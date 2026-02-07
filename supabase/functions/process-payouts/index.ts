import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno'

import { createAdminClient } from '../_shared/supabase.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

type ProcessPayoutsPayload = {
  gameId?: string
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function splitAmounts(totalCents: number, recipients: number) {
  if (recipients <= 0) {
    return []
  }

  const base = Math.floor(totalCents / recipients)
  const remainder = totalCents % recipients

  return Array.from({ length: recipients }, (_, index) => base + (index < remainder ? 1 : 0))
}

async function assertAuthorized(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    throw new Error('Missing bearer token')
  }

  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (token === serviceRoleKey) {
    return
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
    await assertAuthorized(request)

    const payload = (await request.json().catch(() => ({}))) as ProcessPayoutsPayload
    const gameId = typeof payload.gameId === 'string' && payload.gameId.length > 0 ? payload.gameId : null

    if (!gameId) {
      throw new Error('Missing required field: gameId')
    }

    const stripe = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    })
    const supabase = createAdminClient()

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('currency, id, prize_pool, status')
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

    if (game.status !== 'completed') {
      return new Response(
        JSON.stringify({
          gameId,
          message: 'Game is not completed yet.',
          payoutsProcessed: 0,
        }),
        {
          headers: CORS_HEADERS,
          status: 200,
        },
      )
    }

    const { data: successfulPayments, error: successfulPaymentsError } = await supabase
      .from('payments')
      .select('entry_fee')
      .eq('game_id', gameId)
      .eq('status', 'succeeded')

    if (successfulPaymentsError) {
      throw successfulPaymentsError
    }

    const calculatedPrizePool = (successfulPayments ?? []).reduce((sum, payment) => {
      const amount = typeof payment.entry_fee === 'number' ? payment.entry_fee : Number(payment.entry_fee ?? 0)
      return sum + (Number.isFinite(amount) ? amount : 0)
    }, 0)
    const prizePool = Number(calculatedPrizePool.toFixed(2))

    if ((game.prize_pool ?? 0) !== prizePool) {
      const { error: gamePrizePoolUpdateError } = await supabase
        .from('games')
        .update({ prize_pool: prizePool })
        .eq('id', gameId)

      if (gamePrizePoolUpdateError) {
        throw gamePrizePoolUpdateError
      }
    }

    const totalCents = Math.max(0, Math.round(prizePool * 100))
    if (totalCents <= 0) {
      return new Response(
        JSON.stringify({
          gameId,
          message: 'No prize pool to distribute.',
          payoutsProcessed: 0,
        }),
        {
          headers: CORS_HEADERS,
          status: 200,
        },
      )
    }

    const { data: winners, error: winnersError } = await supabase
      .from('game_players')
      .select('user_id')
      .eq('game_id', gameId)
      .eq('status', 'alive')

    if (winnersError) {
      throw winnersError
    }

    const winnerIds = [...new Set((winners ?? []).map((winner) => winner.user_id))]
    if (winnerIds.length === 0) {
      return new Response(
        JSON.stringify({
          gameId,
          message: 'No winners found for payout.',
          payoutsProcessed: 0,
        }),
        {
          headers: CORS_HEADERS,
          status: 200,
        },
      )
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, stripe_connect_id')
      .in('id', winnerIds)

    if (profilesError) {
      throw profilesError
    }

    const connectByUserId = new Map((profiles ?? []).map((profile) => [profile.id, profile.stripe_connect_id]))
    const splitCents = splitAmounts(totalCents, winnerIds.length)
    const currency = game.currency.toLowerCase()

    let completed = 0
    let failed = 0
    const winnersWithoutConnect: string[] = []

    for (const [index, winnerId] of winnerIds.entries()) {
      const amountCents = splitCents[index] ?? 0
      const amount = amountCents / 100
      const connectId = connectByUserId.get(winnerId) ?? null

      if (!connectId || amountCents <= 0) {
        winnersWithoutConnect.push(winnerId)

        const { error: failedUpsertError } = await supabase.from('payouts').upsert(
          {
            amount,
            currency: game.currency,
            game_id: gameId,
            status: 'failed',
            stripe_transfer_id: null,
            user_id: winnerId,
          },
          {
            onConflict: 'game_id,user_id',
          },
        )

        if (failedUpsertError) {
          throw failedUpsertError
        }

        failed += 1
        continue
      }

      const { error: processingUpsertError } = await supabase.from('payouts').upsert(
        {
          amount,
          currency: game.currency,
          game_id: gameId,
          status: 'processing',
          stripe_transfer_id: null,
          user_id: winnerId,
        },
        {
          onConflict: 'game_id,user_id',
        },
      )

      if (processingUpsertError) {
        throw processingUpsertError
      }

      try {
        const transfer = await stripe.transfers.create(
          {
            amount: amountCents,
            currency,
            destination: connectId,
            metadata: {
              game_id: gameId,
              user_id: winnerId,
            },
          },
          {
            idempotencyKey: `payout:${gameId}:${winnerId}:${amountCents}`,
          },
        )

        const { error: completedUpsertError } = await supabase.from('payouts').upsert(
          {
            amount,
            currency: game.currency,
            game_id: gameId,
            status: 'completed',
            stripe_transfer_id: transfer.id,
            user_id: winnerId,
          },
          {
            onConflict: 'game_id,user_id',
          },
        )

        if (completedUpsertError) {
          throw completedUpsertError
        }

        const { error: notificationError } = await supabase.from('notifications').insert({
          body: `Your payout of ${game.currency} ${amount.toFixed(2)} has been initiated.`,
          data: {
            amount,
            currency: game.currency,
            game_id: gameId,
            stripe_transfer_id: transfer.id,
          },
          title: 'Payout processed',
          type: 'payout_processed',
          user_id: winnerId,
        })

        if (notificationError) {
          throw notificationError
        }

        completed += 1
      } catch {
        const { error: failedUpsertError } = await supabase.from('payouts').upsert(
          {
            amount,
            currency: game.currency,
            game_id: gameId,
            status: 'failed',
            stripe_transfer_id: null,
            user_id: winnerId,
          },
          {
            onConflict: 'game_id,user_id',
          },
        )

        if (failedUpsertError) {
          throw failedUpsertError
        }

        failed += 1
      }
    }

    return new Response(
      JSON.stringify({
        completed,
        failed,
        gameId,
        winners: winnerIds.length,
        winnersWithoutConnect,
      }),
      { headers: CORS_HEADERS },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown process-payouts error'
    const status = message === 'Admin access required' || message === 'Unauthorized' ? 403 : 500

    return new Response(
      JSON.stringify({
        error: message,
      }),
      { headers: CORS_HEADERS, status },
    )
  }
})
