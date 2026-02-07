import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno'

import { createAdminClient } from '../_shared/supabase.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

type CreateRebuyCheckoutPayload = {
  gameId?: string
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function calculateFees(entryFee: number) {
  const processingFee = Number((entryFee * 0.029 + 0.25).toFixed(2))
  const total = Number((entryFee + processingFee).toFixed(2))

  return {
    entryFee,
    entryFeeCents: Math.round(entryFee * 100),
    processingFee,
    processingFeeCents: Math.round(processingFee * 100),
    total,
    totalCents: Math.round(total * 100),
  }
}

function resolveOrigin(request: Request) {
  return request.headers.get('origin') ?? Deno.env.get('APP_BASE_URL') ?? null
}

async function getAuthenticatedUser(request: Request) {
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
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return user
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
    const user = await getAuthenticatedUser(request)
    const payload = (await request.json().catch(() => ({}))) as CreateRebuyCheckoutPayload
    const gameId = typeof payload.gameId === 'string' ? payload.gameId.trim() : ''

    if (!gameId) {
      throw new Error('Missing required field: gameId')
    }

    const origin = resolveOrigin(request)
    if (!origin) {
      throw new Error('Missing origin header or APP_BASE_URL')
    }

    const supabase = createAdminClient()
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('currency, current_round, entry_fee, id, name, rebuy_deadline, status, wipeout_mode')
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

    if (game.status !== 'active') {
      throw new Error('Rebuy is only available for active games.')
    }

    if (game.wipeout_mode !== 'rebuy') {
      throw new Error('This game does not support rebuys.')
    }

    if (!game.entry_fee || game.entry_fee <= 0) {
      throw new Error('Rebuy checkout is only available for paid games.')
    }

    if (!game.current_round || game.current_round < 1) {
      throw new Error('Unable to determine current rebuy round.')
    }

    if (!game.rebuy_deadline) {
      throw new Error('Rebuy window is not currently open.')
    }

    const rebuyDeadline = new Date(game.rebuy_deadline)
    if (Number.isNaN(rebuyDeadline.getTime())) {
      throw new Error('Rebuy deadline is invalid.')
    }

    if (rebuyDeadline.getTime() <= Date.now()) {
      throw new Error('Rebuy window has closed.')
    }

    const { data: player, error: playerError } = await supabase
      .from('game_players')
      .select('id, status')
      .eq('game_id', gameId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (playerError) {
      throw playerError
    }

    if (!player) {
      throw new Error('You are not part of this game.')
    }

    if (player.status === 'alive') {
      throw new Error('You are already alive in this game.')
    }

    if (player.status === 'kicked') {
      throw new Error('Kicked players cannot rebuy.')
    }

    if (player.status !== 'eliminated') {
      throw new Error('Only eliminated players can rebuy.')
    }

    const rebuyRound = game.current_round
    const { data: existingRebuyPayment, error: existingPaymentError } = await supabase
      .from('payments')
      .select('id, status')
      .eq('game_id', gameId)
      .eq('payment_type', 'rebuy')
      .eq('rebuy_round', rebuyRound)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingPaymentError) {
      throw existingPaymentError
    }

    if (
      existingRebuyPayment &&
      ['pending', 'refund_pending', 'succeeded'].includes(existingRebuyPayment.status)
    ) {
      throw new Error('A rebuy payment already exists for this round.')
    }

    const stripe = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    })
    const fees = calculateFees(game.entry_fee)
    const currency = game.currency.toLowerCase()
    const rebuyRoundString = String(rebuyRound)

    const session = await stripe.checkout.sessions.create({
      cancel_url: `${origin}/games/${gameId}?rebuy=cancelled`,
      client_reference_id: `${gameId}:${user.id}:rebuy:${rebuyRoundString}`,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Rebuy entry - ${game.name}`,
            },
            unit_amount: fees.entryFeeCents,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency,
            product_data: {
              name: 'Processing fee',
            },
            unit_amount: fees.processingFeeCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        currency: game.currency,
        entry_fee: fees.entryFee.toFixed(2),
        game_id: gameId,
        payment_type: 'rebuy',
        processing_fee: fees.processingFee.toFixed(2),
        rebuy_round: rebuyRoundString,
        total: fees.total.toFixed(2),
        user_id: user.id,
      },
      mode: 'payment',
      payment_intent_data: {
        metadata: {
          game_id: gameId,
          payment_type: 'rebuy',
          rebuy_round: rebuyRoundString,
          user_id: user.id,
        },
      },
      success_url: `${origin}/games/${gameId}?rebuy=success`,
    })

    const { error: paymentUpsertError } = await supabase.from('payments').upsert(
      {
        currency: game.currency,
        entry_fee: fees.entryFee,
        game_id: gameId,
        payment_type: 'rebuy',
        processing_fee: fees.processingFee,
        rebuy_round: rebuyRound,
        status: 'pending',
        stripe_checkout_session_id: session.id,
        total_amount: fees.total,
        user_id: user.id,
      },
      {
        onConflict: 'game_id,user_id,payment_type,rebuy_round',
      },
    )

    if (paymentUpsertError) {
      throw paymentUpsertError
    }

    return new Response(
      JSON.stringify({
        checkoutUrl: session.url,
        currency: game.currency,
        entryFee: fees.entryFee,
        gameId,
        paymentType: 'rebuy',
        processingFee: fees.processingFee,
        rebuyRound,
        sessionId: session.id,
        total: fees.total,
      }),
      {
        headers: CORS_HEADERS,
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown rebuy checkout error'
    const status = message === 'Unauthorized' ? 401 : 400

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        headers: CORS_HEADERS,
        status,
      },
    )
  }
})
