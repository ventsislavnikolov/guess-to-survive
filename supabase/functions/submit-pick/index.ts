import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { sendEmailToUserId } from '../_shared/email.ts'
import { createAdminClient } from '../_shared/supabase.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

type SubmitPickPayload = {
  gameId?: string
  round?: number
  teamId?: number
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

async function getAuthedUserId(request: Request) {
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

  return { token, userId: user.id }
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
    const { userId } = await getAuthedUserId(request)
    const payload = (await request.json().catch(() => ({}))) as SubmitPickPayload

    const gameId = typeof payload.gameId === 'string' && payload.gameId.length > 0 ? payload.gameId : null
    const round = toPositiveInteger(payload.round)
    const teamId = toPositiveInteger(payload.teamId)

    if (!gameId) {
      throw new Error('Missing required field: gameId')
    }
    if (!round) {
      throw new Error('Missing required field: round')
    }
    if (!teamId) {
      throw new Error('Missing required field: teamId')
    }

    const supabase = createAdminClient()

    const { data: firstFixture, error: firstFixtureError } = await supabase
      .from('fixtures')
      .select('kickoff_time')
      .eq('round', round)
      .order('kickoff_time', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (firstFixtureError) {
      throw firstFixtureError
    }

    if (!firstFixture) {
      throw new Error('Round fixtures are not available yet.')
    }

    if (new Date(firstFixture.kickoff_time).getTime() <= Date.now()) {
      throw new Error('Round is locked. Picks can no longer be changed.')
    }

    const { data: existingPick, error: existingError } = await supabase
      .from('picks')
      .select('id, team_id')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .eq('round', round)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existingPick?.team_id === teamId) {
      return new Response(JSON.stringify({ action: 'noop' }), { headers: CORS_HEADERS })
    }

    let action: 'created' | 'updated'
    let pickId: number

    if (existingPick) {
      const { data: updatedPick, error: updateError } = await supabase
        .from('picks')
        .update({
          auto_assigned: false,
          team_id: teamId,
        })
        .eq('id', existingPick.id)
        .select('id')
        .single()

      if (updateError) {
        throw updateError
      }

      action = 'updated'
      pickId = updatedPick.id
    } else {
      const { data: createdPick, error: createError } = await supabase
        .from('picks')
        .insert({
          game_id: gameId,
          round,
          team_id: teamId,
          user_id: userId,
        })
        .select('id')
        .single()

      if (createError) {
        throw createError
      }

      action = 'created'
      pickId = createdPick.id
    }

    const title = action === 'created' ? `Pick submitted for Round ${round}` : `Pick updated for Round ${round}`
    const body =
      action === 'created'
        ? 'Your team selection has been saved.'
        : 'Your team selection has been updated before round lock.'

    const { error: notificationError } = await supabase.from('notifications').insert({
      body,
      data: { action, game_id: gameId, round, team_id: teamId },
      title,
      type: 'pick_confirmed',
      user_id: userId,
    })

    if (notificationError) {
      throw notificationError
    }

    try {
      await sendEmailToUserId(supabase, userId, {
        body,
        subject: title,
        title,
      })
    } catch (emailError) {
      console.error('Failed to send pick confirmation email', emailError)
    }

    return new Response(JSON.stringify({ action, pickId }), { headers: CORS_HEADERS })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown submit-pick error'
    const status = message === 'Unauthorized' ? 403 : 400

    return new Response(JSON.stringify({ error: message }), { headers: CORS_HEADERS, status })
  }
})

