import { createFileRoute, Link } from '@tanstack/react-router'
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
      <main className="grid min-h-[70vh] place-items-center p-6">
        <Card className="w-full max-w-md border-border bg-card/80 text-card-foreground">
          <CardContent className="space-y-4 pt-6 text-center">
            <p className="text-lg font-medium">Check your email to confirm your account.</p>
            <Link className="text-sm text-muted-foreground underline" to="/auth/login">
              Continue to login
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="grid min-h-[70vh] place-items-center p-6">
      <Card className="w-full max-w-md border-border bg-card/80 text-card-foreground">
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
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link className="underline" to="/auth/login">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
