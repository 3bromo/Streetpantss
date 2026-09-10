import { useEffect, useState } from 'react'
import { MapPin, Phone } from 'lucide-react'
import { fetchOrders, updateOrderStatus } from '../lib/api'
import { useNav } from '../App'
import { ORDER_STATUSES, Order, OrderStatus, formatPrice } from '../lib/types'
import { ConfirmDialog, FullLoader, ErrorState, Spinner, StatusPill, TopBar, useSnack } from '../components/ui'

export default function OrderDetailScreen({ id }: { id: string }) {
  const nav = useNav()
  const { show } = useSnack()
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const load = async () => {
    try {
      const list = await fetchOrders()
      setOrder(list.find((o) => o.id === id) ?? null)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load order.')
      setOrder(null)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const setStatus = async (status: OrderStatus) => {
    if (!order) return
    if (status === 'cancelled') {
      setConfirmCancel(true)
      return
    }
    setBusy(true)
    try {
      await updateOrderStatus(order.id, status)
      setOrder({ ...order, status })
      show(`Order → ${status}`)
    } catch (e) {
      show(e instanceof Error ? e.message : 'Update failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const doCancel = async () => {
    if (!order) return
    setBusy(true)
    try {
      await updateOrderStatus(order.id, 'cancelled')
      setOrder({ ...order, status: 'cancelled' })
      show('Order cancelled — items restocked')
    } catch (e) {
      show(e instanceof Error ? e.message : 'Cancel failed', 'error')
    } finally {
      // Always release the UI: close the dialog and clear busy on BOTH
      // success and failure so the screen can never hang or freeze.
      setBusy(false)
      setConfirmCancel(false)
    }
  }

  if (order === undefined) return <FullLoader />
  if (error || order === null)
    return (
      <div className="px-4 pt-4">
        <TopBar title="Order" onBack={nav.pop} />
        <ErrorState message={error || 'Order not found'} onRetry={load} />
      </div>
    )

  return (
    <div>
      <TopBar title={`Order ${order.number}`} onBack={nav.pop} />
      <div className="space-y-5 px-4 pt-4">
        <div className="card flex items-center justify-between p-4">
          <div>
            <p className="eyebrow text-navy-900/50">
              {new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="mt-1 font-display text-[18px] font-black tracking-tight text-navy-950">{formatPrice(order.total)}</p>
          </div>
          <StatusPill status={order.status} />
        </div>

        <section className="card p-4">
          <p className="mb-3 font-display text-[12px] font-black uppercase tracking-[0.14em]">Customer</p>
          <p className="font-display text-[14px] font-bold text-navy-950">{order.customerName}</p>
          <p className="mt-0.5 text-[13px] text-ink/60">{order.email}</p>
          <a href={`tel:${order.phone}`} className="mt-2 flex items-center gap-2 font-mono text-[12px] text-navy-800">
            <Phone size={13} /> {order.phone}
          </a>
          <p className="mt-2 flex items-start gap-2 text-[13px] leading-relaxed text-ink/60">
            <MapPin size={14} className="mt-0.5 shrink-0" />
            {order.address}, {order.city}
          </p>
          {order.notes && <p className="mt-2 border-l-2 border-navy-900/15 pl-3 text-[13px] italic text-ink/55">“{order.notes}”</p>}
        </section>

        <section className="card p-4">
          <p className="mb-3 font-display text-[12px] font-black uppercase tracking-[0.14em]">Products</p>
          <ul className="divide-y divide-navy-900/8">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-display text-[12.5px] font-bold uppercase tracking-[0.05em] text-navy-950">{it.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy-900/50">
                    {it.color} / {it.size} × {it.qty}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-[12.5px]">{formatPrice(it.unitPrice * it.qty)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-1.5 border-t border-navy-900/10 pt-3 text-[13px] text-ink/60">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-navy-600">
                <span>Discount {order.discountCode ? `(${order.discountCode})` : ''}</span>
                <span className="font-mono">−{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-mono">{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
            </div>
          </div>
        </section>

        <section className="card p-4">
          <p className="mb-3 font-display text-[12px] font-black uppercase tracking-[0.14em]">Update Status</p>
          <div className="grid grid-cols-2 gap-2">
            {ORDER_STATUSES.filter((s) => s !== 'cancelled').map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                disabled={busy || order.status === s}
                className={`btn h-11 !text-[11px] ${order.status === s ? 'btn-primary' : 'btn-ghost'} disabled:opacity-50`}
              >
                {busy && order.status !== s ? <Spinner /> : s}
              </button>
            ))}
          </div>
          {order.status !== 'cancelled' && (
            <button onClick={() => setStatus('cancelled')} disabled={busy} className="btn btn-danger mt-2 h-11 w-full !text-[11px]">
              Cancel Order (restocks items)
            </button>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this order?"
        message="The order will be marked cancelled and all its items returned to stock on the website."
        confirmLabel="Cancel Order"
        danger
        busy={busy}
        onConfirm={doCancel}
        onClose={() => setConfirmCancel(false)}
      />
    </div>
  )
}
