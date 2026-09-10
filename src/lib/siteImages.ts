/**
 * Manageable website images. Values are stored in the EXISTING site_settings
 * table under the `siteImages` key (jsonb) and reference URLs in the EXISTING
 * Supabase Storage bucket (`images`) or bundled defaults. Missing values fall
 * back to the original default images, so nothing breaks and no image is lost.
 */
export interface SiteImages {
  story?: string
  newArrivals?: string
  categories?: Record<string, string>
  about?: string[]
}

export const IMAGE_DEFAULTS = {
  heroNote: 'hero',
  story: '/images/about-1.jpg',
  newArrivals: '/images/editorial-2.jpg',
  categories: {
    'wide-leg': '/images/col-wideleg.jpg',
    'street-pants': '/images/col-cargo.jpg',
    'old-money': '/images/col-essentials.jpg',
  } as Record<string, string>,
}

/**
 * Cache-busting version stamp. Appended ONLY when an image is replaced in the
 * admin panel (never hard-coded): `url?v=<timestamp>`. Strips any previous
 * version first so repeated replacements always produce a fresh URL.
 */
export function withVersion(url: string): string {
  if (!url) return url
  const base = url.split('?')[0]
  return base + '?v=' + Date.now()
}

export function getSiteImages(settings: unknown): SiteImages {
  const s = (settings as Record<string, unknown>)?.siteImages
  return (s as SiteImages) ?? {}
}

export function categoryImage(settings: unknown, slug: string): string {
  const custom = getSiteImages(settings).categories?.[slug]
  return custom || IMAGE_DEFAULTS.categories[slug] || '/images/col-cargo.jpg'
}

export function storyImage(settings: unknown): string {
  return getSiteImages(settings).story || IMAGE_DEFAULTS.story
}

export function newArrivalsImage(settings: unknown): string {
  return getSiteImages(settings).newArrivals || IMAGE_DEFAULTS.newArrivals
}

export function aboutImages(settings: unknown): string[] {
  return getSiteImages(settings).about ?? []
}
