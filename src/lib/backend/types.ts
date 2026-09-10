import { AdminSession, Discount, Order, OrderStatus, Product, SiteSettings } from '../types'

export interface PlaceOrderInput {
  customerName: string
  email: string
  phone: string
  address: string
  city: string
  notes?: string
  delivery: 'standard' | 'express'
  discountCode?: string | null
  discountAmount: number
  items: { productId: string; color: string; size: string; qty: number }[]
}

export interface Backend {
  // ---- auth ----
  signIn(email: string, password: string): Promise<{ session: AdminSession | null; error: string | null }>
  signOut(): Promise<void>
  getSession(): Promise<AdminSession | null>
  onAuthChange(cb: (session: AdminSession | null) => void): () => void

  // ---- catalog ----
  listProducts(opts?: { includeUnpublished?: boolean }): Promise<Product[]>
  createProduct(input: Omit<Product, 'id' | 'addedAt'>): Promise<Product>
  updateProduct(id: string, patch: Partial<Product>): Promise<void>
  deleteProduct(id: string): Promise<void>

  // ---- orders ----
  listOrders(): Promise<Order[]>
  placeOrder(input: PlaceOrderInput): Promise<{ id: string; number: string }>
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>

  // ---- inventory ----
  setVariantStock(productId: string, color: string, size: string, stock: number): Promise<void>

  // ---- discounts ----
  listDiscounts(): Promise<Discount[]>
  createDiscount(input: Omit<Discount, 'id'>): Promise<Discount>
  updateDiscount(id: string, patch: Partial<Discount>): Promise<void>
  deleteDiscount(id: string): Promise<void>
  validateDiscount(code: string): Promise<Discount | null>

  // ---- settings / site content ----
  getSettings(): Promise<SiteSettings>
  updateSettings(patch: Partial<SiteSettings>): Promise<void>

  // ---- storage ----
  uploadImage(file: File): Promise<string>
  deleteImage(url: string): Promise<void>

  // ---- realtime ----
  subscribeChanges: (cb: (table: string) => void) => () => void
}
