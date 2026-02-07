import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type DenoEnv = {
  get: (name: string) => string | undefined
}

type DenoGlobal = {
  env: DenoEnv
}

function getRequiredEnv(name: string): string {
  const deno = (globalThis as { Deno?: DenoGlobal }).Deno
  const value = deno?.env.get(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function createAdminClient() {
  return createClient(getRequiredEnv('SUPABASE_URL'), getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      persistSession: false,
    },
  })
}
