import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { fetchSettings, updateSettings } from '../lib/api'
import { useNav } from '../App'
import { SocialLink, SocialIcon } from '../lib/social'
import { Spinner, TopBar, useSnack } from '../components/ui'

const ICON_OPTIONS = ['instagram', 'facebook', 'tiktok', 'whatsapp', 'x', 'youtube', 'snapchat', 'telegram', 'link']
const emptyForm = { name: '', url: '', icon: 'instagram' }

export default function SocialLinksScreen() {
  const nav = useNav()
  const { show } = useSnack()
  const [links, setLinks] = useState<SocialLink[]>([])
  const [titleEn, setTitleEn] = useState('Follow Us')
  const [titleAr, setTitleAr] = useState('تابعنا')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const s = (await fetchSettings()) as unknown as Record<string, unknown>
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
      await updateSettings({ socialLinks: next, ...extra } as never)
      setLinks(next)
      show('Saved — live on website')
    } catch (e) {
      show(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const addOrEdit = () => {
    if (!form.name.trim() || !form.url.trim()) {
      show('Name and URL are required', 'error')
      return
    }
    if (editId) {
      persist(links.map((l) => (l.id === editId ? { ...l, name: form.name.trim(), url: form.url.trim(), icon: form.icon } : l)))
    } else {
      persist([
        ...links,
        { id: 's' + Date.now(), name: form.name.trim(), url: form.url.trim(), icon: form.icon, enabled: true, order: links.length },
      ])
    }
    setForm(emptyForm)
    setEditId(null)
  }

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
      <TopBar title="Social & Contact Links" onBack={nav.pop} />
      <div className="space-y-5 px-4 pt-4">
        <section className="card space-y-3 p-4">
          <p className="font-display text-[12px] font-black uppercase tracking-[0.14em]">Section titles</p>
          <div>
            <span className="label">English</span>
            <input className="input" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          </div>
          <div>
            <span className="label">Arabic</span>
            <input className="input" dir="rtl" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
          </div>
          <button onClick={() => persist(links, { socialTitleEn: titleEn, socialTitleAr: titleAr })} disabled={busy} className="btn btn-primary h-11 w-full !text-[11px]">
            {busy ? <Spinner light /> : 'Save Titles'}
          </button>
        </section>

        <section className="card space-y-3 p-4">
          <p className="font-display text-[12px] font-black uppercase tracking-[0.14em]">{editId ? 'Edit platform' : 'Add platform'}</p>
          <div>
            <span className="label">Platform name</span>
            <input className="input" placeholder="Instagram / TikTok / WhatsApp…" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <span className="label">URL</span>
            <input className="input" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>
          <div>
            <span className="label">Icon</span>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setForm({ ...form, icon: ic })}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                    form.icon === ic ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 text-navy-900/60'
                  }`}
                >
                  <SocialIcon icon={ic} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addOrEdit} disabled={busy} className="btn btn-primary h-11 flex-1 !text-[11px]">
              {editId ? 'Save Changes' : 'Add Platform'}
            </button>
            {editId && (
              <button
                onClick={() => {
                  setEditId(null)
                  setForm(emptyForm)
                }}
                className="btn btn-ghost h-11 px-4 !text-[11px]"
              >
                Cancel
              </button>
            )}
          </div>
        </section>

        <section className="card p-4">
          <p className="mb-2 font-display text-[12px] font-black uppercase tracking-[0.14em]">Platforms ({links.length})</p>
          {loading ? (
            <p className="py-6 text-center text-[12px] text-ink/50">Loading…</p>
          ) : links.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-ink/50">No platforms yet.</p>
          ) : (
            <ul className="divide-y divide-navy-900/10">
              {links
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((l) => (
                  <li key={l.id} className="flex items-center gap-2 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-900">
                      <SocialIcon icon={l.icon} size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[11px] font-bold uppercase text-navy-950">
                        {l.name} {!l.enabled && <span className="text-ink/40">(hidden)</span>}
                      </p>
                      <p className="truncate font-mono text-[10px] text-navy-900/50">{l.url}</p>
                    </div>
                    <button aria-label="Up" onClick={() => move(l.id, -1)} className="p-1.5 text-navy-900/50">
                      <ArrowUp size={14} />
                    </button>
                    <button aria-label="Down" onClick={() => move(l.id, 1)} className="p-1.5 text-navy-900/50">
                      <ArrowDown size={14} />
                    </button>
                    <button
                      aria-label="Edit"
                      onClick={() => {
                        setEditId(l.id)
                        setForm({ name: l.name, url: l.url, icon: l.icon })
                      }}
                      className="p-1.5 text-navy-900/50"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      aria-label="Toggle"
                      onClick={() => persist(links.map((x) => (x.id === l.id ? { ...x, enabled: !x.enabled } : x)))}
                      className={`px-2 py-1 font-mono text-[9px] uppercase ${l.enabled ? 'bg-navy-800 text-white' : 'bg-ink/10 text-ink/50'}`}
                    >
                      {l.enabled ? 'On' : 'Off'}
                    </button>
                    <button aria-label="Delete" onClick={() => persist(links.filter((x) => x.id !== l.id))} className="p-1.5 text-red-700/70">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
