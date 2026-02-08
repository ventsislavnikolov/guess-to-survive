import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { footballDataRequest } from "../_shared/football-data.ts";
import { createAdminClient } from "../_shared/supabase.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

interface FootballDataTeam {
  crest?: string | null;
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
}

interface FootballDataTeamsResponse {
  season?: {
    startDate?: string;
  };
  teams?: FootballDataTeam[];
}

interface ExistingTeam {
  external_id: number | null;
  id: number;
}

function getSeasonLabel(startDate?: string) {
  if (!startDate) {
    return null;
  }

  const year = Number(startDate.slice(0, 4));
  if (Number.isNaN(year)) {
    return null;
  }

  return `${year}-${year + 1}`;
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
    const supabase = createAdminClient();

    const payload = await footballDataRequest<FootballDataTeamsResponse>(
      "/competitions/PL/teams"
    );
    const teams = payload.teams ?? [];
    const currentSeason = getSeasonLabel(payload.season?.startDate);

    const { data: existingLeague, error: leagueFetchError } = await supabase
      .from("leagues")
      .select("id")
      .eq("code", "PL")
      .limit(1)
      .maybeSingle();

    if (leagueFetchError) {
      throw leagueFetchError;
    }

    let leagueId = existingLeague?.id;

    if (!leagueId) {
      const { data: insertedLeague, error: insertLeagueError } = await supabase
        .from("leagues")
        .insert({
          code: "PL",
          country: "England",
          current_season: currentSeason,
          name: "Premier League",
        })
        .select("id")
        .single();

      if (insertLeagueError) {
        throw insertLeagueError;
      }

      leagueId = insertedLeague.id;
    } else if (currentSeason) {
      const { error: leagueUpdateError } = await supabase
        .from("leagues")
        .update({ current_season: currentSeason })
        .eq("id", leagueId);

      if (leagueUpdateError) {
        throw leagueUpdateError;
      }
    }

    if (!leagueId) {
      throw new Error("Unable to resolve league id for Premier League");
    }

    const { data: existingTeams, error: existingTeamsError } = await supabase
      .from("teams")
      .select("id, external_id")
      .eq("league_id", leagueId);

    if (existingTeamsError) {
      throw existingTeamsError;
    }

    const existingByExternalId = new Map(
      (existingTeams as ExistingTeam[] | null)?.map((team) => [
        team.external_id,
        team.id,
      ]) ?? []
    );

    const teamsToInsert: {
      crest_url: string | null;
      external_id: number;
      league_id: number;
      name: string;
      short_name: string | null;
    }[] = [];

    const teamsToUpdate: {
      crest_url: string | null;
      id: number;
      name: string;
      short_name: string | null;
    }[] = [];

    for (const team of teams) {
      const shortName = team.shortName ?? team.tla ?? null;
      const crestUrl = team.crest ?? null;
      const existingId = existingByExternalId.get(team.id);

      if (existingId) {
        teamsToUpdate.push({
          crest_url: crestUrl,
          id: existingId,
          name: team.name,
          short_name: shortName,
        });
      } else {
        teamsToInsert.push({
          crest_url: crestUrl,
          external_id: team.id,
          league_id: leagueId,
          name: team.name,
          short_name: shortName,
        });
      }
    }

    if (teamsToInsert.length > 0) {
      const { error: insertTeamsError } = await supabase
        .from("teams")
        .insert(teamsToInsert);
      if (insertTeamsError) {
        throw insertTeamsError;
      }
    }

    for (const team of teamsToUpdate) {
      const { error: updateTeamError } = await supabase
        .from("teams")
        .update({
          crest_url: team.crest_url,
          name: team.name,
          short_name: team.short_name,
        })
        .eq("id", team.id);

      if (updateTeamError) {
        throw updateTeamError;
      }
    }

    return new Response(
      JSON.stringify({
        inserted: teamsToInsert.length,
        synced: teams.length,
        updated: teamsToUpdate.length,
      }),
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown sync error",
      }),
      { headers: CORS_HEADERS, status: 500 }
    );
  }
});
