import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { createAdminClient } from "../_shared/supabase.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

const TARGET_TO_FUNCTION = {
  fixtures: "sync-fixtures",
  results: "sync-results",
  teams: "sync-teams",
} as const;

interface DenoEnv {
  get: (name: string) => string | undefined;
}

interface DenoGlobal {
  env: DenoEnv;
}

type ManualSyncTarget = keyof typeof TARGET_TO_FUNCTION;

interface ManualSyncPayload {
  target?: "all" | ManualSyncTarget;
  targets?: ManualSyncTarget[];
}

function getRequiredEnv(name: string): string {
  const deno = (globalThis as { Deno?: DenoGlobal }).Deno;
  const value = deno?.env.get(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseTargets(payload: ManualSyncPayload): ManualSyncTarget[] {
  if (payload.target === "all") {
    return ["teams", "fixtures", "results"];
  }

  if (payload.target && payload.target in TARGET_TO_FUNCTION) {
    return [payload.target];
  }

  if (Array.isArray(payload.targets) && payload.targets.length > 0) {
    const filtered = payload.targets.filter(
      (target): target is ManualSyncTarget => {
        return target in TARGET_TO_FUNCTION;
      }
    );

    if (filtered.length > 0) {
      return Array.from(new Set(filtered));
    }
  }

  return ["teams", "fixtures", "results"];
}

async function assertAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new Error("Missing bearer token");
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

  if (!userRow || userRow.role !== "admin") {
    throw new Error("Admin access required");
  }
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
    await assertAdmin(request);

    const rawPayload = (await request
      .json()
      .catch(() => ({}))) as ManualSyncPayload;
    const targets = parseTargets(rawPayload);
    const projectUrl = getRequiredEnv("SUPABASE_URL");

    const results: Record<
      string,
      {
        ok: boolean;
        payload: unknown;
        status: number;
      }
    > = {};

    for (const target of targets) {
      const functionName = TARGET_TO_FUNCTION[target];
      const response = await fetch(
        `${projectUrl}/functions/v1/${functionName}`,
        {
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }
      );

      const payload = await response.json().catch(() => ({}));
      results[target] = {
        ok: response.ok,
        payload,
        status: response.status,
      };
    }

    const failedTargets = Object.entries(results)
      .filter(([, value]) => !value.ok)
      .map(([key]) => key);

    return new Response(
      JSON.stringify({
        failedTargets,
        ok: failedTargets.length === 0,
        results,
        triggeredTargets: targets,
      }),
      {
        headers: CORS_HEADERS,
        status: failedTargets.length === 0 ? 200 : 502,
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Manual sync failed";
    const status =
      message === "Admin access required" || message === "Unauthorized"
        ? 403
        : 400;

    return new Response(JSON.stringify({ error: message }), {
      headers: CORS_HEADERS,
      status,
    });
  }
});
