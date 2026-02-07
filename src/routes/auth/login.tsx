import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn, signInWithGoogle } from '@/lib/auth'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
      navigate({ to: '/' })
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)

    try {
      await signInWithGoogle()
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Google sign in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 text-slate-100">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
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
                autoComplete="current-password"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-400">Or continue with</span>
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
              type="button"
              variant="outline"
            >
              {googleLoading ? 'Redirecting...' : 'Continue with Google'}
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-slate-300">
            Need an account?{' '}
            <Link className="underline" to="/auth/signup">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
