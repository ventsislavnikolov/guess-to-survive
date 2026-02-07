import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { footballDataRequest } from '../_shared/football-data.ts'
import { createAdminClient } from '../_shared/supabase.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

type FootballDataMatch = {
  awayTeam: {
    id: number
  }
  homeTeam: {
    id: number
  }
  id: number
  matchday: number | null
  score?: {
    fullTime?: {
      away: number | null
      home: number | null
    }
  }
  status: string
  utcDate: string
}

type FootballDataMatchesResponse = {
  matches?: FootballDataMatch[]
}

type ExistingFixture = {
  external_id: number | null
  id: number
}

type ExistingTeam = {
  external_id: number | null
  id: number
}

function mapStatus(apiStatus: string): 'finished' | 'live' | 'postponed' | 'scheduled' {
  const normalized = apiStatus.toUpperCase()

  if (normalized === 'IN_PLAY' || normalized === 'PAUSED') {
    return 'live'
  }

  if (normalized === 'FINISHED') {
    return 'finished'
  }

  if (normalized === 'POSTPONED' || normalized === 'CANCELLED') {
    return 'postponed'
  }

  return 'scheduled'
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: CORS_HEADERS,
      status: 405,
    })
  }

  try {
    const supabase = createAdminClient()

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id')
      .eq('code', 'PL')
      .limit(1)
      .maybeSingle()

    if (leagueError) {
      throw leagueError
    }

    if (!league?.id) {
      throw new Error('Premier League not found. Run sync-teams first.')
    }

    const leagueId = league.id

    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, external_id')
      .eq('league_id', leagueId)

    if (teamsError) {
      throw teamsError
    }

    const teamByExternalId = new Map(
      (teams as ExistingTeam[] | null)?.map((team) => [team.external_id, team.id]) ?? [],
    )

    const payload = await footballDataRequest<FootballDataMatchesResponse>('/competitions/PL/matches', {
      query: { status: 'FINISHED' },
    })
    const matches = payload.matches ?? []

    const { data: existingFixtures, error: existingFixturesError } = await supabase
      .from('fixtures')
      .select('id, external_id')
      .eq('league_id', leagueId)

    if (existingFixturesError) {
      throw existingFixturesError
    }

    const fixtureByExternalId = new Map(
      (existingFixtures as ExistingFixture[] | null)?.map((fixture) => [
        fixture.external_id,
        fixture.id,
      ]) ?? [],
    )

    let skipped = 0

    const fixturesToInsert: {
      away_score: number | null
      away_team_id: number
      external_id: number
      home_score: number | null
      home_team_id: number
      kickoff_time: string
      league_id: number
      round: number
      status: 'finished' | 'live' | 'postponed' | 'scheduled'
    }[] = []

    const fixturesToUpdate: {
      away_score: number | null
      away_team_id: number
      home_score: number | null
      home_team_id: number
      id: number
      kickoff_time: string
      round: number
      status: 'finished' | 'live' | 'postponed' | 'scheduled'
    }[] = []

    for (const match of matches) {
      const homeTeamId = teamByExternalId.get(match.homeTeam.id)
      const awayTeamId = teamByExternalId.get(match.awayTeam.id)

      if (!homeTeamId || !awayTeamId) {
        skipped += 1
        continue
      }

      const fixturePayload = {
        away_score: match.score?.fullTime?.away ?? null,
        away_team_id: awayTeamId,
        home_score: match.score?.fullTime?.home ?? null,
        home_team_id: homeTeamId,
        kickoff_time: match.utcDate,
        round: match.matchday ?? 1,
        status: mapStatus(match.status),
      }

      const existingFixtureId = fixtureByExternalId.get(match.id)

      if (existingFixtureId) {
        fixturesToUpdate.push({
          ...fixturePayload,
          id: existingFixtureId,
        })
      } else {
        fixturesToInsert.push({
          ...fixturePayload,
          external_id: match.id,
          league_id: leagueId,
        })
      }
    }

    if (fixturesToInsert.length > 0) {
      const { error: insertFixturesError } = await supabase.from('fixtures').insert(fixturesToInsert)
      if (insertFixturesError) {
        throw insertFixturesError
      }
    }

    for (const fixture of fixturesToUpdate) {
      const { error: updateFixtureError } = await supabase
        .from('fixtures')
        .update({
          away_score: fixture.away_score,
          away_team_id: fixture.away_team_id,
          home_score: fixture.home_score,
          home_team_id: fixture.home_team_id,
          kickoff_time: fixture.kickoff_time,
          round: fixture.round,
          status: fixture.status,
        })
        .eq('id', fixture.id)

      if (updateFixtureError) {
        throw updateFixtureError
      }
    }

    return new Response(
      JSON.stringify({
        inserted: fixturesToInsert.length,
        skipped,
        synced: matches.length,
        updated: fixturesToUpdate.length,
      }),
      { headers: CORS_HEADERS },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown sync error',
      }),
      { headers: CORS_HEADERS, status: 500 },
    )
  }
})
