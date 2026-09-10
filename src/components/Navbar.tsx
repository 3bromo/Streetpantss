import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Search, ShoppingBag, User } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useLang } from '../i18n/LanguageContext'

const NAV = [
  { to: '/shop', key: 'nav.shop' },
  { to: '/new-arrivals', key: 'nav.new' },
  { to: '/collections', key: 'nav.collections' },
  { to: '/best-sellers', key: 'nav.best' },
  { to: '/about', key: 'nav.about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { count, openDrawer } = useCart()
  const { setSearchOpen, setMenuOpen, setAccountOpen } = useUI()
  const { t, lang, setLang } = useLang()
  const isHome = pathname === '/'
  const transparent = isHome && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        transparent
          ? 'bg-transparent text-ink'
          : 'border-b border-ink/10 bg-white/95 text-ink backdrop-blur-md'
      }`}
    >
      <div className="container-sp flex h-[72px] items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <button
            aria-label={t('nav.menu')}
            onClick={() => setMenuOpen(true)}
            className="-ml-1 p-1 transition-transform duration-300 hover:scale-110 lg:hidden"
          >
            <Menu size={24} strokeWidth={1.8} />
          </button>
          <Link to="/" className="font-display text-[19px] font-black uppercase leading-none tracking-[0.06em]">
            Street&nbsp;Pants
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link transition-colors duration-300 ${isActive ? 'active' : ''} ${
                  transparent ? 'text-ink/70 hover:text-ink' : 'text-ink/70 hover:text-ink'
                }`
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1.5">
          <button
            aria-label="Switch language"
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className={`px-2 py-1 font-mono text-[11px] tracking-[0.08em] transition-opacity hover:opacity-70 ${
              lang === 'ar' ? 'font-bold' : ''
            }`}
            style={{ fontFamily: lang === 'en' ? "'Cairo', sans-serif" : undefined }}
          >
            {lang === 'en' ? 'العربية' : 'EN'}
          </button>
          <button
            aria-label={t('nav.search')}
            onClick={() => setSearchOpen(true)}
            className="p-2 transition-transform duration-300 hover:scale-110"
          >
            <Search size={20} strokeWidth={1.8} />
          </button>
          <button
            aria-label={t('nav.account')}
            onClick={() => setAccountOpen(true)}
            className="hidden p-2 transition-transform duration-300 hover:scale-110 sm:block"
          >
            <User size={20} strokeWidth={1.8} />
          </button>
          <button
            aria-label={t('nav.cart')}
            onClick={openDrawer}
            className="relative p-2 transition-transform duration-300 hover:scale-110"
          >
            <ShoppingBag size={20} strokeWidth={1.8} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-navy-800 px-1 font-mono text-[10px] font-medium text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
