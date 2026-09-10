import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useUI } from './UIContext'

interface WishlistContextValue {
  ids: string[]
  has: (id: string) => boolean
  toggle: (id: string, name: string) => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

const STORAGE_KEY = 'sp-wishlist-v1'

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  })
  const { pushToast } = useUI()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      /* ignore */
    }
  }, [ids])

  const has = (id: string) => ids.includes(id)

  const toggle = (id: string, name: string) => {
    setIds((prev) => {
      const active = prev.includes(id)
      if (active) {
        return prev.filter((x) => x !== id)
      }
      pushToast({ title: 'Saved to wishlist', sub: name })
      return [...prev, id]
    })
  }

  return <WishlistContext.Provider value={{ ids, has, toggle }}>{children}</WishlistContext.Provider>
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
