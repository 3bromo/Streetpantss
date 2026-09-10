import { useCallback, useEffect, useMemo, useState } from 'react'
import { Minus, Plus, RefreshCw } from 'lucide-react'
import { fetchProducts, setVariantStock } from '../lib/api'
import { onDataChange } from '../lib/bus'
import { Product, isLowStock, isOutOfStock, totalStock } from '../lib/types'
import { EmptyState, ErrorState, Img, ListSkeleton, SearchBar, TopBar, useSnack } from '../components/ui'
import { usePullToRefresh } from '../lib/usePTR'

export default function InventoryScreen() {
  const { show } = useSnack()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const load = useCallback(async (silent = false) => {
    try {
      setProducts(await fetchProducts())
      setError('')
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Could not load inventory.')
    }
  }, [])

  useEffect(() => {
    load()
    const poll = window.setInterval(() => load(true), 12000)
    const un = onDataChange((t) => {
      if (t === 'products' || t === 'inventory') load(true)
    })
    return () => {
      window.clearInterval(poll)
      un()
    }
  }, [load])

  const pulling = usePullToRefresh(() => load(true))

  const list = useMemo(() => {
    let l = products ?? []
    if (onlyLow) l = l.filter((p) => isLowStock(p) || isOutOfStock(p))
    const query = q.trim().toLowerCase()
    if (query) l = l.filter((p) => p.name.toLowerCase().includes(query))
    return l
  }, [products, q, onlyLow])

  const selected = (products ?? []).find((p) => p.id === selectedId) ?? list[0]

  const bump = async (p: Product, color: string, size: string, delta: number) => {
    const current = p.variants.find((v) => v.color === color && v.size === size)?.stock ?? 0
    const next = Math.max(0, current + delta)
    if (next === current) return
    const key = `${p.id}|${color}|${size}`
    setBusyKey(key)
    try {
      await setVariantStock(p.id, color, size, next)
      await load(true)
    } catch (e) {
      show(e instanceof Error ? e.message : 'Stock update failed', 'error')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div>
      <TopBar title="Inventory" />
      {pulling && (
        <div className="flex justify-center py-3">
          <RefreshCw size={18} className="animate-spin text-navy-800" />
        </div>
      )}
      <div className="space-y-4 px-4 pt-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search product…" />
        <div className="flex gap-2">
          <button className={`chip ${!onlyLow ? 'chip-active' : ''}`} onClick={() => setOnlyLow(false)}>
            All products
          </button>
          <button className={`chip ${onlyLow ? 'chip-active' : ''}`} onClick={() => setOnlyLow(true)}>
            Low / out only
          </button>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => load()} />
        ) : !products ? (
          <ListSkeleton rows={6} />
        ) : list.length === 0 ? (
          <EmptyState title="No matches" sub="No products match the current inventory filter." />
        ) : (
          <>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {list.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`chip ${selected?.id === p.id ? 'chip-active' : ''}`}
                >
                  {p.name}
                  <span className={`ml-2 ${isOutOfStock(p) ? 'text-red-300' : isLowStock(p) ? 'text-amber-300' : ''}`}>
                    {totalStock(p)}
                  </span>
                </button>
              ))}
            </div>

            {selected && (
              <section className="card p-4">
                <div className="mb-4 flex items-center gap-3">
                  <Img src={selected.images[0] ?? ''} alt={selected.name} className="h-14 w-11 rounded-xl" />
                  <div>
                    <p className="font-display text-[13px] font-black uppercase tracking-tight text-navy-950">{selected.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy-900/50">
                      {totalStock(selected)} units total
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-navy-900/10">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-navy-900/10 bg-soft">
                        <th className="px-2 py-2 text-left font-mono text-[9px] uppercase tracking-[0.12em] text-navy-900/50">Color</th>
                        {selected.sizes.map((s) => (
                          <th key={s} className="px-1 py-2 text-center font-mono text-[9px] uppercase text-navy-900/50">
                            {s}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-900/10">
                      {selected.colors.map((c) => (
                        <tr key={c.name}>
                          <td className="px-2 py-2 font-mono text-[10px] uppercase text-navy-950">{c.name.split(' ')[0]}</td>
                          {selected.sizes.map((s) => {
                            const v = selected.variants.find((x) => x.color === c.name && x.size === s)
                            const stock = v?.stock ?? 0
                            const key = `${selected.id}|${c.name}|${s}`
                            return (
                              <td key={s} className="px-0.5 py-2">
                                <div
                                  className={`flex flex-col items-center rounded-lg py-1 ${
                                    stock === 0 ? 'bg-red-50' : stock <= 3 ? 'bg-amber-50' : ''
                                  }`}
                                >
                                  <span className={`font-mono text-[12px] ${stock === 0 ? 'text-red-700' : 'text-navy-950'}`}>{stock}</span>
                                  <div className="mt-0.5 flex gap-0.5">
                                    <button
                                      aria-label="Decrease"
                                      disabled={busyKey === key || stock === 0}
                                      onClick={() => bump(selected, c.name, s, -1)}
                                      className="rounded p-0.5 text-navy-900/50 active:bg-navy-100 disabled:opacity-30"
                                    >
                                      <Minus size={11} />
                                    </button>
                                    <button
                                      aria-label="Increase"
                                      disabled={busyKey === key}
                                      onClick={() => bump(selected, c.name, s, 1)}
                                      className="rounded p-0.5 text-navy-900/50 active:bg-navy-100 disabled:opacity-30"
                                    >
                                      <Plus size={11} />
                                    </button>
                                  </div>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-navy-900/45">
                  Changes save instantly and sync to the website in real time.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
