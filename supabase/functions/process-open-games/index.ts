import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { buildGameSweepTargets } from "../_shared/game-processing-sweep.mjs";
import { createAdminClient } from "../_shared/supabase.ts";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

interface SweepGameRow {
  current_round: number | null;
  id: string;
  starting_round: number | null;
  status: string;
}

interface FunctionInvocationResult {
  ok: boolean;
  payload: unknown;
  status: number;
}

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

async function invokeFunction({
  body,
  functionName,
  projectUrl,
  serviceRoleKey,
}: {
  body: Record<string, number | string>;
  functionName: "process-results" | "process-round";
  projectUrl: string;
  serviceRoleKey: string;
}): Promise<FunctionInvocationResult> {
  const response = await fetch(`${projectUrl}/functions/v1/${functionName}`, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = await response
    .json()
    .catch(async () => await response.text().catch(() => null));

  return {
    ok: response.ok,
    payload,
    status: response.status,
  };
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

    const projectUrl = getRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createAdminClient();

    const { data: games, error: gamesError } = await supabase
      .from("games")
      .select("current_round, id, starting_round, status")
      .in("status", ["active", "pending"]);

    if (gamesError) {
      throw gamesError;
    }

    const targets = buildGameSweepTargets((games ?? []) as SweepGameRow[]);

    const results: {
      gameId: string;
      processResults: FunctionInvocationResult;
      processRound: FunctionInvocationResult;
      round: number;
    }[] = [];

    for (const target of targets) {
      const processRound = await invokeFunction({
        body: {
          gameId: target.gameId,
          round: target.round,
        },
        functionName: "process-round",
        projectUrl,
        serviceRoleKey,
      });

      const processResults = await invokeFunction({
        body: {
          gameId: target.gameId,
          round: target.round,
        },
        functionName: "process-results",
        projectUrl,
        serviceRoleKey,
      });

      results.push({
        gameId: target.gameId,
        processResults,
        processRound,
        round: target.round,
      });
    }

    const summary = {
      gamesDiscovered: (games ?? []).length,
      resultFailed: results.filter(
        (result) =>
          !result.processResults.ok && result.processResults.status !== 409
      ).length,
      resultProcessed: results.filter((result) => result.processResults.ok)
        .length,
      resultWaiting: results.filter(
        (result) => result.processResults.status === 409
      ).length,
      roundFailed: results.filter(
        (result) =>
          !result.processRound.ok && result.processRound.status !== 409
      ).length,
      roundProcessed: results.filter((result) => result.processRound.ok).length,
      roundWaiting: results.filter(
        (result) => result.processRound.status === 409
      ).length,
      sweepTargets: targets.length,
    };

    return new Response(
      JSON.stringify({
        results,
        summary,
      }),
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown process-open-games error";
    const status = message === "Unauthorized" ? 403 : 500;

    return new Response(JSON.stringify({ error: message }), {
      headers: JSON_HEADERS,
      status,
    });
  }
});
