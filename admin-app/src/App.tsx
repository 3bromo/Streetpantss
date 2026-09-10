import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Boxes, ClipboardList, LayoutDashboard, Package } from 'lucide-react'
import { SnackProvider } from './components/ui'
import { subscribeAdminChanges } from './lib/api'
import { emitChange } from './lib/bus'
import DashboardScreen from './screens/DashboardScreen'
import ProductsScreen from './screens/ProductsScreen'
import ProductEditScreen from './screens/ProductEditScreen'
import OrdersScreen from './screens/OrdersScreen'
import OrderDetailScreen from './screens/OrderDetailScreen'
import InventoryScreen from './screens/InventoryScreen'
import ContentScreen from './screens/ContentScreen'
import DiscountsScreen from './screens/DiscountsScreen'
import SettingsScreen from './screens/SettingsScreen'
import SocialLinksScreen from './screens/SocialLinksScreen'

export type Tab = 'dashboard' | 'products' | 'orders' | 'inventory'

export type Screen =
  | { name: 'productEdit'; id?: string }
  | { name: 'orderDetail'; id: string }
  | { name: 'content' }
  | { name: 'discounts' }
  | { name: 'settings' }
  | { name: 'social' }

interface NavValue {
  tab: Tab
  setTab: (t: Tab) => void
  push: (s: Screen) => void
  pop: () => void
  inStack: boolean
}

const NavContext = createContext<NavValue | null>(null)

export function useNav(): NavValue {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav outside provider')
  return ctx
}

const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
]

/**
 * Private admin app: opens DIRECTLY on the dashboard — no login screen.
 * Access control is enforced server-side by the `x-sp-admin-key` header
 * (see ADMIN-KEY-SETUP.md); the app itself never asks for credentials.
 */
function Shell() {
  const [tab, setTabState] = useState<Tab>('dashboard')
  const [stack, setStack] = useState<Screen[]>([])

  const push = (s: Screen) => {
    setStack((st) => [...st, s])
    window.scrollTo(0, 0)
  }
  const pop = () => {
    setStack((st) => st.slice(0, -1))
    window.scrollTo(0, 0)
  }
  const setTab = (t: Tab) => {
    setStack([])
    setTabState(t)
    window.scrollTo(0, 0)
  }

  // realtime push from the shared Supabase backend + safety polling is in screens
  useEffect(() => subscribeAdminChanges((table) => emitChange(table)), [])

  // native lifecycle: splash, status bar, Android back button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    SplashScreen.hide().catch(() => undefined)
    StatusBar.setStyle({ style: Style.Light }).catch(() => undefined)
    StatusBar.setBackgroundColor({ color: '#050D1C' }).catch(() => undefined)
    let removed = false
    const sub = CapApp.addListener('backButton', () => {
      if (stack.length > 0) pop()
      else if (tab !== 'dashboard') setTab('dashboard')
      else CapApp.exitApp()
    })
    return () => {
      removed = true
      sub.then((h) => {
        if (!removed) h.remove()
      })
    }
  }, [stack.length, tab])

  const top = stack[stack.length - 1]

  let content: ReactNode
  if (top) {
    switch (top.name) {
      case 'productEdit':
        content = <ProductEditScreen key={top.id ?? 'new'} id={top.id} />
        break
      case 'orderDetail':
        content = <OrderDetailScreen id={top.id} />
        break
      case 'content':
        content = <ContentScreen />
        break
      case 'discounts':
        content = <DiscountsScreen />
        break
      case 'settings':
        content = <SettingsScreen />
        break
      case 'social':
        content = <SocialLinksScreen />
        break
    }
  } else {
    switch (tab) {
      case 'dashboard':
        content = <DashboardScreen />
        break
      case 'products':
        content = <ProductsScreen />
        break
      case 'orders':
        content = <OrdersScreen />
        break
      case 'inventory':
        content = <InventoryScreen />
        break
    }
  }

  return (
    <NavContext.Provider value={{ tab, setTab, push, pop, inStack: !!top }}>
      <div className="mx-auto min-h-[100vh] max-w-lg pb-24">{content}</div>
      {!top && (
        <nav className="fixed inset-x-0 bottom-0 z-50">
          <div className="mx-auto max-w-lg border-t border-navy-900/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
            <div className="grid grid-cols-4">
              {TABS.map((t) => {
                const active = tab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 transition-colors ${
                      active ? 'text-navy-900' : 'text-navy-900/40'
                    }`}
                  >
                    <t.icon size={21} strokeWidth={active ? 2.2 : 1.7} />
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em]">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </nav>
      )}
    </NavContext.Provider>
  )
}

export default function App() {
  return (
    <SnackProvider>
      <Shell />
    </SnackProvider>
  )
}
