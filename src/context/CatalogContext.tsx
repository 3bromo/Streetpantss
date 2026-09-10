import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { Product, SiteSettings } from '../lib/types'
import { getBackend } from '../lib/backend'
import { DEFAULT_SETTINGS } from '../lib/backend/defaults'
import { products as fallbackProducts } from '../data/products'

interface CatalogValue {
  loading: boolean
  /** Published products — what the storefront shows. */
  products: Product[]
  /** Everything, including unpublished — for admin + cart lookups. */
  allProducts: Product[]
  settings: SiteSettings
  getProduct: (id: string) => Product | undefined
  refresh: () => Promise<void>
}

const CatalogContext = createContext<CatalogValue | null>(null)

const CACHE_KEY = 'sp-catalog-cache-v1'

interface CacheShape {
  settings: SiteSettings
  allProducts: Product[]
}

function readCache(): CacheShape | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheShape
    if (!parsed || !parsed.settings || !Array.isArray(parsed.allProducts)) return null
    return parsed
  } catch {
    return null
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const backend = getBackend()
  const cached = readCache()
  const [loading, setLoading] = useState(true)
  // First paint uses the LAST KNOWN-GOOD data (localStorage) so the latest
  // image URLs render immediately — no stale/default flash while the live
  // fetch resolves in the background.
  const [allProducts, setAllProducts] = useState<Product[]>(
    cached?.allProducts?.length ? cached.allProducts : fallbackProducts.filter((p) => p.published),
  )
  const [settings, setSettings] = useState<SiteSettings>(cached?.settings ?? DEFAULT_SETTINGS)

  const refresh = useCallback(async () => {
    try {
      const [list, s] = await Promise.all([
        backend.listProducts({ includeUnpublished: true }),
        backend.getSettings(),
      ])
      const nextSettings = { ...DEFAULT_SETTINGS, ...s }
      setAllProducts(list)
      setSettings(nextSettings)
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ settings: nextSettings, allProducts: list }))
      } catch {
        /* cache is best-effort */
      }
    } catch {
      /* keep cached/fallback data so the store never breaks */
    } finally {
      setLoading(false)
    }
  }, [backend])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Live sync: admin changes (incl. image replacements) appear immediately
  // while the site is open — no manual refresh, no polling.
  useEffect(() => backend.subscribeChanges(() => refresh()), [backend, refresh])

  const products = allProducts.filter((p) => p.published)
  const getProduct = useCallback((id: string) => allProducts.find((p) => p.id === id), [allProducts])

  return (
    <CatalogContext.Provider
      value={{ loading, products, allProducts, settings, getProduct, refresh }}
    >
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog(): CatalogValue {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}
