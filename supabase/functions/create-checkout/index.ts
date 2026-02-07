import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno'

import { createAdminClient } from '../_shared/supabase.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

type CreateCheckoutPayload = {
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
    const payload = (await request.json().catch(() => ({}))) as CreateCheckoutPayload
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
      .select('currency, entry_fee, id, max_players, name, status')
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

    if (game.status !== 'pending') {
      throw new Error('This game has already started')
    }

    if (!game.entry_fee || game.entry_fee <= 0) {
      throw new Error('This game is free and does not require checkout')
    }

    const { data: existingPlayer, error: existingError } = await supabase
      .from('game_players')
      .select('id, status')
      .eq('game_id', gameId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existingPlayer && existingPlayer.status !== 'kicked') {
      throw new Error('You are already part of this game')
    }

    const { count: playerCount, error: countError } = await supabase
      .from('game_players')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .neq('status', 'kicked')

    if (countError) {
      throw countError
    }

    if (game.max_players !== null && (playerCount ?? 0) >= game.max_players) {
      throw new Error('This game is full')
    }

    const stripe = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    })
    const fees = calculateFees(game.entry_fee)
    const currency = game.currency.toLowerCase()

    const session = await stripe.checkout.sessions.create({
      cancel_url: `${origin}/games/${gameId}?checkout=cancelled`,
      client_reference_id: `${gameId}:${user.id}`,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Entry fee - ${game.name}`,
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
        processing_fee: fees.processingFee.toFixed(2),
        total: fees.total.toFixed(2),
        user_id: user.id,
      },
      mode: 'payment',
      payment_intent_data: {
        metadata: {
          game_id: gameId,
          user_id: user.id,
        },
      },
      success_url: `${origin}/games/${gameId}?checkout=success`,
    })

    const { error: paymentUpsertError } = await supabase.from('payments').upsert(
      {
        currency: game.currency,
        entry_fee: fees.entryFee,
        game_id: gameId,
        processing_fee: fees.processingFee,
        status: 'pending',
        stripe_checkout_session_id: session.id,
        total_amount: fees.total,
        user_id: user.id,
      },
      {
        onConflict: 'game_id,user_id',
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
        processingFee: fees.processingFee,
        sessionId: session.id,
        total: fees.total,
      }),
      {
        headers: CORS_HEADERS,
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown checkout error'
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
