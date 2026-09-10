import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react'
import { ToastMsg } from '../lib/types'

interface UIContextValue {
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  accountOpen: boolean
  setAccountOpen: (open: boolean) => void
  toasts: ToastMsg[]
  pushToast: (toast: { title: string; sub?: string }) => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const counter = useRef(0)

  const pushToast = useCallback((toast: { title: string; sub?: string }) => {
    const id = ++counter.current
    setToasts((prev) => [...prev.slice(-2), { id, ...toast }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  return (
    <UIContext.Provider
      value={{ searchOpen, setSearchOpen, menuOpen, setMenuOpen, accountOpen, setAccountOpen, toasts, pushToast }}
    >
      {children}
    </UIContext.Provider>
  )
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
