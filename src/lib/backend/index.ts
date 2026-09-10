import { Backend } from './types'
import { createSupabaseBackend } from './supabaseBackend'

export { getLastAuthAudit } from './supabaseBackend'

/**
 * Built-in connection for the STREET PANTS Supabase project.
 * The publishable (anon) key is safe to ship to browsers by design — every
 * privileged operation is enforced server-side by Row Level Security.
 * The secret/service_role key must NEVER appear here.
 * `.env` values (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) override these.
 */
const FALLBACK_URL = 'https://werxnlgewnkliuuglovp.supabase.co'
const FALLBACK_ANON_KEY = 'sb_publishable_Da8t8P-wwj78ZEmD8lHWQQ_ZY9KQtY_'

/** Resolved once at build/start — identical on every device and browser. */
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_URL
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || FALLBACK_ANON_KEY

let _backend: Backend | null = null

/**
 * The Supabase backend, initialized from Vite env vars
 * (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) with the bundled project as
 * fallback. Real Supabase Auth, Postgres and Storage — same on all devices.
 */
export function getBackend(): Backend {
  if (_backend) return _backend
  _backend = createSupabaseBackend(SUPABASE_URL, SUPABASE_ANON_KEY)
  return _backend
}
