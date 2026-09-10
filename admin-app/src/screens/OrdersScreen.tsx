import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'
import { deleteOrder, fetchOrders } from '../lib/api'
import { onDataChange } from '../lib/bus'
import { useNav } from '../App'
import { ORDER_STATUSES, Order, formatPrice } from '../lib/types'
import { ConfirmDialog, EmptyState, ErrorState, ListSkeleton, SearchBar, StatusPill, TopBar, useSnack } from '../components/ui'
import { usePullToRefresh } from '../lib/usePTR'

export default function OrdersScreen() {
  const nav = useNav()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | (typeof ORDER_STATUSES)[number]>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { show } = useSnack()

  const load = useCallback(async (silent = false) => {
    try {
      setOrders(await fetchOrders())
      setError('')
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Could not load orders.')
    }
  }, [])

  useEffect(() => {
    load()
    const poll = window.setInterval(() => load(true), 12000)
    const un = onDataChange((t) => {
      if (t === 'orders') load(true)
    })
    return () => {
      window.clearInterval(poll)
      un()
    }
  }, [load])

  const pulling = usePullToRefresh(() => load(true))

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteOrder(deleteTarget.id)
      // Smooth UI: remove locally, no refresh needed.
      setOrders((prev) => (prev ? prev.filter((x) => x.id !== deleteTarget.id) : prev))
      show(`Order ${deleteTarget.number} deleted`)
      setDeleteTarget(null)
    } catch (e) {
      show(e instanceof Error ? e.message : 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    let list = orders ?? []
    if (status !== 'all') list = list.filter((o) => o.status === status)
    if (from) list = list.filter((o) => o.createdAt >= new Date(from).toISOString())
    if (to) list = list.filter((o) => o.createdAt <= new Date(`${to}T23:59:59`).toISOString())
    const query = q.trim().toLowerCase()
    if (query)
      list = list.filter(
        (o) =>
          o.number.toLowerCase().includes(query) ||
          o.customerName.toLowerCase().includes(query) ||
          o.phone.includes(query),
      )
    return list
  }, [orders, q, status, from, to])

  return (
    <div>
      <TopBar title="Orders" />
      {pulling && (
        <div className="flex justify-center py-3">
          <RefreshCw size={18} className="animate-spin text-navy-800" />
        </div>
      )}
      <div className="space-y-4 px-4 pt-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search number, customer, phone…" />

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <button className={`chip ${status === 'all' ? 'chip-active' : ''}`} onClick={() => setStatus('all')}>
            All
          </button>
          {ORDER_STATUSES.map((s) => (
            <button key={s} className={`chip ${status === s ? 'chip-active' : ''}`} onClick={() => setStatus(s)}>
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="label">From</span>
            <input type="date" className="input font-mono text-[12px]" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <span className="label">To</span>
            <input type="date" className="input font-mono text-[12px]" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => load()} />
        ) : !orders ? (
          <ListSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No orders" sub="Website orders appear here in real time the moment customers check out." />
        ) : (
          <ul className="space-y-3">
            {filtered.map((o) => (
              <li key={o.id}>
                <div className="card flex w-full items-center gap-2 p-4">
                  <button onClick={() => nav.push({ name: 'orderDetail', id: o.id })} className="min-w-0 flex-1 text-left active:opacity-80">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-[13px] font-medium text-navy-950">{o.number}</p>
                      <StatusPill status={o.status} />
                    </div>
                    <p className="mt-1 truncate text-[12.5px] text-ink/60">
                      {o.customerName} · {o.city}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-navy-900/45">
                      {new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })} ·{' '}
                      {o.items.reduce((s, i) => s + i.qty, 0)} items
                    </p>
                    <p className="mt-1 font-mono text-[13px] font-medium text-navy-900">{formatPrice(o.total)}</p>
                  </button>
                  <button
                    aria-label={`Delete order ${o.number}`}
                    onClick={() => setDeleteTarget(o)}
                    className="shrink-0 rounded-full p-2 text-ink/40 transition-colors hover:bg-red-50 hover:text-red-600 active:bg-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this order?"
        message={`Are you sure you want to delete order ${deleteTarget?.number ?? ''}? This permanently removes it from the database and cannot be undone.`}
        confirmLabel="Delete Order"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
