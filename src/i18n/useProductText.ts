import { useLang } from './LanguageContext'
import { useCatalog } from '../context/CatalogContext'
import { Product } from '../lib/types'

/** Arabic overrides for DB content are stored in site_settings.translationsAr */
export function useProductText(p: Product): { name: string; description: string } {
  const { lang } = useLang()
  const { settings } = useCatalog()
  if (lang !== 'ar') return { name: p.name, description: p.description }
  const map = (settings as unknown as Record<string, any>)?.translationsAr?.products as
    | Record<string, { name?: string; description?: string }>
    | undefined
  const e = map?.[p.id]
  return { name: e?.name || p.name, description: e?.description || p.description }
}
