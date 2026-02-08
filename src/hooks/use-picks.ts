import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PickRow = Database['public']['Tables']['picks']['Row']

export type MakePickInput = {
  gameId: string
  round: number
  teamId: number
}

export function useMyPicks(gameId: string) {
  const { user } = useAuth()

  return useQuery<PickRow[]>({
    enabled: Boolean(user?.id) && Boolean(gameId),
    queryKey: ['my-picks', gameId, user?.id],
    queryFn: async () => {
      if (!user) {
        return []
      }

      const { data, error } = await supabase
        .from('picks')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .order('round', { ascending: true })

      if (error) {
        throw error
      }

      return data ?? []
    },
  })
}

export function useMakePick() {
  const { session, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ gameId, round, teamId }: MakePickInput) => {
      if (!user || !session?.access_token) {
        throw new Error('You must be signed in to make picks.')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-pick`, {
        body: JSON.stringify({ gameId, round, teamId }),
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as { action?: string; error?: string; pickId?: number } | null

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to submit pick.')
      }

      return payload as { action: 'created' | 'noop' | 'updated'; pickId?: number }
    },
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-picks', gameId, user?.id] })
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
