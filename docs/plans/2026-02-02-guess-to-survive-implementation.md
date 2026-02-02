# Guess to Survive - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a football prediction survival game where players pick teams to win, advance on correct picks, get eliminated on losses/draws, and compete for prize pools.

**Architecture:** React SPA with Supabase backend. TanStack for routing/state/tables. Stripe for payments. football-data.org for EPL fixtures. Vercel hosting.

**Tech Stack:** React 18, Vite, TypeScript, TanStack (Router, Query, Table), Tailwind CSS, Shadcn/ui, Supabase (PostgreSQL, Auth, Edge Functions, RLS), Stripe (Checkout, Connect), Resend (email)

---

## Phase 1: Foundation

### Task 1.1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `index.html`

**Step 1: Initialize Vite React TypeScript project**

Run:
```bash
pnpm create vite@latest . --template react-ts
```

**Step 2: Install core dependencies**

Run:
```bash
pnpm add @tanstack/react-router @tanstack/react-query @tanstack/react-table
pnpm add tailwindcss postcss autoprefixer
pnpm add @supabase/supabase-js
pnpm add -D @tanstack/router-devtools @tanstack/react-query-devtools
```

**Step 3: Initialize Tailwind**

Run:
```bash
pnpm dlx tailwindcss init -p --ts
```

**Step 4: Verify dev server starts**

Run: `pnpm dev`
Expected: Dev server at http://localhost:5173

**Step 5: Commit**

```bash
git add .
git commit -m "chore: initialize vite react typescript project"
```

---

### Task 1.2: Shadcn/ui Setup

**Files:**
- Create: `components.json`
- Create: `src/components/ui/button.tsx`
- Create: `src/lib/utils.ts`

**Step 1: Initialize shadcn**

Run:
```bash
pnpm dlx shadcn@latest init
```
Select: TypeScript, Default style, Slate color, CSS variables, tailwind.config.ts, @/components, @/lib/utils, React Server Components: No

**Step 2: Add core components**

Run:
```bash
pnpm dlx shadcn@latest add button card input label form toast
```

**Step 3: Verify button renders**

Create test file `src/App.tsx`:
```tsx
import { Button } from "@/components/ui/button"

function App() {
  return <Button>Test</Button>
}

export default App
```

Run: `pnpm dev`
Expected: Button renders with styling

**Step 4: Commit**

```bash
git add .
git commit -m "chore: setup shadcn/ui with core components"
```

---

### Task 1.3: TanStack Router Setup

**Files:**
- Create: `src/routes/__root.tsx`
- Create: `src/routes/index.tsx`
- Create: `src/routeTree.gen.ts`
- Modify: `src/main.tsx`
- Modify: `vite.config.ts`

**Step 1: Install router plugin**

Run:
```bash
pnpm add -D @tanstack/router-plugin
```

**Step 2: Configure Vite plugin**

Edit `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 3: Create root route**

Create `src/routes/__root.tsx`:
```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

**Step 4: Create index route**

Create `src/routes/index.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return <div>Guess to Survive</div>
}
```

**Step 5: Update main.tsx**

Edit `src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
```

**Step 6: Verify routing works**

Run: `pnpm dev`
Expected: Index page shows "Guess to Survive", devtools visible

**Step 7: Commit**

```bash
git add .
git commit -m "feat: setup tanstack router with file-based routing"
```

---

### Task 1.4: TanStack Query Setup

**Files:**
- Modify: `src/main.tsx`
- Create: `src/lib/query-client.ts`

**Step 1: Create query client**

Create `src/lib/query-client.ts`:
```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})
```

**Step 2: Add QueryClientProvider**

Edit `src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { routeTree } from './routeTree.gen'
import { queryClient } from './lib/query-client'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

**Step 3: Verify Query devtools visible**

Run: `pnpm dev`
Expected: React Query devtools flower icon visible

**Step 4: Commit**

```bash
git add .
git commit -m "feat: setup tanstack query with devtools"
```

---

### Task 1.5: Supabase Project Setup

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `.env.local`
- Create: `.env.example`

**Step 1: Create Supabase project**

Go to https://supabase.com/dashboard
Create new project: "guess-to-survive"
Note: Project URL and anon key

**Step 2: Create env files**

Create `.env.example`:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Create `.env.local` with actual values from Supabase dashboard.

**Step 3: Create Supabase client**

Create `src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**Step 4: Add .env.local to .gitignore**

Verify `.gitignore` includes:
```
.env.local
.env*.local
```

**Step 5: Commit**

```bash
git add .env.example src/lib/supabase.ts .gitignore
git commit -m "feat: setup supabase client configuration"
```

---

### Task 1.6: Database Schema - Users Extension

**Files:**
- Create: `supabase/migrations/001_users.sql`

**Step 1: Create migration file**

Create `supabase/migrations/001_users.sql`:
```sql
-- Extend auth.users with public profile data
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  email_verified boolean default false,
  role text default 'user' check (role in ('user', 'admin')),
  self_excluded_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Username constraints
alter table public.profiles
  add constraint username_length check (char_length(username) >= 3 and char_length(username) <= 20),
  add constraint username_format check (username ~ '^[a-zA-Z0-9_]+$');

-- RLS policies
alter table public.profiles enable row level security;

-- Anyone can view profiles
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can update own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
```

**Step 2: Apply migration via Supabase dashboard**

Go to SQL Editor in Supabase dashboard
Paste and run the migration

**Step 3: Verify table created**

Check Table Editor shows `profiles` table

**Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add profiles table with RLS policies"
```

---

### Task 1.7: Database Types Generation

**Files:**
- Create: `src/types/database.ts`

**Step 1: Install Supabase CLI**

Run:
```bash
pnpm add -D supabase
```

**Step 2: Generate types**

Run:
```bash
pnpm supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

**Step 3: Add npm script**

Edit `package.json`, add to scripts:
```json
"db:types": "supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts"
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add supabase type generation"
```

---

### Task 1.8: Auth Context Setup

**Files:**
- Create: `src/contexts/auth-context.tsx`
- Create: `src/hooks/use-auth.ts`

**Step 1: Create auth context**

Create `src/contexts/auth-context.tsx`:
```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

**Step 2: Create hook file for re-export**

Create `src/hooks/use-auth.ts`:
```ts
export { useAuth } from '@/contexts/auth-context'
```

**Step 3: Add AuthProvider to main.tsx**

Edit `src/main.tsx`, wrap RouterProvider:
```tsx
import { AuthProvider } from '@/contexts/auth-context'

// Inside render:
<AuthProvider>
  <RouterProvider router={router} />
</AuthProvider>
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add auth context and useAuth hook"
```

---

### Task 1.9: Email/Password Auth - Sign Up

**Files:**
- Create: `src/routes/auth/signup.tsx`
- Create: `src/lib/auth.ts`

**Step 1: Create auth utilities**

Create `src/lib/auth.ts`:
```ts
import { supabase } from './supabase'

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}
```

**Step 2: Create signup page**

Create `src/routes/auth/signup.tsx`:
```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { signUp } from '@/lib/auth'

export const Route = createFileRoute('/auth/signup')({
  component: SignUpPage,
})

function SignUpPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signUp(email, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="mx-auto mt-20 max-w-md">
        <CardContent className="pt-6">
          <p>Check your email to confirm your account.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto mt-20 max-w-md">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Step 3: Verify signup page renders**

Run: `pnpm dev`
Navigate to: http://localhost:5173/auth/signup
Expected: Form renders

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add email/password signup"
```

---

### Task 1.10: Email/Password Auth - Sign In

**Files:**
- Create: `src/routes/auth/login.tsx`

**Step 1: Create login page**

Create `src/routes/auth/login.tsx`:
```tsx
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { signIn } from '@/lib/auth'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto mt-20 max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          Don't have an account? <Link to="/auth/signup" className="underline">Sign up</Link>
        </p>
      </CardContent>
    </Card>
  )
}
```

**Step 2: Verify login page renders**

Run: `pnpm dev`
Navigate to: http://localhost:5173/auth/login
Expected: Form renders with link to signup

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add email/password login"
```

---

### Task 1.11: Auth Callback Route

**Files:**
- Create: `src/routes/auth/callback.tsx`

**Step 1: Create callback route**

Create `src/routes/auth/callback.tsx`:
```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate({ to: '/' })
      }
    })
  }, [navigate])

  return <div>Loading...</div>
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add auth callback route"
```

---

### Task 1.12: Google OAuth

**Files:**
- Modify: `src/routes/auth/login.tsx`

**Step 1: Enable Google provider in Supabase**

Go to Supabase Dashboard > Authentication > Providers
Enable Google, add Client ID and Secret from Google Cloud Console

**Step 2: Add Google button to login**

Edit `src/routes/auth/login.tsx`, add after form:
```tsx
import { signIn, signInWithGoogle } from '@/lib/auth'

// Inside component, add handler:
const handleGoogleSignIn = async () => {
  try {
    await signInWithGoogle()
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Google sign in failed')
  }
}

// In JSX, after form closing tag:
<div className="mt-4">
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-background px-2 text-muted-foreground">Or</span>
    </div>
  </div>
  <Button
    variant="outline"
    className="mt-4 w-full"
    onClick={handleGoogleSignIn}
  >
    Continue with Google
  </Button>
</div>
```

**Step 3: Test Google OAuth flow**

Run: `pnpm dev`
Click "Continue with Google"
Expected: Redirects to Google, then back to app

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add google oauth login"
```

---

### Task 1.13: Protected Routes

**Files:**
- Create: `src/components/protected-route.tsx`
- Modify: `src/routes/__root.tsx`

**Step 1: Create protected route component**

Create `src/components/protected-route.tsx`:
```tsx
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/auth/login" />
  }

  return <>{children}</>
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add protected route component"
```

---

### Task 1.14: Base Layout Component

**Files:**
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/layout.tsx`
- Modify: `src/routes/__root.tsx`

**Step 1: Create header component**

Create `src/components/layout/header.tsx`:
```tsx
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold">
          Guess to Survive
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/games">Games</Link>
              <Link to="/profile">Profile</Link>
              <Button variant="ghost" onClick={signOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/auth/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
```

**Step 2: Create layout component**

Create `src/components/layout/layout.tsx`:
```tsx
import { Header } from './header'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
```

**Step 3: Update root route**

Edit `src/routes/__root.tsx`:
```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Layout } from '@/components/layout/layout'

export const Route = createRootRoute({
  component: () => (
    <>
      <Layout>
        <Outlet />
      </Layout>
      <TanStackRouterDevtools />
    </>
  ),
})
```

**Step 4: Verify layout renders**

Run: `pnpm dev`
Expected: Header with logo and nav, content area below

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add base layout with header"
```

---

### Task 1.15: User Profile Page

**Files:**
- Create: `src/routes/profile.tsx`
- Create: `src/hooks/use-profile.ts`

**Step 1: Create profile hook**

Create `src/hooks/use-profile.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: { username?: string; avatar_url?: string }) => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
  })
}
```

**Step 2: Create profile page**

Create `src/routes/profile.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/protected-route'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'

export const Route = createFileRoute('/profile')({
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
})

function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const [username, setUsername] = useState('')

  if (isLoading) return <div>Loading...</div>

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile.mutate({ username })
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username || profile?.username || ''}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
            />
          </div>
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Step 3: Verify profile page**

Run: `pnpm dev`
Login and navigate to /profile
Expected: Profile form with username field

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add user profile page with username update"
```

---

---

## Phase 2: Core Game

### Task 2.1: Database Schema - Leagues & Teams

**Files:**
- Create: `supabase/migrations/002_leagues_teams.sql`

**Step 1: Create migration**

Create `supabase/migrations/002_leagues_teams.sql`:
```sql
-- Leagues table
create table public.leagues (
  id serial primary key,
  name text not null,
  code text not null unique,
  country text,
  current_season text,
  external_id integer unique
);

-- Teams table
create table public.teams (
  id serial primary key,
  league_id integer references public.leagues(id),
  name text not null,
  short_name text,
  crest_url text,
  external_id integer unique
);

-- RLS
alter table public.leagues enable row level security;
alter table public.teams enable row level security;

-- Public read access
create policy "Leagues are viewable by everyone"
  on public.leagues for select using (true);

create policy "Teams are viewable by everyone"
  on public.teams for select using (true);

-- Insert EPL
insert into public.leagues (name, code, country, current_season, external_id)
values ('Premier League', 'PL', 'England', '2025-26', 2021);
```

**Step 2: Apply migration**

Run in Supabase SQL Editor

**Step 3: Regenerate types**

Run: `pnpm db:types`

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add leagues and teams tables"
```

---

### Task 2.2: Database Schema - Fixtures

**Files:**
- Create: `supabase/migrations/003_fixtures.sql`

**Step 1: Create migration**

Create `supabase/migrations/003_fixtures.sql`:
```sql
-- Fixture status enum
create type fixture_status as enum ('scheduled', 'live', 'finished', 'postponed', 'cancelled');

-- Fixtures table
create table public.fixtures (
  id serial primary key,
  league_id integer references public.leagues(id) not null,
  round integer not null,
  home_team_id integer references public.teams(id) not null,
  away_team_id integer references public.teams(id) not null,
  kickoff_time timestamptz not null,
  status fixture_status default 'scheduled',
  home_score integer,
  away_score integer,
  external_id integer unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for round queries
create index fixtures_round_idx on public.fixtures(league_id, round);
create index fixtures_kickoff_idx on public.fixtures(kickoff_time);

-- RLS
alter table public.fixtures enable row level security;

create policy "Fixtures are viewable by everyone"
  on public.fixtures for select using (true);

-- Updated_at trigger
create trigger fixtures_updated_at
  before update on public.fixtures
  for each row execute procedure public.handle_updated_at();
```

**Step 2: Apply migration**

Run in Supabase SQL Editor

**Step 3: Regenerate types**

Run: `pnpm db:types`

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add fixtures table"
```

---

### Task 2.3: Database Schema - Games

**Files:**
- Create: `supabase/migrations/004_games.sql`

**Step 1: Create migration**

Create `supabase/migrations/004_games.sql`:
```sql
-- Game enums
create type game_visibility as enum ('public', 'private');
create type game_currency as enum ('EUR', 'GBP', 'USD');
create type wipeout_mode as enum ('split', 'rebuy');
create type pick_visibility as enum ('hidden', 'visible');
create type game_status as enum ('pending', 'active', 'completed', 'cancelled');

-- Games table
create table public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  manager_id uuid references public.profiles(id) not null,
  visibility game_visibility default 'public',
  entry_fee decimal(10,2) default 0,
  currency game_currency default 'EUR',
  starting_round integer not null,
  current_round integer,
  min_players integer default 2,
  max_players integer,
  wipeout_mode wipeout_mode default 'split',
  pick_visibility pick_visibility default 'hidden',
  status game_status default 'pending',
  prize_pool decimal(10,2) default 0,
  rebuy_deadline timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index games_status_idx on public.games(status);
create index games_manager_idx on public.games(manager_id);
create index games_code_idx on public.games(code);

-- RLS
alter table public.games enable row level security;

-- Public games visible to all
create policy "Public games are viewable"
  on public.games for select
  using (visibility = 'public' or manager_id = auth.uid());

-- Users can create games
create policy "Users can create games"
  on public.games for insert
  with check (auth.uid() = manager_id);

-- Managers can update their games
create policy "Managers can update own games"
  on public.games for update
  using (auth.uid() = manager_id);

-- Updated_at trigger
create trigger games_updated_at
  before update on public.games
  for each row execute procedure public.handle_updated_at();

-- Generate short code function
create or replace function generate_game_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$ language plpgsql;
```

**Step 2: Apply migration**

Run in Supabase SQL Editor

**Step 3: Regenerate types**

Run: `pnpm db:types`

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add games table with enums"
```

---

### Task 2.4: Database Schema - Game Players

**Files:**
- Create: `supabase/migrations/005_game_players.sql`

**Step 1: Create migration**

Create `supabase/migrations/005_game_players.sql`:
```sql
-- Player status enum
create type player_status as enum ('alive', 'eliminated', 'kicked');

-- Game players table
create table public.game_players (
  id serial primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  status player_status default 'alive',
  eliminated_round integer,
  kick_reason text,
  joined_at timestamptz default now(),
  is_rebuy boolean default false,
  stripe_payment_id text,
  unique(game_id, user_id)
);

-- Indexes
create index game_players_game_idx on public.game_players(game_id);
create index game_players_user_idx on public.game_players(user_id);

-- RLS
alter table public.game_players enable row level security;

-- Players visible in games user can see
create policy "Game players viewable"
  on public.game_players for select
  using (
    exists (
      select 1 from public.games g
      where g.id = game_id
      and (g.visibility = 'public' or g.manager_id = auth.uid())
    )
    or user_id = auth.uid()
  );

-- Users can join games
create policy "Users can join games"
  on public.game_players for insert
  with check (auth.uid() = user_id);

-- Users can leave (delete own record)
create policy "Users can leave games"
  on public.game_players for delete
  using (auth.uid() = user_id);
```

**Step 2: Apply migration**

Run in Supabase SQL Editor

**Step 3: Regenerate types**

Run: `pnpm db:types`

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add game_players table"
```

---

### Task 2.5: Database Schema - Picks

**Files:**
- Create: `supabase/migrations/006_picks.sql`

**Step 1: Create migration**

Create `supabase/migrations/006_picks.sql`:
```sql
-- Pick result enum
create type pick_result as enum ('pending', 'won', 'lost', 'draw', 'voided');

-- Picks table
create table public.picks (
  id serial primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  round integer not null,
  team_id integer references public.teams(id) not null,
  auto_assigned boolean default false,
  result pick_result default 'pending',
  created_at timestamptz default now(),
  unique(game_id, user_id, round)
);

-- Indexes
create index picks_game_round_idx on public.picks(game_id, round);
create index picks_user_idx on public.picks(user_id);

-- RLS
alter table public.picks enable row level security;

-- Picks visible based on game settings
create policy "Own picks always visible"
  on public.picks for select
  using (auth.uid() = user_id);

create policy "Others picks visible after deadline or if visible setting"
  on public.picks for select
  using (
    exists (
      select 1 from public.games g
      where g.id = game_id
      and (
        g.pick_visibility = 'visible'
        or g.manager_id = auth.uid()
        or exists (
          select 1 from public.fixtures f
          where f.league_id = 1
          and f.round = picks.round
          and f.kickoff_time <= now()
        )
      )
    )
  );

-- Users can make picks
create policy "Users can make picks"
  on public.picks for insert
  with check (auth.uid() = user_id);

-- Users can update own picks before deadline
create policy "Users can update picks"
  on public.picks for update
  using (auth.uid() = user_id);
```

**Step 2: Apply migration**

Run in Supabase SQL Editor

**Step 3: Regenerate types**

Run: `pnpm db:types`

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add picks table"
```

---

### Task 2.6: Football Data Sync - Edge Function Setup

**Files:**
- Create: `supabase/functions/sync-fixtures/index.ts`

**Step 1: Create edge function directory**

Run:
```bash
mkdir -p supabase/functions/sync-fixtures
```

**Step 2: Create sync function**

Create `supabase/functions/sync-fixtures/index.ts`:
```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FOOTBALL_API_KEY = Deno.env.get('FOOTBALL_DATA_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

serve(async (req) => {
  try {
    // Fetch fixtures from football-data.org
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED',
      {
        headers: {
          'X-Auth-Token': FOOTBALL_API_KEY!,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const matches = data.matches || []

    // Get team mappings
    const { data: teams } = await supabase
      .from('teams')
      .select('id, external_id')

    const teamMap = new Map(teams?.map(t => [t.external_id, t.id]) || [])

    // Upsert fixtures
    for (const match of matches) {
      const homeTeamId = teamMap.get(match.homeTeam.id)
      const awayTeamId = teamMap.get(match.awayTeam.id)

      if (!homeTeamId || !awayTeamId) continue

      await supabase.from('fixtures').upsert({
        external_id: match.id,
        league_id: 1, // EPL
        round: match.matchday,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        kickoff_time: match.utcDate,
        status: mapStatus(match.status),
        home_score: match.score?.fullTime?.home,
        away_score: match.score?.fullTime?.away,
      }, {
        onConflict: 'external_id',
      })
    }

    return new Response(JSON.stringify({ synced: matches.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

function mapStatus(apiStatus: string): string {
  const statusMap: Record<string, string> = {
    SCHEDULED: 'scheduled',
    TIMED: 'scheduled',
    IN_PLAY: 'live',
    PAUSED: 'live',
    FINISHED: 'finished',
    POSTPONED: 'postponed',
    CANCELLED: 'cancelled',
  }
  return statusMap[apiStatus] || 'scheduled'
}
```

**Step 3: Add environment variables in Supabase**

Go to Supabase Dashboard > Settings > Edge Functions
Add: FOOTBALL_DATA_API_KEY

**Step 4: Deploy function**

Run:
```bash
pnpm supabase functions deploy sync-fixtures
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add sync-fixtures edge function"
```

---

### Task 2.7: Football Data Sync - Teams

**Files:**
- Create: `supabase/functions/sync-teams/index.ts`

**Step 1: Create sync teams function**

Create `supabase/functions/sync-teams/index.ts`:
```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FOOTBALL_API_KEY = Deno.env.get('FOOTBALL_DATA_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

serve(async (req) => {
  try {
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/PL/teams',
      {
        headers: { 'X-Auth-Token': FOOTBALL_API_KEY! },
      }
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const teams = data.teams || []

    for (const team of teams) {
      await supabase.from('teams').upsert({
        external_id: team.id,
        league_id: 1,
        name: team.name,
        short_name: team.shortName || team.tla,
        crest_url: team.crest,
      }, {
        onConflict: 'external_id',
      })
    }

    return new Response(JSON.stringify({ synced: teams.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Step 2: Deploy function**

Run:
```bash
pnpm supabase functions deploy sync-teams
```

**Step 3: Invoke to seed teams**

Run:
```bash
pnpm supabase functions invoke sync-teams
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add sync-teams edge function"
```

---

### Task 2.8: Game Creation Form

**Files:**
- Create: `src/routes/games/create.tsx`
- Create: `src/hooks/use-games.ts`

**Step 1: Create games hook**

Create `src/hooks/use-games.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import type { Database } from '@/types/database'

type Game = Database['public']['Tables']['games']['Row']
type GameInsert = Database['public']['Tables']['games']['Insert']

export function useGames(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['games', filters],
    queryFn: async () => {
      let query = supabase
        .from('games')
        .select('*, profiles!manager_id(username)')
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreateGame() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (game: Omit<GameInsert, 'manager_id' | 'code'>) => {
      if (!user) throw new Error('Not authenticated')

      // Generate unique code
      const code = generateCode()

      const { data, error } = await supabase
        .from('games')
        .insert({
          ...game,
          manager_id: user.id,
          code,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
```

**Step 2: Create game creation page**

Create `src/routes/games/create.tsx`:
```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProtectedRoute } from '@/components/protected-route'
import { useCreateGame } from '@/hooks/use-games'

export const Route = createFileRoute('/games/create')({
  component: () => (
    <ProtectedRoute>
      <CreateGamePage />
    </ProtectedRoute>
  ),
})

function CreateGamePage() {
  const navigate = useNavigate()
  const createGame = useCreateGame()
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [entryFee, setEntryFee] = useState('0')
  const [currency, setCurrency] = useState<'EUR' | 'GBP' | 'USD'>('EUR')
  const [startingRound, setStartingRound] = useState('1')
  const [minPlayers, setMinPlayers] = useState('2')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [wipeoutMode, setWipeoutMode] = useState<'split' | 'rebuy'>('split')
  const [pickVisibility, setPickVisibility] = useState<'hidden' | 'visible'>('hidden')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const game = await createGame.mutateAsync({
        name,
        visibility,
        entry_fee: parseFloat(entryFee) || 0,
        currency,
        starting_round: parseInt(startingRound),
        min_players: parseInt(minPlayers),
        max_players: maxPlayers ? parseInt(maxPlayers) : null,
        wipeout_mode: wipeoutMode,
        pick_visibility: pickVisibility,
      })
      navigate({ to: '/games/$gameId', params: { gameId: game.id } })
    } catch (error) {
      console.error('Failed to create game:', error)
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Create Game</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Game Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={(v: 'public' | 'private') => setVisibility(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entryFee">Entry Fee</Label>
              <Input
                id="entryFee"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v: 'EUR' | 'GBP' | 'USD') => setCurrency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="startingRound">Starting Round</Label>
            <Input
              id="startingRound"
              type="number"
              min="1"
              max="38"
              value={startingRound}
              onChange={(e) => setStartingRound(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minPlayers">Min Players</Label>
              <Input
                id="minPlayers"
                type="number"
                min="2"
                value={minPlayers}
                onChange={(e) => setMinPlayers(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maxPlayers">Max Players (optional)</Label>
              <Input
                id="maxPlayers"
                type="number"
                min="2"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div>
            <Label>Wipeout Mode</Label>
            <Select value={wipeoutMode} onValueChange={(v: 'split' | 'rebuy') => setWipeoutMode(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="split">Split (pool splits on wipeout)</SelectItem>
                <SelectItem value="rebuy">Rebuy (24h window to rebuy)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Pick Visibility</Label>
            <Select value={pickVisibility} onValueChange={(v: 'hidden' | 'visible') => setPickVisibility(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hidden">Hidden until deadline</SelectItem>
                <SelectItem value="visible">Visible immediately</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={createGame.isPending}>
            {createGame.isPending ? 'Creating...' : 'Create Game'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Step 3: Add Select component**

Run:
```bash
pnpm dlx shadcn@latest add select
```

**Step 4: Verify form renders**

Run: `pnpm dev`
Navigate to: /games/create
Expected: Full game creation form

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add game creation form"
```

---

### Task 2.9: Game Browser Page

**Files:**
- Create: `src/routes/games/index.tsx`

**Step 1: Create games list page**

Create `src/routes/games/index.tsx`:
```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGames } from '@/hooks/use-games'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/games/')({
  component: GamesPage,
})

function GamesPage() {
  const { user } = useAuth()
  const { data: games, isLoading } = useGames()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Games</h1>
        {user && (
          <Link to="/games/create">
            <Button>Create Game</Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <p>Loading games...</p>
      ) : games?.length === 0 ? (
        <p>No games found. Create one to get started!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games?.map((game) => (
            <Link key={game.id} to="/games/$gameId" params={{ gameId: game.id }}>
              <Card className="cursor-pointer hover:bg-accent">
                <CardHeader>
                  <CardTitle>{game.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p>
                      Entry: {game.entry_fee === 0 ? 'Free' : `${game.currency} ${game.entry_fee}`}
                    </p>
                    <p>Status: {game.status}</p>
                    <p>Round: {game.current_round || game.starting_round}</p>
                    <p className="text-muted-foreground">
                      by {(game as any).profiles?.username || 'Unknown'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify games list**

Run: `pnpm dev`
Navigate to: /games
Expected: Games list or empty state

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add game browser page"
```

---

### Task 2.10: Game Detail Page

**Files:**
- Create: `src/routes/games/$gameId.tsx`
- Create: `src/hooks/use-game.ts`

**Step 1: Create single game hook**

Create `src/hooks/use-game.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

export function useGame(gameId: string) {
  return useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          profiles!manager_id(username, avatar_url),
          game_players(
            *,
            profiles(username, avatar_url)
          )
        `)
        .eq('id', gameId)
        .single()

      if (error) throw error
      return data
    },
  })
}

export function useJoinGame() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('game_players')
        .insert({
          game_id: gameId,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
    },
  })
}

export function useLeaveGame() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
    },
  })
}
```

**Step 2: Create game detail page**

Create `src/routes/games/$gameId.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGame, useJoinGame, useLeaveGame } from '@/hooks/use-game'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/games/$gameId')({
  component: GameDetailPage,
})

function GameDetailPage() {
  const { gameId } = Route.useParams()
  const { user } = useAuth()
  const { data: game, isLoading } = useGame(gameId)
  const joinGame = useJoinGame()
  const leaveGame = useLeaveGame()

  if (isLoading) return <p>Loading...</p>
  if (!game) return <p>Game not found</p>

  const isManager = user?.id === game.manager_id
  const isPlayer = game.game_players?.some((p: any) => p.user_id === user?.id)
  const playerCount = game.game_players?.length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{game.name}</h1>
          <p className="text-muted-foreground">
            by {(game as any).profiles?.username} • Code: {game.code}
          </p>
        </div>
        <div>
          {!isPlayer && user && game.status === 'pending' && (
            <Button
              onClick={() => joinGame.mutate(gameId)}
              disabled={joinGame.isPending}
            >
              {game.entry_fee > 0 ? `Join (${game.currency} ${game.entry_fee})` : 'Join Game'}
            </Button>
          )}
          {isPlayer && !isManager && game.status === 'pending' && (
            <Button
              variant="outline"
              onClick={() => leaveGame.mutate(gameId)}
              disabled={leaveGame.isPending}
            >
              Leave Game
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Game Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Status: {game.status}</p>
            <p>Entry: {game.entry_fee === 0 ? 'Free' : `${game.currency} ${game.entry_fee}`}</p>
            <p>Starting Round: {game.starting_round}</p>
            <p>Current Round: {game.current_round || '-'}</p>
            <p>Players: {playerCount} / {game.max_players || '∞'}</p>
            <p>Min Players: {game.min_players}</p>
            <p>Wipeout Mode: {game.wipeout_mode}</p>
            <p>Pick Visibility: {game.pick_visibility}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Players ({playerCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {game.game_players?.length === 0 ? (
              <p className="text-muted-foreground">No players yet</p>
            ) : (
              <ul className="space-y-2">
                {game.game_players?.map((player: any) => (
                  <li key={player.id} className="flex items-center gap-2">
                    <span>{player.profiles?.username || 'Unknown'}</span>
                    {player.status !== 'alive' && (
                      <span className="text-xs text-muted-foreground">
                        ({player.status})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

**Step 3: Verify game detail**

Run: `pnpm dev`
Create a game, navigate to its detail page
Expected: Game info and players list

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add game detail page with join/leave"
```

---

### Task 2.11: Make Pick Page

**Files:**
- Create: `src/routes/games/$gameId/pick.tsx`
- Create: `src/hooks/use-picks.ts`
- Create: `src/hooks/use-teams.ts`

**Step 1: Create teams hook**

Create `src/hooks/use-teams.ts`:
```ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name')

      if (error) throw error
      return data
    },
  })
}

export function useAvailableTeams(gameId: string, round: number) {
  return useQuery({
    queryKey: ['available-teams', gameId, round],
    queryFn: async () => {
      // Get teams playing this round
      const { data: fixtures } = await supabase
        .from('fixtures')
        .select('home_team_id, away_team_id')
        .eq('round', round)

      const playingTeamIds = new Set<number>()
      fixtures?.forEach((f) => {
        playingTeamIds.add(f.home_team_id)
        playingTeamIds.add(f.away_team_id)
      })

      // Get user's previous picks in this game
      const { data: picks } = await supabase
        .from('picks')
        .select('team_id')
        .eq('game_id', gameId)

      const usedTeamIds = new Set(picks?.map((p) => p.team_id) || [])

      // Get all teams
      const { data: teams } = await supabase.from('teams').select('*')

      return teams?.filter(
        (t) => playingTeamIds.has(t.id) && !usedTeamIds.has(t.id)
      ) || []
    },
  })
}
```

**Step 2: Create picks hook**

Create `src/hooks/use-picks.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

export function useMyPicks(gameId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['picks', gameId, user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('picks')
        .select('*, teams(*)')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .order('round')

      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useMakePick() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      gameId,
      round,
      teamId,
    }: {
      gameId: string
      round: number
      teamId: number
    }) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('picks')
        .upsert(
          {
            game_id: gameId,
            user_id: user.id,
            round,
            team_id: teamId,
          },
          {
            onConflict: 'game_id,user_id,round',
          }
        )
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['picks', gameId] })
    },
  })
}
```

**Step 3: Create pick page**

Create `src/routes/games/$gameId/pick.tsx`:
```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/protected-route'
import { useGame } from '@/hooks/use-game'
import { useAvailableTeams } from '@/hooks/use-teams'
import { useMyPicks, useMakePick } from '@/hooks/use-picks'

export const Route = createFileRoute('/games/$gameId/pick')({
  component: () => (
    <ProtectedRoute>
      <PickPage />
    </ProtectedRoute>
  ),
})

function PickPage() {
  const { gameId } = Route.useParams()
  const navigate = useNavigate()
  const { data: game } = useGame(gameId)
  const round = game?.current_round || game?.starting_round || 1
  const { data: availableTeams, isLoading: teamsLoading } = useAvailableTeams(gameId, round)
  const { data: myPicks } = useMyPicks(gameId)
  const makePick = useMakePick()
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)

  const currentPick = myPicks?.find((p) => p.round === round)

  const handleSubmit = async () => {
    if (!selectedTeam) return
    await makePick.mutateAsync({ gameId, round, teamId: selectedTeam })
    navigate({ to: '/games/$gameId', params: { gameId } })
  }

  if (teamsLoading) return <p>Loading teams...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Make Your Pick</h1>
        <p className="text-muted-foreground">
          {game?.name} - Round {round}
        </p>
      </div>

      {currentPick && (
        <Card>
          <CardContent className="pt-4">
            <p>
              Current pick: <strong>{(currentPick as any).teams?.name}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              You can change your pick until the round locks.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {availableTeams?.map((team) => (
          <Card
            key={team.id}
            className={`cursor-pointer transition-colors ${
              selectedTeam === team.id
                ? 'border-primary bg-primary/10'
                : 'hover:bg-accent'
            }`}
            onClick={() => setSelectedTeam(team.id)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              {team.crest_url && (
                <img src={team.crest_url} alt="" className="h-8 w-8" />
              )}
              <span>{team.name}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {availableTeams?.length === 0 && (
        <p className="text-muted-foreground">
          No available teams this round. You may have used all teams playing.
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!selectedTeam || makePick.isPending}
        className="w-full"
      >
        {makePick.isPending ? 'Saving...' : 'Confirm Pick'}
      </Button>
    </div>
  )
}
```

**Step 4: Add link to pick page from game detail**

Edit `src/routes/games/$gameId.tsx`, add after join/leave buttons:
```tsx
{isPlayer && game.status === 'active' && (
  <Link to="/games/$gameId/pick" params={{ gameId }}>
    <Button>Make Pick</Button>
  </Link>
)}
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add make pick page with team selection"
```

---

### Task 2.12: Game Leaderboard

**Files:**
- Modify: `src/routes/games/$gameId.tsx`
- Create: `src/components/game-leaderboard.tsx`

**Step 1: Create leaderboard component**

Create `src/components/game-leaderboard.tsx`:
```tsx
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface GameLeaderboardProps {
  gameId: string
  pickVisibility: 'hidden' | 'visible'
  currentRound: number
}

export function GameLeaderboard({
  gameId,
  pickVisibility,
  currentRound,
}: GameLeaderboardProps) {
  const { data: players, isLoading } = useQuery({
    queryKey: ['leaderboard', gameId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_players')
        .select(`
          *,
          profiles(username, avatar_url),
          picks:picks(round, team_id, result, teams(name, short_name))
        `)
        .eq('game_id', gameId)
        .order('status')

      if (error) throw error
      return data
    },
  })

  if (isLoading) return <p>Loading leaderboard...</p>

  // Sort: alive first, then by rounds survived
  const sorted = [...(players || [])].sort((a, b) => {
    if (a.status === 'alive' && b.status !== 'alive') return -1
    if (a.status !== 'alive' && b.status === 'alive') return 1
    const aRounds = a.eliminated_round || currentRound
    const bRounds = b.eliminated_round || currentRound
    return bRounds - aRounds
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Player</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Rounds</TableHead>
          <TableHead>Current Pick</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((player: any, index) => {
          const currentPick = player.picks?.find(
            (p: any) => p.round === currentRound
          )
          const showPick =
            pickVisibility === 'visible' ||
            player.status !== 'alive'

          return (
            <TableRow key={player.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{player.profiles?.username || 'Unknown'}</TableCell>
              <TableCell>
                <span
                  className={
                    player.status === 'alive'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {player.status}
                </span>
              </TableCell>
              <TableCell>
                {player.eliminated_round
                  ? player.eliminated_round - 1
                  : currentRound}
              </TableCell>
              <TableCell>
                {showPick
                  ? currentPick?.teams?.short_name || '-'
                  : '???'}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
```

**Step 2: Add table component**

Run:
```bash
pnpm dlx shadcn@latest add table
```

**Step 3: Add leaderboard to game detail**

Edit `src/routes/games/$gameId.tsx`, add import and use:
```tsx
import { GameLeaderboard } from '@/components/game-leaderboard'

// After the two cards grid, add:
<Card>
  <CardHeader>
    <CardTitle>Leaderboard</CardTitle>
  </CardHeader>
  <CardContent>
    <GameLeaderboard
      gameId={gameId}
      pickVisibility={game.pick_visibility as 'hidden' | 'visible'}
      currentRound={game.current_round || game.starting_round}
    />
  </CardContent>
</Card>
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add game leaderboard component"
```

---

### Task 2.13: Auto-Assign Edge Function

**Files:**
- Create: `supabase/functions/process-round/index.ts`

**Step 1: Create process round function**

Create `supabase/functions/process-round/index.ts`:
```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

serve(async (req) => {
  try {
    const { gameId, round } = await req.json()

    // Get game
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (!game) throw new Error('Game not found')

    // Get alive players
    const { data: alivePlayers } = await supabase
      .from('game_players')
      .select('user_id')
      .eq('game_id', gameId)
      .eq('status', 'alive')

    // Get teams playing this round
    const { data: fixtures } = await supabase
      .from('fixtures')
      .select('home_team_id, away_team_id')
      .eq('round', round)

    const playingTeamIds = new Set<number>()
    fixtures?.forEach((f) => {
      playingTeamIds.add(f.home_team_id)
      playingTeamIds.add(f.away_team_id)
    })

    // Get all teams sorted alphabetically
    const { data: allTeams } = await supabase
      .from('teams')
      .select('id, name')
      .order('name')

    const teamsThisRound = allTeams?.filter((t) => playingTeamIds.has(t.id)) || []

    // Process each alive player without a pick
    for (const player of alivePlayers || []) {
      // Check if player has pick
      const { data: existingPick } = await supabase
        .from('picks')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', player.user_id)
        .eq('round', round)
        .single()

      if (existingPick) continue // Has pick, skip

      // Get player's used teams
      const { data: usedPicks } = await supabase
        .from('picks')
        .select('team_id')
        .eq('game_id', gameId)
        .eq('user_id', player.user_id)

      const usedTeamIds = new Set(usedPicks?.map((p) => p.team_id) || [])

      // Find first available team alphabetically
      const availableTeam = teamsThisRound.find(
        (t) => !usedTeamIds.has(t.id)
      )

      if (availableTeam) {
        // Auto-assign
        await supabase.from('picks').insert({
          game_id: gameId,
          user_id: player.user_id,
          round,
          team_id: availableTeam.id,
          auto_assigned: true,
        })
      } else {
        // No available team - eliminate
        await supabase
          .from('game_players')
          .update({
            status: 'eliminated',
            eliminated_round: round,
          })
          .eq('game_id', gameId)
          .eq('user_id', player.user_id)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Step 2: Deploy function**

Run:
```bash
pnpm supabase functions deploy process-round
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add auto-assign process-round edge function"
```

---

### Task 2.14: Process Results Edge Function

**Files:**
- Create: `supabase/functions/process-results/index.ts`

**Step 1: Create process results function**

Create `supabase/functions/process-results/index.ts`:
```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

serve(async (req) => {
  try {
    const { gameId, round } = await req.json()

    // Get game
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (!game) throw new Error('Game not found')

    // Get fixtures for round
    const { data: fixtures } = await supabase
      .from('fixtures')
      .select('*')
      .eq('round', round)
      .eq('status', 'finished')

    // Build results map: teamId -> 'won' | 'lost' | 'draw'
    const results = new Map<number, 'won' | 'lost' | 'draw'>()

    for (const fixture of fixtures || []) {
      if (fixture.home_score === null || fixture.away_score === null) continue

      if (fixture.home_score > fixture.away_score) {
        results.set(fixture.home_team_id, 'won')
        results.set(fixture.away_team_id, 'lost')
      } else if (fixture.home_score < fixture.away_score) {
        results.set(fixture.home_team_id, 'lost')
        results.set(fixture.away_team_id, 'won')
      } else {
        results.set(fixture.home_team_id, 'draw')
        results.set(fixture.away_team_id, 'draw')
      }
    }

    // Get all picks for this round
    const { data: picks } = await supabase
      .from('picks')
      .select('*')
      .eq('game_id', gameId)
      .eq('round', round)

    // Update each pick and eliminate losers
    for (const pick of picks || []) {
      const result = results.get(pick.team_id)
      if (!result) continue

      // Update pick result
      await supabase
        .from('picks')
        .update({ result })
        .eq('id', pick.id)

      // Eliminate if lost or draw
      if (result === 'lost' || result === 'draw') {
        await supabase
          .from('game_players')
          .update({
            status: 'eliminated',
            eliminated_round: round,
          })
          .eq('game_id', gameId)
          .eq('user_id', pick.user_id)
      }
    }

    // Check if game should complete (0 or 1 survivor)
    const { data: alivePlayers } = await supabase
      .from('game_players')
      .select('id')
      .eq('game_id', gameId)
      .eq('status', 'alive')

    if ((alivePlayers?.length || 0) <= 1) {
      await supabase
        .from('games')
        .update({ status: 'completed' })
        .eq('id', gameId)
    } else {
      // Advance to next round
      await supabase
        .from('games')
        .update({ current_round: round + 1 })
        .eq('id', gameId)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Step 2: Deploy function**

Run:
```bash
pnpm supabase functions deploy process-results
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add process-results edge function for eliminations"
```

---

## Phase 2 Complete

Phase 2 establishes the core game:
- Database schema (leagues, teams, fixtures, games, players, picks)
- Football data sync functions
- Game CRUD (create, list, detail)
- Join/leave games
- Make pick with team selection
- Game leaderboard
- Auto-assign logic
- Results processing and eliminations

Continue to Phase 3 for Payments implementation.
