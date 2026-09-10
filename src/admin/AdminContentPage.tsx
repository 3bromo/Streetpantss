import { useState } from 'react'
import { Upload } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import { getBackend } from '../lib/backend'
import { withVersion } from '../lib/siteImages'
import { useCatalog } from '../context/CatalogContext'
import { useUI } from '../context/UIContext'
import { AdminPageHead, Card, Spinner } from './ui'
import SmartImage from '../components/SmartImage'

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const backend = getBackend()
  const { pushToast } = useUI()
  const [urlInput, setUrlInput] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">{label}</p>
      <div className="mt-2 flex gap-4">
        <div className="h-28 w-40 shrink-0 overflow-hidden border border-navy-900/10 bg-navy-100/40">
          <SmartImage src={value} alt={label} className="h-full w-full" />
        </div>
        <div className="flex-1 space-y-2.5">
          <label className="flex h-[44px] cursor-pointer items-center justify-center gap-2 border border-dashed border-navy-900/25 font-mono text-[11px] uppercase tracking-[0.16em] text-navy-900/60 transition-colors hover:border-navy-900 hover:text-navy-900">
            <Upload size={14} /> {busy ? 'Uploading…' : 'Upload new image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                setBusy(true)
                try {
                  onChange(withVersion(await backend.uploadImage(f)))
                  pushToast({ title: 'Image uploaded' })
                } catch (err) {
                  pushToast({ title: 'Upload failed', sub: err instanceof Error ? err.message : undefined })
                } finally {
                  setBusy(false)
                }
              }}
            />
          </label>
          <div className="flex gap-2">
            <input
              className="input !h-[40px] flex-1 font-mono text-[11px]"
              placeholder="…or paste URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button
              onClick={() => {
                if (urlInput.trim()) {
                  onChange(urlInput.trim())
                  setUrlInput('')
                }
              }}
              className="btn btn-outline-dark btn-sm !h-[40px]"
            >
              Set
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminContentPage() {
  usePageTitle('Admin — Website Content')
  const { settings, allProducts, loading, refresh } = useCatalog()
  const backend = getBackend()
  const { pushToast } = useUI()
  const [draft, setDraft] = useState({ ...settings })
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner />

  const save = async () => {
    setBusy(true)
    try {
      await backend.updateSettings(draft)
      await refresh()
      pushToast({ title: 'Content published' })
    } catch (e) {
      pushToast({ title: 'Could not save content', sub: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      await backend.updateProduct(id, { featured: !featured })
      await refresh()
      pushToast({ title: featured ? 'Removed from featured' : 'Marked as featured' })
    } catch (e) {
      pushToast({ title: 'Could not update', sub: e instanceof Error ? e.message : undefined })
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHead
        title="Website Content"
        sub="Hero, banners, announcement and featured products — live on the storefront after publishing."
        actions={
          <button onClick={save} disabled={busy} className="btn btn-dark btn-sm disabled:opacity-50">
            {busy ? 'Publishing…' : 'Publish Changes'}
          </button>
        }
      />

      <div className="space-y-6">
        <Card className="space-y-7 p-6">
          <ImageField label="Homepage hero image" value={draft.heroImage} onChange={(v) => setDraft((d) => ({ ...d, heroImage: v }))} />
          <ImageField label="Editorial banner image" value={draft.bannerImage} onChange={(v) => setDraft((d) => ({ ...d, bannerImage: v }))} />
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Banner title</span>
            <input className="input mt-1.5" value={draft.bannerTitle} onChange={(e) => setDraft((d) => ({ ...d, bannerTitle: e.target.value }))} />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Announcement bar text</span>
            <textarea
              className="input mt-1.5 h-20 resize-y py-3 font-mono text-[12px]"
              value={draft.announcement}
              onChange={(e) => setDraft((d) => ({ ...d, announcement: e.target.value }))}
            />
            <span className="mt-1 block font-mono text-[10px] text-navy-900/40">
              Separate messages with “ · ” for the marquee.
            </span>
          </label>
        </Card>

        <Card className="p-6">
          <p className="mb-4 font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">
            Featured Products
          </p>
          <ul className="divide-y divide-navy-900/10">
            {allProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <p className="font-display text-[12px] font-bold uppercase tracking-[0.08em] text-navy-950">{p.name}</p>
                <button
                  onClick={() => toggleFeatured(p.id, p.featured)}
                  aria-label={p.featured ? 'Remove from featured' : 'Mark as featured'}
                  className={`relative h-5 w-9 rounded-full transition-colors duration-300 ${p.featured ? 'bg-navy-800' : 'bg-navy-900/20'}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-300 ${p.featured ? 'left-[18px]' : 'left-0.5'}`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
