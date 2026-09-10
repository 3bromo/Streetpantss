import { useMemo, useState } from 'react'
import { usePageTitle } from '../lib/usePageTitle'
import { getBackend } from '../lib/backend'
import { useCatalog } from '../context/CatalogContext'
import { useUI } from '../context/UIContext'
import { totalStock, isLowStock, isOutOfStock } from '../lib/stock'
import { AdminPageHead, Card, Spinner } from './ui'
import SmartImage from '../components/SmartImage'

export default function AdminInventoryPage() {
  usePageTitle('Admin — Inventory')
  const { allProducts, loading, refresh } = useCatalog()
  const backend = getBackend()
  const { pushToast } = useUI()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, number>>({})
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const lowStock = useMemo(() => allProducts.filter((p) => isLowStock(p) || isOutOfStock(p)), [allProducts])
  const selected = allProducts.find((p) => p.id === (selectedId ?? allProducts[0]?.id))

  const saveCell = async (productId: string, color: string, size: string, stock: number) => {
    const key = `${productId}|${color}|${size}`
    setBusyKey(key)
    try {
      await backend.setVariantStock(productId, color, size, stock)
      await refresh()
      pushToast({ title: 'Stock updated', sub: `${color} / ${size} → ${stock}` })
    } catch (e) {
      pushToast({ title: 'Could not update stock', sub: e instanceof Error ? e.message : undefined })
    } finally {
      setBusyKey(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <AdminPageHead
        title="Inventory"
        sub="Stock per size and color variant. Changes save instantly and hit the storefront immediately."
      />

      {lowStock.length > 0 && (
        <Card className="mb-6">
          <div className="border-b border-navy-900/10 px-5 py-4">
            <p className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">
              Low / Out of Stock ({lowStock.length})
            </p>
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            {lowStock.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`flex items-center gap-2 border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                  selected?.id === p.id
                    ? 'border-navy-900 bg-navy-900 text-white'
                    : 'border-navy-900/15 text-navy-900/70 hover:border-navy-900'
                }`}
              >
                {p.name}
                <span className={isOutOfStock(p) ? 'text-red-400' : 'text-navy-600'}>{totalStock(p)}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <p className="border-b border-navy-900/10 px-5 py-4 font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">
            Products
          </p>
          <ul className="max-h-[60vh] divide-y divide-navy-900/10 overflow-y-auto">
            {allProducts.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    setSelectedId(p.id)
                    setValues({})
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selected?.id === p.id ? 'bg-navy-950 text-white' : 'hover:bg-soft'
                  }`}
                >
                  <div className="h-10 w-8 shrink-0 overflow-hidden bg-navy-100/40">
                    <SmartImage src={p.images[0] ?? ''} alt="" className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[11px] font-bold uppercase tracking-[0.08em]">{p.name}</p>
                    <p className={`font-mono text-[10px] ${selected?.id === p.id ? 'text-white/50' : 'text-navy-900/45'}`}>
                      {totalStock(p)} units
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 lg:col-span-3">
          {selected ? (
            <>
              <div className="mb-5 flex items-center justify-between">
                <p className="font-display text-[15px] font-black uppercase tracking-tight text-navy-950">
                  {selected.name}
                </p>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-navy-900/50">
                  {totalStock(selected)} units total
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border border-navy-900/10">
                  <thead>
                    <tr className="border-b border-navy-900/10 bg-soft">
                      <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/50">
                        Color \ Size
                      </th>
                      {selected.sizes.map((s) => (
                        <th key={s} className="px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/50">
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-900/10">
                    {selected.colors.map((c) => (
                      <tr key={c.name}>
                        <td className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-navy-950">
                          {c.name}
                        </td>
                        {selected.sizes.map((s) => {
                          const current = selected.variants.find((v) => v.color === c.name && v.size === s)?.stock ?? 0
                          const key = `${selected.id}|${c.name}|${s}`
                          const value = values[key] ?? current
                          return (
                            <td key={s} className="px-2 py-2 text-center">
                              <input
                                type="number"
                                min={0}
                                value={value}
                                onChange={(e) =>
                                  setValues((m) => ({ ...m, [key]: Math.max(0, Number(e.target.value)) }))
                                }
                                onBlur={() => {
                                  if (value !== current) saveCell(selected.id, c.name, s, value)
                                }}
                                disabled={busyKey === key}
                                className={`h-9 w-16 border text-center font-mono text-[12px] focus:border-navy-800 disabled:opacity-50 ${
                                  current === 0 ? 'border-red-300 bg-red-50' : current <= 3 ? 'border-navy-900/30 bg-navy-100/50' : 'border-navy-900/15'
                                }`}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/45">
                Edit a cell and click away to save. Red = out of stock, shaded = low.
              </p>
            </>
          ) : (
            <p className="py-16 text-center text-[13px] text-ink/50">No products yet — create one first.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
