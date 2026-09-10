import { useEffect, useMemo, useState } from 'react'
import { Camera, ChevronLeft, ChevronRight, GalleryHorizontalEnd, ImagePlus, Trash2 } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { createProduct, deleteProduct, fetchProducts, updateProduct, deleteImage } from '../lib/api'
import { useNav } from '../App'
import { CATEGORIES, CategorySlug, Product, ProductColor } from '../lib/types'
import { ConfirmDialog, FullLoader, Img, Spinner, Toggle, TopBar, useSnack } from '../components/ui'

const BRAND_COLORS: ProductColor[] = [
  { name: 'Deep Navy', hex: '#0B2555' },
  { name: 'Black', hex: '#050505' },
  { name: 'Graphite', hex: '#3B4252' },
  { name: 'Stone', hex: '#CFCBC2' },
  { name: 'Indigo', hex: '#1F2A44' },
  { name: 'Cream', hex: '#E4DED2' },
]
const ALL_SIZES = ['28', '30', '32', '34', '36']

function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}

function pickFile(capture: boolean): Promise<Blob | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    if (capture) input.setAttribute('capture', 'environment')
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.click()
  })
}

async function pickImage(source: 'camera' | 'gallery'): Promise<Blob | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Camera, CameraSource, CameraResultType } = await import('@capacitor/camera')
      const photo = await Camera.getPhoto({
        quality: 88,
        resultType: CameraResultType.Base64,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      })
      return photo.base64String ? base64ToBlob(photo.base64String, photo.format === 'png' ? 'image/png' : 'image/jpeg') : null
    }
  } catch {
    /* fall through to web picker (permission denied etc.) */
  }
  return pickFile(source === 'camera')
}

export default function ProductEditScreen({ id }: { id?: string }) {
  const nav = useNav()
  const { show } = useSnack()
  const [loading, setLoading] = useState(!!id)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState<CategorySlug>('essentials')
  const [price, setPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [description, setDescription] = useState('')
  const [material, setMaterial] = useState('')
  const [fit, setFit] = useState('')
  const [care, setCare] = useState('')
  const [details, setDetails] = useState('')
  const [keywords, setKeywords] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [isBestSeller, setIsBestSeller] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [published, setPublished] = useState(true)
  const [colors, setColors] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([...ALL_SIZES])
  const [images, setImages] = useState<string[]>([])
  const [stock, setStock] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!id) return
    fetchProducts()
      .then((list) => {
        const p = list.find((x) => x.id === id)
        if (!p) return
        setName(p.name)
        setSku(p.sku ?? '')
        setCategory(p.category)
        setPrice(String(p.price))
        setSalePrice(p.salePrice != null ? String(p.salePrice) : '')
        setDescription(p.description)
        setMaterial(p.material)
        setFit(p.fit)
        setCare(p.care)
        setDetails(p.details.join('\n'))
        setKeywords(p.keywords.join(', '))
        setIsNew(p.isNew)
        setIsBestSeller(p.isBestSeller)
        setFeatured(p.featured)
        setPublished(p.published)
        setColors(p.colors.map((c) => c.name))
        setSizes(p.sizes.length ? p.sizes : [...ALL_SIZES])
        setImages(p.images)
        const m: Record<string, number> = {}
        for (const v of p.variants) m[`${v.color}|${v.size}`] = v.stock
        setStock(m)
      })
      .catch((e) => show(e instanceof Error ? e.message : 'Load failed', 'error'))
      .finally(() => setLoading(false))
  }, [id, show])

  const sizeCols = useMemo(() => [...sizes].sort((a, b) => Number(a) - Number(b)), [sizes])

  const addImage = async (source: 'camera' | 'gallery') => {
    setBusy(true)
    try {
      const blob = await pickImage(source)
      if (!blob) return
      const { uploadImage } = await import('../lib/api')
      const url = await uploadImage(blob, `upload-${Date.now()}.jpg`)
      setImages((imgs) => [...imgs, url])
      show('Image uploaded')
    } catch (e) {
      show(e instanceof Error ? e.message : 'Upload failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const removeImageAt = async (idx: number) => {
    const url = images[idx]
    setImages((imgs) => imgs.filter((_, i) => i !== idx))
    try {
      await deleteImage(url)
    } catch {
      /* remote cleanup is best-effort */
    }
  }

  const moveImage = (idx: number, dir: -1 | 1) => {
    setImages((imgs) => {
      const next = [...imgs]
      const j = idx + dir
      if (j < 0 || j >= next.length) return imgs
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
  }

  const save = async () => {
    const priceNum = Number(price)
    if (!name.trim() || !priceNum || priceNum <= 0) {
      show('Name and a valid price are required', 'error')
      return
    }
    if (colors.length === 0 || sizes.length === 0) {
      show('Select at least one color and one size', 'error')
      return
    }
    setBusy(true)
    try {
      const colorObjs = BRAND_COLORS.filter((c) => colors.includes(c.name))
      const variants = colorObjs.flatMap((c) =>
        sizeCols.map((s) => ({ color: c.name, size: s, stock: stock[`${c.name}|${s}`] ?? 0 })),
      )
      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        category,
        price: priceNum,
        salePrice: salePrice !== '' ? Number(salePrice) : null,
        description,
        material,
        fit,
        care,
        details: details.split('\n').map((s) => s.trim()).filter(Boolean),
        keywords: keywords.split(',').map((s) => s.trim()).filter(Boolean),
        isNew,
        isBestSeller,
        featured,
        published,
        colors: colorObjs,
        sizes: sizeCols,
        images,
        variants,
      }
      if (id) {
        await updateProduct(id, payload)
        show('Product saved')
      } else {
        await createProduct(payload)
        show('Product created')
      }
      nav.pop()
    } catch (e) {
      show(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const doDelete = async () => {
    if (!id) return
    setBusy(true)
    try {
      await deleteProduct(id)
      show('Product deleted')
      nav.pop()
    } catch (e) {
      show(e instanceof Error ? e.message : 'Delete failed', 'error')
      setBusy(false)
    }
  }

  if (loading) return <FullLoader />

  return (
    <div>
      <TopBar title={id ? 'Edit Product' : 'New Product'} onBack={nav.pop} />
      <div className="space-y-5 px-4 pt-4">
        <section className="card p-4">
          <p className="mb-3 font-display text-[12px] font-black uppercase tracking-[0.14em]">Images</p>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
            {images.map((url, i) => (
              <div key={`${url.slice(0, 32)}-${i}`} className="relative w-28 shrink-0">
                <Img src={url} alt={`Image ${i + 1}`} className="h-36 w-28 rounded-xl" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-navy-900 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-white">
                    Cover
                  </span>
                )}
                <div className="mt-1.5 flex justify-center gap-1.5">
                  <button aria-label="Move left" onClick={() => moveImage(i, -1)} className="rounded-lg border border-navy-900/15 p-1.5 text-navy-900/60 active:bg-soft">
                    <ChevronLeft size={13} />
                  </button>
                  <button aria-label="Delete image" onClick={() => removeImageAt(i)} className="rounded-lg border border-red-200 p-1.5 text-red-700 active:bg-red-50">
                    <Trash2 size={13} />
                  </button>
                  <button aria-label="Move right" onClick={() => moveImage(i, 1)} className="rounded-lg border border-navy-900/15 p-1.5 text-navy-900/60 active:bg-soft">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex w-28 shrink-0 flex-col gap-2">
              <button onClick={() => addImage('camera')} disabled={busy} className="flex h-[70px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-navy-900/25 text-navy-900/60 active:bg-soft">
                <Camera size={17} />
                <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Camera</span>
              </button>
              <button onClick={() => addImage('gallery')} disabled={busy} className="flex h-[70px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-navy-900/25 text-navy-900/60 active:bg-soft">
                <GalleryHorizontalEnd size={17} />
                <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Gallery</span>
              </button>
              <p className="text-center font-mono text-[8px] uppercase tracking-[0.12em] text-navy-900/40">
                {busy ? 'Uploading…' : 'To Supabase Storage'}
              </p>
            </div>
          </div>
        </section>

        <section className="card space-y-4 p-4">
          <p className="font-display text-[12px] font-black uppercase tracking-[0.14em]">Basics</p>
          <div>
            <span className="label">Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="STREET CARGO PANTS" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label">SKU</span>
              <input className="input font-mono text-[13px]" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SP-CRG-001" />
            </div>
            <div>
              <span className="label">Category</span>
              <select className="input appearance-none capitalize" value={category} onChange={(e) => setCategory(e.target.value as CategorySlug)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Price (EGP)</span>
              <input className="input font-mono text-[13px]" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1499" />
            </div>
            <div>
              <span className="label">Sale price</span>
              <input className="input font-mono text-[13px]" type="number" min={0} value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div>
            <span className="label">Description</span>
            <textarea className="input h-24 resize-none py-3" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <span className="label">Details (one per line)</span>
            <textarea className="input h-20 resize-none py-3 font-mono text-[12px]" value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <span className="label">Material</span>
              <input className="input" value={material} onChange={(e) => setMaterial(e.target.value)} />
            </div>
            <div>
              <span className="label">Fit</span>
              <input className="input" value={fit} onChange={(e) => setFit(e.target.value)} />
            </div>
            <div>
              <span className="label">Care</span>
              <input className="input" value={care} onChange={(e) => setCare(e.target.value)} />
            </div>
            <div>
              <span className="label">Keywords (comma separated)</span>
              <input className="input" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="card space-y-4 p-4">
          <p className="font-display text-[12px] font-black uppercase tracking-[0.14em]">Colors & Sizes</p>
          <div className="flex flex-wrap gap-2">
            {BRAND_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setColors((cs) => (cs.includes(c.name) ? cs.filter((x) => x !== c.name) : [...cs, c.name]))}
                className={`chip ${colors.includes(c.name) ? 'chip-active' : ''}`}
              >
                <span className="mr-1.5 inline-block h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: c.hex }} />
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSizes((ss) => (ss.includes(s) ? ss.filter((x) => x !== s) : [...ss, s]))}
                className={`chip ${sizes.includes(s) ? 'chip-active' : ''}`}
              >
                {s}
              </button>
            ))}
          </div>

          {colors.length > 0 && sizeCols.length > 0 && (
            <div>
              <span className="label">Stock per variant</span>
              <div className="overflow-hidden rounded-xl border border-navy-900/10">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-navy-900/10 bg-soft">
                      <th className="px-2 py-2 text-left font-mono text-[9px] uppercase tracking-[0.12em] text-navy-900/50">Color</th>
                      {sizeCols.map((s) => (
                        <th key={s} className="px-1 py-2 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-navy-900/50">
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-900/10">
                    {colors.map((cn) => (
                      <tr key={cn}>
                        <td className="px-2 py-1.5 font-mono text-[10px] uppercase text-navy-950">{cn.split(' ')[0]}</td>
                        {sizeCols.map((s) => (
                          <td key={s} className="px-1 py-1.5 text-center">
                            <input
                              type="number"
                              min={0}
                              value={stock[`${cn}|${s}`] ?? 0}
                              onChange={(e) => setStock((m) => ({ ...m, [`${cn}|${s}`]: Math.max(0, Number(e.target.value)) }))}
                              className="h-9 w-full min-w-0 rounded-lg border border-navy-900/15 text-center font-mono text-[12px]"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="card space-y-3 p-4">
          <p className="font-display text-[12px] font-black uppercase tracking-[0.14em]">Flags</p>
          {(
            [
              ['New arrival', isNew, setIsNew],
              ['Best seller', isBestSeller, setIsBestSeller],
              ['Featured', featured, setFeatured],
              ['Published on website', published, setPublished],
            ] as const
          ).map(([label, val, set]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[13.5px] text-ink/75">{label}</span>
              <Toggle checked={val} onChange={set} />
            </div>
          ))}
        </section>

        <button onClick={save} disabled={busy} className="btn btn-primary w-full">
          {busy ? <Spinner light /> : id ? 'Save Changes' : 'Create Product'}
        </button>
        {id && (
          <button onClick={() => setConfirmDelete(true)} className="btn btn-danger w-full">
            <Trash2 size={16} /> Delete Product
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete product?"
        message={`"${name}" will be removed from the database and the website. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={doDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  )
}
