import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import PageHeader from '../components/PageHeader'
import Filters, { EMPTY_FILTERS, FilterState, PRICE_RANGES } from '../components/Filters'
import ProductGrid from '../components/ProductGrid'
import Reveal from '../components/Reveal'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'
import { getCollection } from '../data/collections'
import { canonCategory, canonSize, displayCategory, matchesCategory, sizeLabel, suggestHex } from '../lib/categories'

const SORT_IDS = ['featured', 'newest', 'price-asc', 'price-desc'] as const

export default function ShopPage() {
  usePageTitle('Shop All')
  const { products } = useCatalog()
  const { t, lang } = useLang()
  const sortLabel: Record<string, string> = {
    featured: t('sort.featured'),
    newest: t('sort.newest'),
    'price-asc': t('sort.asc'),
    'price-desc': t('sort.desc'),
  }
  const [searchParams] = useSearchParams()
  const catParam = searchParams.get('category')
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS, cats: catParam ? [canonCategory(catParam)] : [] })
  const [sort, setSort] = useState('featured')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setFilters({ ...EMPTY_FILTERS, cats: catParam ? [canonCategory(catParam)] : [] })
  }, [catParam])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  /** Counts per canonical category. */
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const p of products) {
      const slug = canonCategory(p.category)
      c[slug] = (c[slug] ?? 0) + 1
    }
    return c
  }, [products])

  /** Dynamic color list — colors are fully admin-managed, derived from the live catalog. */
  const filterColors = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of products) for (const c of p.colors) if (c.name && !map.has(c.name)) map.set(c.name, c.hex || suggestHex(c.name))
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }))
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (filters.cats.length && !filters.cats.some((c) => matchesCategory(p.category, c))) return false
      if (filters.sizes.length && !p.sizes.some((s) => filters.sizes.includes(canonSize(s)))) return false
      if (filters.colors.length && !p.colors.some((c) => filters.colors.includes(c.name))) return false
      if (filters.prices.length) {
        const inRange = PRICE_RANGES.some(
          (r) => filters.prices.includes(r.id) && p.price >= r.min && p.price <= r.max,
        )
        if (!inRange) return false
      }
      return true
    })
    switch (sort) {
      case 'newest':
        list = [...list].sort((a, b) => b.addedAt - a.addedAt)
        break
      case 'price-asc':
        list = [...list].sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list = [...list].sort((a, b) => b.price - a.price)
        break
      default:
        list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured))
    }
    return list
  }, [products, filters, sort])

  const toggle = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const arr = prev[key]
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] }
    })
  }

  const clearAll = () => setFilters(EMPTY_FILTERS)
  const activeCount = filters.cats.length + filters.sizes.length + filters.colors.length + filters.prices.length
  const activeCollection = filters.cats.length === 1 ? getCollection(canonCategory(filters.cats[0])) : undefined

  const chips: { key: keyof FilterState; value: string; label: string }[] = [
    ...filters.cats.map((v) => ({ key: 'cats' as const, value: v, label: displayCategory(v, lang) })),
    ...filters.sizes.map((v) => ({ key: 'sizes' as const, value: v, label: `${t('filter.size')} ${sizeLabel(v, lang)}` })),
    ...filters.colors.map((v) => ({ key: 'colors' as const, value: v, label: v })),
    ...filters.prices.map((v) => ({
      key: 'prices' as const,
      value: v,
      label: PRICE_RANGES.find((r) => r.id === v)?.label ?? v,
    })),
  ]

  return (
    <div className="bg-soft">
      <PageHeader
        eyebrow={activeCollection ? `Collection — ${activeCollection.tagline}` : t('shop.eyebrow')}
        title={activeCollection ? displayCategory(activeCollection.slug, lang) : t('shop.title')}
        sub={activeCollection ? activeCollection.description : t('shop.sub')}
      />

      <div className="container-sp py-10 md:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-navy-900/55">
            {filtered.length} {filtered.length === 1 ? t('shop.style') : t('shop.styles')}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-[46px] items-center gap-2 border border-navy-900/15 bg-white px-4 font-display text-[12px] font-bold uppercase tracking-[0.16em] text-navy-950 transition-colors hover:border-navy-900 lg:hidden"
            >
              <SlidersHorizontal size={15} /> {t('shop.filters')} {activeCount > 0 ? `(${activeCount})` : ''}
            </button>
            <div className="relative">
              <select
                aria-label="Sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-[46px] appearance-none border border-navy-900/15 bg-white pl-4 pr-10 font-mono text-[12px] uppercase tracking-[0.12em] text-navy-950 transition-colors hover:border-navy-900"
              >
                {SORT_IDS.map((s) => (
                  <option key={s} value={s}>
                    {sortLabel[s]}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-900/50 rtl:right-auto rtl:left-3.5 rtl:-scale-x-100" />
            </div>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button
                key={`${c.key}-${c.value}`}
                onClick={() => toggle(c.key, c.value)}
                className="group flex items-center gap-2 border border-navy-900/15 bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-950 transition-colors hover:border-navy-900"
              >
                {c.label}
                <X size={12} className="text-navy-900/40 transition-colors group-hover:text-navy-900" />
              </button>
            ))}
            <button
              onClick={clearAll}
              className="px-2 font-mono text-[11px] uppercase tracking-[0.18em] text-navy-900/55 underline-offset-4 hover:text-navy-900 hover:underline"
            >
              {t('shop.clearAll')}
            </button>
          </div>
        )}

        <div className="flex gap-12">
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-24">
              <Filters state={filters} counts={counts} colors={filterColors} onToggle={toggle} onClear={clearAll} activeCount={activeCount} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {filtered.length === 0 ? (
              <Reveal className="flex flex-col items-center border border-navy-900/10 bg-white px-6 py-24 text-center">
                <p className="font-display text-2xl font-black uppercase tracking-tight text-navy-950">
                  {t('shop.empty')}
                </p>
                <p className="mt-2 max-w-sm text-[14px] text-ink/55">{t('shop.emptySub')}</p>
                <button onClick={clearAll} className="btn btn-dark mt-7">
                  {t('shop.clearAll')}
                </button>
              </Reveal>
            ) : (
              <Reveal>
                <ProductGrid products={filtered} cols={3} />
              </Reveal>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[75] bg-navy-950/60 backdrop-blur-[2px] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-0 z-[76] flex h-full w-full max-w-sm flex-col bg-white lg:hidden rtl:left-auto rtl:right-0"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between border-b border-navy-900/10 px-6 py-5">
                <p className="font-display text-lg font-black uppercase tracking-tight">{t('shop.filters')}</p>
                <button aria-label="Close" onClick={() => setMobileOpen(false)} className="p-1">
                  <X size={24} strokeWidth={1.6} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <Filters state={filters} counts={counts} colors={filterColors} onToggle={toggle} onClear={clearAll} activeCount={activeCount} />
              </div>
              <div className="border-t border-navy-900/10 p-5">
                <button onClick={() => setMobileOpen(false)} className="btn btn-dark w-full">
                  {filtered.length} {filtered.length === 1 ? t('shop.style') : t('shop.styles')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
