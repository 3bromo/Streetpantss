export type CategorySlug = 'essentials' | 'cargo' | 'wide-leg' | 'utility' | 'denim'

export const CATEGORIES: CategorySlug[] = ['essentials', 'cargo', 'wide-leg', 'utility', 'denim']

export interface ProductColor {
  name: string
  hex: string
}

export interface ProductVariant {
  color: string
  size: string
  stock: number
}

export interface Product {
  id: string
  name: string
  price: number
  salePrice?: number | null
  sku?: string
  category: CategorySlug
  description: string
  details: string[]
  material: string
  fit: string
  care: string
  colors: ProductColor[]
  sizes: string[]
  images: string[]
  isNew: boolean
  isBestSeller: boolean
  featured: boolean
  published: boolean
  variants: ProductVariant[]
  addedAt: number
  keywords: string[]
}

export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'

export const ORDER_STATUSES: OrderStatus[] = ['new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']

export interface OrderItem {
  productId: string
  name: string
  color: string
  size: string
  qty: number
  unitPrice: number
}

export interface Order {
  id: string
  number: string
  customerName: string
  email: string
  phone: string
  address: string
  city: string
  notes?: string
  status: OrderStatus
  subtotal: number
  shipping: number
  discountCode?: string | null
  discountAmount: number
  total: number
  items: OrderItem[]
  createdAt: string
}

export interface Discount {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  active: boolean
  expiresAt: string | null
}

export interface SiteSettings {
  storeName: string
  announcement: string
  heroImage: string
  bannerImage: string
  bannerTitle: string
  instagram: string
  youtube: string
  whatsapp: string
  email: string
  phone: string
  freeThreshold: number
  standardShipping: number
  expressShipping: number
  currency: string
}

export function totalStock(p: Product): number {
  return p.variants.reduce((s, v) => s + v.stock, 0)
}

export function isLowStock(p: Product): boolean {
  const t = totalStock(p)
  return t > 0 && t <= 10
}

export function isOutOfStock(p: Product): boolean {
  return totalStock(p) <= 0
}

export function formatPrice(v: number, currency = 'EGP'): string {
  return `${v.toLocaleString('en-US')} ${currency}`
}
