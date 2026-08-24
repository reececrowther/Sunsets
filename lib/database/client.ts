import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'

// Env vars are read inside each function so that scripts using dotenv
// (which loads .env.local after imports are hoisted) see the correct values.

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, anon)
}

// Server client with session cookie forwarding — for Server Components and Route Handlers.
// Pass the result of `await cookies()` from next/headers.
export function createServerSupabaseClient(cookieMethods: CookieMethodsServer) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createServerClient(url, anon, { cookies: cookieMethods })
}

// Service role client — bypasses RLS for trusted server-side operations only.
// Never expose this to the client side or include in client bundles.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
