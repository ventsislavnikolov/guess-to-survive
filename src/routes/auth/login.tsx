import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn, signInWithGoogle } from '@/lib/auth'
import { track } from '@/lib/analytics'

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
      track('auth_login', { method: 'email' })
      toast.success('Logged in successfully.')
      navigate({ to: '/' })
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : 'Login failed'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)

    try {
      track('auth_login_started', { method: 'google' })
      await signInWithGoogle()
      toast.info('Redirecting to Google...')
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : 'Google sign in failed'
      setError(message)
      toast.error(message)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <section aria-label="Log in" className="grid min-h-[70vh] place-items-center p-6">
      <Card className="w-full max-w-md border-border bg-card/80 text-card-foreground">
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
            <p className="text-right text-sm">
              <Link className="text-muted-foreground underline" to="/auth/forgot-password">
                Forgot password?
              </Link>
            </p>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
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
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Need an account?{' '}
            <Link className="underline" to="/auth/signup">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
