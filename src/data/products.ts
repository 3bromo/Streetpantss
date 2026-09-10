import { Product, ProductColor, ProductVariant } from '../lib/types'
import { SIZE_KEYS } from '../lib/categories'

/** THE FINAL size system — S, M, L, XL, 2XL only. */
const SIZES = [...SIZE_KEYS]

export const BLACK = { name: 'Black', hex: '#050505' }
export const DARK_BROWN = { name: 'Dark Brown', hex: '#4A3221' }
export const BEIGE = { name: 'Beige', hex: '#D9CBB0' }
export const NAVY = { name: 'Navy', hex: '#13294B' }
export const OFF_WHITE = { name: 'Off White', hex: '#EDEAE2' }
export const DARK_GREY = { name: 'Dark Grey', hex: '#3B4252' }
export const DARK_BLUE = { name: 'Dark Blue', hex: '#152238' }

/** Build a variant matrix (color × size). `low` / `out` take "Color|Size" keys. */
export function buildVariants(
  colors: ProductColor[],
  sizes: string[] = SIZES,
  low: string[] = [],
  out: string[] = [],
): ProductVariant[] {
  const res: ProductVariant[] = []
  for (const c of colors) {
    for (const s of sizes) {
      const key = `${c.name}|${s}`
      res.push({ color: c.name, size: s, stock: out.includes(key) ? 0 : low.includes(key) ? 3 : 12 })
    }
  }
  return res
}

export const products: Product[] = [
  {
    id: 'street-cargo-pants',
    name: 'Street Cargo Pants',
    price: 1499,
    salePrice: null,
    sku: 'SP-STP-001',
    category: 'street-pants',
    description:
      'Our signature street pant, rebuilt for the city. Heavyweight cotton twill with eight utility pockets, a tapered leg and adjustable ankle cuffs. Made to move, built to last.',
    details: [
      'Heavyweight 310 GSM cotton twill',
      'Eight-pocket utility construction',
      'Adjustable ankle cuffs with snap closure',
      'YKK matte hardware throughout',
      'Tapered leg with articulated knees',
    ],
    material: '98% Cotton, 2% Elastane — heavyweight twill, 310 GSM.',
    fit: 'Relaxed through the thigh, tapered from the knee. True to size.',
    care: 'Machine wash cold, inside out. Do not bleach. Tumble dry low. Iron on reverse.',
    colors: [NAVY, BLACK, DARK_GREY],
    sizes: SIZES,
    images: ['/images/col-cargo.jpg', '/images/prod-back.svg', '/images/detail-fabric.jpg', '/images/editorial-1.jpg'],
    isNew: true,
    isBestSeller: true,
    featured: true,
    published: true,
    variants: buildVariants([NAVY, BLACK, DARK_GREY], SIZES, ['Navy|S', 'Black|2XL']),
    addedAt: 10,
    keywords: ['cargo', 'street pants', 'pockets', 'tapered', 'street', 'navy'],
  },
  {
    id: 'signature-wide-leg-pants',
    name: 'Signature Wide Leg Pants',
    price: 1699,
    salePrice: null,
    sku: 'SP-WDL-002',
    category: 'wide-leg',
    description:
      'The silhouette of the season. A high-rise, floor-skimming wide leg cut from fluid heavyweight twill that moves like it has somewhere to be.',
    details: [
      'High rise with extended waistband',
      'Floor-skimming wide leg',
      'Fluid 290 GSM twill with soft drape',
      'Hidden side-seam pockets',
      'Single pleat front',
    ],
    material: '72% Cotton, 28% Lyocell — fluid twill, 290 GSM.',
    fit: 'High rise, wide through the leg with a floor-length hem. Size down between sizes.',
    care: 'Machine wash cold. Hang dry. Warm iron on reverse to keep the crease sharp.',
    colors: [BEIGE, NAVY],
    sizes: SIZES,
    images: ['/images/col-wideleg.jpg', '/images/editorial-1.jpg', '/images/detail-fabric.jpg'],
    isNew: true,
    isBestSeller: false,
    featured: true,
    published: true,
    variants: buildVariants([BEIGE, NAVY], SIZES, ['Beige|M', 'Beige|XL'], ['Navy|2XL']),
    addedAt: 9,
    keywords: ['wide leg', 'wide', 'flowy', 'high rise', 'pleat', 'beige'],
  },
  {
    id: 'essential-black-pants',
    name: 'Essential Black Pants',
    price: 899,
    salePrice: 799,
    sku: 'SP-OMN-003',
    category: 'old-money',
    description:
      'The pair you reach for every day. Matte stretch twill, a clean straight leg and zero noise. The foundation of every rotation.',
    details: [
      'Matte stretch twill, 260 GSM',
      'Clean straight leg',
      'Invisible zip pocket at the back',
      'Soft brushed waistband lining',
      'No external branding',
    ],
    material: '97% Cotton, 3% Elastane — matte stretch twill, 260 GSM.',
    fit: 'Mid rise, straight leg. True to size.',
    care: 'Machine wash cold, inside out. Do not bleach. Iron on low.',
    colors: [BLACK, DARK_GREY],
    sizes: SIZES,
    images: ['/images/col-essentials.jpg', '/images/prod-straight.svg', '/images/detail-zoom.svg'],
    isNew: false,
    isBestSeller: true,
    featured: true,
    published: true,
    variants: buildVariants([BLACK, DARK_GREY], SIZES),
    addedAt: 8,
    keywords: ['black', 'essential', 'straight', 'everyday', 'minimal', 'old money'],
  },
  {
    id: 'navy-utility-pants',
    name: 'Navy Street Utility Pants',
    price: 1499,
    salePrice: null,
    sku: 'SP-STP-004',
    category: 'street-pants',
    description:
      'Built like equipment. Ripstop weave, reinforced knees and a webbing belt system — utility that actually works, cut clean enough for the city.',
    details: [
      'Navy ripstop cotton blend',
      'Reinforced double-layer knees',
      'Integrated webbing belt',
      'Six-pocket utility layout',
      'Bar-tacked stress points',
    ],
    material: '65% Cotton, 35% Nylon — ripstop weave, 280 GSM.',
    fit: 'Relaxed straight with a gusseted crotch for movement. True to size.',
    care: 'Machine wash cold. Do not tumble dry. Hang dry away from direct sun.',
    colors: [NAVY, BLACK],
    sizes: SIZES,
    images: ['/images/col-utility.svg', '/images/night.svg', '/images/detail-fabric.jpg'],
    isNew: false,
    isBestSeller: true,
    featured: true,
    published: true,
    variants: buildVariants([NAVY, BLACK], SIZES, ['Navy|XL']),
    addedAt: 7,
    keywords: ['utility', 'ripstop', 'navy', 'technical', 'belt', 'street'],
  },
  {
    id: 'relaxed-fit-pants',
    name: 'Relaxed Fit Pants',
    price: 1099,
    salePrice: null,
    sku: 'SP-OMN-005',
    category: 'old-money',
    description:
      'Ease, engineered. A relaxed block with an elastic back waist and a gentle taper — comfort without losing the line.',
    details: [
      'Soft brushed cotton twill',
      'Elastic back waistband',
      'Relaxed thigh, gentle taper',
      'Deep front pockets',
      'Drawcord with matte tips',
    ],
    material: '100% Cotton — brushed twill, 250 GSM.',
    fit: 'Relaxed through the seat and thigh with a tapered hem. True to size.',
    care: 'Machine wash cold. Tumble dry low. Do not iron the drawcord.',
    colors: [OFF_WHITE, BLACK, NAVY],
    sizes: SIZES,
    images: ['/images/prod-relaxed.svg', '/images/col-essentials.jpg', '/images/detail-zoom.svg'],
    isNew: false,
    isBestSeller: false,
    featured: false,
    published: true,
    variants: buildVariants([OFF_WHITE, BLACK, NAVY], SIZES),
    addedAt: 6,
    keywords: ['relaxed', 'comfort', 'elastic', 'off white', 'everyday', 'old money'],
  },
  {
    id: 'urban-cargo',
    name: 'Urban Cargo',
    price: 1299,
    salePrice: null,
    sku: 'SP-STP-006',
    category: 'street-pants',
    description:
      'The cargo, sharpened. A slimmer block with hidden zip pockets and clean lines — utility energy with a quieter finish.',
    details: [
      'Slim cargo block',
      'Hidden zip cargo pockets',
      'Lightweight 270 GSM twill',
      'Matte snap closures',
      'Pre-washed for zero shrinkage',
    ],
    material: '98% Cotton, 2% Elastane — washed twill, 270 GSM.',
    fit: 'Slim through the thigh with a straight leg opening. Size up for a looser fit.',
    care: 'Machine wash cold, inside out. Hang dry. Iron on medium if needed.',
    colors: [BLACK, DARK_GREY],
    sizes: SIZES,
    images: ['/images/prod-back.svg', '/images/col-cargo.jpg', '/images/editorial-3.jpg'],
    isNew: false,
    isBestSeller: true,
    featured: false,
    published: true,
    variants: buildVariants([BLACK, DARK_GREY], SIZES, ['Black|S', 'Black|M'], ['Dark Grey|2XL']),
    addedAt: 5,
    keywords: ['cargo', 'urban', 'street', 'zip pockets', 'slim'],
  },
  {
    id: 'widecargo-pants',
    name: 'Wide Cargo Pants',
    price: 1599,
    salePrice: null,
    sku: 'SP-WDL-007',
    category: 'wide-leg',
    description:
      'Volume, with pockets. A wide-leg cargo block with oversized side pockets and a heavyweight drape — statement proportions, everyday function.',
    details: [
      'Wide-leg cargo block',
      'Oversized side cargo pockets',
      'Heavy 320 GSM twill',
      'Adjustable hem cinch',
      'Reinforced pocket bags',
    ],
    material: '98% Cotton, 2% Elastane — heavyweight twill, 320 GSM.',
    fit: 'High rise, wide through the entire leg. True to size.',
    care: 'Machine wash cold, inside out. Do not bleach. Tumble dry low.',
    colors: [NAVY, DARK_GREY],
    sizes: SIZES,
    images: ['/images/prod-widecargo.svg', '/images/editorial-3.jpg', '/images/col-wideleg.jpg'],
    isNew: true,
    isBestSeller: false,
    featured: true,
    published: true,
    variants: buildVariants([NAVY, DARK_GREY], SIZES),
    addedAt: 4,
    keywords: ['wide leg', 'cargo', 'volume', 'pockets', 'statement'],
  },
  {
    id: 'old-money-trousers',
    name: 'Old Money Trousers',
    price: 1799,
    salePrice: null,
    sku: 'SP-OMN-008',
    category: 'old-money',
    description:
      'Quiet luxury, cut for the street. A wool-blend trouser with a single pleat, a clean drape and a tailored taper — elegance that never raises its voice.',
    details: [
      'Wool-blend suiting fabric',
      'Single pleat, tailored taper',
      'Extended waistband with hidden clasp',
      'Lined to the knee',
      'Pick-stitched details',
    ],
    material: '62% Wool, 33% Polyester, 5% Elastane — suiting twill.',
    fit: 'Mid rise with a tailored taper. True to size.',
    care: 'Dry clean only. Steam to refresh — do not press directly.',
    colors: [BEIGE, DARK_BROWN, DARK_BLUE],
    sizes: SIZES,
    images: ['/images/editorial-2.jpg', '/images/detail-fabric.jpg', '/images/about-1.jpg'],
    isNew: true,
    isBestSeller: false,
    featured: true,
    published: true,
    variants: buildVariants([BEIGE, DARK_BROWN, DARK_BLUE], SIZES, ['Dark Brown|M']),
    addedAt: 3,
    keywords: ['old money', 'trousers', 'pleat', 'tailored', 'quiet luxury', 'beige'],
  },
  {
    id: 'essential-relaxed-pants',
    name: 'Essential Relaxed Pants',
    price: 1099,
    salePrice: null,
    sku: 'SP-OMN-009',
    category: 'old-money',
    description:
      'The everyday answer. Brushed cotton with a relaxed straight cut — soft, simple, and quietly perfect.',
    details: [
      'Brushed cotton twill',
      'Relaxed straight leg',
      'Elastic waist with drawcord',
      'Side and back pockets',
      'Garment dyed for depth',
    ],
    material: '100% Cotton — brushed twill, 240 GSM.',
    fit: 'Relaxed straight with an elastic waist. True to size.',
    care: 'Machine wash cold. Tumble dry low. Expect a soft hand from the first wear.',
    colors: [NAVY, OFF_WHITE],
    sizes: SIZES,
    images: ['/images/prod-essential-relaxed.svg', '/images/prod-relaxed.svg', '/images/about-1.jpg'],
    isNew: false,
    isBestSeller: false,
    featured: false,
    published: true,
    variants: buildVariants([NAVY, OFF_WHITE], SIZES, ['Off White|S']),
    addedAt: 2,
    keywords: ['relaxed', 'essential', 'brushed', 'comfort', 'navy', 'old money'],
  },
  {
    id: 'wide-leg-flow-pants',
    name: 'Wide Leg Flow Pants',
    price: 1499,
    salePrice: null,
    sku: 'SP-WDL-010',
    category: 'wide-leg',
    description:
      'Pure movement. A featherweight wide leg with an elastic waist and a dramatic drape — street energy, fluid silhouette.',
    details: [
      'Featherweight fluid twill',
      'Elastic waist with internal drawcord',
      'Extra-wide leg opening',
      'Deep side pockets',
      'Garment washed for softness',
    ],
    material: '88% Viscose, 12% Nylon — fluid twill, 220 GSM.',
    fit: 'High rise, ultra-wide leg. True to size.',
    care: 'Machine wash cold, gentle cycle. Hang dry.',
    colors: [BLACK, DARK_BLUE, OFF_WHITE],
    sizes: SIZES,
    images: ['/images/col-wideleg.jpg', '/images/editorial-1.jpg', '/images/night.svg'],
    isNew: false,
    isBestSeller: true,
    featured: false,
    published: true,
    variants: buildVariants([BLACK, DARK_BLUE, OFF_WHITE], SIZES),
    addedAt: 1,
    keywords: ['wide leg', 'flow', 'fluid', 'drape', 'street'],
  },
]

export function searchProducts(list: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return list.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.keywords.some((k) => k.toLowerCase().includes(q)) ||
      p.colors.some((c) => c.name.toLowerCase().includes(q)),
  )
}

/** Canonical sizes exported for legacy imports. */
export const allSizes = SIZES
