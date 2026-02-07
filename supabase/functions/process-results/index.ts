import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { createAdminClient } from '../_shared/supabase.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

type ProcessResultsPayload = {
  gameId?: string
  round?: number
}

type RoundFixture = {
  away_score: number | null
  away_team_id: number
  home_score: number | null
  home_team_id: number
  id: number
  status: string
}

type PickOutcome = 'draw' | 'lost' | 'voided' | 'won'

type PayoutTriggerResult = {
  error?: string
  response?: unknown
  triggered: boolean
}

function toPositiveInteger(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  const integer = Math.floor(value)
  if (integer < 1) {
    return null
  }

  return integer
}

async function assertAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    throw new Error('Missing bearer token')
  }

  const supabase = createAdminClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const { data: userRow, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (roleError) {
    throw roleError
  }

  if (!userRow || userRow.role !== 'admin') {
    throw new Error('Admin access required')
  }
}

function buildOutcomeMap(fixtures: RoundFixture[]) {
  const outcomes = new Map<number, PickOutcome>()
  const unresolvedFixtures: number[] = []
  let hasVoidedFixtures = false

  for (const fixture of fixtures) {
    const status = fixture.status.toLowerCase()

    if (status === 'postponed') {
      hasVoidedFixtures = true
      outcomes.set(fixture.home_team_id, 'voided')
      outcomes.set(fixture.away_team_id, 'voided')
      continue
    }

    if (status !== 'finished') {
      unresolvedFixtures.push(fixture.id)
      continue
    }

    if (fixture.home_score === null || fixture.away_score === null) {
      unresolvedFixtures.push(fixture.id)
      continue
    }

    if (fixture.home_score > fixture.away_score) {
      outcomes.set(fixture.home_team_id, 'won')
      outcomes.set(fixture.away_team_id, 'lost')
      continue
    }

    if (fixture.home_score < fixture.away_score) {
      outcomes.set(fixture.home_team_id, 'lost')
      outcomes.set(fixture.away_team_id, 'won')
      continue
    }

    outcomes.set(fixture.home_team_id, 'draw')
    outcomes.set(fixture.away_team_id, 'draw')
  }

  return { hasVoidedFixtures, outcomes, unresolvedFixtures }
}

async function triggerPayoutProcessing(gameId: string): Promise<PayoutTriggerResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      triggered: false,
    }
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/process-payouts`, {
    body: JSON.stringify({ gameId }),
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const payload = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    return {
      error: `process-payouts failed with status ${response.status}`,
      response: payload,
      triggered: false,
    }
  }

  return {
    response: payload,
    triggered: true,
  }
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
    await assertAdmin(request)

    const payload = (await request.json().catch(() => ({}))) as ProcessResultsPayload
    const gameId = typeof payload.gameId === 'string' && payload.gameId.length > 0 ? payload.gameId : null

    if (!gameId) {
      throw new Error('Missing required field: gameId')
    }

    const supabase = createAdminClient()

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('current_round, id, manager_id, starting_round, wipeout_mode')
      .eq('id', gameId)
      .maybeSingle()

    if (gameError) {
      throw gameError
    }

    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        headers: CORS_HEADERS,
        status: 404,
      })
    }

    const payloadRound = toPositiveInteger(payload.round)
    const targetRound = payloadRound ?? game.current_round ?? game.starting_round

    if (!targetRound) {
      throw new Error('Unable to determine target round')
    }

    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('away_score, away_team_id, home_score, home_team_id, id, status')
      .eq('round', targetRound)

    if (fixturesError) {
      throw fixturesError
    }

    const roundFixtures = (fixtures as RoundFixture[] | null) ?? []
    if (roundFixtures.length === 0) {
      return new Response(
        JSON.stringify({
          eliminated: 0,
          message: `No fixtures found for round ${targetRound}.`,
          picksUpdated: 0,
          round: targetRound,
        }),
        { headers: CORS_HEADERS, status: 200 },
      )
    }

    const { hasVoidedFixtures, outcomes, unresolvedFixtures } = buildOutcomeMap(roundFixtures)
    if (unresolvedFixtures.length > 0) {
      return new Response(
        JSON.stringify({
          error: `Round ${targetRound} still has unresolved fixtures.`,
          unresolvedFixtureIds: unresolvedFixtures,
        }),
        { headers: CORS_HEADERS, status: 409 },
      )
    }

    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select('id, team_id, user_id')
      .eq('game_id', gameId)
      .eq('round', targetRound)

    if (picksError) {
      throw picksError
    }

    let picksUpdated = 0
    let eliminated = 0
    const voidedUserIds = new Set<string>()

    for (const pick of picks ?? []) {
      const outcome = outcomes.get(pick.team_id)
      if (!outcome) {
        continue
      }

      const { error: updatePickError } = await supabase
        .from('picks')
        .update({ result: outcome })
        .eq('id', pick.id)

      if (updatePickError) {
        throw updatePickError
      }

      picksUpdated += 1

      if (outcome === 'lost' || outcome === 'draw') {
        const { data: eliminateRows, error: eliminateError } = await supabase
          .from('game_players')
          .update({
            eliminated_round: targetRound,
            status: 'eliminated',
          })
          .eq('game_id', gameId)
          .eq('status', 'alive')
          .eq('user_id', pick.user_id)
          .select('id')

        if (eliminateError) {
          throw eliminateError
        }

        eliminated += eliminateRows?.length ?? 0
      }

      if (outcome === 'voided') {
        voidedUserIds.add(pick.user_id)
      }
    }

    if (voidedUserIds.size > 0) {
      const notifications = [...voidedUserIds].map((userId) => ({
        body: `One or more fixtures in round ${targetRound} were postponed. Submit a new pick before the updated lock deadline.`,
        data: {
          game_id: gameId,
          reason: 'postponed_fixture',
          round: targetRound,
        },
        title: 'Repick required',
        type: 'repick_required',
        user_id: userId,
      }))

      const { error: notificationsError } = await supabase.from('notifications').insert(notifications)

      if (notificationsError) {
        throw notificationsError
      }
    }

    const { data: alivePlayers, error: alivePlayersError } = await supabase
      .from('game_players')
      .select('id')
      .eq('game_id', gameId)
      .eq('status', 'alive')

    if (alivePlayersError) {
      throw alivePlayersError
    }

    const aliveCount = alivePlayers?.length ?? 0
    const wipeoutDetected = aliveCount === 0
    const nextStatus = hasVoidedFixtures
      ? 'active'
      : wipeoutDetected
        ? game.wipeout_mode === 'rebuy'
          ? 'active'
          : 'completed'
        : aliveCount <= 1
          ? 'completed'
          : 'active'

    const gameStatePatch: { current_round?: number; status: 'active' | 'completed' } = {
      status: nextStatus,
    }

    if (hasVoidedFixtures) {
      gameStatePatch.current_round = targetRound
    } else if (nextStatus === 'active') {
      gameStatePatch.current_round = targetRound + 1
    }

    const { error: gameUpdateError } = await supabase.from('games').update(gameStatePatch).eq('id', gameId)

    if (gameUpdateError) {
      throw gameUpdateError
    }

    if (wipeoutDetected) {
      const wipeoutMessage =
        game.wipeout_mode === 'rebuy'
          ? `Total wipeout detected in round ${targetRound}. Rebuy mode is enabled.`
          : `Total wipeout detected in round ${targetRound}. Game marked completed.`

      const { error: wipeoutNotificationError } = await supabase.from('notifications').insert({
        body: wipeoutMessage,
        data: {
          game_id: gameId,
          reason: 'total_wipeout',
          round: targetRound,
          wipeout_mode: game.wipeout_mode,
        },
        title: 'Total wipeout detected',
        type: 'wipeout_detected',
        user_id: game.manager_id,
      })

      if (wipeoutNotificationError) {
        throw wipeoutNotificationError
      }
    }

    let payoutTrigger: PayoutTriggerResult | null = null
    if (nextStatus === 'completed' && aliveCount > 0 && !hasVoidedFixtures) {
      payoutTrigger = await triggerPayoutProcessing(gameId)

      if (!payoutTrigger.triggered) {
        await supabase.from('notifications').insert({
          body: `Payout trigger failed after round ${targetRound}. Review process-payouts logs.`,
          data: {
            error: payoutTrigger.error,
            game_id: gameId,
            response: payoutTrigger.response ?? null,
            round: targetRound,
          },
          title: 'Payout trigger failed',
          type: 'payout_trigger_failed',
          user_id: game.manager_id,
        })
      }
    }

    return new Response(
      JSON.stringify({
        aliveCount,
        eliminated,
        gameId,
        hasVoidedFixtures,
        nextStatus,
        picksUpdated,
        payoutTrigger,
        round: targetRound,
        voidedUsers: voidedUserIds.size,
        wipeoutDetected,
      }),
      { headers: CORS_HEADERS },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown process-results error'
    const status = message === 'Admin access required' || message === 'Unauthorized' ? 403 : 500

    return new Response(
      JSON.stringify({
        error: message,
      }),
      { headers: CORS_HEADERS, status },
    )
  }
})
