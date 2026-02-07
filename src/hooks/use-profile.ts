import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Pick<ProfileRow, 'avatar_url' | 'username'>
type CreateConnectAccountResponse = {
  accountId: string
  onboardingUrl: string
}

export type PaymentHistoryEntry = Database['public']['Tables']['payments']['Row'] & {
  game_name: string | null
}

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

export function useCreateConnectAccount() {
  const { session, user } = useAuth()

  return useMutation({
    mutationFn: async (): Promise<CreateConnectAccountResponse> => {
      if (!user || !session?.access_token) {
        throw new Error('You must be signed in to connect payouts.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-connect-account`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      )

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to start Stripe Connect onboarding.')
      }

      return payload as CreateConnectAccountResponse
    },
  })
}

export function usePaymentHistory() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['payment-history', user?.id],
    queryFn: async (): Promise<PaymentHistoryEntry[]> => {
      if (!user) {
        return []
      }

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (paymentsError) {
        throw paymentsError
      }

      const paymentRows = (payments ?? []) as PaymentHistoryEntry[]
      const gameIds = [...new Set(paymentRows.map((payment) => payment.game_id))]

      if (gameIds.length === 0) {
        return paymentRows.map((payment) => ({ ...payment, game_name: null }))
      }

      const { data: games, error: gamesError } = await supabase.from('games').select('id, name').in('id', gameIds)

      if (gamesError) {
        return paymentRows.map((payment) => ({ ...payment, game_name: null }))
      }

      const gameNameById = new Map((games ?? []).map((game) => [game.id, game.name]))
      return paymentRows.map((payment) => ({
        ...payment,
        game_name: gameNameById.get(payment.game_id) ?? null,
      }))
    },
    enabled: !!user,
  })
}
