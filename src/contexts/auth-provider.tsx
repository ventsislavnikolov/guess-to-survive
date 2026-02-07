import type { Session, User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

import { AuthContext } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

type AuthProviderProps = {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const initSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (!active) {
        return
      }

      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
    }

    void initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ loading, session, signOut, user }}>
      {children}
    </AuthContext.Provider>
  )
}
