import { useCallback, useEffect, useState } from 'react'
import { Globe, Tags } from 'lucide-react'
import { fetchSettings, updateSettings } from '../lib/api'
import { useNav } from '../App'
import { SUPABASE_URL, supabase } from '../lib/supabase'
import { SiteSettings } from '../lib/types'
import { ErrorState, FullLoader, Spinner, TopBar, useSnack } from '../components/ui'

const CURRENCIES = ['EGP', 'USD', 'AED', 'SAR']

export default function SettingsScreen() {
  const nav = useNav()
  const { show } = useSnack()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [grant, setGrant] = useState<'checking' | 'active' | 'missing'>('checking')

  const probeGrant = useCallback(async () => {
    // Admin-only read: with the server-side grant active this returns >=1
    // profile row; without it RLS hides all rows from anon. Read-only probe.
    try {
      const { data } = await supabase.from('profiles').select('id').limit(1)
      setGrant(data && data.length > 0 ? 'active' : 'missing')
    } catch {
      setGrant('missing')
    }
  }, [])

  const load = useCallback(async () => {
    try {
      setSettings(await fetchSettings())
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load settings.')
    }
    probeGrant()
  }, [probeGrant])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    if (!settings) return
    setBusy(true)
    try {
      await updateSettings({
        storeName: settings.storeName,
        currency: settings.currency,
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        email: settings.email,
        instagram: settings.instagram,
        youtube: settings.youtube,
        freeThreshold: Number(settings.freeThreshold) || 0,
        standardShipping: Number(settings.standardShipping) || 0,
        expressShipping: Number(settings.expressShipping) || 0,
      })
      show('Settings saved')
      probeGrant()
    } catch (e) {
      show(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (error)
    return (
      <div className="px-4 pt-4">
        <TopBar title="Settings" onBack={nav.pop} />
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  if (!settings) return <FullLoader />

  const host = (() => {
    try {
      return new URL(SUPABASE_URL).host
    } catch {
      return SUPABASE_URL
    }
  })()

  return (
    <div>
      <TopBar title="Settings" onBack={nav.pop} />
      <div className="space-y-5 px-4 pt-4">
        <section className="card p-4">
          <p className="font-display text-[12px] font-black uppercase tracking-[0.14em]">Connection</p>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-navy-900/60">{host}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-800">
            Private admin · key-based access · no login
          </p>
          <p
            className={`mt-2 rounded-lg px-3 py-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] ${
              grant === 'active'
                ? 'bg-navy-100 text-navy-900'
                : grant === 'missing'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-soft text-navy-900/50'
            }`}
          >
            {grant === 'active' && 'Server admin grant: ACTIVE — full write access'}
            {grant === 'missing' &&
              'Server admin grant: NOT ENABLED — run supabase/enable-admin-app.sql once in the Supabase SQL Editor'}
            {grant === 'checking' && 'Checking server admin grant…'}
          </p>
        </section>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => nav.push({ name: 'social' })} className="btn btn-ghost h-14 flex-col gap-1 !text-[9px]">
            <Tags size={16} /> Social Links
          </button>
          <button onClick={() => nav.push({ name: 'content' })} className="btn btn-ghost h-14 flex-col gap-1 !text-[9px]">
            <Globe size={16} /> Content
          </button>
          <button onClick={() => nav.push({ name: 'discounts' })} className="btn btn-ghost h-14 flex-col gap-1 !text-[9px]">
            <Tags size={16} /> Discounts
          </button>
        </div>

        <section className="card space-y-4 p-4">
          <p className="font-display text-[12px] font-black uppercase tracking-[0.14em]">Store information</p>
          <div>
            <span className="label">Store name</span>
            <input className="input" value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label">Currency</span>
              <select className="input appearance-none font-mono text-[13px]" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Contact email</span>
              <input className="input" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
            </div>
            <div>
              <span className="label">Phone</span>
              <input className="input font-mono text-[13px]" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
            </div>
            <div>
              <span className="label">WhatsApp</span>
              <input className="input font-mono text-[13px]" value={settings.whatsapp} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} />
            </div>
            <div>
              <span className="label">Instagram</span>
              <input className="input font-mono text-[12px]" value={settings.instagram} onChange={(e) => setSettings({ ...settings, instagram: e.target.value })} />
            </div>
            <div>
              <span className="label">YouTube</span>
              <input className="input font-mono text-[12px]" value={settings.youtube} onChange={(e) => setSettings({ ...settings, youtube: e.target.value })} />
            </div>
          </div>
        </section>

        <section className="card space-y-4 p-4">
          <p className="font-display text-[12px] font-black uppercase tracking-[0.14em]">Shipping</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="label">Free over</span>
              <input className="input font-mono text-[13px]" type="number" value={String(settings.freeThreshold)} onChange={(e) => setSettings({ ...settings, freeThreshold: Number(e.target.value) })} />
            </div>
            <div>
              <span className="label">Standard</span>
              <input className="input font-mono text-[13px]" type="number" value={String(settings.standardShipping)} onChange={(e) => setSettings({ ...settings, standardShipping: Number(e.target.value) })} />
            </div>
            <div>
              <span className="label">Express</span>
              <input className="input font-mono text-[13px]" type="number" value={String(settings.expressShipping)} onChange={(e) => setSettings({ ...settings, expressShipping: Number(e.target.value) })} />
            </div>
          </div>
        </section>

        <button onClick={save} disabled={busy} className="btn btn-primary w-full">
          {busy ? <Spinner light /> : 'Save Settings'}
        </button>
        <p className="pb-2 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-navy-900/35">
          STREET PANTS ADMIN · v8.0 · passwordless
        </p>
      </div>
    </div>
  )
}
