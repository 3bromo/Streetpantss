import { createClient } from '@supabase/supabase-js'

/**
 * The EXACT SAME Supabase project used by the STREET PANTS website.
 * Only the public publishable/anon key is embedded — all privileged access
 * is enforced server-side by the existing Row Level Security policies.
 * The secret/service-role key is never included.
 */
export const SUPABASE_URL = 'https://werxnlgewnkliuuglovp.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_Da8t8P-wwj78ZEmD8lHWQQ_ZY9KQtY_'

/**
 * Private, revocable admin-app key (NOT a user session, NOT the service-role
 * key). It is sent as the `x-sp-admin-key` header; the server-side
 * `is_admin()` function (see ADMIN-KEY-SETUP.md) accepts it by SHA-256 hash.
 * Revocation = re-run the SQL with a different hash. Same database, same
 * tables, same storage as the website.
 */
export const ADMIN_APP_KEY = 'sp-admin-app-30c8e9316ddb6a4962ff47d3'

// ---------------------------------------------------------------------------
// Runtime auth audit: captures the REAL request the device makes (URL, key
// prefix, email, password length + hash, HTTP status, raw server response)
// so web and Android sign-ins can be compared byte-for-byte.
// ---------------------------------------------------------------------------

export interface AuthAudit {
  url: string
  keyPrefix: string
  email: string
  pwLength: number
  pwHash: string
  status: number
  server: string
}

let lastAudit: AuthAudit | null = null

export function getLastAuthAudit(): AuthAudit | null {
  return lastAudit
}

function djb2(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(16)
}

const realFetch: typeof fetch | null = typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null

if (realFetch) {
  ;(globalThis as unknown as { fetch: typeof fetch }).fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    const resp = await (realFetch as typeof fetch)(input as never, init as never)
    try {
      if (url.indexOf('/auth/v1/token') !== -1) {
        const body = typeof init?.body === 'string' ? init.body : ''
        let email = ''
        let pw = ''
        try {
          const j = JSON.parse(body) as { email?: string; password?: string }
          email = String(j.email ?? '')
          pw = String(j.password ?? '')
        } catch {
          /* body not json */
        }
        const headers = (init?.headers ?? {}) as HeadersInit
        let key = ''
        try {
          if (typeof (headers as Headers).get === 'function') key = (headers as Headers).get('apikey') ?? ''
          else key = String((headers as Record<string, string>).apikey ?? '')
        } catch {
          key = ''
        }
        const text = await resp.clone().text()
        lastAudit = {
          url: url,
          keyPrefix: key.slice(0, 14),
          email: email,
          pwLength: pw.length,
          pwHash: djb2(pw),
          status: resp.status,
          server: text.slice(0, 140),
        }
      }
    } catch {
      /* never break auth */
    }
    return resp
  }) as typeof fetch
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: { 'x-sp-admin-key': ADMIN_APP_KEY },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export const STORAGE_BUCKET = 'images'
