import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { createAdminClient } from '../_shared/supabase.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

type ProcessRoundPayload = {
  gameId?: string
  round?: number
}

type RefundTriggerResult = {
  error?: string
  response?: unknown
  triggered: boolean
}

type PayoutTriggerResult = {
  error?: string
  response?: unknown
  triggered: boolean
}

type FixtureWithTeams = {
  away_team: {
    id: number
    name: string
  } | null
  away_team_id: number
  home_team: {
    id: number
    name: string
  } | null
  home_team_id: number
  kickoff_time: string
}

async function triggerCancellationRefunds(gameId: string): Promise<RefundTriggerResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      triggered: false,
    }
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/process-refund`, {
    body: JSON.stringify({
      gameId,
      reason: 'Game cancelled because minimum players were not met before kickoff.',
      scenario: 'game_cancelled',
    }),
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const payload = (await response.json().catch(() => null)) as unknown
  if (!response.ok) {
    return {
      error: `process-refund failed with status ${response.status}`,
      response: payload,
      triggered: false,
    }
  }

  return {
    response: payload,
    triggered: true,
  }
}

async function triggerSingleRebuyerRefund(
  gameId: string,
  rebuyRound: number,
  userId: string,
): Promise<RefundTriggerResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      triggered: false,
    }
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/process-refund`, {
    body: JSON.stringify({
      gameId,
      rebuyRound,
      reason: 'Single rebuyer remaining in rebuy mode.',
      scenario: 'single_rebuyer',
      userId,
    }),
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const payload = (await response.json().catch(() => null)) as unknown
  if (!response.ok) {
    return {
      error: `process-refund failed with status ${response.status}`,
      response: payload,
      triggered: false,
    }
  }

  return {
    response: payload,
    triggered: true,
  }
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

    const payload = (await request.json().catch(() => ({}))) as ProcessRoundPayload
    const gameId = typeof payload.gameId === 'string' && payload.gameId.length > 0 ? payload.gameId : null

    if (!gameId) {
      throw new Error('Missing required field: gameId')
    }

    const supabase = createAdminClient()

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('current_round, id, manager_id, min_players, rebuy_deadline, starting_round, status, wipeout_mode')
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
      .select(
        `
          away_team:teams!fixtures_away_team_id_fkey(id, name),
          away_team_id,
          home_team:teams!fixtures_home_team_id_fkey(id, name),
          home_team_id,
          kickoff_time
        `,
      )
      .eq('round', targetRound)
      .order('kickoff_time', { ascending: true })

    if (fixturesError) {
      throw fixturesError
    }

    const roundFixtures = (fixtures as FixtureWithTeams[] | null) ?? []
    if (roundFixtures.length === 0) {
      return new Response(
        JSON.stringify({
          assigned: 0,
          eliminated: 0,
          message: `No fixtures found for round ${targetRound}.`,
          round: targetRound,
          skipped: 0,
        }),
        { headers: CORS_HEADERS, status: 200 },
      )
    }

    const earliestKickoff = roundFixtures[0]?.kickoff_time ? new Date(roundFixtures[0].kickoff_time).getTime() : null
    if (earliestKickoff && earliestKickoff > Date.now()) {
      return new Response(
        JSON.stringify({
          error: `Round ${targetRound} is not locked yet. Run after first kickoff.`,
        }),
        { headers: CORS_HEADERS, status: 409 },
      )
    }

    const uniqueRoundTeams = new Map<number, { id: number; name: string }>()
    for (const fixture of roundFixtures) {
      const homeTeam = fixture.home_team
      const awayTeam = fixture.away_team

      if (homeTeam) {
        uniqueRoundTeams.set(homeTeam.id, homeTeam)
      }

      if (awayTeam) {
        uniqueRoundTeams.set(awayTeam.id, awayTeam)
      }
    }

    const roundTeamsSorted = [...uniqueRoundTeams.values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    )

    const { data: alivePlayersResult, error: alivePlayersError } = await supabase
      .from('game_players')
      .select('id, user_id')
      .eq('game_id', gameId)
      .eq('status', 'alive')

    if (alivePlayersError) {
      throw alivePlayersError
    }

    let alivePlayers = alivePlayersResult ?? []
    const aliveCount = alivePlayers.length
    if (game.status === 'pending' && aliveCount < game.min_players) {
      const { error: cancelGameError } = await supabase
        .from('games')
        .update({ status: 'cancelled' })
        .eq('id', gameId)

      if (cancelGameError) {
        throw cancelGameError
      }

      const refundTrigger = await triggerCancellationRefunds(gameId)
      if (!refundTrigger.triggered) {
        const { error: managerNotificationError } = await supabase.from('notifications').insert({
          body: `Game auto-cancelled due to minimum players not met, but refunds failed to trigger. Review process-refund logs.`,
          data: {
            error: refundTrigger.error,
            game_id: gameId,
            response: refundTrigger.response ?? null,
            round: targetRound,
          },
          title: 'Refund trigger failed',
          type: 'refund_trigger_failed',
          user_id: game.manager_id,
        })

        if (managerNotificationError) {
          throw managerNotificationError
        }
      }

      return new Response(
        JSON.stringify({
          assigned: 0,
          eliminated: 0,
          gameId,
          minPlayersRequired: game.min_players,
          playersAtLock: aliveCount,
          refundTrigger,
          round: targetRound,
          skipped: 0,
          status: 'cancelled',
        }),
        { headers: CORS_HEADERS, status: 200 },
      )
    }

    let payoutTrigger: PayoutTriggerResult | null = null
    let rebuyRefundTrigger: RefundTriggerResult | null = null
    let rebuyResolution: { mode: 'completed' | 'continue'; rebuyers: number; winners?: number } | null =
      null

    if (game.status === 'active' && game.wipeout_mode === 'rebuy' && game.rebuy_deadline) {
      const rebuyDeadlineTimestamp = new Date(game.rebuy_deadline).getTime()

      if (Number.isFinite(rebuyDeadlineTimestamp) && rebuyDeadlineTimestamp > Date.now()) {
        return new Response(
          JSON.stringify({
            assigned: 0,
            eliminated: 0,
            gameId,
            message: `Rebuy window is still open until ${game.rebuy_deadline}.`,
            rebuyDeadline: game.rebuy_deadline,
            round: targetRound,
            skipped: 0,
            status: game.status,
          }),
          { headers: CORS_HEADERS, status: 200 },
        )
      }

      const { data: rebuyPayments, error: rebuyPaymentsError } = await supabase
        .from('payments')
        .select('user_id')
        .eq('game_id', gameId)
        .eq('payment_type', 'rebuy')
        .eq('rebuy_round', targetRound)
        .eq('status', 'succeeded')

      if (rebuyPaymentsError) {
        throw rebuyPaymentsError
      }

      const rebuyerIds = [...new Set((rebuyPayments ?? []).map((payment) => payment.user_id))]

      if (rebuyerIds.length >= 2) {
        const { error: restoreRebuyersError } = await supabase
          .from('game_players')
          .update({
            eliminated_round: null,
            is_rebuy: true,
            kick_reason: null,
            status: 'alive',
          })
          .eq('game_id', gameId)
          .in('user_id', rebuyerIds)

        if (restoreRebuyersError) {
          throw restoreRebuyersError
        }

        const { error: clearRebuyDeadlineError } = await supabase
          .from('games')
          .update({
            rebuy_deadline: null,
            status: 'active',
          })
          .eq('id', gameId)

        if (clearRebuyDeadlineError) {
          throw clearRebuyDeadlineError
        }

        const { data: refreshedAlivePlayers, error: refreshedAlivePlayersError } = await supabase
          .from('game_players')
          .select('id, user_id')
          .eq('game_id', gameId)
          .eq('status', 'alive')

        if (refreshedAlivePlayersError) {
          throw refreshedAlivePlayersError
        }

        alivePlayers = refreshedAlivePlayers ?? []
        rebuyResolution = {
          mode: 'continue',
          rebuyers: rebuyerIds.length,
        }
      } else {
        const previousRound = Math.max(1, targetRound - 1)

        if (rebuyerIds.length === 1) {
          const { error: demoteRebuyerError } = await supabase
            .from('game_players')
            .update({
              eliminated_round: previousRound,
              status: 'eliminated',
            })
            .eq('game_id', gameId)
            .eq('user_id', rebuyerIds[0])

          if (demoteRebuyerError) {
            throw demoteRebuyerError
          }

          rebuyRefundTrigger = await triggerSingleRebuyerRefund(gameId, targetRound, rebuyerIds[0])
          if (!rebuyRefundTrigger.triggered) {
            const { error: managerNotificationError } = await supabase.from('notifications').insert({
              body: 'Single rebuyer refund trigger failed after rebuy deadline.',
              data: {
                error: rebuyRefundTrigger.error,
                game_id: gameId,
                rebuy_round: targetRound,
                response: rebuyRefundTrigger.response ?? null,
              },
              title: 'Single rebuyer refund failed',
              type: 'refund_trigger_failed',
              user_id: game.manager_id,
            })

            if (managerNotificationError) {
              throw managerNotificationError
            }
          }
        }

        const { data: lastRoundSurvivors, error: lastRoundSurvivorsError } = await supabase
          .from('game_players')
          .select('user_id')
          .eq('game_id', gameId)
          .eq('status', 'eliminated')
          .eq('eliminated_round', previousRound)

        if (lastRoundSurvivorsError) {
          throw lastRoundSurvivorsError
        }

        const winnerIds = [...new Set((lastRoundSurvivors ?? []).map((player) => player.user_id))]

        if (winnerIds.length > 0) {
          const { error: winnerRestoreError } = await supabase
            .from('game_players')
            .update({
              eliminated_round: null,
              kick_reason: null,
              status: 'alive',
            })
            .eq('game_id', gameId)
            .in('user_id', winnerIds)

          if (winnerRestoreError) {
            throw winnerRestoreError
          }
        }

        const { error: completeGameError } = await supabase
          .from('games')
          .update({
            rebuy_deadline: null,
            status: 'completed',
          })
          .eq('id', gameId)

        if (completeGameError) {
          throw completeGameError
        }

        payoutTrigger = await triggerPayoutProcessing(gameId)
        if (!payoutTrigger.triggered) {
          const { error: managerNotificationError } = await supabase.from('notifications').insert({
            body: `Payout trigger failed after rebuy resolution for round ${targetRound}.`,
            data: {
              error: payoutTrigger.error,
              game_id: gameId,
              rebuy_round: targetRound,
              response: payoutTrigger.response ?? null,
            },
            title: 'Payout trigger failed',
            type: 'payout_trigger_failed',
            user_id: game.manager_id,
          })

          if (managerNotificationError) {
            throw managerNotificationError
          }
        }

        rebuyResolution = {
          mode: 'completed',
          rebuyers: rebuyerIds.length,
          winners: winnerIds.length,
        }

        return new Response(
          JSON.stringify({
            assigned: 0,
            eliminated: 0,
            gameId,
            payoutTrigger,
            rebuyRefundTrigger,
            rebuyResolution,
            round: targetRound,
            skipped: 0,
            status: 'completed',
          }),
          { headers: CORS_HEADERS, status: 200 },
        )
      }
    }

    let assigned = 0
    let eliminated = 0
    let skipped = 0

    for (const player of alivePlayers) {
      const { data: existingPick, error: existingPickError } = await supabase
        .from('picks')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', player.user_id)
        .eq('round', targetRound)
        .maybeSingle()

      if (existingPickError) {
        throw existingPickError
      }

      if (existingPick) {
        skipped += 1
        continue
      }

      const { data: usedPicks, error: usedPicksError } = await supabase
        .from('picks')
        .select('team_id')
        .eq('game_id', gameId)
        .eq('user_id', player.user_id)

      if (usedPicksError) {
        throw usedPicksError
      }

      const usedTeamIds = new Set((usedPicks ?? []).map((pick) => pick.team_id))
      const autoAssignedTeam = roundTeamsSorted.find((team) => !usedTeamIds.has(team.id))

      if (!autoAssignedTeam) {
        const { error: eliminateError } = await supabase
          .from('game_players')
          .update({
            eliminated_round: targetRound,
            kick_reason: 'no_available_team',
            status: 'eliminated',
          })
          .eq('id', player.id)

        if (eliminateError) {
          throw eliminateError
        }

        eliminated += 1
        continue
      }

      const { error: insertPickError } = await supabase.from('picks').insert({
        auto_assigned: true,
        game_id: gameId,
        round: targetRound,
        team_id: autoAssignedTeam.id,
        user_id: player.user_id,
      })

      if (insertPickError) {
        throw insertPickError
      }

      assigned += 1
    }

    const gameStatePatch: { current_round?: number; status?: string } = {}
    if (game.current_round === null) {
      gameStatePatch.current_round = targetRound
    }

    if (game.status === 'pending') {
      gameStatePatch.status = 'active'
    }

    if (Object.keys(gameStatePatch).length > 0) {
      const { error: gameUpdateError } = await supabase
        .from('games')
        .update(gameStatePatch)
        .eq('id', gameId)

      if (gameUpdateError) {
        throw gameUpdateError
      }
    }

    return new Response(
      JSON.stringify({
        assigned,
        eliminated,
        gameId,
        payoutTrigger,
        rebuyRefundTrigger,
        rebuyResolution,
        round: targetRound,
        skipped,
        status: gameStatePatch.status ?? game.status,
      }),
      { headers: CORS_HEADERS },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown process-round error'
    const status = message === 'Admin access required' || message === 'Unauthorized' ? 403 : 500

    return new Response(
      JSON.stringify({
        error: message,
      }),
      { headers: CORS_HEADERS, status },
    )
  }
})
