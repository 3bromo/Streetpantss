import { useCallback, useEffect, useState } from 'react'
import { Camera, GalleryHorizontalEnd } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { fetchProducts, fetchSettings, updateProduct, updateSettings, uploadImage } from '../lib/api'
import { onDataChange } from '../lib/bus'
import { useNav } from '../App'
import { Product, SiteSettings } from '../lib/types'
import { ErrorState, FullLoader, Img, Spinner, Toggle, TopBar, useSnack } from '../components/ui'

function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}

export default function ContentScreen() {
  const nav = useNav()
  const { show } = useSnack()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState<'hero' | 'banner' | null>(null)

  const load = useCallback(async (silent = false) => {
    try {
      const [s, p] = await Promise.all([fetchSettings(), fetchProducts()])
      setSettings(s)
      setProducts(p)
      setError('')
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Could not load content.')
    }
  }, [])

  useEffect(() => {
    load()
    return onDataChange((t) => {
      if (t === 'settings' || t === 'products') load(true)
    })
  }, [load])

  const pick = async (target: 'hero' | 'banner', source: 'camera' | 'gallery') => {
    if (!settings) return
    setUploading(target)
    try {
      let blob: Blob | null = null
      if (Capacitor.isNativePlatform()) {
        const { Camera, CameraSource, CameraResultType } = await import('@capacitor/camera')
        const photo = await Camera.getPhoto({
          quality: 88,
          resultType: CameraResultType.Base64,
          source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        })
        blob = photo.base64String ? base64ToBlob(photo.base64String, photo.format === 'png' ? 'image/png' : 'image/jpeg') : null
      } else {
        blob = await new Promise<Blob | null>((resolve) => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          if (source === 'camera') input.setAttribute('capture', 'environment')
          input.onchange = () => resolve(input.files?.[0] ?? null)
          input.click()
        })
      }
      if (!blob) return
      const url = await uploadImage(blob, `${target}-${Date.now()}.jpg`)
      setSettings({ ...settings, [target === 'hero' ? 'heroImage' : 'bannerImage']: url })
      show('Image uploaded — remember to save')
    } catch (e) {
      show(e instanceof Error ? e.message : 'Upload failed', 'error')
    } finally {
      setUploading(null)
    }
  }

  const save = async () => {
    if (!settings) return
    setBusy(true)
    try {
      await updateSettings({
        heroImage: settings.heroImage,
        bannerImage: settings.bannerImage,
        bannerTitle: settings.bannerTitle,
        announcement: settings.announcement,
      })
      show('Website content published')
    } catch (e) {
      show(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const toggleFeatured = async (p: Product) => {
    try {
      await updateProduct(p.id, { featured: !p.featured })
      show(p.featured ? 'Removed from featured' : 'Marked as featured')
      await load(true)
    } catch (e) {
      show(e instanceof Error ? e.message : 'Update failed', 'error')
    }
  }

  if (error)
    return (
      <div className="px-4 pt-4">
        <TopBar title="Website Content" onBack={nav.pop} />
        <ErrorState message={error} onRetry={() => load()} />
      </div>
    )
  if (!settings) return <FullLoader />

  return (
    <div>
      <TopBar title="Website Content" onBack={nav.pop} />
      <div className="space-y-5 px-4 pt-4">
        {(
          [
            ['hero', 'Homepage hero image', settings.heroImage],
            ['banner', 'Editorial banner image', settings.bannerImage],
          ] as const
        ).map(([key, label, value]) => (
          <section key={key} className="card p-4">
            <p className="mb-3 font-display text-[12px] font-black uppercase tracking-[0.14em]">{label}</p>
            <div className="flex gap-3">
              <Img src={value} alt={label} className="h-28 flex-1 rounded-xl" />
              <div className="flex w-24 flex-col gap-2">
                <button onClick={() => pick(key, 'camera')} disabled={uploading === key} className="flex h-12 flex-col items-center justify-center rounded-xl border border-dashed border-navy-900/25 text-navy-900/60 active:bg-soft">
                  <Camera size={16} />
                </button>
                <button onClick={() => pick(key, 'gallery')} disabled={uploading === key} className="flex h-12 flex-col items-center justify-center rounded-xl border border-dashed border-navy-900/25 text-navy-900/60 active:bg-soft">
                  <GalleryHorizontalEnd size={16} />
                </button>
                <p className="text-center font-mono text-[8px] uppercase text-navy-900/40">{uploading === key ? 'Uploading…' : 'Replace'}</p>
              </div>
            </div>
          </section>
        ))}

        <section className="card space-y-4 p-4">
          <div>
            <span className="label">Banner title</span>
            <input className="input" value={settings.bannerTitle} onChange={(e) => setSettings({ ...settings, bannerTitle: e.target.value })} />
          </div>
          <div>
            <span className="label">Announcement bar text</span>
            <textarea
              className="input h-24 resize-none py-3 font-mono text-[12px]"
              value={settings.announcement}
              onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
            />
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-navy-900/40">Separate messages with “ · ”</p>
          </div>
        </section>

        <section className="card p-4">
          <p className="mb-3 font-display text-[12px] font-black uppercase tracking-[0.14em]">Featured products</p>
          <ul className="divide-y divide-navy-900/8">
            {products.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <p className="min-w-0 flex-1 truncate pr-3 font-display text-[12px] font-bold uppercase tracking-[0.06em] text-navy-950">
                  {p.name}
                </p>
                <Toggle checked={p.featured} onChange={() => toggleFeatured(p)} />
              </li>
            ))}
          </ul>
        </section>

        <button onClick={save} disabled={busy} className="btn btn-primary w-full">
          {busy ? <Spinner light /> : 'Publish to Website'}
        </button>
      </div>
    </div>
  )
}
