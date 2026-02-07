import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno'

import { createAdminClient } from '../_shared/supabase.ts'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
  const gameId = session.metadata?.game_id ?? session.metadata?.gameId
  const userId = session.metadata?.user_id ?? session.metadata?.userId

  if (!gameId || !userId) {
    return {
      ignored: true,
      reason: 'missing_checkout_metadata',
    }
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null
  const metadataCurrency = session.metadata?.currency?.toUpperCase() ?? 'EUR'
  const metadataEntryFee = Number(session.metadata?.entry_fee ?? '0')
  const metadataProcessingFee = Number(session.metadata?.processing_fee ?? '0')
  const metadataTotal = Number(session.metadata?.total ?? '0')
  const entryFee = Number.isFinite(metadataEntryFee) ? metadataEntryFee : 0
  const processingFee = Number.isFinite(metadataProcessingFee) ? metadataProcessingFee : 0
  const totalAmount = Number.isFinite(metadataTotal) ? metadataTotal : 0

  const supabase = createAdminClient()
  const { error: upsertError } = await supabase.from('game_players').upsert(
    {
      game_id: gameId,
      stripe_payment_id: paymentIntentId,
      user_id: userId,
    },
    {
      onConflict: 'game_id,user_id',
    },
  )

  if (upsertError) {
    throw upsertError
  }

  const { error: paymentUpsertError } = await supabase.from('payments').upsert(
    {
      currency: metadataCurrency,
      entry_fee: entryFee,
      game_id: gameId,
      processing_fee: processingFee,
      status: 'succeeded',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      total_amount: totalAmount,
      user_id: userId,
    },
    {
      onConflict: 'game_id,user_id',
    },
  )

  if (paymentUpsertError) {
    throw paymentUpsertError
  }

  const { error: notificationError } = await supabase.from('notifications').insert({
    body: 'Payment successful. Your spot in the game is confirmed.',
    data: {
      event_id: eventId,
      game_id: gameId,
      stripe_payment_intent_id: paymentIntentId,
      stripe_session_id: session.id,
    },
    title: 'Payment confirmed',
    type: 'payment_confirmed',
    user_id: userId,
  })

  if (notificationError) {
    throw notificationError
  }

  return {
    gameId,
    ignored: false,
    paymentIntentId,
    userId,
  }
}

async function handleChargeRefunded(charge: Stripe.Charge, eventId: string) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null

  if (!paymentIntentId) {
    return {
      ignored: true,
      reason: 'missing_payment_intent',
    }
  }

  const supabase = createAdminClient()
  const refunds = charge.refunds?.data ?? []
  const latestRefund = refunds.reduce<Stripe.Refund | null>((latest, current) => {
    if (!latest) {
      return current
    }

    return (current.created ?? 0) > (latest.created ?? 0) ? current : latest
  }, null)
  const refundedAmount = charge.amount_refunded ? charge.amount_refunded / 100 : null

  const { error: paymentUpdateError } = await supabase
    .from('payments')
    .update({
      refund_failure_reason: null,
      refunded_amount: refundedAmount,
      refunded_at: new Date().toISOString(),
      status: 'refunded',
      stripe_refund_id: latestRefund?.id ?? null,
    })
    .eq('stripe_payment_intent_id', paymentIntentId)

  if (paymentUpdateError) {
    throw paymentUpdateError
  }

  const { data: refundedPlayers, error: refundUpdateError } = await supabase
    .from('game_players')
    .update({
      kick_reason: 'Payment refunded via Stripe.',
      status: 'kicked',
    })
    .eq('stripe_payment_id', paymentIntentId)
    .neq('status', 'kicked')
    .select('game_id, user_id')

  if (refundUpdateError) {
    throw refundUpdateError
  }

  if ((refundedPlayers?.length ?? 0) > 0) {
    const notifications = (refundedPlayers ?? []).map((player) => ({
      body: 'Your entry payment was refunded. You have been removed from the game.',
      data: {
        event_id: eventId,
        game_id: player.game_id,
        stripe_payment_intent_id: paymentIntentId,
      },
      title: 'Payment refunded',
      type: 'payment_refunded',
      user_id: player.user_id,
    }))

    const { error: notificationsError } = await supabase.from('notifications').insert(notifications)

    if (notificationsError) {
      throw notificationsError
    }
  }

  return {
    ignored: false,
    refundedAmount,
    paymentIntentId,
    refundedPlayers: refundedPlayers?.length ?? 0,
  }
}

async function handleRefundFailed(refund: Stripe.Refund, eventId: string) {
  const paymentIntentId =
    typeof refund.payment_intent === 'string'
      ? refund.payment_intent
      : refund.payment_intent?.id ?? null

  if (!paymentIntentId) {
    return {
      ignored: true,
      reason: 'missing_payment_intent',
    }
  }

  const supabase = createAdminClient()
  const failureReason = refund.failure_reason ?? 'unknown_refund_failure'

  const { data: affectedPayments, error: paymentUpdateError } = await supabase
    .from('payments')
    .update({
      refund_failure_reason: failureReason,
      status: 'refund_failed',
      stripe_refund_id: refund.id,
    })
    .eq('stripe_payment_intent_id', paymentIntentId)
    .select('game_id, user_id')

  if (paymentUpdateError) {
    throw paymentUpdateError
  }

  if ((affectedPayments?.length ?? 0) > 0) {
    const notifications = (affectedPayments ?? []).map((payment) => ({
      body: 'We could not complete your refund. Please contact support.',
      data: {
        event_id: eventId,
        failure_reason: failureReason,
        game_id: payment.game_id,
        stripe_payment_intent_id: paymentIntentId,
        stripe_refund_id: refund.id,
      },
      title: 'Refund failed',
      type: 'payment_refund_failed',
      user_id: payment.user_id,
    }))

    const { error: notificationError } = await supabase.from('notifications').insert(notifications)

    if (notificationError) {
      throw notificationError
    }
  }

  return {
    ignored: false,
    paymentIntentId,
    failureReason,
    paymentsUpdated: affectedPayments?.length ?? 0,
    refundId: refund.id,
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('payments')
    .update({ status: 'cancelled' })
    .eq('stripe_checkout_session_id', session.id)

  if (error) {
    throw error
  }

  return {
    ignored: false,
    sessionId: session.id,
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent, eventId: string) {
  const paymentIntentId = paymentIntent.id
  const userId = paymentIntent.metadata?.user_id ?? null
  const gameId = paymentIntent.metadata?.game_id ?? null
  const supabase = createAdminClient()

  const { error: paymentUpdateError } = await supabase
    .from('payments')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntentId)

  if (paymentUpdateError) {
    throw paymentUpdateError
  }

  if (userId) {
    const { error: notificationError } = await supabase.from('notifications').insert({
      body: 'Payment failed. Please retry checkout to join the game.',
      data: {
        event_id: eventId,
        game_id: gameId,
        stripe_payment_intent_id: paymentIntentId,
      },
      title: 'Payment failed',
      type: 'payment_failed',
      user_id: userId,
    })

    if (notificationError) {
      throw notificationError
    }
  }

  return {
    ignored: false,
    paymentIntentId,
  }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: JSON_HEADERS })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: JSON_HEADERS,
      status: 405,
    })
  }

  try {
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing Stripe signature' }), {
        headers: JSON_HEADERS,
        status: 400,
      })
    }

    const stripe = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    })
    const webhookSecret = getRequiredEnv('STRIPE_WEBHOOK_SECRET')
    const payload = await request.text()
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      const result = await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, event.id)

      return new Response(
        JSON.stringify({
          ...result,
          eventType: event.type,
          received: true,
        }),
        {
          headers: JSON_HEADERS,
          status: 200,
        },
      )
    }

    if (event.type === 'charge.refunded') {
      const result = await handleChargeRefunded(event.data.object as Stripe.Charge, event.id)

      return new Response(
        JSON.stringify({
          ...result,
          eventType: event.type,
          received: true,
        }),
        {
          headers: JSON_HEADERS,
          status: 200,
        },
      )
    }

    if (event.type === 'refund.failed') {
      const result = await handleRefundFailed(event.data.object as Stripe.Refund, event.id)

      return new Response(
        JSON.stringify({
          ...result,
          eventType: event.type,
          received: true,
        }),
        {
          headers: JSON_HEADERS,
          status: 200,
        },
      )
    }

    if (event.type === 'checkout.session.expired') {
      const result = await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)

      return new Response(
        JSON.stringify({
          ...result,
          eventType: event.type,
          received: true,
        }),
        {
          headers: JSON_HEADERS,
          status: 200,
        },
      )
    }

    if (event.type === 'payment_intent.payment_failed') {
      const result = await handlePaymentFailed(event.data.object as Stripe.PaymentIntent, event.id)

      return new Response(
        JSON.stringify({
          ...result,
          eventType: event.type,
          received: true,
        }),
        {
          headers: JSON_HEADERS,
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({
        eventType: event.type,
        ignored: true,
        received: true,
      }),
      {
        headers: JSON_HEADERS,
        status: 200,
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown stripe webhook error'
    const status = message.toLowerCase().includes('signature') ? 400 : 500

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        headers: JSON_HEADERS,
        status,
      },
    )
  }
})
