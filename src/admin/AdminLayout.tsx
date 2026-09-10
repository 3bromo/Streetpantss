import { useState } from 'react'
import { NavLink, Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  ShoppingBag,
  Tags,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Share2,
  Images as ImagesIcon,
  Mail as MailIcon,
  LogOut,
  Store,
  Menu,
  X,
} from 'lucide-react'
import { useAdminSession } from './useAdminSession'
import { Spinner } from './ui'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/inventory', label: 'Inventory', icon: ShoppingBag },
  { to: '/admin/discounts', label: 'Discounts', icon: Tags },
  { to: '/admin/content', label: 'Website Content', icon: ImageIcon },
  { to: '/admin/social', label: 'Social Links', icon: Share2 },
  { to: '/admin/images', label: 'Website Images', icon: ImagesIcon },
  { to: '/admin/notifications', label: 'Order Emails', icon: MailIcon },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

export default function AdminLayout() {
  const { session, ready, backend } = useAdminSession()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!ready)
    return (
      <div className="flex min-h-[100vh] items-center justify-center bg-soft">
        <Spinner />
      </div>
    )
  if (!session) return <Navigate to="/admin/login" replace />

  const logout = async () => {
    await backend.signOut()
    navigate('/admin/login')
  }

  const nav = (
    <nav className="flex-1 space-y-1 px-4 py-6">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-4 py-3 font-display text-[12px] font-bold uppercase tracking-[0.14em] transition-colors duration-200 ${
              isActive ? 'bg-[#ECEBE7] text-ink' : 'text-ink/55 hover:bg-soft hover:text-ink'
            }`
          }
        >
          <item.icon size={16} strokeWidth={1.8} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  const sidebarInner = (
    <>
      <div className="flex h-[68px] items-center justify-between px-6">
        <Link to="/" className="font-display text-[17px] font-black uppercase tracking-[0.06em] text-ink">
          Street Pants
        </Link>
        <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-ink/40">Admin</span>
      </div>
      {nav}
      <div className="border-t border-ink/10 p-4">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 font-display text-[12px] font-bold uppercase tracking-[0.14em] text-ink/55 transition-colors hover:bg-soft hover:text-ink"
        >
          <Store size={16} strokeWidth={1.8} /> View Store
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 font-display text-[12px] font-bold uppercase tracking-[0.14em] text-ink/55 transition-colors hover:bg-soft hover:text-ink"
        >
          <LogOut size={16} strokeWidth={1.8} /> Sign Out
        </button>
        <p className="truncate px-4 pt-2 font-mono text-[10px] text-ink/35">{session.email}</p>
      </div>
    </>
  )

  return (
    <div className="flex min-h-[100vh] bg-soft">
      <aside className="sticky top-0 hidden h-[100vh] w-64 shrink-0 flex-col border-r border-ink/10 bg-white lg:flex">
        {sidebarInner}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white rtl:left-auto rtl:right-0">
            <button
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-5 p-1 text-ink/50 rtl:right-auto rtl:left-4"
            >
              <X size={22} />
            </button>
            {sidebarInner}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-ink/10 bg-white/95 px-5 backdrop-blur lg:px-8">
          <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="p-1 text-ink lg:hidden">
            <Menu size={24} strokeWidth={1.8} />
          </button>
          <p className="hidden font-mono text-[11px] uppercase tracking-[0.22em] text-ink/45 lg:block">
            Store Management
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/45 lg:hidden">Admin</p>
        </header>

        <main className="p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
