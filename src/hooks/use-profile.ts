import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Pick<ProfileRow, 'avatar_url' | 'username'>

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) {
        return null
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        throw error
      }

      return data
    },
    enabled: !!user,
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select('*')
        .single()

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
  })
}
