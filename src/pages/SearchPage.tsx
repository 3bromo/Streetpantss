import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import ProductGrid from '../components/ProductGrid'
import Reveal from '../components/Reveal'
import { useLang } from '../i18n/LanguageContext'
import { searchProducts } from '../data/products'
import { useCatalog } from '../context/CatalogContext'

const POPULAR = ['Cargo', 'Wide leg', 'Black', 'Navy', 'Denim', 'Relaxed']

export default function SearchPage() {
  usePageTitle('Search')
  const { t } = useLang()
  const { products } = useCatalog()
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initial)

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  const results = useMemo(() => searchProducts(products, query), [products, query])

  const update = (value: string) => {
    setQuery(value)
    setSearchParams(value ? { q: value } : {}, { replace: true })
  }

  return (
    <div className="min-h-[70vh] bg-soft">
      <section className="border-b border-navy-900/10 bg-white">
        <div className="container-sp py-14 md:py-20">
          <Reveal>
            <p className="eyebrow text-navy-800/60">{t('search.eyebrow')}</p>
            <h1 className="mt-3 font-display text-5xl font-black uppercase leading-[0.92] tracking-tight text-navy-950 sm:text-6xl">
              {t('search.title')}
            </h1>
            <div className="mt-8 flex max-w-2xl items-center gap-4 border-b-2 border-navy-950 pb-3">
              <Search size={22} strokeWidth={1.6} className="shrink-0 text-navy-900/50" />
              <input
                autoFocus
                value={query}
                onChange={(e) => update(e.target.value)}
                placeholder={t('search.ph')}
                aria-label={t('search.eyebrow')}
                className="w-full bg-transparent font-display text-xl font-bold uppercase tracking-wide text-navy-950 placeholder:text-navy-900/25"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <div className="container-sp py-12 md:py-16">
        {query.trim() === '' ? (
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-navy-900/50">{t('search.popular')}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {POPULAR.map((p) => (
                <button
                  key={p}
                  onClick={() => update(p)}
                  className="border border-navy-900/15 bg-white px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.16em] text-navy-900 transition-colors duration-300 hover:border-navy-900 hover:bg-navy-900 hover:text-white"
                >
                  {p}
                </button>
              ))}
            </div>
          </Reveal>
        ) : results.length === 0 ? (
          <Reveal className="flex flex-col items-center border border-navy-900/10 bg-white px-6 py-24 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-navy-900/15 text-navy-900/40">
              <Search size={24} strokeWidth={1.5} />
            </span>
            <p className="mt-6 font-display text-2xl font-black uppercase tracking-tight text-navy-950">
              {t('search.noTitle')} “{query}”
            </p>
            <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink/55">{t('search.noSub')}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button onClick={() => update('')} className="btn btn-outline-dark btn-sm">
                {t('search.clear')}
              </button>
              <Link to="/shop" className="btn btn-dark btn-sm">
                {t('search.all')}
              </Link>
            </div>
          </Reveal>
        ) : (
          <>
            <p className="mb-8 font-mono text-[12px] uppercase tracking-[0.2em] text-navy-900/55">
              {results.length} {results.length === 1 ? t('search.result') : t('search.results')} “{query}”
            </p>
            <Reveal>
              <ProductGrid products={results} />
            </Reveal>
          </>
        )}
      </div>
    </div>
  )
}
