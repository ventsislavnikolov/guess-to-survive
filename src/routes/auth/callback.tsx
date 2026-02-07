import type { EmailOtpType } from '@supabase/supabase-js'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

const SUPPORTED_OTP_TYPES: ReadonlySet<EmailOtpType> = new Set([
  'signup',
  'recovery',
  'invite',
  'email',
  'email_change',
])

function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const handleCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')
        const tokenHash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            throw exchangeError
          }
        } else if (
          tokenHash &&
          type &&
          SUPPORTED_OTP_TYPES.has(type as EmailOtpType)
        ) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          })

          if (verifyError) {
            throw verifyError
          }
        }

        if (active) {
          navigate({ replace: true, to: '/' })
        }
      } catch (callbackError) {
        if (!active) {
          return
        }
        setError(
          callbackError instanceof Error ? callbackError.message : 'Authentication callback failed',
        )
      }
    }

    void handleCallback()

    return () => {
      active = false
    }
  }, [navigate])

  if (error) {
    return (
      <main className="grid min-h-[70vh] place-items-center p-6">
        <Card className="w-full max-w-md border-border bg-card/80 text-card-foreground">
          <CardHeader>
            <CardTitle>Authentication error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-400">{error}</p>
            <p className="text-sm text-muted-foreground">
              <Link className="underline" to="/auth/login">
                Return to login
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="grid min-h-[70vh] place-items-center p-6">
      <Card className="w-full max-w-md border-border bg-card/80 text-card-foreground">
        <CardContent className="space-y-2 pt-6 text-center">
          <p className="text-sm text-muted-foreground">Finalizing authentication...</p>
        </CardContent>
      </Card>
    </main>
  )
}
