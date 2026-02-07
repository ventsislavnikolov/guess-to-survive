import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp } from '@/lib/auth'

export const Route = createFileRoute('/auth/signup')({
  component: SignUpPage,
})

function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signUp(email, password)
      setSuccess(true)
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 text-slate-100">
          <CardContent className="space-y-4 pt-6 text-center">
            <p className="text-lg font-medium">Check your email to confirm your account.</p>
            <a className="text-sm text-slate-300 underline" href="/auth/login">
              Continue to login
            </a>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 text-slate-100">
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                autoComplete="new-password"
                id="password"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? 'Signing up...' : 'Sign up'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-300">
            Already have an account?{' '}
            <a className="underline" href="/auth/login">
              Log in
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
