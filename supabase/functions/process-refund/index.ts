import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { sendEmailToUserId } from "../_shared/email.ts";
import { createAdminClient } from "../_shared/supabase.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

type RefundScenario = "game_cancelled" | "kick_player" | "single_rebuyer";

interface ProcessRefundPayload {
  gameId?: string;
  rebuyRound?: number;
  reason?: string;
  scenario?: RefundScenario;
  userId?: string;
}

interface AuthorizedContext {
  mode: "admin" | "manager" | "service";
  userId: string | null;
}

interface PaymentRow {
  currency: string;
  game_id: string;
  id: number;
  payment_type: string;
  rebuy_round: number;
  status: string;
  stripe_payment_intent_id: string | null;
  total_amount: number;
  user_id: string;
}

interface NotificationContent {
  body: string;
  title: string;
  type: string;
}

const REFUNDABLE_STATUSES = ["refund_failed", "succeeded"];

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseScenario(value: string | undefined): RefundScenario {
  if (
    value === "game_cancelled" ||
    value === "kick_player" ||
    value === "single_rebuyer"
  ) {
    return value;
  }

  return "kick_player";
}

function toPositiveInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const integer = Math.floor(value);
  if (integer < 1) {
    return null;
  }

  return integer;
}

async function assertAuthorized(
  request: Request,
  gameId: string
): Promise<AuthorizedContext> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new Error("Missing bearer token");
  }

  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (token === serviceRoleKey) {
    return {
      mode: "service",
      userId: null,
    };
  }

  const supabase = createAdminClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: userRow, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    throw roleError;
  }

  if (userRow?.role === "admin") {
    return {
      mode: "admin",
      userId: user.id,
    };
  }

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("manager_id")
    .eq("id", gameId)
    .maybeSingle();

  if (gameError) {
    throw gameError;
  }

  if (game?.manager_id === user.id) {
    return {
      mode: "manager",
      userId: user.id,
    };
  }

  throw new Error("Not authorized to process refunds for this game");
}

async function resolveSingleRebuyerUserId(
  supabase: ReturnType<typeof createAdminClient>,
  gameId: string,
  requestedUserId: string | undefined
) {
  if (requestedUserId) {
    return requestedUserId;
  }

  const { data: rebuyers, error: rebuyerError } = await supabase
    .from("game_players")
    .select("user_id")
    .eq("game_id", gameId)
    .eq("is_rebuy", true)
    .neq("status", "kicked");

  if (rebuyerError) {
    throw rebuyerError;
  }

  const rebuyerIds = [...new Set((rebuyers ?? []).map((row) => row.user_id))];
  if (rebuyerIds.length !== 1) {
    throw new Error("Single rebuyer refund requires exactly one rebuyer.");
  }

  return rebuyerIds[0];
}

async function getTargetPayments(
  supabase: ReturnType<typeof createAdminClient>,
  gameId: string,
  rebuyRound: number | null,
  scenario: RefundScenario,
  userId: string | undefined
) {
  let targetUserId = userId;

  if (scenario === "single_rebuyer") {
    targetUserId = await resolveSingleRebuyerUserId(supabase, gameId, userId);
  }

  let query = supabase
    .from("payments")
    .select(
      "currency, game_id, id, payment_type, rebuy_round, status, stripe_payment_intent_id, total_amount, user_id"
    )
    .eq("game_id", gameId)
    .in("status", REFUNDABLE_STATUSES);

  if (scenario === "single_rebuyer") {
    query = query.eq("payment_type", "rebuy");

    if (rebuyRound !== null) {
      query = query.eq("rebuy_round", rebuyRound);
    } else {
      query = query.gt("rebuy_round", 0);
    }
  }

  if (targetUserId) {
    query = query.eq("user_id", targetUserId);
  }

  const { data: payments, error: paymentError } = await query;

  if (paymentError) {
    throw paymentError;
  }

  return {
    payments: (payments ?? []) as PaymentRow[],
    targetUserId,
  };
}

function toStripeRefundReason(
  scenario: RefundScenario
): Stripe.RefundCreateParams.Reason {
  if (scenario === "single_rebuyer") {
    return "duplicate";
  }

  return "requested_by_customer";
}

function getNotificationContent(
  scenario: RefundScenario,
  reason: string | null
): NotificationContent {
  if (scenario === "game_cancelled") {
    return {
      body: "This game was cancelled before kickoff. Your payment refund is now processing.",
      title: "Game cancelled refund started",
      type: "game_refund_pending",
    };
  }

  if (scenario === "single_rebuyer") {
    return {
      body: "Only one rebuyer remained. Your rebuy refund is now processing.",
      title: "Rebuy refund started",
      type: "rebuy_refund_pending",
    };
  }

  return {
    body: `You were removed from the game. ${reason ? `Reason: ${reason}. ` : ""}Your refund is now processing.`,
    title: "Kick refund started",
    type: "kick_refund_pending",
  };
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: CORS_HEADERS,
      status: 405,
    });
  }

  try {
    const payload = (await request
      .json()
      .catch(() => ({}))) as ProcessRefundPayload;
    const gameId =
      typeof payload.gameId === "string" && payload.gameId.length > 0
        ? payload.gameId
        : null;

    if (!gameId) {
      throw new Error("Missing required field: gameId");
    }

    const scenario = parseScenario(payload.scenario);
    const rebuyRound = toPositiveInteger(payload.rebuyRound);
    const reason =
      typeof payload.reason === "string" && payload.reason.trim().length > 0
        ? payload.reason.trim()
        : null;
    const requestedUserId =
      typeof payload.userId === "string" && payload.userId.length > 0
        ? payload.userId
        : undefined;

    const authorization = await assertAuthorized(request, gameId);
    const supabase = createAdminClient();

    if (scenario === "game_cancelled") {
      const { error: cancelGameError } = await supabase
        .from("games")
        .update({ status: "cancelled" })
        .eq("id", gameId);

      if (cancelGameError) {
        throw cancelGameError;
      }

      const { error: cancelPlayersError } = await supabase
        .from("game_players")
        .update({
          kick_reason: reason ?? "Game cancelled before kickoff.",
          status: "kicked",
        })
        .eq("game_id", gameId)
        .neq("status", "kicked");

      if (cancelPlayersError) {
        throw cancelPlayersError;
      }
    }

    if (scenario === "kick_player") {
      if (!requestedUserId) {
        throw new Error("Missing required field: userId");
      }

      const { error: kickPlayerError } = await supabase
        .from("game_players")
        .update({
          kick_reason: reason ?? "Removed by manager.",
          status: "kicked",
        })
        .eq("game_id", gameId)
        .eq("user_id", requestedUserId);

      if (kickPlayerError) {
        throw kickPlayerError;
      }
    }

    const stripe = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2024-06-20",
    });

    const { payments, targetUserId } = await getTargetPayments(
      supabase,
      gameId,
      rebuyRound,
      scenario,
      requestedUserId
    );
    if (payments.length === 0) {
      return new Response(
        JSON.stringify({
          authorizedAs: authorization.mode,
          failed: 0,
          gameId,
          message: "No refundable payments found for the requested scenario.",
          processed: 0,
          rebuyRound,
          scenario,
        }),
        {
          headers: CORS_HEADERS,
          status: 200,
        }
      );
    }

    const notificationContent = getNotificationContent(scenario, reason);
    const nowIso = new Date().toISOString();
    let processed = 0;
    let failed = 0;
    let skipped = 0;
    const failures: Array<{ paymentId: number; reason: string }> = [];
    const notificationRows: Array<{
      body: string;
      data: Record<string, unknown>;
      title: string;
      type: string;
      user_id: string;
    }> = [];

    for (const payment of payments) {
      const paymentIntentId = payment.stripe_payment_intent_id;

      if (!paymentIntentId) {
        skipped += 1;
        failures.push({
          paymentId: payment.id,
          reason: "Payment intent id is missing.",
        });
        continue;
      }

      try {
        const refund = await stripe.refunds.create(
          {
            metadata: {
              game_id: payment.game_id,
              payment_id: String(payment.id),
              payment_type: payment.payment_type,
              reason: reason ?? "",
              rebuy_round: payment.rebuy_round,
              scenario,
              user_id: payment.user_id,
            },
            payment_intent: paymentIntentId,
            reason: toStripeRefundReason(scenario),
          },
          {
            idempotencyKey: `refund:${scenario}:${payment.id}`,
          }
        );

        const { error: refundUpdateError } = await supabase
          .from("payments")
          .update({
            refund_failure_reason: null,
            refund_reason: reason ?? scenario,
            refund_requested_at: nowIso,
            status: "refund_pending",
            stripe_refund_id: refund.id,
          })
          .eq("id", payment.id);

        if (refundUpdateError) {
          throw refundUpdateError;
        }

        notificationRows.push({
          body: notificationContent.body,
          data: {
            game_id: payment.game_id,
            payment_id: payment.id,
            payment_type: payment.payment_type,
            refund_reason: reason ?? scenario,
            rebuy_round: payment.rebuy_round,
            scenario,
            stripe_payment_intent_id: paymentIntentId,
            stripe_refund_id: refund.id,
          },
          title: notificationContent.title,
          type: notificationContent.type,
          user_id: payment.user_id,
        });

        processed += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown refund failure";

        const { error: failedUpdateError } = await supabase
          .from("payments")
          .update({
            refund_failure_reason: message,
            refund_reason: reason ?? scenario,
            refund_requested_at: nowIso,
            status: "refund_failed",
          })
          .eq("id", payment.id);

        if (failedUpdateError) {
          throw failedUpdateError;
        }

        failures.push({
          paymentId: payment.id,
          reason: message,
        });
        failed += 1;
      }
    }

    if (notificationRows.length > 0) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notificationRows);

      if (notificationError) {
        throw notificationError;
      }

      const uniqueUserIds = [
        ...new Set(notificationRows.map((row) => row.user_id)),
      ];
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          const sample = notificationRows.find((row) => row.user_id === userId);
          if (!sample) {
            return;
          }

          try {
            await sendEmailToUserId(supabase, userId, {
              body: sample.body,
              subject: sample.title,
              title: sample.title,
            });
          } catch (emailError) {
            console.error("Failed to send refund email", emailError);
          }
        })
      );
    }

    return new Response(
      JSON.stringify({
        authorizedAs: authorization.mode,
        failed,
        failures,
        gameId,
        processed,
        rebuyRound,
        scenario,
        skipped,
        targetUserId: targetUserId ?? null,
      }),
      {
        headers: CORS_HEADERS,
        status: 200,
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown process-refund error";
    const isAccessError =
      message === "Unauthorized" ||
      message === "Missing or invalid Authorization header" ||
      message === "Missing bearer token" ||
      message === "Not authorized to process refunds for this game";

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        headers: CORS_HEADERS,
        status: isAccessError ? 403 : 500,
      }
    );
  }
});
