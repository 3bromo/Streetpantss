import { useState } from 'react'
import { usePageTitle } from '../lib/usePageTitle'
import { getBackend } from '../lib/backend'
import { useCatalog } from '../context/CatalogContext'
import { useUI } from '../context/UIContext'
import { AdminPageHead, Card, Spinner } from './ui'

const CURRENCIES = ['EGP', 'USD', 'AED', 'SAR']

export default function AdminSettingsPage() {
  usePageTitle('Admin — Settings')
  const { settings, loading, refresh } = useCatalog()
  const backend = getBackend()
  const { pushToast } = useUI()
  const [draft, setDraft] = useState({ ...settings })
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner />

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const save = async () => {
    setBusy(true)
    try {
      await backend.updateSettings({
        ...draft,
        freeThreshold: Number(draft.freeThreshold) || 0,
        standardShipping: Number(draft.standardShipping) || 0,
        expressShipping: Number(draft.expressShipping) || 0,
      })
      await refresh()
      pushToast({ title: 'Settings saved' })
    } catch (e) {
      pushToast({ title: 'Could not save settings', sub: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const num = (v: string | number) => String(v)

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHead
        title="Settings"
        sub="Store identity, contact channels and shipping rules."
        actions={
          <button onClick={save} disabled={busy} className="btn btn-dark btn-sm disabled:opacity-50">
            {busy ? 'Saving…' : 'Save Settings'}
          </button>
        }
      />

      <div className="space-y-6">
        <Card className="p-6">
          <p className="mb-5 font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">Store</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Store name</span>
              <input className="input mt-1.5" value={draft.storeName} onChange={(e) => set('storeName', e.target.value)} />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Currency</span>
              <select className="input mt-1.5 appearance-none font-mono" value={draft.currency} onChange={(e) => set('currency', e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card className="p-6">
          <p className="mb-5 font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">Contact</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Contact phone</span>
              <input className="input mt-1.5 font-mono" value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">WhatsApp</span>
              <input className="input mt-1.5 font-mono" value={draft.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Email</span>
              <input className="input mt-1.5" value={draft.email} onChange={(e) => set('email', e.target.value)} />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Instagram URL</span>
              <input className="input mt-1.5 font-mono text-[12px]" value={draft.instagram} onChange={(e) => set('instagram', e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">YouTube URL</span>
              <input className="input mt-1.5 font-mono text-[12px]" value={draft.youtube} onChange={(e) => set('youtube', e.target.value)} />
            </label>
          </div>
        </Card>

        <Card className="p-6">
          <p className="mb-5 font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">Shipping</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Free over ({draft.currency})</span>
              <input className="input mt-1.5 font-mono" type="number" min={0} value={num(draft.freeThreshold)} onChange={(e) => set('freeThreshold', Number(e.target.value))} />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Standard ({draft.currency})</span>
              <input className="input mt-1.5 font-mono" type="number" min={0} value={num(draft.standardShipping)} onChange={(e) => set('standardShipping', Number(e.target.value))} />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Express ({draft.currency})</span>
              <input className="input mt-1.5 font-mono" type="number" min={0} value={num(draft.expressShipping)} onChange={(e) => set('expressShipping', Number(e.target.value))} />
            </label>
          </div>
        </Card>
      </div>
    </div>
  )
}
