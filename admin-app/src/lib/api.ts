import { supabase, STORAGE_BUCKET } from './supabase'
import { CategorySlug, Discount, Order, OrderStatus, Product, SiteSettings } from './types'

const PRODUCT_SELECT = `
  id, slug, name, description, price, sale_price, sku, category, details, material, fit, care, keywords,
  is_new, is_best_seller, featured, published, added_at,
  product_images ( url, position, alt ),
  product_variants ( stock, colors ( name, hex ), sizes ( label ) )
`

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapProduct(row: any): Product {
  const variants = (row.product_variants ?? []).map((v: any) => ({
    color: v.colors?.name ?? '',
    size: v.sizes?.label ?? '',
    stock: Number(v.stock ?? 0),
  }))
  const colorMap = new Map<string, string>()
  for (const v of row.product_variants ?? []) {
    if (v.colors?.name) colorMap.set(v.colors.name, v.colors.hex ?? '#0B2555')
  }
  const sizes = Array.from(new Set(variants.map((v: { size: string }) => v.size))) as string[]
  sizes.sort((a, b) => Number(a) - Number(b))
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    salePrice: row.sale_price != null ? Number(row.sale_price) : null,
    sku: row.sku ?? '',
    category: row.category,
    description: row.description ?? '',
    details: row.details ?? [],
    material: row.material ?? '',
    fit: row.fit ?? '',
    care: row.care ?? '',
    colors: Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex })),
    sizes,
    images: ((row.product_images ?? []) as any[]).sort((a, b) => a.position - b.position).map((i) => i.url),
    isNew: !!row.is_new,
    isBestSeller: !!row.is_best_seller,
    featured: !!row.featured,
    published: !!row.published,
    variants,
    addedAt: row.added_at ? new Date(row.added_at).getTime() : 0,
    keywords: row.keywords ?? [],
  }
}

function mapOrder(row: any): Order {
  return {
    id: row.id,
    number: row.number,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    notes: row.notes ?? undefined,
    status: row.status,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    discountCode: row.discount_code ?? null,
    discountAmount: Number(row.discount_amount ?? 0),
    total: Number(row.total),
    items: ((row.order_items ?? []) as any[]).map((i) => ({
      productId: i.product_id ?? '',
      name: i.name,
      color: i.color,
      size: i.size,
      qty: Number(i.qty),
      unitPrice: Number(i.unit_price),
    })),
    createdAt: row.created_at,
  }
}

function fail(error: { message: string } | null, fallback: string): never {
  throw new Error(error?.message ?? fallback)
}

// ------------------------------------------------ products

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .order('added_at', { ascending: false })
  if (error) fail(error, 'Could not load products')
  return (data ?? []).map(mapProduct)
}

async function ensureColorIds(colors: { name: string; hex: string }[]) {
  const map = new Map<string, string>()
  for (const c of colors) {
    const { data } = await supabase.from('colors').select('id, name').eq('name', c.name).maybeSingle()
    if (data) map.set(c.name, data.id)
    else {
      const { data: created, error } = await supabase.from('colors').insert({ name: c.name, hex: c.hex }).select('id').single()
      if (error) fail(error, 'Could not create color')
      map.set(c.name, created.id)
    }
  }
  return map
}

async function ensureSizeIds(sizes: string[]) {
  const map = new Map<string, string>()
  for (const label of sizes) {
    const { data } = await supabase.from('sizes').select('id, label').eq('label', label).maybeSingle()
    if (data) map.set(label, data.id)
    else {
      const { data: created, error } = await supabase.from('sizes').insert({ label }).select('id').single()
      if (error) fail(error, 'Could not create size')
      map.set(label, created.id)
    }
  }
  return map
}

function productColumns(p: Partial<Product>) {
  return {
    name: p.name,
    description: p.description,
    price: p.price,
    sale_price: p.salePrice ?? null,
    sku: p.sku ?? '',
    category: p.category,
    details: p.details,
    material: p.material,
    fit: p.fit,
    care: p.care,
    keywords: p.keywords ?? [],
    is_new: p.isNew,
    is_best_seller: p.isBestSeller,
    featured: p.featured,
    published: p.published,
  }
}

async function writeImages(productId: string, images: string[]) {
  await supabase.from('product_images').delete().eq('product_id', productId)
  if (images.length) {
    const rows = images.map((url, i) => ({ product_id: productId, url, position: i + 1, alt: '' }))
    const { error } = await supabase.from('product_images').insert(rows)
    if (error) fail(error, 'Could not save images')
  }
}

async function writeVariants(productId: string, p: Pick<Product, 'colors' | 'sizes' | 'variants'>) {
  await supabase.from('product_variants').delete().eq('product_id', productId)
  if (!p.variants.length) return
  const colorIds = await ensureColorIds(p.colors)
  const sizeIds = await ensureSizeIds(p.sizes)
  const rows = p.variants.map((v) => ({
    product_id: productId,
    color_id: colorIds.get(v.color),
    size_id: sizeIds.get(v.size),
    stock: v.stock,
  }))
  const { error } = await supabase.from('product_variants').insert(rows)
  if (error) fail(error, 'Could not save variants')
}

export async function createProduct(input: Omit<Product, 'id' | 'addedAt'>): Promise<void> {
  const { data, error } = await supabase
    .from('products')
    .insert({ ...productColumns(input), slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), added_at: new Date().toISOString() })
    .select('id')
    .single()
  if (error) fail(error, 'Could not create product')
  await writeImages(data.id, input.images)
  await writeVariants(data.id, input)
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<void> {
  const cols: Record<string, unknown> = {}
  const scalar = productColumns(patch)
  for (const [k, v] of Object.entries(scalar)) {
    const camel = k.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())
    if ((patch as Record<string, unknown>)[camel] !== undefined) cols[k] = v
  }
  if (Object.keys(cols).length) {
    const { error } = await supabase.from('products').update(cols).eq('id', id)
    if (error) fail(error, 'Could not update product')
  }
  if (patch.images) await writeImages(id, patch.images)
  if (patch.variants && patch.colors && patch.sizes) await writeVariants(id, patch as Product)
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) fail(error, 'Could not delete product')
}

export async function setVariantStock(productId: string, color: string, size: string, stock: number): Promise<void> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, colors ( name ), sizes ( label )')
    .eq('product_id', productId)
  if (error) fail(error, 'Could not load variants')
  const row = (data ?? []).find((v: any) => v.colors?.name === color && v.sizes?.label === size)
  if (row) {
    const { error: e2 } = await supabase.from('product_variants').update({ stock }).eq('id', row.id)
    if (e2) fail(e2, 'Could not update stock')
  } else {
    const colorIds = await ensureColorIds([{ name: color, hex: '#0B2555' }])
    const sizeIds = await ensureSizeIds([size])
    const { error: e3 } = await supabase
      .from('product_variants')
      .insert({ product_id: productId, color_id: colorIds.get(color), size_id: sizeIds.get(size), stock })
    if (e3) fail(e3, 'Could not create variant')
  }
}

// ------------------------------------------------ orders

export async function fetchOrders(limit = 200): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items ( * )')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) fail(error, 'Could not load orders')
  return (data ?? []).map(mapOrder)
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  if (status === 'cancelled') {
    // Preferred path: security-definer RPC that cancels AND restocks.
    const { error } = await supabase.rpc('cancel_order', { order_id: id })
    if (error) {
      const code = (error as { code?: string }).code
      // If the RPC is missing/unavailable in this project, fall back to a
      // plain status update so cancelling NEVER hangs or fails silently.
      if (code === '42883' || code === 'PGRST202' || code === '42P01') {
        const { error: e2 } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)
        if (e2) fail(e2, 'Could not cancel order')
        return
      }
      fail(error, 'Could not cancel order')
    }
    return
  }
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) fail(error, 'Could not update order')
}

export async function deleteOrder(id: string): Promise<void> {
  // order_items are removed by the existing ON DELETE CASCADE FK.
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) fail(error, 'Could not delete order')
}

// ------------------------------------------------ discounts

export async function fetchDiscounts(): Promise<Discount[]> {
  const { data, error } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false })
  if (error) fail(error, 'Could not load discounts')
  return (data ?? []).map((d: any) => ({
    id: d.id,
    code: d.code,
    type: d.type,
    value: Number(d.value),
    active: !!d.active,
    expiresAt: d.expires_at,
  }))
}

export async function createDiscount(input: Omit<Discount, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('discount_codes')
    .insert({ code: input.code, type: input.type, value: input.value, active: input.active, expires_at: input.expiresAt })
  if (error) fail(error, 'Could not create discount')
}

export async function updateDiscount(id: string, patch: Partial<Discount>): Promise<void> {
  const cols: Record<string, unknown> = {}
  if (patch.code !== undefined) cols.code = patch.code
  if (patch.type !== undefined) cols.type = patch.type
  if (patch.value !== undefined) cols.value = patch.value
  if (patch.active !== undefined) cols.active = patch.active
  if (patch.expiresAt !== undefined) cols.expires_at = patch.expiresAt
  const { error } = await supabase.from('discount_codes').update(cols).eq('id', id)
  if (error) fail(error, 'Could not update discount')
}

export async function deleteDiscount(id: string): Promise<void> {
  const { error } = await supabase.from('discount_codes').delete().eq('id', id)
  if (error) fail(error, 'Could not delete discount')
}

// ------------------------------------------------ settings

const DEFAULT_SETTINGS: SiteSettings = {
  storeName: 'STREET PANTS',
  announcement: '',
  heroImage: '',
  bannerImage: '',
  bannerTitle: '',
  instagram: '',
  youtube: '',
  whatsapp: '',
  email: '',
  phone: '',
  freeThreshold: 2000,
  standardShipping: 50,
  expressShipping: 120,
  currency: 'EGP',
}

export async function fetchSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from('site_settings').select('key, value')
  if (error) fail(error, 'Could not load settings')
  const settings: SiteSettings = { ...DEFAULT_SETTINGS }
  for (const row of data ?? []) {
    if (row.key in settings) (settings as unknown as Record<string, unknown>)[row.key] = row.value
  }
  return settings
}

export async function updateSettings(patch: Partial<SiteSettings>): Promise<void> {
  const rows = Object.entries(patch).map(([key, value]) => ({ key, value }))
  const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' })
  if (error) fail(error, 'Could not save settings')
}

// ------------------------------------------------ storage

export async function uploadImage(blob: Blob, originalName: string): Promise<string> {
  const safe = originalName.replace(/[^a-zA-Z0-9.-]+/g, '-') || 'image.jpg'
  const path = `products/${Date.now()}-${safe}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, { upsert: false })
  if (error) fail(error, 'Upload failed')
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

export async function deleteImage(url: string): Promise<void> {
  const marker = `/${STORAGE_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1 || url.startsWith('data:')) return
  const path = decodeURIComponent(url.slice(idx + marker.length).split('?')[0])
  if (!path.startsWith('products/')) return
  await supabase.storage.from(STORAGE_BUCKET).remove([path])
}

// ------------------------------------------------ realtime

export function subscribeAdminChanges(onChange: (table: string) => void): () => void {
  const channel = supabase
    .channel('admin-app-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => onChange('orders'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => onChange('products'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => onChange('inventory'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images' }, () => onChange('products'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'discount_codes' }, () => onChange('discounts'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => onChange('settings'))
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

export type { CategorySlug }
