import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno'

import { createAdminClient } from '../_shared/supabase.ts'
import { sendEmailToUserId } from '../_shared/email.ts'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

type PaymentType = 'entry' | 'rebuy'

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function parsePaymentType(value: string | undefined): PaymentType {
  return value === 'rebuy' ? 'rebuy' : 'entry'
}

function parseRebuyRound(value: string | undefined, paymentType: PaymentType) {
  if (paymentType !== 'rebuy') {
    return 0
  }

  if (!value) {
    return 0
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return 0
  }

  const integer = Math.floor(parsed)
  return integer > 0 ? integer : 0
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
  const paymentType = parsePaymentType(session.metadata?.payment_type)
  const rebuyRound = parseRebuyRound(session.metadata?.rebuy_round, paymentType)
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
      eliminated_round: null,
      game_id: gameId,
      is_rebuy: paymentType === 'rebuy',
      kick_reason: null,
      status: 'alive',
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
      payment_type: paymentType,
      processing_fee: processingFee,
      rebuy_round: rebuyRound,
      status: 'succeeded',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      total_amount: totalAmount,
      user_id: userId,
    },
    {
      onConflict: 'game_id,user_id,payment_type,rebuy_round',
    },
  )

  if (paymentUpsertError) {
    throw paymentUpsertError
  }

  const { error: notificationError } = await supabase.from('notifications').insert({
    body:
      paymentType === 'rebuy'
        ? 'Rebuy payment successful. You are back in the game.'
        : 'Payment successful. Your spot in the game is confirmed.',
    data: {
      event_id: eventId,
      game_id: gameId,
      payment_type: paymentType,
      rebuy_round: rebuyRound,
      stripe_payment_intent_id: paymentIntentId,
      stripe_session_id: session.id,
    },
    title: paymentType === 'rebuy' ? 'Rebuy confirmed' : 'Payment confirmed',
    type: paymentType === 'rebuy' ? 'rebuy_payment_confirmed' : 'payment_confirmed',
    user_id: userId,
  })

  if (notificationError) {
    throw notificationError
  }

  try {
    await sendEmailToUserId(supabase, userId, {
      body:
        paymentType === 'rebuy'
          ? 'Rebuy payment successful. You are back in the game.'
          : 'Payment successful. Your spot in the game is confirmed.',
      subject: paymentType === 'rebuy' ? 'Rebuy confirmed' : 'Payment confirmed',
      title: paymentType === 'rebuy' ? 'Rebuy confirmed' : 'Payment confirmed',
    })
  } catch (emailError) {
    console.error('Failed to send payment confirmed email', emailError)
  }

  return {
    gameId,
    ignored: false,
    paymentType,
    paymentIntentId,
    rebuyRound,
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

  const { data: refundedPayments, error: paymentUpdateError } = await supabase
    .from('payments')
    .update({
      refund_failure_reason: null,
      refunded_amount: refundedAmount,
      refunded_at: new Date().toISOString(),
      status: 'refunded',
      stripe_refund_id: latestRefund?.id ?? null,
    })
    .eq('stripe_payment_intent_id', paymentIntentId)
    .select('game_id, payment_type, rebuy_round, user_id')

  if (paymentUpdateError) {
    throw paymentUpdateError
  }

  if ((refundedPayments?.length ?? 0) > 0) {
    const notifications = (refundedPayments ?? []).map((payment) => ({
      body:
        payment.payment_type === 'rebuy'
          ? 'Your rebuy payment was refunded.'
          : 'Your entry payment was refunded.',
      data: {
        event_id: eventId,
        game_id: payment.game_id,
        payment_type: payment.payment_type,
        rebuy_round: payment.rebuy_round,
        stripe_payment_intent_id: paymentIntentId,
      },
      title: payment.payment_type === 'rebuy' ? 'Rebuy payment refunded' : 'Payment refunded',
      type: payment.payment_type === 'rebuy' ? 'rebuy_payment_refunded' : 'payment_refunded',
      user_id: payment.user_id,
    }))

    const { error: notificationsError } = await supabase.from('notifications').insert(notifications)

    if (notificationsError) {
      throw notificationsError
    }

    await Promise.all(
      (refundedPayments ?? []).map(async (payment) => {
        try {
          await sendEmailToUserId(supabase, payment.user_id, {
            body:
              payment.payment_type === 'rebuy'
                ? 'Your rebuy payment was refunded.'
                : 'Your entry payment was refunded.',
            subject: payment.payment_type === 'rebuy' ? 'Rebuy payment refunded' : 'Payment refunded',
            title: payment.payment_type === 'rebuy' ? 'Rebuy payment refunded' : 'Payment refunded',
          })
        } catch (emailError) {
          console.error('Failed to send refund email', emailError)
        }
      }),
    )
  }

  return {
    ignored: false,
    refundedAmount,
    paymentIntentId,
    refundedPayments: refundedPayments?.length ?? 0,
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
    .select('game_id, payment_type, rebuy_round, user_id')

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
        payment_type: payment.payment_type,
        rebuy_round: payment.rebuy_round,
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
