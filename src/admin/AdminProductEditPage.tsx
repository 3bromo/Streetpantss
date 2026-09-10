import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2, Upload, Link as LinkIcon, Plus } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import { getBackend } from '../lib/backend'
import { withVersion } from '../lib/siteImages'
import { useCatalog } from '../context/CatalogContext'
import { useUI } from '../context/UIContext'
import {
  NEW_CATEGORIES,
  SIZE_KEYS,
  SIZE_LABELS,
  canonCategory,
  canonColor,
  sizeLabel,
  suggestHex,
} from '../lib/categories'
import { CategorySlug, Product } from '../lib/types'
import { AdminPageHead, Card, Spinner } from './ui'
import SmartImage from '../components/SmartImage'

/** THE FINAL system: only these three categories can be selected. */
const CATEGORIES: CategorySlug[] = [...NEW_CATEGORIES.map((c) => c.slug)] as CategorySlug[]

interface ImageEntry {
  url: string
  /** '' = main image, otherwise the color this image belongs to (alt). */
  color: string
}

export default function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  usePageTitle(isNew ? 'Admin — New Product' : 'Admin — Edit Product')
  const { loading, refresh, getProduct } = useCatalog()
  const existing = id ? getProduct(id) : undefined
  const backend = getBackend()
  const { pushToast } = useUI()
  const navigate = useNavigate()

  const [arName, setArName] = useState('')
  const [arDesc, setArDesc] = useState('')

  const [draft, setDraft] = useState(() => ({
    name: existing?.name ?? '',
    sku: existing?.sku ?? '',
    category: canonCategory(existing?.category ?? 'street-pants') as CategorySlug,
    price: existing ? String(existing.price) : '',
    salePrice: existing?.salePrice != null ? String(existing.salePrice) : '',
    description: existing?.description ?? '',
    material: existing?.material ?? '',
    fit: existing?.fit ?? '',
    care: existing?.care ?? '',
    details: existing ? existing.details.join('\n') : '',
    keywords: existing ? existing.keywords.join(', ') : '',
    isNew: existing?.isNew ?? false,
    isBestSeller: existing?.isBestSeller ?? false,
    featured: existing?.featured ?? false,
    published: existing?.published ?? true,
    // Colors are fully admin-managed: free-typed names, no fixed list.
    colors: existing?.colors.map((c) => ({ name: c.name, hex: c.hex || suggestHex(c.name) })) ?? [],
    sizes: (existing?.sizes.length ? existing.sizes : [...SIZE_KEYS]).map((s) => s),
    images: [
      ...(existing?.images ?? []).map((url) => ({ url, color: '' })),
      ...Object.entries(existing?.colorImages ?? {}).flatMap(([color, urls]) =>
        urls.map((url) => ({ url, color })),
      ),
    ] as ImageEntry[],
  }))
  const [colorInput, setColorInput] = useState('')
  const [stock, setStock] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const v of existing?.variants ?? []) map[`${canonColor(v.color)}|${v.size}`] = v.stock
    return map
  })
  const [urlInput, setUrlInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    backend
      .getSettings()
      .then((st) => {
        const e = (st as unknown as Record<string, unknown>)?.translationsAr as
          | { products?: Record<string, { name?: string; description?: string }> }
          | undefined
        const entry = e?.products?.[id]
        if (entry) {
          setArName(entry.name ?? '')
          setArDesc(entry.description ?? '')
        }
      })
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <Spinner />
  if (id && !existing) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl font-black uppercase text-navy-950">Product not found</p>
        <Link to="/admin/products" className="btn btn-outline-dark btn-sm mt-6">
          Back to Products
        </Link>
      </div>
    )
  }

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const toggleSize = (value: string) =>
    setDraft((d) => ({
      ...d,
      sizes: d.sizes.includes(value) ? d.sizes.filter((x) => x !== value) : [...d.sizes, value],
    }))

  /** Add a color by typing ANY name — hex is suggested automatically. */
  const addColor = () => {
    const name = canonColor(colorInput.trim())
    if (!name) return
    if (draft.colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setColorInput('')
      return
    }
    setDraft((d) => ({ ...d, colors: [...d.colors, { name, hex: suggestHex(name) }] }))
    setColorInput('')
  }

  const removeColor = (name: string) => {
    setDraft((d) => ({
      ...d,
      colors: d.colors.filter((c) => c.name !== name),
      // Images assigned to the removed color become main images.
      images: d.images.map((img) => (img.color === name ? { ...img, color: '' } : img)),
    }))
  }

  const upload = async (file: File) => {
    setBusy(true)
    try {
      const url = withVersion(await backend.uploadImage(file))
      setDraft((d) => ({ ...d, images: [...d.images, { url, color: '' }] }))
      pushToast({ title: 'Image uploaded' })
    } catch (e) {
      pushToast({ title: 'Upload failed', sub: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const removeImage = async (url: string) => {
    setDraft((d) => ({ ...d, images: d.images.filter((u) => u.url !== url) }))
    await backend.deleteImage(url)
  }

  const saveArabic = async (productId: string) => {
    try {
      const st = (await backend.getSettings()) as unknown as Record<string, unknown>
      const tr = (st.translationsAr ?? {}) as { products?: Record<string, { name?: string; description?: string }> }
      tr.products = tr.products ?? {}
      if (arName.trim() || arDesc.trim()) tr.products[productId] = { name: arName.trim(), description: arDesc.trim() }
      else delete tr.products[productId]
      await backend.updateSettings({ translationsAr: tr } as never)
    } catch {
      /* non-blocking */
    }
  }

  const save = async () => {
    const price = Number(draft.price)
    if (!draft.name.trim() || !price || price <= 0) {
      setError('Name and a valid price are required.')
      return
    }
    if (draft.colors.length === 0 || draft.sizes.length === 0) {
      setError('Add at least one color and select at least one size.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const sizeOrder = [...SIZE_KEYS]
      const sizes = [...draft.sizes].sort((a, b) => sizeOrder.indexOf(a as (typeof sizeOrder)[number]) - sizeOrder.indexOf(b as (typeof sizeOrder)[number]))
      const variants = draft.colors.flatMap((c) =>
        sizes.map((s) => ({ color: c.name, size: s, stock: stock[`${c.name}|${s}`] ?? 0 })),
      )
      const mainImages = draft.images.filter((i) => !i.color).map((i) => i.url)
      const colorImagesMap: Record<string, string[]> = {}
      for (const img of draft.images) {
        if (!img.color) continue
        colorImagesMap[img.color] = colorImagesMap[img.color] ?? []
        colorImagesMap[img.color].push(img.url)
      }
      const payload: Omit<Product, 'id' | 'addedAt'> = {
        name: draft.name.trim(),
        sku: draft.sku.trim(),
        category: draft.category,
        price,
        salePrice: draft.salePrice !== '' ? Number(draft.salePrice) : null,
        description: draft.description,
        material: draft.material,
        fit: draft.fit,
        care: draft.care,
        details: draft.details.split('\n').map((s) => s.trim()).filter(Boolean),
        keywords: draft.keywords.split(',').map((s) => s.trim()).filter(Boolean),
        isNew: draft.isNew,
        isBestSeller: draft.isBestSeller,
        featured: draft.featured,
        published: draft.published,
        colors: draft.colors,
        sizes,
        images: mainImages,
        colorImages: colorImagesMap,
        variants,
      }
      if (isNew) {
        const created = await backend.createProduct(payload)
        await saveArabic(created.id)
        pushToast({ title: 'Product created', sub: payload.name })
      } else {
        await backend.updateProduct(id!, payload)
        await saveArabic(id!)
        pushToast({ title: 'Product saved', sub: payload.name })
      }
      await refresh()
      navigate('/admin/products')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save product.')
    } finally {
      setBusy(false)
    }
  }

  const sizeCols = [...draft.sizes].sort((a, b) => [...SIZE_KEYS].indexOf(a as (typeof SIZE_KEYS)[number]) - [...SIZE_KEYS].indexOf(b as (typeof SIZE_KEYS)[number]))

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHead
        title={isNew ? 'New Product' : `Edit — ${existing?.name}`}
        sub="Everything the storefront shows comes from this form. Categories: Wide Leg / Street Pants / Old Money — Sizes: S–2XL — Colors: type any name."
        actions={
          <Link to="/admin/products" className="btn btn-outline-dark btn-sm">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <div className="space-y-6">
        <Card className="p-6">
          <p className="mb-5 font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">Basics</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Name</span>
              <input className="input mt-1.5" value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="STREET CARGO PANTS" />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">SKU</span>
              <input className="input mt-1.5 font-mono" value={draft.sku} onChange={(e) => set('sku', e.target.value)} placeholder="SP-STP-001" />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Category</span>
              <select className="input mt-1.5 appearance-none" value={draft.category} onChange={(e) => set('category', e.target.value as CategorySlug)}>
                {CATEGORIES.map((c) => {
                  const entry = NEW_CATEGORIES.find((n) => n.slug === c)!
                  return (
                    <option key={c} value={c}>
                      {entry.en}
                    </option>
                  )
                })}
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Price (EGP)</span>
              <input className="input mt-1.5 font-mono" type="number" min={0} value={draft.price} onChange={(e) => set('price', e.target.value)} placeholder="1499" />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Sale price (optional)</span>
              <input className="input mt-1.5 font-mono" type="number" min={0} value={draft.salePrice} onChange={(e) => set('salePrice', e.target.value)} placeholder="Leave empty for no sale" />
            </label>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Description</span>
              <textarea className="input mt-1.5 h-24 resize-y py-3" value={draft.description} onChange={(e) => set('description', e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Product details (one per line)</span>
              <textarea className="input mt-1.5 h-24 resize-y py-3 font-mono text-[12px]" value={draft.details} onChange={(e) => set('details', e.target.value)} />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Material</span>
              <input className="input mt-1.5" value={draft.material} onChange={(e) => set('material', e.target.value)} />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Fit</span>
              <input className="input mt-1.5" value={draft.fit} onChange={(e) => set('fit', e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Care instructions</span>
              <input className="input mt-1.5" value={draft.care} onChange={(e) => set('care', e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Keywords (comma separated)</span>
              <input className="input mt-1.5" value={draft.keywords} onChange={(e) => set('keywords', e.target.value)} />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-navy-900/10 pt-5">
            {(
              [
                ['isNew', 'New arrival'],
                ['isBestSeller', 'Best seller'],
                ['featured', 'Featured'],
                ['published', 'Published (visible in store)'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={draft[key]} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 accent-[#0B2555]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-navy-900/70">{label}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="mb-2 font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">
            Colors, Sizes & Stock
          </p>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-900/45">
            Colors are free — type any name (Black, Dark Brown, Beige, Navy…). A matching shade is suggested automatically.
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            {draft.colors.map((c) => (
              <span
                key={c.name}
                className="flex items-center gap-2 border border-navy-900 bg-navy-900 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white"
              >
                <label className="flex items-center gap-2" title="Click the swatch to change the shade">
                  <input
                    type="color"
                    aria-label={`Shade for ${c.name}`}
                    value={c.hex}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        colors: d.colors.map((x) => (x.name === c.name ? { ...x, hex: e.target.value } : x)),
                      }))
                    }
                    className="h-4 w-5 cursor-pointer appearance-none border-0 bg-transparent p-0"
                  />
                </label>
                {c.name}
                <button onClick={() => removeColor(c.name)} aria-label={`Remove color ${c.name}`} className="ml-1 text-white/60 transition-colors hover:text-white">
                  ✕
                </button>
              </span>
            ))}
            <div className="flex items-center gap-2">
              <input
                className="input h-10 w-44 font-mono text-[12px]"
                placeholder="Add a color name…"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addColor()
                  }
                }}
              />
              <button onClick={addColor} className="btn btn-outline-dark btn-sm h-10 shrink-0">
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          <p className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">
            Sizes — S, M, L, XL, 2XL only
          </p>
          <div className="flex flex-wrap gap-2.5">
            {[...SIZE_KEYS].map((s) => (
              <button
                key={s}
                onClick={() => toggleSize(s)}
                title={SIZE_LABELS[s].en}
                className={`h-10 min-w-[56px] px-2 border font-mono text-[12px] transition-colors ${
                  draft.sizes.includes(s)
                    ? 'border-navy-900 bg-navy-900 text-white'
                    : 'border-navy-900/15 text-navy-900/70 hover:border-navy-900'
                }`}
              >
                {sizeLabel(s, 'en')}
              </button>
            ))}
          </div>

          {draft.colors.length > 0 && sizeCols.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[480px] border border-navy-900/10">
                <thead>
                  <tr className="border-b border-navy-900/10 bg-soft">
                    <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/50">
                      Color \ Size
                    </th>
                    {sizeCols.map((s) => (
                      <th key={s} className="px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/50">
                        {sizeLabel(s, 'en')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-900/10">
                  {draft.colors.map((c) => (
                    <tr key={c.name}>
                      <td className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-navy-950">
                        <span className="mr-2 inline-block h-3 w-3 rounded-full border border-black/10 align-middle" style={{ backgroundColor: c.hex }} />
                        {c.name}
                      </td>
                      {sizeCols.map((s) => (
                        <td key={s} className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            value={stock[`${c.name}|${s}`] ?? 0}
                            onChange={(e) =>
                              setStock((m) => ({ ...m, [`${c.name}|${s}`]: Math.max(0, Number(e.target.value)) }))
                            }
                            className="h-9 w-16 border border-navy-900/15 text-center font-mono text-[12px] focus:border-navy-800"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <p className="mb-2 font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">Images</p>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-900/45">
            Assign any image to a color — the gallery switches with the selected color on the product page.
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {draft.images.map((img, i) => {
              const mainIndex = draft.images.filter((x) => !x.color).findIndex((x) => x.url === img.url)
              return (
                <div key={`${img.url.slice(0, 40)}-${i}`} className="group relative aspect-[3/4] overflow-hidden border border-navy-900/10 bg-navy-100/40">
                  <SmartImage src={img.url} alt={`Product image ${i + 1}`} className="h-full w-full" />
                  {!img.color && mainIndex === 0 && (
                    <span className="absolute left-1.5 top-1.5 bg-navy-900 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white">
                      Cover
                    </span>
                  )}
                  <button
                    onClick={() => removeImage(img.url)}
                    aria-label="Remove image"
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center bg-white/90 text-navy-900 opacity-100 transition-opacity hover:text-red-700 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                  <select
                    aria-label="Assign image to color"
                    value={img.color}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        images: d.images.map((x, xi) => (xi === i ? { ...x, color: e.target.value } : x)),
                      }))
                    }
                    className="absolute inset-x-1 bottom-1 h-7 border border-navy-900/20 bg-white/95 px-1 font-mono text-[9px] uppercase tracking-[0.1em] text-navy-950"
                  >
                    <option value="">Main image</option>
                    {draft.colors.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
            <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-navy-900/25 text-navy-900/50 transition-colors hover:border-navy-900 hover:text-navy-900">
              <Upload size={18} />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em]">{busy ? 'Uploading…' : 'Upload'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) upload(f)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="input flex-1 font-mono text-[12px]"
              placeholder="…or paste an image URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button
              onClick={() => {
                if (urlInput.trim()) {
                  setDraft((d) => ({ ...d, images: [...d.images, { url: urlInput.trim(), color: '' }] }))
                  setUrlInput('')
                }
              }}
              className="btn btn-outline-dark btn-sm shrink-0"
            >
              <LinkIcon size={14} /> Add URL
            </button>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <p className="font-display text-[12px] font-black uppercase tracking-[0.14em]">Arabic content (المحتوى بالعربية)</p>
          <div>
            <span className="label">Product name — Arabic</span>
            <input dir="rtl" className="input" value={arName} onChange={(e) => setArName(e.target.value)} placeholder="اسم المنتج بالعربية" />
          </div>
          <div>
            <span className="label">Description — Arabic</span>
            <textarea dir="rtl" className="input h-24 resize-y py-3" value={arDesc} onChange={(e) => setArDesc(e.target.value)} placeholder="وصف المنتج بالعربية" />
          </div>
        </Card>

        {error && <p className="border border-red-300 bg-red-50 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-red-700">{error}</p>}

        <div className="flex gap-3">
          <button onClick={save} disabled={busy} className="btn btn-dark flex-1 disabled:opacity-50">
            {busy ? 'Saving…' : isNew ? 'Create Product' : 'Save Changes'}
          </button>
          <Link to="/admin/products" className="btn btn-outline-dark">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
