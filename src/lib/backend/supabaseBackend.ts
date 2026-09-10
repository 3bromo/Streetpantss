import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Runtime auth audit (identical to the Android app): captures the real auth
// request (URL, key prefix, email, password length + hash, status, raw server
// response) so web and Android sign-ins can be compared exactly.
// ---------------------------------------------------------------------------

export interface AuthAudit {
  url: string
  keyPrefix: string
  email: string
  pwLength: number
  pwHash: string
  status: number
  server: string
}

let lastAudit: AuthAudit | null = null

export function getLastAuthAudit(): AuthAudit | null {
  return lastAudit
}

function djb2(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(16)
}

const realFetch: typeof fetch | null = typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null

if (realFetch) {
  ;(globalThis as unknown as { fetch: typeof fetch }).fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    const resp = await (realFetch as typeof fetch)(input as never, init as never)
    try {
      if (url.indexOf('/auth/v1/token') !== -1) {
        const body = typeof init?.body === 'string' ? init.body : ''
        let email = ''
        let pw = ''
        try {
          const j = JSON.parse(body) as { email?: string; password?: string }
          email = String(j.email ?? '')
          pw = String(j.password ?? '')
        } catch {
          /* body not json */
        }
        const headers = (init?.headers ?? {}) as HeadersInit
        let key = ''
        try {
          if (typeof (headers as Headers).get === 'function') key = (headers as Headers).get('apikey') ?? ''
          else key = String((headers as Record<string, string>).apikey ?? '')
        } catch {
          key = ''
        }
        const text = await resp.clone().text()
        lastAudit = {
          url: url,
          keyPrefix: key.slice(0, 14),
          email: email,
          pwLength: pw.length,
          pwHash: djb2(pw),
          status: resp.status,
          server: text.slice(0, 140),
        }
      }
    } catch {
      /* never break auth */
    }
    return resp
  }) as typeof fetch
}
import { AdminSession, Discount, Order, OrderStatus, Product, SiteSettings } from '../types'
import { canonColor, canonSize, SIZE_KEYS } from '../categories'
import { DEFAULT_SETTINGS } from './defaults'
import { Backend, PlaceOrderInput } from './types'

const SIZE_ORDER: Record<string, number> = Object.fromEntries(SIZE_KEYS.map((k, i) => [k, i]))

const PRODUCT_SELECT = `
  id, slug, name, description, price, sale_price, sku, category, details, material, fit, care, keywords,
  is_new, is_best_seller, featured, published, added_at,
  product_images ( url, position, alt ),
  product_variants ( stock, colors ( name, hex ), sizes ( label ) )
`

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapProduct(row: any): Product {
  const variants = (row.product_variants ?? []).map((v: any) => ({
    color: canonColor(v.colors?.name ?? ''),
    size: canonSize(v.sizes?.label ?? ''),
    stock: Number(v.stock ?? 0),
  }))
  const colorMap = new Map<string, string>()
  for (const v of row.product_variants ?? []) {
    if (v.colors?.name) {
      const name = canonColor(v.colors.name)
      if (!colorMap.has(name)) colorMap.set(name, v.colors.hex ?? '#B8B2A7')
    }
  }
  const rawSizes = Array.from(new Set(variants.map((v: { size: string }) => v.size))) as string[]
  // Selectable sizes are ONLY S, M, L, XL. Extra historical sizes (e.g. 2XL)
  // remain safely stored in variants/order history but are not offered.
  const selectableSizes = rawSizes.filter((s) => (SIZE_KEYS as readonly string[]).includes(s))
  const sizesFinal = (selectableSizes.length ? selectableSizes : rawSizes) as string[]
  sizesFinal.sort((a, b) => (SIZE_ORDER[a] ?? 9) - (SIZE_ORDER[b] ?? 9))
  const images = ((row.product_images ?? []) as any[]).sort((a, b) => a.position - b.position)
  // Per-color galleries: product_images.alt stores the color name.
  const colorImages: Record<string, string[]> = {}
  for (const img of images) {
    const alt = String(img.alt ?? '').trim()
    if (!alt) continue
    const name = canonColor(alt)
    colorImages[name] = colorImages[name] ?? []
    colorImages[name].push(img.url)
  }
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
    sizes: sizesFinal,
    images: images.map((i) => i.url),
    colorImages,
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

/** Raw value first, then trim / NFC / NFKC normalization variants — identical
 *  to the Android admin app's attempt order. */
function credVariants(s: string): string[] {
  const out: string[] = [s]
  const push = (v: string) => {
    if (out.indexOf(v) === -1) out.push(v)
  }
  push(s.trim())
  try {
    push(s.normalize('NFC'))
    push(s.normalize('NFC').trim())
    push(s.normalize('NFKC'))
    push(s.normalize('NFKC').trim())
  } catch {
    /* normalize unsupported */
  }
  push(s.trim().toLowerCase())
  return out
}

export function createSupabaseBackend(url: string, anonKey: string): Backend {
  // The anon key is safe to ship to clients: all sensitive access is enforced
  // server-side by Supabase Row Level Security (see supabase/schema.sql).
  const sb: SupabaseClient = createClient(url, anonKey)

  async function ensureColorIds(colors: { name: string; hex: string }[]): Promise<Map<string, string>> {
    const map = new Map<string, string>()
    for (const c of colors) {
      const { data } = await sb.from('colors').select('id, name').eq('name', c.name).maybeSingle()
      if (data) {
        map.set(c.name, data.id)
      } else {
        const { data: created, error } = await sb.from('colors').insert({ name: c.name, hex: c.hex }).select('id').single()
        if (error) fail(error, 'Could not create color')
        map.set(c.name, created.id)
      }
    }
    return map
  }

  async function ensureSizeIds(sizes: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>()
    for (const label of sizes) {
      const { data } = await sb.from('sizes').select('id, label').eq('label', label).maybeSingle()
      if (data) {
        map.set(label, data.id)
      } else {
        const { data: created, error } = await sb.from('sizes').insert({ label }).select('id').single()
        if (error) fail(error, 'Could not create size')
        map.set(label, created.id)
      }
    }
    return map
  }

  /**
   * Writes the product's images. Per-color images are stored in the SAME
   * product_images table using the existing `alt` column = color name
   * (no schema change). Main images get alt = ''.
   */
  async function writeImages(productId: string, mainImages: string[], byColor?: Record<string, string[]>) {
    await sb.from('product_images').delete().eq('product_id', productId)
    const rows: { product_id: string; url: string; position: number; alt: string }[] = []
    let pos = 0
    const mainSet = new Set(mainImages)
    for (const url of mainImages) rows.push({ product_id: productId, url, position: pos++, alt: '' })
    for (const [color, urls] of Object.entries(byColor ?? {})) {
      for (const url of urls ?? []) {
        if (!url || mainSet.has(url)) continue
        rows.push({ product_id: productId, url, position: pos++, alt: canonColor(color) })
        mainSet.add(url)
      }
    }
    if (rows.length) {
      const { error } = await sb.from('product_images').insert(rows)
      if (error) fail(error, 'Could not save images')
    }
  }

  async function writeVariants(productId: string, product: Pick<Product, 'colors' | 'sizes' | 'variants'>) {
    await sb.from('product_variants').delete().eq('product_id', productId)
    if (!product.variants.length) return
    const colorIds = await ensureColorIds(product.colors)
    const sizeIds = await ensureSizeIds(product.sizes)
    const rows = product.variants.map((v) => ({
      product_id: productId,
      color_id: colorIds.get(v.color),
      size_id: sizeIds.get(v.size),
      stock: v.stock,
    }))
    const { error } = await sb.from('product_variants').insert(rows)
    if (error) fail(error, 'Could not save variants')
  }

  /** Scalar product columns — only fields actually present (supports Partial). */
  function productColumns(p: Omit<Product, 'id' | 'addedAt'> | Partial<Product>) {
    const cols: Record<string, unknown> = {}
    const set = (key: string, value: unknown) => {
      if (value !== undefined) cols[key] = value
    }
    set('name', p.name)
    set('description', p.description)
    set('price', p.price)
    set('sale_price', p.salePrice ?? null)
    set('sku', p.sku ?? '')
    set('category', p.category)
    set('details', p.details)
    set('material', p.material)
    set('fit', p.fit)
    set('care', p.care)
    set('keywords', p.keywords)
    set('is_new', p.isNew)
    set('is_best_seller', p.isBestSeller)
    set('featured', p.featured)
    set('published', p.published)
    return cols
  }

  return {
    subscribeChanges(onChange) {
      const channel = sb
        .channel('storefront-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => onChange('products'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images' }, () => onChange('products'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () =>
          onChange('inventory'),
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => onChange('settings'))
        .subscribe()
      return () => {
        sb.removeChannel(channel)
      }
    },

    async signIn(email, password) {
      // The password is sent exactly as typed — never lowercased or rewritten.
      // Attempt 1 is the raw value; trimmed retries run only if raw fails
      // (covers keyboards/pastes that silently add whitespace). Identical
      // logic to the Android admin app.
      const candidates: { email: string; password: string }[] = []
      const emails = credVariants(email)
      const passwords = credVariants(password)
      for (const p of passwords) candidates.push({ email, password: p })
      for (const e of emails) for (const p of passwords) candidates.push({ email: e, password: p })
      const seen = new Set<string>()
      let lastError = 'Sign-in failed.'
      for (const a of candidates) {
        const key = a.email + ' ' + a.password
        if (seen.has(key)) continue
        seen.add(key)
        const { data, error } = await sb.auth.signInWithPassword({ email: a.email, password: a.password })
        if (!error && data.user) {
          return { session: { userId: data.user.id, email: data.user.email ?? email }, error: null }
        }
        lastError = error?.message ?? lastError
      }
      return { session: null, error: lastError }
    },

    async signOut() {
      await sb.auth.signOut()
    },

    async getSession() {
      const { data } = await sb.auth.getSession()
      const user = data.session?.user
      return user ? { userId: user.id, email: user.email ?? '' } : null
    },

    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_event, session) => {
        cb(session?.user ? { userId: session.user.id, email: session.user.email ?? '' } : null)
      })
      return () => data.subscription.unsubscribe()
    },

    async listProducts(opts) {
      let query = sb.from('products').select(PRODUCT_SELECT)
      if (!opts?.includeUnpublished) query = query.eq('published', true)
      const { data, error } = await query.order('added_at', { ascending: false })
      if (error) fail(error, 'Could not load products')
      return (data ?? []).map(mapProduct)
    },

    async createProduct(input) {
      const { data, error } = await sb
        .from('products')
        .insert({ ...productColumns(input), slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), added_at: new Date().toISOString() })
        .select('id')
        .single()
      if (error) fail(error, 'Could not create product')
      await writeImages(data.id, input.images, input.colorImages)
      await writeVariants(data.id, input)
      const { data: full } = await sb.from('products').select(PRODUCT_SELECT).eq('id', data.id).single()
      return mapProduct(full)
    },

    async updateProduct(id, patch) {
      const cols = productColumns(patch as Partial<Product>)
      if (Object.keys(cols).length) {
        const { error } = await sb.from('products').update(cols).eq('id', id)
        if (error) fail(error, 'Could not update product')
      }
      if (patch.images || patch.colorImages) {
        await writeImages(id, patch.images ?? [], patch.colorImages)
      }
      if (patch.variants && patch.colors && patch.sizes) await writeVariants(id, patch as Product)
    },

    async deleteProduct(id) {
      const { error } = await sb.from('products').delete().eq('id', id)
      if (error) fail(error, 'Could not delete product')
    },

    async listOrders() {
      const { data, error } = await sb
        .from('orders')
        .select('*, order_items ( * )')
        .order('created_at', { ascending: false })
      if (error) fail(error, 'Could not load orders')
      return (data ?? []).map(mapOrder)
    },

  async placeOrder(input) {
    // The RPC is security-definer: it prices items server-side, writes the
    // order + items and decrements stock. It returns {id, number}.
    // NOTE: we intentionally do NOT read the order back afterwards — under
    // RLS `orders` is admin-readable only, so an anonymous checkout would get
    // zero rows and `.single()` would throw "cannot coerce to a single JSON
    // object". The receipt is built client-side by the caller instead.
    const { data, error } = await sb.rpc('place_order', { payload: input as unknown as object })
    if (error) fail(error, 'Could not place order')
    return data as { id: string; number: string }
  },

    async updateOrderStatus(id, status: OrderStatus) {
      if (status === 'cancelled') {
        const { error } = await sb.rpc('cancel_order', { order_id: id })
        if (error) fail(error, 'Could not cancel order')
        return
      }
      const { error } = await sb.from('orders').update({ status }).eq('id', id)
      if (error) fail(error, 'Could not update order')
    },

    async setVariantStock(productId, color, size, stock) {
      const { data, error } = await sb
        .from('product_variants')
        .select('id, colors ( name ), sizes ( label )')
        .eq('product_id', productId)
      if (error) fail(error, 'Could not load variants')
      const row = (data ?? []).find(
        (v: any) => v.colors?.name === color && v.sizes?.label === size,
      )
      if (row) {
        const { error: e2 } = await sb.from('product_variants').update({ stock }).eq('id', row.id)
        if (e2) fail(e2, 'Could not update stock')
      } else {
        const colorIds = await ensureColorIds([{ name: color, hex: '#0B2555' }])
        const sizeIds = await ensureSizeIds([size])
        const { error: e3 } = await sb
          .from('product_variants')
          .insert({ product_id: productId, color_id: colorIds.get(color), size_id: sizeIds.get(size), stock })
        if (e3) fail(e3, 'Could not create variant')
      }
    },

    async listDiscounts() {
      const { data, error } = await sb.from('discount_codes').select('*').order('created_at', { ascending: false })
      if (error) fail(error, 'Could not load discounts')
      return (data ?? []).map((d: any) => ({
        id: d.id,
        code: d.code,
        type: d.type,
        value: Number(d.value),
        active: !!d.active,
        expiresAt: d.expires_at,
      }))
    },

    async createDiscount(input) {
      const { data, error } = await sb
        .from('discount_codes')
        .insert({ code: input.code, type: input.type, value: input.value, active: input.active, expires_at: input.expiresAt })
        .select('*')
        .single()
      if (error) fail(error, 'Could not create discount')
      return { id: data.id, code: data.code, type: data.type, value: Number(data.value), active: !!data.active, expiresAt: data.expires_at }
    },

    async updateDiscount(id, patch) {
      const cols: Record<string, unknown> = {}
      if (patch.code !== undefined) cols.code = patch.code
      if (patch.type !== undefined) cols.type = patch.type
      if (patch.value !== undefined) cols.value = patch.value
      if (patch.active !== undefined) cols.active = patch.active
      if (patch.expiresAt !== undefined) cols.expires_at = patch.expiresAt
      const { error } = await sb.from('discount_codes').update(cols).eq('id', id)
      if (error) fail(error, 'Could not update discount')
    },

    async deleteDiscount(id) {
      const { error } = await sb.from('discount_codes').delete().eq('id', id)
      if (error) fail(error, 'Could not delete discount')
    },

    async validateDiscount(code) {
      const { data } = await sb
        .from('discount_codes')
        .select('*')
        .ilike('code', code.trim())
        .eq('active', true)
        .maybeSingle()
      if (!data) return null
      if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return null
      return { id: data.id, code: data.code, type: data.type, value: Number(data.value), active: true, expiresAt: data.expires_at }
    },

    async getSettings() {
      const { data, error } = await sb.from('site_settings').select('key, value')
      if (error) fail(error, 'Could not load settings')
      const settings: SiteSettings = { ...DEFAULT_SETTINGS }
      for (const row of data ?? []) {
        // keep ALL keys (including extended jsonb values like siteImages)
        ;(settings as unknown as Record<string, unknown>)[row.key] = row.value
      }
      return settings
    },

    async updateSettings(patch) {
      const rows = Object.entries(patch).map(([key, value]) => ({ key, value }))
      const { error } = await sb.from('site_settings').upsert(rows, { onConflict: 'key' })
      if (error) fail(error, 'Could not save settings')
    },

    async uploadImage(file) {
      const safe = file.name.replace(/[^a-zA-Z0-9.-]+/g, '-')
      const path = `products/${Date.now()}-${safe}`
      const { error } = await sb.storage.from('images').upload(path, file, { upsert: false })
      if (error) fail(error, 'Upload failed')
      return sb.storage.from('images').getPublicUrl(path).data.publicUrl
    },

    async deleteImage(url) {
      const marker = '/images/'
      const idx = url.indexOf(marker)
      if (idx === -1 || url.includes('data:')) return
      const path = decodeURIComponent(url.slice(idx + marker.length).split('?')[0])
      if (!path.startsWith('products/')) return
      await sb.storage.from('images').remove([path])
    },
  }
}
