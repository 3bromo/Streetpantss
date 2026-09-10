// ============================================================================
// THE FINAL CATEGORY / SIZE / COLOR SYSTEM
//
// Categories — exactly three, everywhere (storefront + admin + filters):
//   Wide Leg / Street Pants / Old Money
// Sizes — exactly four selectable letter sizes: M, L, XL, 2XL
//   displayed exactly as "M / L / XL / 2XL" everywhere (both languages).
//   (S belongs to the old system: kept display-only for historical orders.)
// Colors — fully admin-managed. There is NO hardcoded color list anymore;
//   the admin types any color name and a hex is suggested automatically.
//
// Legacy values coming from the old database (essentials/cargo/..., 28..36,
// Deep Navy/Graphite/...) are canon-mapped here defensively so the new
// system shows up immediately — even before the migration SQL is run.
// ============================================================================

export const NEW_CATEGORIES = [
  { slug: 'wide-leg', en: 'Wide Leg', ar: 'وايد ليج' },
  { slug: 'street-pants', en: 'Street Pants', ar: 'ستريت بانتس' },
  { slug: 'old-money', en: 'Old Money', ar: 'أولد موني' },
] as const

export type NewCategorySlug = (typeof NEW_CATEGORIES)[number]['slug']

/** Canonical sizes — the ONLY selectable sizes: M, L, XL, 2XL. */
export const SIZE_KEYS = ['M', 'L', 'XL', '2XL'] as const
export type SizeKey = (typeof SIZE_KEYS)[number]

/** Short labels everywhere (storefront, admin, cart, checkout, orders). */
export const SIZE_LABELS: Record<string, { en: string; ar: string }> = {
  M: { en: 'M', ar: 'M' },
  L: { en: 'L', ar: 'L' },
  XL: { en: 'XL', ar: 'XL' },
  '2XL': { en: '2XL', ar: '2XL' },
  // Display-only for historical data (old orders/variants) — NOT selectable.
  S: { en: 'S', ar: 'S' },
}

/** Legacy numeric waist sizes → canonical letters ('36' kept as display-only 2XL). */
const LEGACY_SIZE: Record<string, string> = {
  '28': 'S',
  '30': 'M',
  '32': 'L',
  '34': 'XL',
  '36': '2XL',
}

const SIZE_WORDS: Record<string, string> = {
  small: 'S',
  medium: 'M',
  large: 'L',
  xl: 'XL',
  '2xl': '2XL',
  xxl: '2XL',
}

/** Normalize ANY incoming size value (legacy numbers, words, letters). */
export function canonSize(size: string): string {
  const k = String(size ?? '').trim()
  if (SIZE_LABELS[k]) return k
  if (LEGACY_SIZE[k]) return LEGACY_SIZE[k]
  const word = SIZE_WORDS[k.toLowerCase()]
  if (word) return word
  return 'M'
}

/** Display label for a size — short letters everywhere (S / M / L / XL). */
export function sizeLabel(size: string, lang: 'en' | 'ar' = 'en'): string {
  const key = canonSize(size)
  const entry = SIZE_LABELS[key]
  return entry ? entry[lang] : key
}

/** Legacy category slugs → the three canonical categories. */
const LEGACY_CATEGORY: Record<string, NewCategorySlug> = {
  essentials: 'street-pants',
  cargo: 'street-pants',
  utility: 'street-pants',
  denim: 'street-pants',
  'street-pants': 'street-pants',
  streetpants: 'street-pants',
  'wide-leg': 'wide-leg',
  wideleg: 'wide-leg',
  'wide leg': 'wide-leg',
  'old-money': 'old-money',
  oldmoney: 'old-money',
  'old money': 'old-money',
}

export function canonCategory(cat: string): NewCategorySlug {
  const k = String(cat ?? '').trim().toLowerCase()
  return LEGACY_CATEGORY[k] ?? 'street-pants'
}

/** True when a product/category value belongs to the given canonical category. */
export function matchesCategory(productCategory: string, categorySlug: string): boolean {
  return canonCategory(productCategory) === canonCategory(categorySlug)
}

/** Localized display name for a category value. */
export function displayCategory(cat: string, lang: 'en' | 'ar' = 'en'): string {
  const slug = canonCategory(cat)
  const entry = NEW_CATEGORIES.find((c) => c.slug === slug) ?? NEW_CATEGORIES[1]
  return lang === 'ar' ? entry.ar : entry.en
}

/** Legacy fixed color names → simple admin-friendly names. */
const LEGACY_COLOR: Record<string, string> = {
  'Deep Navy': 'Navy',
  Graphite: 'Dark Grey',
  Stone: 'Beige',
  Indigo: 'Dark Blue',
  Cream: 'Off White',
}

export function canonColor(name: string): string {
  const k = String(name ?? '').trim()
  return LEGACY_COLOR[k] ?? k
}

/**
 * Known hex suggestions for common color names — used ONLY as a default when
 * the admin types a color without choosing a swatch. Nothing here restricts
 * what colors can be created.
 */
export const COLOR_HEX_SUGGESTIONS: Record<string, string> = {
  black: '#050505',
  white: '#F5F5F5',
  'off white': '#EDEAE2',
  beige: '#D9CBB0',
  brown: '#6B4A2F',
  'dark brown': '#4A3221',
  navy: '#13294B',
  blue: '#1F3B73',
  'dark blue': '#152238',
  grey: '#8A8A8A',
  gray: '#8A8A8A',
  'dark grey': '#3B4252',
  'light grey': '#C7C7C7',
  green: '#3E5641',
  olive: '#5B5E3C',
  khaki: '#B5A580',
  camel: '#B08D57',
  burgundy: '#6D2032',
  red: '#8E1F2F',
}

/** Suggest a hex for any color name (falls back to a neutral tone). */
export function suggestHex(name: string): string {
  const key = String(name ?? '').trim().toLowerCase()
  return COLOR_HEX_SUGGESTIONS[key] ?? '#B8B2A7'
}

/**
 * Images for a specific color of a product.
 * Per-color images are stored in product_images.alt = color name.
 * Falls back to the product's main images when a color has none assigned.
 */
export function colorImages(
  product: { images: string[]; colorImages?: Record<string, string[]> },
  color?: string | null,
): string[] {
  if (!color) return product.images
  const key = canonColor(color)
  const map = product.colorImages ?? {}
  const direct = map[key] ?? map[color]
  if (direct && direct.length) return direct
  // tolerant match (case-insensitive)
  const found = Object.entries(map).find(([k]) => canonColor(k).toLowerCase() === key.toLowerCase())
  if (found && found[1].length) return found[1]
  return product.images
}
