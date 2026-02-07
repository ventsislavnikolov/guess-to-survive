import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type GamePlayerRow = Database['public']['Tables']['game_players']['Row']
type PublicGameDetailRow = Database['public']['Functions']['get_public_game_detail']['Returns'][number]
type CreateCheckoutResponse = {
  checkoutUrl: string | null
  currency: string
  entryFee: number
  gameId: string
  paymentType?: 'entry' | 'rebuy'
  processingFee: number
  rebuyRound?: number
  sessionId: string
  total: number
}

type KickPlayerWithRefundInput = {
  gameId: string
  reason: string
  userId: string
}

type ProcessRefundResponse = {
  failed: number
  gameId: string
  processed: number
  scenario: string
  skipped: number
}

export type GameDetail = PublicGameDetailRow & {
  game_players: Pick<GamePlayerRow, 'eliminated_round' | 'id' | 'is_rebuy' | 'joined_at' | 'status' | 'user_id'>[]
}

export function useGame(gameId: string) {
  return useQuery<GameDetail | null>({
    enabled: Boolean(gameId),
    queryKey: ['game', gameId],
    queryFn: async () => {
      const { data: gameData, error: gameError } = await supabase.rpc('get_public_game_detail', {
        p_game_id: gameId,
      })

      if (gameError) {
        throw gameError
      }

      const game = gameData?.at(0)

      if (!game) {
        return null
      }

      const { data: players, error: playersError } = await supabase
        .from('game_players')
        .select('eliminated_round, id, is_rebuy, joined_at, status, user_id')
        .eq('game_id', gameId)
        .order('joined_at', { ascending: true })

      if (playersError) {
        throw playersError
      }

      return {
        ...game,
        game_players: players ?? [],
      }
    },
  })
}

export function useJoinGame() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) {
        throw new Error('You must be signed in to join games.')
      }

      const { data: gameData, error: gameError } = await supabase.rpc('get_public_game_detail', {
        p_game_id: gameId,
      })

      if (gameError) {
        throw gameError
      }

      const game = gameData?.at(0)

      if (!game) {
        throw new Error('Game not found.')
      }

      if (game.status !== 'pending') {
        throw new Error('This game has already started.')
      }

      if ((game.entry_fee ?? 0) > 0) {
        throw new Error('Paid game join flow is not available yet.')
      }

      if (game.max_players !== null && game.player_count >= game.max_players) {
        throw new Error('This game is full.')
      }

      const { data: existingPlayer, error: existingError } = await supabase
        .from('game_players')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingError) {
        throw existingError
      }

      if (existingPlayer) {
        throw new Error('You are already in this game.')
      }

      const { data, error } = await supabase
        .from('game_players')
        .insert({
          game_id: gameId,
          user_id: user.id,
        })
        .select('id')
        .single()

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

export function useLeaveGame() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) {
        throw new Error('You must be signed in to leave games.')
      }

      const { data: gameData, error: gameError } = await supabase.rpc('get_public_game_detail', {
        p_game_id: gameId,
      })

      if (gameError) {
        throw gameError
      }

      const game = gameData?.at(0)

      if (!game) {
        throw new Error('Game not found.')
      }

      if (game.status !== 'pending') {
        throw new Error('You can only leave a game before it starts.')
      }

      if (game.manager_id === user.id) {
        throw new Error('Game managers cannot leave their own game.')
      }

      const { data, error } = await supabase
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .select('id')

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('You are not part of this game.')
      }
    },
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

export function useCreateCheckout() {
  const { session, user } = useAuth()

  return useMutation({
    mutationFn: async (gameId: string): Promise<CreateCheckoutResponse> => {
      if (!user || !session?.access_token) {
        throw new Error('You must be signed in to start checkout.')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        body: JSON.stringify({ gameId }),
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to create checkout session.')
      }

      return payload as CreateCheckoutResponse
    },
  })
}

export function useCreateRebuyCheckout() {
  const { session, user } = useAuth()

  return useMutation({
    mutationFn: async (gameId: string): Promise<CreateCheckoutResponse> => {
      if (!user || !session?.access_token) {
        throw new Error('You must be signed in to rebuy.')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-rebuy-checkout`, {
        body: JSON.stringify({ gameId }),
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to create rebuy checkout session.')
      }

      return payload as CreateCheckoutResponse
    },
  })
}

export function useKickPlayerWithRefund() {
  const { session, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: KickPlayerWithRefundInput): Promise<ProcessRefundResponse> => {
      if (!user || !session?.access_token) {
        throw new Error('You must be signed in to manage game players.')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-refund`, {
        body: JSON.stringify({
          gameId: input.gameId,
          reason: input.reason,
          scenario: 'kick_player',
          userId: input.userId,
        }),
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to process kick refund.')
      }

      return payload as ProcessRefundResponse
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ['game', input.gameId] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      queryClient.invalidateQueries({ queryKey: ['payment-history'] })
    },
  })
}
