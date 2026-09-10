import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { CartItem, Product } from '../lib/types'
import { useUI } from './UIContext'
import { useCatalog } from './CatalogContext'
import { effectivePrice, variantStock } from '../lib/stock'

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  addItem: (product: Product, color: string, size: string, qty?: number, opts?: { silent?: boolean }) => void
  removeItem: (productId: string, color: string, size: string) => void
  setQty: (productId: string, color: string, size: string, qty: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'sp-cart-v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
      return []
    }
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pushToast } = useUI()
  const { getProduct } = useCatalog()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items])

  const inCart = (productId: string, color: string, size: string) =>
    items.find((i) => i.productId === productId && i.color === color && i.size === size)?.qty ?? 0

  const addItem: CartContextValue['addItem'] = (product, color, size, qty = 1, opts) => {
    const available = variantStock(product, color, size)
    const current = inCart(product.id, color, size)
    if (available <= 0) {
      pushToast({ title: 'Out of stock', sub: `${product.name} — ${color} / ${size}` })
      return
    }
    const canAdd = available - current
    if (canAdd <= 0) {
      pushToast({ title: 'No more stock available', sub: `${product.name} — ${color} / ${size}` })
      return
    }
    const addQty = Math.min(qty, canAdd)
    if (addQty < qty) {
      pushToast({ title: `Only ${available} in stock`, sub: `${product.name} — ${color} / ${size}` })
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id && i.color === color && i.size === size)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.color === color && i.size === size ? { ...i, qty: i.qty + addQty } : i,
        )
      }
      return [...prev, { productId: product.id, color, size, qty: addQty }]
    })
    if (!opts?.silent) {
      pushToast({ title: 'Added to cart', sub: `${product.name} — ${size}` })
      setDrawerOpen(true)
    }
  }

  const removeItem = (productId: string, color: string, size: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.color === color && i.size === size)))
  }

  const setQty = (productId: string, color: string, size: string, qty: number) => {
    if (qty < 1) {
      removeItem(productId, color, size)
      return
    }
    const p = getProduct(productId)
    if (p) {
      const available = variantStock(p, color, size)
      if (qty > available) {
        pushToast({ title: `Only ${available} in stock`, sub: `${p.name} — ${color} / ${size}` })
        qty = available
        if (qty < 1) {
          removeItem(productId, color, size)
          return
        }
      }
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId && i.color === color && i.size === size ? { ...i, qty } : i)),
    )
  }

  const clearCart = () => setItems([])

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])
  const subtotal = useMemo(
    () =>
      items.reduce((sum, i) => {
        const p = getProduct(i.productId)
        return sum + (p ? effectivePrice(p) * i.qty : 0)
      }, 0),
    [items, getProduct],
  )

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        addItem,
        removeItem,
        setQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
