import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import { getBackend } from '../lib/backend'
import { useCatalog } from '../context/CatalogContext'
import { useUI } from '../context/UIContext'
import { formatPrice } from '../lib/format'
import { totalStock, effectivePrice } from '../lib/stock'
import { AdminPageHead, Card, Spinner, Th, Td } from './ui'
import SmartImage from '../components/SmartImage'

export default function AdminProductsPage() {
  usePageTitle('Admin — Products')
  const { allProducts, loading, refresh } = useCatalog()
  const backend = getBackend()
  const { pushToast } = useUI()
  const [busyId, setBusyId] = useState<string | null>(null)

  const togglePublish = async (id: string, published: boolean) => {
    setBusyId(id)
    try {
      await backend.updateProduct(id, { published: !published })
      await refresh()
      pushToast({ title: published ? 'Product unpublished' : 'Product published' })
    } catch (e) {
      pushToast({ title: 'Could not update product', sub: e instanceof Error ? e.message : undefined })
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setBusyId(id)
    try {
      await backend.deleteProduct(id)
      await refresh()
      pushToast({ title: 'Product deleted', sub: name })
    } catch (e) {
      pushToast({ title: 'Could not delete product', sub: e instanceof Error ? e.message : undefined })
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <AdminPageHead
        title="Products"
        sub={`${allProducts.length} products in the catalog.`}
        actions={
          <Link to="/admin/products/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> New Product
          </Link>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-navy-900/10">
              <tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Stock</Th>
                <Th>Live</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/10">
              {allProducts.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-soft">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-11 shrink-0 overflow-hidden bg-navy-100/40">
                        <SmartImage src={p.images[0] ?? ''} alt={p.name} className="h-full w-full" />
                      </div>
                      <div>
                        <p className="font-display text-[12px] font-bold uppercase tracking-[0.08em] text-navy-950">
                          {p.name}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy-900/45">
                          {p.isNew ? 'New' : ''} {p.isBestSeller ? '· Best Seller' : ''} {p.featured ? '· Featured' : ''}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="font-mono text-[11px]">{p.sku || '—'}</Td>
                  <Td className="capitalize">{p.category.replace('-', ' ')}</Td>
                  <Td className="font-mono text-[12px]">{formatPrice(effectivePrice(p))}</Td>
                  <Td className="font-mono text-[12px]">{totalStock(p)}</Td>
                  <Td>
                    <button
                      onClick={() => togglePublish(p.id, p.published)}
                      disabled={busyId === p.id}
                      aria-label={p.published ? 'Unpublish' : 'Publish'}
                      className={`relative h-5 w-9 rounded-full transition-colors duration-300 disabled:opacity-50 ${
                        p.published ? 'bg-navy-800' : 'bg-navy-900/20'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-300 ${
                          p.published ? 'left-[18px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        to={`/admin/products/${p.id}`}
                        aria-label="Edit product"
                        className="flex h-8 w-8 items-center justify-center border border-navy-900/15 text-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
                      >
                        <Pencil size={13} />
                      </Link>
                      <button
                        onClick={() => remove(p.id, p.name)}
                        disabled={busyId === p.id}
                        aria-label="Delete product"
                        className="flex h-8 w-8 items-center justify-center border border-navy-900/15 text-navy-900 transition-colors hover:bg-red-700 hover:border-red-700 hover:text-white disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
