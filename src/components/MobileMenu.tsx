import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Search, ShoppingBag, User, X, Instagram } from 'lucide-react'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { useLang } from '../i18n/LanguageContext'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const LINKS = [
  { to: '/shop', key: 'nav.shop' },
  { to: '/new-arrivals', key: 'nav.new' },
  { to: '/collections', key: 'nav.collections' },
  { to: '/best-sellers', key: 'nav.best' },
  { to: '/about', key: 'nav.about' },
]

export default function MobileMenu() {
  const { menuOpen, setMenuOpen, setSearchOpen, setAccountOpen } = useUI()
  const { count, openDrawer } = useCart()
  const { t, lang, setLang } = useLang()
  const navigate = useNavigate()

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const go = (to: string) => {
    setMenuOpen(false)
    navigate(to)
  }

  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col bg-navy-950 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex h-[72px] items-center justify-between px-5">
            <span className="font-display text-[19px] font-black uppercase tracking-[0.06em]">Street&nbsp;Pants</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className="px-2 py-1 font-mono text-[12px] text-white/70"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                {lang === 'en' ? 'العربية' : 'EN'}
              </button>
              <button
                aria-label="Close"
                onClick={() => setMenuOpen(false)}
                className="p-2 transition-transform duration-300 hover:rotate-90"
              >
                <X size={26} strokeWidth={1.6} />
              </button>
            </div>
          </div>

          <nav className="flex flex-1 flex-col justify-center px-7">
            {LINKS.map((l, i) => (
              <motion.div
                key={l.to}
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06, duration: 0.55, ease: EASE }}
                className="border-b border-white/10"
              >
                <button onClick={() => go(l.to)} className="group flex w-full items-baseline gap-4 py-4 text-left">
                  <span className="font-mono text-[11px] text-white/35">0{i + 1}</span>
                  <span className="font-display text-[30px] font-black uppercase leading-none tracking-tight transition-colors duration-300 group-hover:text-navy-100">
                    {t(l.key)}
                  </span>
                </button>
              </motion.div>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="px-7 pb-9"
          >
            <div className="mb-7 flex gap-2">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setSearchOpen(true)
                }}
                className="flex h-12 flex-1 items-center justify-center gap-2 border border-white/20 font-display text-[11px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-white hover:text-navy-950"
              >
                <Search size={15} /> {t('nav.search')}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setAccountOpen(true)
                }}
                className="flex h-12 flex-1 items-center justify-center gap-2 border border-white/20 font-display text-[11px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-white hover:text-navy-950"
              >
                <User size={15} /> {t('nav.account')}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  openDrawer()
                }}
                className="flex h-12 flex-1 items-center justify-center gap-2 border border-white/20 font-display text-[11px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-white hover:text-navy-950"
              >
                <ShoppingBag size={15} /> {t('nav.cart')} {count > 0 ? `(${count})` : ''}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <a
                  aria-label="Instagram"
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/60 transition-colors hover:text-white"
                >
                  <Instagram size={18} />
                </a>
                <Link
                  to="/collections"
                  onClick={() => setMenuOpen(false)}
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/60 transition-colors hover:text-white"
                >
                  City Uniform / 01
                </Link>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">Cairo — EG</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
