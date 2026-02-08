import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

function isPlaceholder(value: string) {
  return (
    value.includes("your-project-ref") ||
    value.includes("<project-ref>") ||
    value.includes("your-anon-key") ||
    value.includes("<anon-key>")
  );
}

if (!(supabaseUrl && supabaseAnonKey)) {
  throw new Error(
    "Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  throw new Error(
    "Supabase environment variables look like placeholders. Update .env.local with real values (see .env.example)."
  );
}

try {
  new URL(supabaseUrl);
} catch {
  throw new Error(
    "Invalid VITE_SUPABASE_URL. Expected a valid URL such as https://<project-ref>.supabase.co"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
