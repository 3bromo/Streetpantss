import { Product } from './types'
import { canonColor, canonSize } from './categories'

export function totalStock(p: Product): number {
  return p.variants.reduce((sum, v) => sum + v.stock, 0)
}

/** Canon-aware: legacy DB sizes/colors match the new letter sizes/colors. */
export function variantStock(p: Product, color: string, size: string): number {
  const cs = canonSize(size)
  const cc = canonColor(color)
  const v = p.variants.find((x) => canonColor(x.color) === cc && canonSize(x.size) === cs)
  return v ? v.stock : 0
}

export function isOutOfStock(p: Product): boolean {
  return totalStock(p) <= 0
}

export function isLowStock(p: Product): boolean {
  const t = totalStock(p)
  return t > 0 && t <= 10
}

export function effectivePrice(p: Product): number {
  return p.salePrice != null && p.salePrice < p.price ? p.salePrice : p.price
}
