import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import { getBackend } from '../lib/backend'
import { useCatalog } from '../context/CatalogContext'
import { Order } from '../lib/types'
import { totalStock, isLowStock, isOutOfStock } from '../lib/stock'
import { formatPrice } from '../lib/format'
import { AdminPageHead, Card, StatCard, StatusBadge, Spinner, Th, Td } from './ui'

export default function AdminDashboardPage() {
  usePageTitle('Admin — Dashboard')
  const backend = getBackend()
  const { allProducts } = useCatalog()
  const [orders, setOrders] = useState<Order[] | null>(null)

  useEffect(() => {
    backend
      .listOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
  }, [backend])

  if (!orders) return <Spinner />

  const active = orders.filter((o) => o.status !== 'cancelled')
  const totalSales = active.reduce((s, o) => s + o.total, 0)
  const newOrders = orders.filter((o) => o.status === 'new').length
  const lowStock = allProducts.filter((p) => isLowStock(p) || isOutOfStock(p))

  return (
    <div>
      <AdminPageHead
        title="Dashboard"
        sub="What's moving in the store right now."
        actions={
          <Link to="/admin/orders" className="btn btn-primary btn-sm">
            Manage Orders <ArrowRight size={14} />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard label="Total Orders" value={orders.length} />
        <StatCard label="New Orders" value={newOrders} accent />
        <StatCard label="Total Sales" value={formatPrice(totalSales)} />
        <StatCard label="Products" value={allProducts.length} />
        <StatCard label="Low / Out of Stock" value={lowStock.length} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between border-b border-navy-900/10 px-5 py-4">
            <p className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">Recent Orders</p>
            <Link to="/admin/orders" className="font-mono text-[11px] uppercase tracking-[0.18em] text-navy-900/55 hover:text-navy-900">
              View all →
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-ink/50">No orders yet — they'll appear here the moment a customer checks out.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-navy-900/10">
                  <tr>
                    <Th>Order</Th>
                    <Th>Customer</Th>
                    <Th className="hidden md:table-cell">Date</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-900/10">
                  {orders.slice(0, 6).map((o) => (
                    <tr key={o.id} className="transition-colors hover:bg-soft">
                      <Td>
                        <Link to={`/admin/orders/${o.id}`} className="font-mono text-[12px] text-navy-900 hover:underline">
                          {o.number}
                        </Link>
                      </Td>
                      <Td>{o.customerName}</Td>
                      <Td className="hidden font-mono text-[12px] md:table-cell">
                        {new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </Td>
                      <Td className="font-mono text-[12px]">{formatPrice(o.total)}</Td>
                      <Td>
                        <StatusBadge status={o.status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-navy-900/10 px-5 py-4">
            <p className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">Stock Alerts</p>
            <Link to="/admin/inventory" className="font-mono text-[11px] uppercase tracking-[0.18em] text-navy-900/55 hover:text-navy-900">
              Inventory →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-ink/50">All products are healthy on stock.</p>
          ) : (
            <ul className="divide-y divide-navy-900/10">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-display text-[12px] font-bold uppercase tracking-[0.08em] text-navy-950">
                      {p.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/50">
                      {totalStock(p)} units left
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] ${
                      isOutOfStock(p) ? 'bg-ink text-white' : 'bg-navy-100 text-navy-900'
                    }`}
                  >
                    {isOutOfStock(p) ? 'Out' : 'Low'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
