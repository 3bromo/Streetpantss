import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import { getBackend } from '../lib/backend'
import { useUI } from '../context/UIContext'
import { Order, ORDER_STATUSES, OrderStatus } from '../lib/types'
import { formatPrice } from '../lib/format'
import { AdminPageHead, Card, Spinner, StatusBadge } from './ui'

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  usePageTitle('Admin — Order')
  const backend = getBackend()
  const { pushToast } = useUI()
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    backend
      .listOrders()
      .then((list) => setOrder(list.find((o) => o.id === id) ?? null))
      .catch(() => setOrder(null))
  }, [backend, id])

  if (order === undefined) return <Spinner />
  if (order === null) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl font-black uppercase text-navy-950">Order not found</p>
        <Link to="/admin/orders" className="btn btn-outline-dark btn-sm mt-6">
          Back to Orders
        </Link>
      </div>
    )
  }

  const setStatus = async (status: OrderStatus) => {
    setBusy(true)
    try {
      await backend.updateOrderStatus(order.id, status)
      pushToast({ title: `Order ${order.number} → ${status}` })
      setOrder({ ...order, status })
    } catch (e) {
      pushToast({ title: 'Could not update order', sub: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHead
        title={`Order ${order.number}`}
        sub={`Placed ${new Date(order.createdAt).toLocaleString('en-GB')} `}
        actions={
          <Link to="/admin/orders" className="btn btn-outline-dark btn-sm">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="p-6 md:col-span-3">
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">Items</p>
          <ul className="mt-4 divide-y divide-navy-900/10">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="truncate font-display text-[13px] font-bold uppercase tracking-[0.06em] text-navy-950">
                    {it.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/50">
                    {it.color} / {it.size} × {it.qty}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-[13px]">{formatPrice(it.unitPrice * it.qty)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-navy-900/10 pt-4">
            <div className="flex justify-between text-[13px] text-ink/60">
              <span>Subtotal</span>
              <span className="font-mono">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-[13px] text-navy-600">
                <span>Discount {order.discountCode ? `(${order.discountCode})` : ''}</span>
                <span className="font-mono">−{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[13px] text-ink/60">
              <span>Shipping</span>
              <span className="font-mono">{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="font-display text-[13px] font-bold uppercase tracking-[0.16em]">Total</span>
              <span className="font-mono text-[16px]">{formatPrice(order.total)}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-6 md:col-span-2">
          <Card className="p-6">
            <p className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">Customer</p>
            <div className="mt-4 space-y-2 text-[13px] text-ink/70">
              <p className="font-medium text-navy-950">{order.customerName}</p>
              <p>{order.email}</p>
              <p className="font-mono text-[12px]">{order.phone}</p>
              <p className="pt-2">
                {order.address}
                <br />
                {order.city}
              </p>
              {order.notes && <p className="border-l-2 border-navy-900/15 pl-3 italic text-ink/55">“{order.notes}”</p>}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">Status</p>
              <StatusBadge status={order.status} />
            </div>
            <div className="relative mt-4">
              <select
                aria-label="Order status"
                disabled={busy}
                value={order.status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="input appearance-none pr-10 font-mono text-[12px] uppercase tracking-[0.12em] disabled:opacity-50"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-900/50" />
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-navy-900/45">
              Cancelling an order returns its items to stock.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
