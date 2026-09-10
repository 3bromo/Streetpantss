import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight, PackagePlus, RefreshCw } from 'lucide-react'
import { fetchProducts, updateProduct } from '../lib/api'
import { onDataChange } from '../lib/bus'
import { useNav } from '../App'
import { CATEGORIES, Product, formatPrice, totalStock } from '../lib/types'
import { EmptyState, ErrorState, Img, ListSkeleton, SearchBar, Toggle, TopBar, useSnack } from '../components/ui'
import { usePullToRefresh } from '../lib/usePTR'

export default function ProductsScreen() {
  const nav = useNav()
  const { show } = useSnack()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('all')
  const [vis, setVis] = useState<'all' | 'live' | 'hidden'>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (silent = false) => {
    try {
      setProducts(await fetchProducts())
      setError('')
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Could not load products.')
    }
  }, [])

  useEffect(() => {
    load()
    return onDataChange((t) => {
      if (t === 'products' || t === 'inventory') load(true)
    })
  }, [load])

  const pulling = usePullToRefresh(() => load(true))

  const filtered = useMemo(() => {
    let list = products ?? []
    if (cat !== 'all') list = list.filter((p) => p.category === cat)
    if (vis === 'live') list = list.filter((p) => p.published)
    if (vis === 'hidden') list = list.filter((p) => !p.published)
    const query = q.trim().toLowerCase()
    if (query)
      list = list.filter(
        (p) => p.name.toLowerCase().includes(query) || (p.sku ?? '').toLowerCase().includes(query),
      )
    return list
  }, [products, q, cat, vis])

  const togglePublish = async (p: Product, v: boolean) => {
    setBusyId(p.id)
    try {
      await updateProduct(p.id, { published: v })
      show(v ? 'Published to website' : 'Hidden from website')
      await load(true)
    } catch (e) {
      show(e instanceof Error ? e.message : 'Update failed', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <TopBar title="Products" />
      {pulling && (
        <div className="flex justify-center py-3">
          <RefreshCw size={18} className="animate-spin text-navy-800" />
        </div>
      )}
      <div className="space-y-4 px-4 pt-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search name or SKU…" />

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <button className={`chip ${cat === 'all' ? 'chip-active' : ''}`} onClick={() => setCat('all')}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${cat === c ? 'chip-active' : ''}`} onClick={() => setCat(c)}>
              {c.replace('-', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['all', 'live', 'hidden'] as const).map((v) => (
            <button key={v} className={`chip ${vis === v ? 'chip-active' : ''}`} onClick={() => setVis(v)}>
              {v === 'all' ? 'All states' : v === 'live' ? 'Live' : 'Hidden'}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => load()} />
        ) : !products ? (
          <ListSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No products"
            sub="Nothing matches your search or filters."
            action={
              <button onClick={() => nav.push({ name: 'productEdit' })} className="btn btn-primary h-11 px-6">
                <PackagePlus size={16} /> Add Product
              </button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((p) => (
              <li key={p.id} className="card flex items-center gap-3 p-3">
                <button onClick={() => nav.push({ name: 'productEdit', id: p.id })} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <Img src={p.images[0] ?? ''} alt={p.name} className="h-16 w-13 w-[52px] shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[13px] font-bold uppercase tracking-[0.06em] text-navy-950">
                      {p.name}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-navy-900/60">
                      {formatPrice(p.price)} · {totalStock(p)} units
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-navy-900/40">
                      {p.category.replace('-', ' ')} {p.sku ? `· ${p.sku}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={17} className="shrink-0 text-navy-900/30" />
                </button>
                <div className="flex flex-col items-end gap-1.5">
                  <Toggle checked={p.published} onChange={(v) => togglePublish(p, v)} />
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-navy-900/40">
                    {busyId === p.id ? '…' : p.published ? 'live' : 'hidden'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button onClick={() => nav.push({ name: 'productEdit' })} className="btn btn-primary w-full">
          <PackagePlus size={17} /> Add Product
        </button>
      </div>
    </div>
  )
}
