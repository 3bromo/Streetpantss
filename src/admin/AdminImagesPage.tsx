import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, RefreshCw, Trash2, Upload } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import { getBackend } from '../lib/backend'
import { useUI } from '../context/UIContext'
import { getSiteImages, IMAGE_DEFAULTS, SiteImages, withVersion } from '../lib/siteImages'
import { AdminPageHead, Card, Spinner } from './ui'

const TABS = ['Homepage', 'Categories', 'Collections', 'About', 'Other'] as const
type Tab = (typeof TABS)[number]

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024

interface SlotProps {
  label: string
  hint?: string
  current: string
  custom: string | undefined
  onUploaded: (url: string) => void
  onClear: () => void
}

function ImageSlot({ label, hint, current, custom, onUploaded, onClear }: SlotProps) {
  const backend = getBackend()
  const { pushToast } = useUI()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!ACCEPTED.includes(file.type)) {
      pushToast({ title: 'Unsupported format', sub: 'Use JPG, JPEG, PNG or WEBP' })
      return
    }
    if (file.size > MAX_BYTES) {
      pushToast({ title: 'File too large', sub: 'Max 4 MB' })
      return
    }
    setBusy(true)
    backend
      .uploadImage(file)
      .then((url) => {
        onUploaded(withVersion(url))
        pushToast({ title: 'Image ready', sub: 'Review the preview, then Save' })
      })
      .catch((e) => pushToast({ title: 'Upload failed', sub: e instanceof Error ? e.message : undefined }))
      .finally(() => setBusy(false))
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-[12px] font-bold uppercase tracking-[0.1em] text-ink">{label}</p>
          {hint && <p className="mt-0.5 font-mono text-[10px] text-ink/40">{hint}</p>}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${
            custom ? 'bg-[#ECEBE7] text-ink' : 'bg-ink/5 text-ink/45'
          }`}
        >
          {custom ? 'Custom (unsaved)' : 'Default'}
        </span>
      </div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-soft">
        {custom || current ? (
          <img src={custom || current} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink/35">
            Empty slot
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn btn-dark btn-sm flex-1 !text-[10px]"
        >
          {busy ? <Spinner /> : <Upload size={13} />} Replace
        </button>
        {(custom || current !== undefined) && (
          <button onClick={onClear} className="btn btn-ghost btn-sm !text-[10px]" aria-label={`Remove custom ${label}`}>
            <Trash2 size={13} /> Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}

export default function AdminImagesPage() {
  usePageTitle('Admin — Website Images')
  const backend = getBackend()
  const { pushToast } = useUI()
  const [tab, setTab] = useState<Tab>('Homepage')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [hero, setHero] = useState<string>('')
  const [banner, setBanner] = useState<string>('')
  const [savedHero, setSavedHero] = useState('')
  const [savedBanner, setSavedBanner] = useState('')
  const [imgs, setImgs] = useState<SiteImages>({})
  const [savedImgs, setSavedImgs] = useState<SiteImages>({})

  const load = useCallback(async () => {
    try {
      const s = (await backend.getSettings()) as unknown as Record<string, unknown>
      setSavedHero(String(s.heroImage ?? ''))
      setSavedBanner(String(s.bannerImage ?? ''))
      setHero(String(s.heroImage ?? ''))
      setBanner(String(s.bannerImage ?? ''))
      const si = getSiteImages(s)
      setSavedImgs(si)
      setImgs(JSON.parse(JSON.stringify(si)))
    } catch (e) {
      pushToast({ title: 'Load failed', sub: e instanceof Error ? e.message : undefined })
    } finally {
      setLoading(false)
    }
  }, [backend, pushToast])

  useEffect(() => {
    load()
  }, [load])

  const dirty =
    hero !== savedHero || banner !== savedBanner || JSON.stringify(imgs) !== JSON.stringify(savedImgs)

  const save = async () => {
    setSaving(true)
    try {
      await backend.updateSettings({
        heroImage: hero,
        bannerImage: banner,
        siteImages: { ...imgs, about: (imgs.about ?? []).filter((u) => !!u) },
      } as never)
      setSavedHero(hero)
      setSavedBanner(banner)
      setSavedImgs(JSON.parse(JSON.stringify(imgs)))
      pushToast({ title: 'Saved — live on website' })
    } catch (e) {
      pushToast({ title: 'Save failed', sub: e instanceof Error ? e.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  const discard = () => {
    setHero(savedHero)
    setBanner(savedBanner)
    setImgs(JSON.parse(JSON.stringify(savedImgs)))
  }

  const setCats = (slug: string, url: string | undefined) => {
    setImgs((m) => {
      const cats = { ...(m.categories ?? {}) }
      if (url) cats[slug] = url
      else delete cats[slug]
      return { ...m, categories: cats }
    })
  }

  /** THE FINAL system: exactly three categories. */
  const categoryDefs = [
    { slug: 'wide-leg', label: 'Wide Leg' },
    { slug: 'street-pants', label: 'Street Pants' },
    { slug: 'old-money', label: 'Old Money' },
  ]

  return (
    <div>
      <AdminPageHead
        title="Website Images"
        sub="Manage every static image on the public website. Uploads go to the existing Supabase Storage bucket; changes go live when you Save."
        actions={
          dirty ? (
            <>
              <button onClick={discard} className="btn btn-ghost btn-sm">
                Discard
              </button>
              <button onClick={save} disabled={saving} className="btn btn-dark btn-sm">
                {saving ? <Spinner /> : 'Save Changes'}
              </button>
            </>
          ) : undefined
        }
      />

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`chip ${tab === t ? 'chip-active' : ''}`}
            style={{ borderColor: tab === t ? '#0A0A0A' : undefined, background: tab === t ? '#0A0A0A' : undefined, color: tab === t ? '#fff' : undefined }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          {tab === 'Homepage' && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ImageSlot
                label="Hero image"
                hint="Homepage hero background"
                current={savedHero || IMAGE_DEFAULTS.story}
                custom={hero !== savedHero ? hero : undefined}
                onUploaded={(u) => setHero(u)}
                onClear={() => setHero(savedHero)}
              />
              <ImageSlot
                label="Editorial banner"
                hint="Homepage editorial section"
                current={savedBanner}
                custom={banner !== savedBanner ? banner : undefined}
                onUploaded={(u) => setBanner(u)}
                onClear={() => setBanner(savedBanner)}
              />
              <ImageSlot
                label="Brand story image"
                hint="Homepage story section"
                current={IMAGE_DEFAULTS.story}
                custom={imgs.story}
                onUploaded={(u) => setImgs((m) => ({ ...m, story: u }))}
                onClear={() => setImgs((m) => ({ ...m, story: undefined }))}
              />
              <ImageSlot
                label="New Arrivals banner"
                hint="New Arrivals page banner"
                current={IMAGE_DEFAULTS.newArrivals}
                custom={imgs.newArrivals}
                onUploaded={(u) => setImgs((m) => ({ ...m, newArrivals: u }))}
                onClear={() => setImgs((m) => ({ ...m, newArrivals: undefined }))}
              />
            </div>
          )}

          {tab === 'Categories' && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {categoryDefs.map((c) => (
                <ImageSlot
                  key={c.slug}
                  label={c.label}
                  hint={`Category tile — ${c.slug}`}
                  current={IMAGE_DEFAULTS.categories[c.slug]}
                  custom={imgs.categories?.[c.slug]}
                  onUploaded={(u) => setCats(c.slug, u)}
                  onClear={() => setCats(c.slug, undefined)}
                />
              ))}
            </div>
          )}

          {tab === 'Collections' && (
            <>
              <p className="mb-4 rounded-lg bg-[#ECEBE7] px-4 py-3 font-mono text-[11px] text-ink/60">
                Collection pages share the same images as the category tiles. Changes here apply to both.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {categoryDefs.map((c) => (
                  <ImageSlot
                    key={c.slug}
                    label={`${c.label} collection`}
                    hint="Collections page banner"
                    current={IMAGE_DEFAULTS.categories[c.slug]}
                    custom={imgs.categories?.[c.slug]}
                    onUploaded={(u) => setCats(c.slug, u)}
                    onClear={() => setCats(c.slug, undefined)}
                  />
                ))}
              </div>
            </>
          )}

          {tab === 'About' && (
            <div>
              <p className="mb-4 rounded-lg bg-[#ECEBE7] px-4 py-3 font-mono text-[11px] text-ink/60">
                Optional campaign band: when images exist here, the About page shows them as a clean image band.
                Empty by default (as currently live).
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {(imgs.about ?? []).map((url, i) => (
                  <ImageSlot
                    key={url + i}
                    label={`About image ${i + 1}`}
                    hint="About page band"
                    current={url}
                    custom={url}
                    onUploaded={(u) =>
                      setImgs((m) => ({ ...m, about: (m.about ?? []).map((x, j) => (j === i ? u : x)) }))
                    }
                    onClear={() => setImgs((m) => ({ ...m, about: (m.about ?? []).filter((_, j) => j !== i) }))}
                  />
                ))}
                <button
                  onClick={() => setImgs((m) => ({ ...m, about: [...(m.about ?? []), ''] }))}
                  className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink/20 text-ink/50 transition-colors hover:border-ink hover:text-ink"
                >
                  <ImagePlus size={20} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em]">Add About image</span>
                </button>
              </div>
            </div>
          )}

          {tab === 'Other' && (
            <Card className="p-6">
              <p className="font-display text-[12px] font-black uppercase tracking-[0.14em]">Other website images</p>
              <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-ink/60">
                <li>• Product photography is managed per product in Products → edit → Images (separate by design, kept in original color).</li>
                <li>• Social platform icons are vector icons managed in Social Links.</li>
                <li>• No other static images are used by the public website.</li>
              </ul>
            </Card>
          )}
        </>
      )}

      {dirty && (
        <div className="sticky bottom-4 mt-6 flex justify-end gap-2 rounded-xl border border-ink/10 bg-white/95 p-3 shadow-lg backdrop-blur">
          <button onClick={discard} className="btn btn-ghost btn-sm">
            Discard
          </button>
          <button onClick={save} disabled={saving} className="btn btn-dark btn-sm">
            {saving ? <Spinner /> : <RefreshCw size={13} />} Save — publish to website
          </button>
        </div>
      )}
    </div>
  )
}
