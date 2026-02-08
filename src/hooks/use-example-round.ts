import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

interface ExampleTeam {
  crest_url: string | null;
  name: string;
  short_name: string | null;
}

interface ExampleLeague {
  code: string;
  name: string;
}

interface ExampleFixtureRow {
  away_score: number | null;
  away_team: ExampleTeam | null;
  home_score: number | null;
  home_team: ExampleTeam | null;
  kickoff_time: string;
  league: ExampleLeague | null;
  round: number;
  status: string;
}

export interface ExampleRoundSnapshot {
  awayTeam: ExampleTeam;
  homeTeam: ExampleTeam;
  kickoffTime: string;
  league: ExampleLeague | null;
  outcomeLabel: "Survived" | "Eliminated" | "Draw";
  pickTeam: ExampleTeam;
  resultScoreline: string;
  round: number;
}

function getTeamDisplayName(team: ExampleTeam) {
  return team.short_name || team.name;
}

function isValidFixtureRow(row: ExampleFixtureRow): row is ExampleFixtureRow & {
  away_score: number;
  away_team: ExampleTeam;
  home_score: number;
  home_team: ExampleTeam;
} {
  return (
    typeof row.round === "number" &&
    typeof row.kickoff_time === "string" &&
    typeof row.home_score === "number" &&
    typeof row.away_score === "number" &&
    Boolean(row.home_team) &&
    Boolean(row.away_team)
  );
}

function buildSnapshot(row: ExampleFixtureRow): ExampleRoundSnapshot | null {
  if (!isValidFixtureRow(row)) {
    return null;
  }

  const resultScoreline = `${row.home_score}-${row.away_score}`;
  const outcomeLabel = row.home_score === row.away_score ? "Draw" : "Survived";
  const pickTeam =
    row.home_score < row.away_score ? row.away_team : row.home_team;

  return {
    awayTeam: row.away_team,
    homeTeam: row.home_team,
    kickoffTime: row.kickoff_time,
    league: row.league,
    outcomeLabel,
    pickTeam,
    resultScoreline,
    round: row.round,
  };
}

export function useExampleRoundSnapshot() {
  return useQuery<ExampleRoundSnapshot | null>({
    queryKey: ["example-round-snapshot"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fixtures")
        .select(
          `
            away_score,
            kickoff_time,
            home_score,
            round,
            status,
            league:leagues!fixtures_league_id_fkey(code, name),
            home_team:teams!fixtures_home_team_id_fkey(name, short_name, crest_url),
            away_team:teams!fixtures_away_team_id_fkey(name, short_name, crest_url)
          `
        )
        .eq("status", "finished")
        .order("kickoff_time", { ascending: false })
        .limit(25);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const bestCandidate =
        data.find(
          (row) => isValidFixtureRow(row) && row.home_score !== row.away_score
        ) ?? data.find(isValidFixtureRow);

      if (!bestCandidate) {
        return null;
      }

      return buildSnapshot(bestCandidate);
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function formatExampleLeagueBadge(league: ExampleLeague | null) {
  if (!league) {
    return "Football survival pools";
  }

  if (league.code === "PL") {
    return "EPL survival pools";
  }

  return `${league.code} survival pools`;
}

export function formatExamplePickHeadline(pickTeam: ExampleTeam) {
  return `Your pick: ${getTeamDisplayName(pickTeam)}`;
}

export function formatExamplePickHelper(pickTeam: ExampleTeam) {
  return `You cannot use ${getTeamDisplayName(pickTeam)} again this game.`;
}
