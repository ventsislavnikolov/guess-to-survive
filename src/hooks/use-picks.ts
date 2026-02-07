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
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ gameId, round, teamId }: MakePickInput) => {
      if (!user) {
        throw new Error('You must be signed in to make picks.')
      }

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
        .eq('user_id', user.id)
        .eq('round', round)
        .maybeSingle()

      if (existingError) {
        throw existingError
      }

      if (existingPick) {
        if (existingPick.team_id === teamId) {
          return { action: 'noop' as const }
        }

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

        return { action: 'updated' as const, pickId: updatedPick.id }
      }

      const { data: createdPick, error: createError } = await supabase
        .from('picks')
        .insert({
          game_id: gameId,
          round,
          team_id: teamId,
          user_id: user.id,
        })
        .select('id')
        .single()

      if (createError) {
        throw createError
      }

      return { action: 'created' as const, pickId: createdPick.id }
    },
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-picks', gameId, user?.id] })
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
    },
  })
}
