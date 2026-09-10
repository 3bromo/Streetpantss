import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, Boxes, ClipboardList, PackagePlus, RefreshCw, Settings } from 'lucide-react'
import { fetchOrders, fetchProducts } from '../lib/api'
import { onDataChange } from '../lib/bus'
import { useNav } from '../App'
import { Order, Product, formatPrice, isLowStock, isOutOfStock, totalStock } from '../lib/types'
import { Img, ListSkeleton, ErrorState, StatCard, StatusPill, TopBar, useSnack } from '../components/ui'
import { usePullToRefresh } from '../lib/usePTR'

export default function DashboardScreen() {
  const nav = useNav()
  const { show } = useSnack()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async (silent = false) => {
    try {
      const [o, p] = await Promise.all([fetchOrders(), fetchProducts()])
      setOrders(o)
      setProducts(p)
      setError('')
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Could not reach the store backend.')
    }
  }, [])

  useEffect(() => {
    load()
    const poll = window.setInterval(() => load(true), 12000)
    const un = onDataChange((t) => {
      if (t === 'orders') load(true)
      if (t === 'products' || t === 'inventory') load(true)
    })
    return () => {
      window.clearInterval(poll)
      un()
    }
  }, [load])

  const pulling = usePullToRefresh(() => load(true))

  const stats = useMemo(() => {
    const o = orders ?? []
    const p = products ?? []
    const active = o.filter((x) => x.status !== 'cancelled')
    return {
      sales: active.reduce((s, x) => s + x.total, 0),
      totalOrders: o.length,
      newOrders: o.filter((x) => x.status === 'new').length,
      pending: o.filter((x) => x.status === 'confirmed' || x.status === 'preparing').length,
      completed: o.filter((x) => x.status === 'delivered').length,
      products: p.length,
      low: p.filter(isLowStock).length,
      out: p.filter(isOutOfStock).length,
    }
  }, [orders, products])

  const bestSellers = useMemo(() => {
    const qty = new Map<string, number>()
    for (const o of orders ?? []) {
      if (o.status === 'cancelled') continue
      for (const it of o.items) qty.set(it.productId, (qty.get(it.productId) ?? 0) + it.qty)
    }
    return Array.from(qty.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, q]) => ({ product: (products ?? []).find((p) => p.id === id), qty: q }))
      .filter((x) => x.product)
  }, [orders, products])

  const lowList = useMemo(() => (products ?? []).filter((p) => isLowStock(p) || isOutOfStock(p)).slice(0, 5), [products])
  const currency = 'EGP'

  return (
    <div>
      <TopBar
        title="Dashboard"
        right={
          <button aria-label="Settings & more" onClick={() => nav.push({ name: 'settings' })} className="p-1.5 text-navy-950 active:opacity-60">
            <Settings size={21} strokeWidth={1.8} />
          </button>
        }
      />

      {pulling && (
        <div className="flex justify-center py-3">
          <RefreshCw size={18} className="animate-spin text-navy-800" />
        </div>
      )}

      <div className="space-y-5 px-4 pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/45">
          Private admin — key-based access
        </p>

        {error ? (
          <ErrorState message={error} onRetry={() => load()} />
        ) : !orders || !products ? (
          <ListSkeleton rows={6} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Sales" value={formatPrice(stats.sales, currency)} accent />
              <StatCard label="Total Orders" value={stats.totalOrders} />
              <StatCard label="New Orders" value={stats.newOrders} />
              <StatCard label="Pending" value={stats.pending} />
              <StatCard label="Completed" value={stats.completed} />
              <StatCard label="Products" value={stats.products} />
              <StatCard label="Low Stock" value={stats.low} />
              <StatCard label="Out of Stock" value={stats.out} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => nav.push({ name: 'productEdit' })} className="btn btn-primary h-16 flex-col gap-1 !text-[10px]">
                <PackagePlus size={18} /> Add Product
              </button>
              <button onClick={() => nav.setTab('orders')} className="btn btn-ghost h-16 flex-col gap-1 !text-[10px]">
                <ClipboardList size={18} /> Orders
              </button>
              <button onClick={() => nav.setTab('inventory')} className="btn btn-ghost h-16 flex-col gap-1 !text-[10px]">
                <Boxes size={18} /> Inventory
              </button>
            </div>

            <section className="card">
              <div className="flex items-center justify-between border-b border-navy-900/10 px-4 py-3">
                <p className="font-display text-[12px] font-black uppercase tracking-[0.14em]">Recent Orders</p>
                <button onClick={() => nav.setTab('orders')} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/50">
                  All <ArrowRight size={12} />
                </button>
              </div>
              {orders.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-ink/50">No orders yet — new website orders appear here in real time.</p>
              ) : (
                <ul className="divide-y divide-navy-900/8">
                  {orders.slice(0, 5).map((o) => (
                    <li key={o.id}>
                      <button onClick={() => nav.push({ name: 'orderDetail', id: o.id })} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-soft">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[12px] font-medium text-navy-950">{o.number}</p>
                          <p className="mt-0.5 truncate text-[12px] text-ink/55">
                            {o.customerName} · {formatPrice(o.total, currency)}
                          </p>
                        </div>
                        <StatusPill status={o.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {bestSellers.length > 0 && (
              <section className="card">
                <p className="border-b border-navy-900/10 px-4 py-3 font-display text-[12px] font-black uppercase tracking-[0.14em]">
                  Best Selling
                </p>
                <ul className="divide-y divide-navy-900/8">
                  {bestSellers.map((b, i) => (
                    <li key={b.product!.id} className="flex items-center gap-3 px-4 py-3">
                      <Img src={b.product!.images[0] ?? ''} alt={b.product!.name} className="h-12 w-10 rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[12px] font-bold uppercase tracking-[0.06em] text-navy-950">
                          {i + 1}. {b.product!.name}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy-900/50">{b.qty} sold</p>
                      </div>
                      <p className="font-mono text-[12px] text-navy-900">{formatPrice(b.product!.price, currency)}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="card">
              <div className="flex items-center justify-between border-b border-navy-900/10 px-4 py-3">
                <p className="flex items-center gap-2 font-display text-[12px] font-black uppercase tracking-[0.14em]">
                  <AlertTriangle size={14} className="text-red-700" /> Stock Alerts
                </p>
                <button onClick={() => nav.setTab('inventory')} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/50">
                  Manage <ArrowRight size={12} />
                </button>
              </div>
              {lowList.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-ink/50">All products are healthy on stock.</p>
              ) : (
                <ul className="divide-y divide-navy-900/8">
                  {lowList.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                      <Img src={p.images[0] ?? ''} alt={p.name} className="h-12 w-10 rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[12px] font-bold uppercase tracking-[0.06em] text-navy-950">{p.name}</p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy-900/50">{totalStock(p)} units left</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] ${isOutOfStock(p) ? 'bg-ink text-white' : 'bg-navy-100 text-navy-900'}`}>
                        {isOutOfStock(p) ? 'Out' : 'Low'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
