import { useState, FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useAdminSession } from './useAdminSession'
import { usePageTitle } from '../lib/usePageTitle'
import { SUPABASE_URL, getLastAuthAudit } from '../lib/backend'

export default function AdminLoginPage() {
  usePageTitle('Admin Login')
  const { backend, session, ready } = useAdminSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [audit, setAudit] = useState('')
  const [busy, setBusy] = useState(false)

  if (ready && session) return <Navigate to="/admin" replace />

  const connectedHost = (() => {
    try {
      return new URL(SUPABASE_URL).host
    } catch {
      return SUPABASE_URL
    }
  })()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setAudit('')
    const { error: err } = await backend.signIn(email, password)
    setBusy(false)
    if (err) {
      setError(err)
      const a = getLastAuthAudit()
      if (a) {
        setAudit(
          'request: ' + a.url + '  •  key: ' + a.keyPrefix + '…  •  email sent: "' + a.email + '"  •  pw ' +
            a.pwLength + ' chars hash ' + a.pwHash + '  •  server ' + a.status + ': ' + a.server,
        )
      }
      return
    }
    navigate('/admin')
  }

  return (
    <div className="grid min-h-[100svh] bg-soft lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-ink/10 bg-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <p className="font-display text-xl font-black uppercase tracking-[0.06em] text-ink">Street Pants</p>
        <div>
          <p className="eyebrow text-ink/45">Store Admin</p>
          <p className="mt-3 max-w-md font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-ink">
            Run the streets.
            <br />
            <span className="text-outline">Run the store.</span>
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink/35">
          Protected area — authorized staff only
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <p className="font-display text-xl font-black uppercase tracking-[0.06em] text-ink lg:hidden">Street Pants</p>
          <h1 className="mt-6 font-display text-3xl font-black uppercase tracking-tight text-ink">Admin Login</h1>
          <p className="mt-2 text-[13.5px] text-ink/55">Sign in to manage products, orders, inventory and content.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@streetpants.example"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="input mt-1.5"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">Password</span>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="input pr-12"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink/45 transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-mono text-[11px] leading-relaxed tracking-[0.08em] text-red-700">
                {error}
              </p>
            )}
            {audit && (
              <div className="rounded-lg border border-ink/10 bg-white px-4 py-3 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-ink/55">
                <p className="mb-1 text-ink">Request audit (this device)</p>
                <p className="break-all">{audit}</p>
              </div>
            )}
            <button type="submit" disabled={busy} className="btn btn-dark w-full disabled:opacity-50">
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            <Lock size={12} /> Authenticated via Supabase — access enforced by Row Level Security.
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">Connected: {connectedHost}</p>
        </div>
      </div>
    </div>
  )
}
