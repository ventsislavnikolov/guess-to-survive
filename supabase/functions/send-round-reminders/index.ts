import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { sendEmailToUserId } from "../_shared/email.ts";
import { createAdminClient } from "../_shared/supabase.ts";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function assertCronAuth(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing Authorization header");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new Error("Missing bearer token");
  }

  const expected = getRequiredEnv("CRON_TOKEN");
  if (token !== expected) {
    throw new Error("Unauthorized");
  }
}

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: JSON_HEADERS,
      status: 405,
    });
  }

  try {
    assertCronAuth(request);

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    const supabase = createAdminClient();

    // Active games with a current round.
    const { data: games, error: gamesError } = await supabase
      .from("games")
      .select("current_round, id, name, status")
      .eq("status", "active")
      .not("current_round", "is", null);

    if (gamesError) {
      throw gamesError;
    }

    const candidateGames = (games ?? []).filter(
      (game) => typeof game.current_round === "number" && game.current_round > 0
    );

    let checkedGames = 0;
    let remindersSent = 0;
    let skippedAlreadySent = 0;

    for (const game of candidateGames) {
      checkedGames += 1;
      const round = game.current_round as number;

      // Determine the round lock time (earliest kickoff).
      const { data: firstFixture, error: fixtureError } = await supabase
        .from("fixtures")
        .select("kickoff_time")
        .eq("round", round)
        .order("kickoff_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (fixtureError) {
        throw fixtureError;
      }

      if (!firstFixture?.kickoff_time) {
        continue;
      }

      const lockTime = new Date(firstFixture.kickoff_time);
      if (!(lockTime > in23h && lockTime <= in24h)) {
        continue;
      }

      // Alive players in the game.
      const { data: players, error: playersError } = await supabase
        .from("game_players")
        .select("user_id")
        .eq("game_id", game.id)
        .eq("status", "alive");

      if (playersError) {
        throw playersError;
      }

      const userIds = [...new Set((players ?? []).map((row) => row.user_id))];
      if (userIds.length === 0) {
        continue;
      }

      // Existing picks for this round.
      const { data: picks, error: picksError } = await supabase
        .from("picks")
        .select("user_id")
        .eq("game_id", game.id)
        .eq("round", round)
        .in("user_id", userIds);

      if (picksError) {
        throw picksError;
      }

      const pickedUserIds = new Set((picks ?? []).map((pick) => pick.user_id));
      const missingPickUserIds = userIds.filter((id) => !pickedUserIds.has(id));

      for (const userId of missingPickUserIds) {
        // Idempotency: if we already sent this reminder, skip.
        const { data: existing, error: existingError } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "round_reminder_24h")
          .contains("data", { game_id: game.id, round, reminder: "24h" })
          .limit(1);

        if (existingError) {
          throw existingError;
        }

        if ((existing ?? []).length > 0) {
          skippedAlreadySent += 1;
          continue;
        }

        const title = `Reminder: submit your pick (Round ${round})`;
        const body = `Round ${round} locks in about 24 hours. Open the game and submit your pick before kickoff.`;

        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            body,
            data: { game_id: game.id, reminder: "24h", round },
            title,
            type: "round_reminder_24h",
            user_id: userId,
          });

        if (notificationError) {
          throw notificationError;
        }

        try {
          await sendEmailToUserId(supabase, userId, {
            body,
            subject: title,
            title,
          });
        } catch (emailError) {
          console.error("Failed to send round reminder email", emailError);
        }

        remindersSent += 1;
      }
    }

    return new Response(
      JSON.stringify({
        checkedGames,
        remindersSent,
        skippedAlreadySent,
      }),
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown send-round-reminders error";
    const status = message === "Unauthorized" ? 403 : 500;
    return new Response(JSON.stringify({ error: message }), {
      headers: JSON_HEADERS,
      status,
    });
  }
});
