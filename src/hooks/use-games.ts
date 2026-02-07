import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type GameInsert = Database['public']['Tables']['games']['Insert']
type GameRow = Database['public']['Tables']['games']['Row']

const GAME_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const GAME_CODE_LENGTH = 6
const MAX_GAME_CODE_ATTEMPTS = 20

export type CreateGameInput = Pick<
  GameInsert,
  | 'currency'
  | 'entry_fee'
  | 'max_players'
  | 'min_players'
  | 'name'
  | 'pick_visibility'
  | 'rebuy_deadline'
  | 'starting_round'
  | 'visibility'
  | 'wipeout_mode'
>

export type GameFilters = {
  status?: GameRow['status']
}

function generateRandomGameCode() {
  let code = ''

  for (let index = 0; index < GAME_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * GAME_CODE_ALPHABET.length)
    code += GAME_CODE_ALPHABET[randomIndex]
  }

  return code
}

export async function generateUniqueGameCode() {
  for (let attempt = 0; attempt < MAX_GAME_CODE_ATTEMPTS; attempt += 1) {
    const code = generateRandomGameCode()
    const { data, error } = await supabase.from('games').select('id').eq('code', code).maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return code
    }
  }

  throw new Error('Unable to generate a unique game code. Please try again.')
}

export function useGames(filters?: GameFilters) {
  return useQuery({
    queryKey: ['games', filters],
    queryFn: async () => {
      let query = supabase.from('games').select('*').order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query
      if (error) {
        throw error
      }

      return data
    },
  })
}

export function useCreateGame() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (game: CreateGameInput) => {
      if (!user) {
        throw new Error('You must be signed in to create a game.')
      }

      const code = await generateUniqueGameCode()
      const { data, error } = await supabase
        .from('games')
        .insert({
          ...game,
          code,
          manager_id: user.id,
        })
        .select('*')
        .single()

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
}
