import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import { getBackend } from '../lib/backend'
import { SocialLink, SocialIcon } from '../components/SocialLinksSection'

const ICON_OPTIONS = ['instagram', 'facebook', 'tiktok', 'whatsapp', 'x', 'youtube', 'snapchat', 'telegram', 'link']

const emptyForm = { name: '', url: '', icon: 'instagram' }

export default function AdminSocialPage() {
  usePageTitle('Admin — Social Links')
  const [note, setNote] = useState('')
  const backend = getBackend()
  const show = (m: string, _kind?: string) => setNote(m)
  const [links, setLinks] = useState<SocialLink[]>([])
  const [titleEn, setTitleEn] = useState('Follow Us')
  const [titleAr, setTitleAr] = useState('تابعنا')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const s = (await backend.getSettings()) as unknown as Record<string, unknown>
      setLinks(Array.isArray(s.socialLinks) ? (s.socialLinks as SocialLink[]) : [])
      setTitleEn(String(s.socialTitleEn ?? 'Follow Us'))
      setTitleAr(String(s.socialTitleAr ?? 'تابعنا'))
    } catch (e) {
      show(e instanceof Error ? e.message : 'Load failed', 'error')
    } finally {
      setLoading(false)
    }
  }, [show])

  useEffect(() => {
    load()
  }, [load])

  const persist = async (next: SocialLink[], extra?: Record<string, unknown>) => {
    setBusy(true)
    try {
      await backend.updateSettings({ socialLinks: next, ...extra } as never)
      setLinks(next)
      show('Saved — live on website')
    } catch (e) {
      show(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const saveTitles = () => persist(links, { socialTitleEn: titleEn, socialTitleAr: titleAr })

  const addOrEdit = () => {
    if (!form.name.trim() || !form.url.trim()) {
      show('Name and URL are required', 'error')
      return
    }
    if (editId) {
      persist(links.map((l) => (l.id === editId ? { ...l, name: form.name.trim(), url: form.url.trim(), icon: form.icon } : l)))
    } else {
      const next: SocialLink = {
        id: `s${Date.now()}`,
        name: form.name.trim(),
        url: form.url.trim(),
        icon: form.icon,
        enabled: true,
        order: links.length,
      }
      persist([...links, next])
    }
    setForm(emptyForm)
    setEditId(null)
  }

  const remove = (id: string) => persist(links.filter((l) => l.id !== id))
  const toggle = (id: string) => persist(links.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)))
  const move = (id: string, dir: -1 | 1) => {
    const idx = links.findIndex((l) => l.id === id)
    const j = idx + dir
    if (j < 0 || j >= links.length) return
    const next = [...links]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    persist(next.map((l, i) => ({ ...l, order: i })))
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        {note && <p className="mb-4 rounded-lg bg-navy-100 px-4 py-2 font-mono text-[11px] text-navy-900">{note}</p>}
        <div>
          <p className="eyebrow text-navy-800/60">Admin</p>
          <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-navy-950">
            Social Media & Contact Links
          </h1>
          <p className="mt-2 max-w-xl text-[13.5px] text-ink/55">
            Controls the “Follow Us” section at the bottom of the customer website. Changes go live immediately.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        <section className="card space-y-4 p-6">
          <p className="font-display text-[12px] font-black uppercase tracking-[0.14em]">Section titles</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label">English title</span>
              <input className="input" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
            </div>
            <div>
              <span className="label">Arabic title (العنوان بالعربية)</span>
              <input className="input" dir="rtl" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
            </div>
          </div>
          <button onClick={saveTitles} disabled={busy} className="btn btn-primary btn-sm">
            {busy ? '…' : 'Save Titles'}
          </button>
        </section>

        <section className="card p-6">
          <p className="mb-4 font-display text-[12px] font-black uppercase tracking-[0.14em]">
            {editId ? 'Edit platform' : 'Add platform'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="label">Platform name</span>
              <input className="input" placeholder="Instagram / TikTok / WhatsApp…" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <span className="label">URL</span>
              <input className="input" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
          </div>
          <div className="mt-3">
            <span className="label">Icon</span>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setForm({ ...form, icon: ic })}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                    form.icon === ic ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 text-navy-900/60 hover:border-navy-900'
                  }`}
                  aria-label={ic}
                >
                  <SocialIcon icon={ic} size={16} />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={addOrEdit} disabled={busy} className="btn btn-primary btn-sm">
              {editId ? 'Save Changes' : '+ Add Platform'}
            </button>
            {editId && (
              <button
                onClick={() => {
                  setEditId(null)
                  setForm(emptyForm)
                }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </section>

        <section className="card p-6">
          <p className="mb-4 font-display text-[12px] font-black uppercase tracking-[0.14em]">
            Platforms ({links.length}) — order matters
          </p>
          {loading ? (
            <p className="py-8 text-center text-[13px] text-ink/50">Loading…</p>
          ) : links.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink/50">No platforms yet — add the first one above.</p>
          ) : (
            <ul className="divide-y divide-navy-900/10">
              {links
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((l) => (
                  <li key={l.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-navy-900">
                      <SocialIcon icon={l.icon} size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[12px] font-bold uppercase tracking-[0.06em] text-navy-950">
                        {l.name} {!l.enabled && <span className="text-ink/40">(hidden)</span>}
                      </p>
                      <p className="truncate font-mono text-[11px] text-navy-900/50">{l.url}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button aria-label="Move up" onClick={() => move(l.id, -1)} className="p-1.5 text-navy-900/50 hover:text-navy-900">
                        <ArrowUp size={14} />
                      </button>
                      <button aria-label="Move down" onClick={() => move(l.id, 1)} className="p-1.5 text-navy-900/50 hover:text-navy-900">
                        <ArrowDown size={14} />
                      </button>
                      <button aria-label="Edit" onClick={() => { setEditId(l.id); setForm({ name: l.name, url: l.url, icon: l.icon }) }} className="p-1.5 text-navy-900/50 hover:text-navy-900">
                        <Pencil size={14} />
                      </button>
                      <button
                        aria-label={l.enabled ? 'Hide' : 'Show'}
                        onClick={() => toggle(l.id)}
                        className={`px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${
                          l.enabled ? 'bg-navy-800 text-white' : 'bg-ink/10 text-ink/50'
                        }`}
                      >
                        {l.enabled ? 'On' : 'Off'}
                      </button>
                      <button aria-label="Delete" onClick={() => remove(l.id)} className="p-1.5 text-red-700/70 hover:text-red-700">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
