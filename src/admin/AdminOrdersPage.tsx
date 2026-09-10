import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import { getBackend } from '../lib/backend'
import { useUI } from '../context/UIContext'
import { Order, ORDER_STATUSES, OrderStatus } from '../lib/types'
import { formatPrice } from '../lib/format'
import { AdminPageHead, Card, Spinner, StatusBadge, Th, Td } from './ui'

export default function AdminOrdersPage() {
  usePageTitle('Admin — Orders')
  const backend = getBackend()
  const { pushToast } = useUI()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () =>
    backend
      .listOrders()
      .then(setOrders)
      .catch(() => setOrders([]))

  useEffect(() => {
    load()
  }, [backend])

  const setStatus = async (order: Order, status: OrderStatus) => {
    setBusyId(order.id)
    try {
      await backend.updateOrderStatus(order.id, status)
      pushToast({ title: `Order ${order.number} → ${status}` })
      await load()
    } catch (e) {
      pushToast({ title: 'Could not update order', sub: e instanceof Error ? e.message : undefined })
    } finally {
      setBusyId(null)
    }
  }

  if (!orders) return <Spinner />
  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div>
      <AdminPageHead
        title="Orders"
        sub={`${orders.length} total — ${orders.filter((o) => o.status === 'new').length} awaiting confirmation.`}
        actions={
          <div className="relative">
            <select
              aria-label="Filter by status"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="h-[44px] appearance-none border border-navy-900/15 bg-white pl-4 pr-10 font-mono text-[12px] uppercase tracking-[0.12em] text-navy-950"
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-900/50" />
          </div>
        }
      />

      <Card>
        {filtered.length === 0 ? (
          <p className="px-5 py-14 text-center text-[13px] text-ink/50">No orders with this status yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-navy-900/10">
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th className="hidden lg:table-cell">City</Th>
                  <Th>Date</Th>
                  <Th>Items</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th>Update</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/10">
                {filtered.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-soft">
                    <Td>
                      <Link to={`/admin/orders/${o.id}`} className="font-mono text-[12px] font-medium text-navy-900 hover:underline">
                        {o.number}
                      </Link>
                    </Td>
                    <Td>{o.customerName}</Td>
                    <Td className="hidden lg:table-cell">{o.city}</Td>
                    <Td className="font-mono text-[12px]">
                      {new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </Td>
                    <Td className="font-mono text-[12px]">{o.items.reduce((s, i) => s + i.qty, 0)}</Td>
                    <Td className="font-mono text-[12px]">{formatPrice(o.total)}</Td>
                    <Td>
                      <StatusBadge status={o.status} />
                    </Td>
                    <Td>
                      <div className="relative">
                        <select
                          aria-label={`Update status for ${o.number}`}
                          disabled={busyId === o.id}
                          value={o.status}
                          onChange={(e) => setStatus(o, e.target.value as OrderStatus)}
                          className="h-9 appearance-none border border-navy-900/15 bg-white pl-3 pr-8 font-mono text-[11px] uppercase tracking-[0.1em] text-navy-950 disabled:opacity-50"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-900/50" />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
