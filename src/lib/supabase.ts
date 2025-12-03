// C:\Users\gulfe\Medi\medicare-supersystem-frontend\src\lib\supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? undefined) as string | undefined
// support multiple possible names used in your env files
// Only using publishable key - no fallbacks
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined

if (!SUPABASE_URL) {
  throw new Error(
    'VITE_SUPABASE_URL is required. Add it to .env.local (or your environment) and restart the dev server.'
  )
}
if (!SUPABASE_KEY) {
  throw new Error(
    'VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY is required. Add it to your .env file and restart the dev server.'
  )
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY)