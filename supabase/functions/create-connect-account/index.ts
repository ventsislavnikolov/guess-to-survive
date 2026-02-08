import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";

import { createAdminClient } from "../_shared/supabase.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function resolveOrigin(request: Request) {
  return request.headers.get("origin") ?? Deno.env.get("APP_BASE_URL") ?? null;
}

async function getAuthenticatedUser(request: Request) {
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
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
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
    const user = await getAuthenticatedUser(request);
    const origin = resolveOrigin(request);

    if (!origin) {
      throw new Error("Missing origin header or APP_BASE_URL");
    }

    const stripe = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2024-06-20",
    });
    const connectCountry = (
      Deno.env.get("STRIPE_CONNECT_COUNTRY") ?? "US"
    ).toUpperCase();

    const supabase = createAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, stripe_connect_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        headers: CORS_HEADERS,
        status: 404,
      });
    }

    let accountId = profile.stripe_connect_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        capabilities: {
          transfers: { requested: true },
        },
        country: connectCountry,
        email: user.email ?? profile.email ?? undefined,
        metadata: {
          user_id: user.id,
        },
        type: "express",
      });

      accountId = account.id;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_connect_id: accountId })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/profile?connect=refresh`,
      return_url: `${origin}/profile?connect=complete`,
      type: "account_onboarding",
    });

    return new Response(
      JSON.stringify({
        accountId,
        onboardingUrl: accountLink.url,
      }),
      {
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Stripe Connect error";
    const status = message === "Unauthorized" ? 401 : 400;

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        headers: CORS_HEADERS,
        status,
      }
    );
  }
});
