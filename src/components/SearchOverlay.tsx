import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Search, X } from 'lucide-react'
import { useUI } from '../context/UIContext'
import { useLang } from '../i18n/LanguageContext'
import { useProductText } from '../i18n/useProductText'
import { searchProducts } from '../data/products'
import { useCatalog } from '../context/CatalogContext'
import { formatPrice } from '../lib/format'
import { Product } from '../lib/types'
import SmartImage from './SmartImage'

const POPULAR = ['Cargo', 'Wide leg', 'Black', 'Navy', 'Denim']

function ResultRow({ p, onGo }: { p: Product; onGo: (id: string) => void }) {
  const { name } = useProductText(p)
  return (
    <button
      onClick={() => onGo(p.id)}
      className="group flex items-center gap-4 border border-transparent p-3 text-left transition-colors duration-300 hover:border-white/15 hover:bg-white/5"
    >
      <SmartImage src={p.images[0]} alt={name} className="h-20 w-16 shrink-0 bg-navy-100/20" />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">{p.category.replace('-', ' ')}</p>
        <p className="mt-0.5 truncate font-display text-[14px] font-bold uppercase tracking-wide">{name}</p>
        <p className="mt-1 font-mono text-[12px] text-white/65">{formatPrice(p.price)}</p>
      </div>
      <ArrowRight size={16} className="shrink-0 text-white/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white rtl:rotate-180 rtl:group-hover:-translate-x-1" />
    </button>
  )
}

export default function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useUI()
  const { t } = useLang()
  const { products } = useCatalog()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const results = useMemo(() => searchProducts(products, query).slice(0, 6), [products, query])

  useEffect(() => {
    document.body.style.overflow = searchOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [searchOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSearchOpen])

  const close = () => {
    setSearchOpen(false)
    setQuery('')
  }

  const goProduct = (id: string) => {
    close()
    navigate(`/product/${id}`)
  }

  const goAll = () => {
    close()
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          className="fixed inset-0 z-[80] overflow-y-auto bg-navy-950/95 text-white backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container-sp py-8 md:py-14">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-white/50">{t('search.eyebrow')}</p>
              <button aria-label="Close" onClick={close} className="p-2 transition-transform duration-300 hover:rotate-90">
                <X size={26} strokeWidth={1.6} />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-4 border-b border-white/25 pb-4 focus-within:border-white">
              <Search size={22} strokeWidth={1.6} className="shrink-0 text-white/50" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) goAll()
                }}
                placeholder={t('search.overlayPh')}
                aria-label={t('search.eyebrow')}
                className="w-full bg-transparent font-display text-2xl font-bold uppercase tracking-wide placeholder:text-white/25 sm:text-4xl"
              />
            </div>

            {query.trim() === '' ? (
              <div className="mt-10">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">{t('search.popular')}</p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {POPULAR.map((p) => (
                    <button
                      key={p}
                      onClick={() => setQuery(p)}
                      className="border border-white/20 px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.18em] text-white/75 transition-colors duration-300 hover:border-white hover:bg-white hover:text-navy-950"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="mt-14 text-center">
                <p className="font-display text-2xl font-black uppercase tracking-tight">
                  {t('search.noTitle')} “{query}”
                </p>
                <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.2em] text-white/50">{t('search.noSub')}</p>
                <button onClick={() => setQuery('')} className="btn btn-outline-light mt-8">
                  {t('search.clear')}
                </button>
              </div>
            ) : (
              <div className="mt-8">
                <div className="grid gap-1 sm:grid-cols-2">
                  {results.map((p) => (
                    <ResultRow key={p.id} p={p} onGo={goProduct} />
                  ))}
                </div>
                <button
                  onClick={goAll}
                  className="group mt-6 inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.22em] text-white/70 transition-colors hover:text-white"
                >
                  {t('search.viewAll')} ({results.length})
                  <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </button>
              </div>
            )}
          </div>

          <div className="container-sp pb-8">
            <Link
              to="/shop"
              onClick={close}
              className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/40 transition-colors hover:text-white"
            >
              {t('search.browse')}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
