// ============================================================================
// STREET PANTS — REAL server-side order email (Vercel serverless function).
//
// Plain JavaScript, DEFAULT Node.js serverless runtime (no custom runtime,
// no TypeScript → no TS/process build issues).
//
//   POST /api/order-email
//
// REQUIRED env var (already set in Vercel Production):
//   RESEND_API_KEY            — from https://resend.com
//
// OPTIONAL env vars:
//   EMAIL_FROM                — a VERIFIED Resend sender (needed to email any
//                               address; see the 403 note below)
//   ORDER_NOTIFICATION_EMAIL  — fallback recipient if none saved in Admin
//   SUPABASE_URL / SUPABASE_ANON_KEY — override the built-in public values
//   SUPABASE_SERVICE_ROLE_KEY — OPTIONAL hardening (server-side order reload
//                               + DB dedupe). NOT required.
//
// Recipient: ALWAYS read LIVE from the EXISTING settings system
// (site_settings.orderNotificationEmail — the field in Admin →
// Order Email Notifications) using the publishable anon key (public by
// design, same as the storefront). Changing the email in Admin immediately
// redirects all future order emails; the old address stops receiving.
//
// Modes:
//   POST { orderId, paymentMethod, order, to }  → order email (one per order)
//   POST { test: true, to }                     → real test email
//
// NOTE on Resend 403: with Resend's free default sender (onboarding@resend.dev)
// emails can ONLY be delivered to the Resend account owner's own address.
// To deliver to any store email: verify a domain in Resend and set EMAIL_FROM,
// or create the Resend account with the store email itself.
// When a 403 happens this function reports that exact reason.
// ============================================================================

const RESEND_BASE = process.env.RESEND_BASE_URL || 'https://api.resend.com'

/**
 * The publishable (anon) Supabase key is PUBLIC by design — the browser app
 * already ships it and Row Level Security enforces what it can read. We use
 * it here (exactly like the storefront does) to read the CURRENT notification
 * email saved in Admin. No secrets, no new settings, no new tables.
 */
const SB_URL = process.env.SUPABASE_URL || 'https://werxnlgewnkliuuglovp.supabase.co'
const SB_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_Da8t8P-wwj78ZEmD8lHWQQ_ZY9KQtY_'

/** Read the currently saved recipient from the EXISTING settings table. */
async function readSavedNotificationEmail() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/site_settings?select=value&key=eq.orderNotificationEmail`, {
      headers: { apikey: SB_ANON_KEY, Authorization: `Bearer ${SB_ANON_KEY}` },
    })
    if (!res.ok) return ''
    const rows = await res.json().catch(() => [])
    const v = Array.isArray(rows) ? rows[0]?.value : null
    return typeof v === 'string' ? v.trim() : ''
  } catch {
    return ''
  }
}

/** In-memory dedupe: absorbs immediate retries within the same instance.
 *  (The site triggers the email exactly once per order; with the optional
 *  service key, dedupe is additionally persisted in site_settings.) */
const SENT = new Map()
const DEDUPE_MS = 10 * 60 * 1000

function log(level, message, extra) {
  const line = `[order-email] ${message}`
  if (level === 'error') console.error(line, extra ?? '')
  else console.log(line, extra ?? '')
}

const money = (n) => `${Number(n ?? 0).toLocaleString('en-US')} EGP`
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

const paymentLabel = (p) => {
  const v = String(p ?? '').toLowerCase()
  if (v === 'cod' || v === 'cash') return 'Cash on Delivery'
  if (v === 'card') return 'Card'
  return v ? v.toUpperCase() : '—'
}

/** Accepts BOTH the client receipt shape (camelCase) and DB shape (snake_case). */
function normalizeOrder(o, fallbackId) {
  if (!o || typeof o !== 'object') return null
  if (typeof (o.number ?? '') !== 'string' || !o.number) return null
  const itemsRaw = Array.isArray(o.order_items) ? o.order_items : Array.isArray(o.items) ? o.items : []
  if (!itemsRaw.length && typeof o.customer_name !== 'string' && typeof o.customerName !== 'string') return null
  return {
    id: o.id ?? fallbackId,
    number: o.number,
    customer_name: o.customer_name ?? o.customerName ?? '',
    email: o.email ?? '',
    phone: o.phone ?? '',
    address: o.address ?? '',
    city: o.city ?? '',
    notes: o.notes ?? undefined,
    status: o.status ?? 'new',
    subtotal: Number(o.subtotal ?? 0),
    shipping: Number(o.shipping ?? 0),
    discount_code: o.discount_code ?? o.discountCode ?? null,
    discount_amount: Number(o.discount_amount ?? o.discountAmount ?? 0),
    total: Number(o.total ?? 0),
    created_at: o.created_at ?? o.createdAt ?? new Date().toISOString(),
    order_items: itemsRaw.map((i) => ({
      name: String(i.name ?? 'Item'),
      color: String(i.color ?? ''),
      size: String(i.size ?? ''),
      qty: Number(i.qty ?? 0),
      unit_price: Number(i.unit_price ?? i.unitPrice ?? 0),
    })),
  }
}

function buildOrderEmail(order, paymentMethod) {
  const rows = (order.order_items ?? [])
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #ECEBE7;vertical-align:top;">
          <strong>${esc(i.name)}</strong><br/>
          <span style="color:#6B6B6B;font-size:12px;">Size: ${esc(i.size)} &nbsp;•&nbsp; Color: ${esc(i.color)} &nbsp;•&nbsp; Qty: ${Number(i.qty)}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #ECEBE7;text-align:right;white-space:nowrap;vertical-align:top;">
          ${money(i.unit_price)}<br/><strong>${money(Number(i.unit_price) * Number(i.qty))}</strong>
        </td>
      </tr>`,
    )
    .join('')

  const date = order.created_at
    ? new Date(order.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Cairo' })
    : new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Cairo' })

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#F7F6F2;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #ECEBE7;">
      <div style="background:#0A0A0A;color:#ffffff;padding:20px 24px;">
        <div style="font-size:18px;font-weight:bold;letter-spacing:2px;">STREET PANTS</div>
        <div style="font-size:13px;color:#B8B2A7;margin-top:4px;letter-spacing:1px;">NEW ORDER</div>
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#6B6B6B;width:42%;">Order Number</td><td style="padding:6px 0;text-align:right;"><strong>#${esc(order.number)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6B6B6B;">Order Date</td><td style="padding:6px 0;text-align:right;">${esc(date)}</td></tr>
          <tr><td style="padding:6px 0;color:#6B6B6B;">Order Status</td><td style="padding:6px 0;text-align:right;text-transform:uppercase;">${esc(order.status ?? 'new')}</td></tr>
          <tr><td style="padding:6px 0;color:#6B6B6B;">Payment Method</td><td style="padding:6px 0;text-align:right;">${esc(paymentLabel(paymentMethod))}</td></tr>
        </table>
        <div style="border-top:1px solid #ECEBE7;margin:14px 0;"></div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#6B6B6B;width:42%;">Customer Name</td><td style="padding:6px 0;text-align:right;"><strong>${esc(order.customer_name)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6B6B6B;">Customer Email</td><td style="padding:6px 0;text-align:right;">${esc(order.email)}</td></tr>
          <tr><td style="padding:6px 0;color:#6B6B6B;">Customer Phone</td><td style="padding:6px 0;text-align:right;">${esc(order.phone)}</td></tr>
          <tr><td style="padding:6px 0;color:#6B6B6B;">Delivery Address</td><td style="padding:6px 0;text-align:right;">${esc(order.address)}${order.city ? `, ${esc(order.city)}` : ''}</td></tr>
          ${order.notes ? `<tr><td style="padding:6px 0;color:#6B6B6B;">Notes</td><td style="padding:6px 0;text-align:right;">${esc(order.notes)}</td></tr>` : ''}
        </table>
        <div style="border-top:1px solid #ECEBE7;margin:14px 0;"></div>
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:1.5px;color:#6B6B6B;text-transform:uppercase;">Products</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <th style="padding:8px 12px;border-bottom:2px solid #0A0A0A;text-align:left;font-size:11px;letter-spacing:1px;color:#6B6B6B;">ITEM (SIZE • COLOR • QTY)</th>
            <th style="padding:8px 12px;border-bottom:2px solid #0A0A0A;text-align:right;font-size:11px;letter-spacing:1px;color:#6B6B6B;">UNIT / TOTAL</th>
          </tr>
          ${rows}
        </table>
        <table style="width:100%;font-size:14px;margin-top:16px;">
          <tr><td style="padding:4px 0;color:#6B6B6B;">Subtotal</td><td style="padding:4px 0;text-align:right;">${money(order.subtotal)}</td></tr>
          <tr><td style="padding:4px 0;color:#6B6B6B;">Shipping</td><td style="padding:4px 0;text-align:right;">${money(order.shipping)}</td></tr>
          ${Number(order.discount_amount) > 0
            ? `<tr><td style="padding:4px 0;color:#6B6B6B;">Discount${order.discount_code ? ` (${esc(order.discount_code)})` : ''}</td><td style="padding:4px 0;text-align:right;">-${money(order.discount_amount)}</td></tr>`
            : ''}
          <tr>
            <td style="padding:10px 0;font-weight:bold;font-size:16px;border-top:2px solid #0A0A0A;">FINAL TOTAL</td>
            <td style="padding:10px 0;font-weight:bold;font-size:16px;border-top:2px solid #0A0A0A;text-align:right;">${money(order.total)}</td>
          </tr>
        </table>
        ${order.id ? `<p style="margin-top:24px;font-size:12px;color:#6B6B6B;">Order ID: ${esc(order.id)}</p>` : ''}
      </div>
      <div style="background:#F7F6F2;padding:14px 24px;font-size:11px;color:#6B6B6B;">
        STREET PANTS — Premium streetwear. Designed in Cairo.
      </div>
    </div>
  </div>`

  return { subject: `New STREET PANTS Order #${order.number}`, html }
}

function buildTestEmail() {
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#F7F6F2;padding:24px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #ECEBE7;">
      <div style="background:#0A0A0A;color:#ffffff;padding:20px 24px;">
        <div style="font-size:18px;font-weight:bold;letter-spacing:2px;">STREET PANTS</div>
      </div>
      <div style="padding:28px 24px;">
        <h1 style="margin:0;font-size:20px;color:#0A0A0A;">Test Email</h1>
        <p style="margin-top:12px;font-size:15px;line-height:1.6;color:#3A3A3A;">
          Your order notification email system is working correctly.
        </p>
      </div>
      <div style="background:#F7F6F2;padding:14px 24px;font-size:11px;color:#6B6B6B;">
        STREET PANTS — Premium streetwear. Designed in Cairo.
      </div>
    </div>
  </div>`
  return { subject: 'STREET PANTS — Test Email', html }
}

function resendHint(status, msg) {
  if (status === 403) {
    return (
      `${msg} — Resend restriction: the default free sender (onboarding@resend.dev) can ONLY deliver ` +
      `to the Resend account owner's own address. To deliver to your store email: (a) create the Resend ` +
      `account with the store email, or (b) verify a domain in Resend and set the EMAIL_FROM env var.`
    )
  }
  return msg
}

async function sendViaResend(opts) {
  let res
  try {
    res = await fetch(`${RESEND_BASE}/emails`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: opts.from, to: [opts.to], subject: opts.subject, html: opts.html }),
    })
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e)
    log('error', 'Resend request failed to connect', { message: m })
    return { ok: false, error: `Could not reach the email provider (${m})` }
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const raw = body?.message || body?.name || `email provider HTTP ${res.status}`
    const msg = resendHint(res.status, String(raw))
    log('error', 'Resend rejected the email', { status: res.status, provider: String(raw).slice(0, 200) })
    return { ok: false, error: msg }
  }
  log('info', 'Email accepted by provider', { id: body?.id ?? null, to: opts.to })
  return { ok: true }
}

async function sbServiceFetch(path, init = {}) {
  const url = `${process.env.SUPABASE_URL}/rest/v1${path}`
  const headers = {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    ...(init.headers ?? {}),
  }
  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    log('error', 'Supabase request failed', { status: res.status, detail: text.slice(0, 200) })
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.status === 204 ? null : await res.json().catch(() => null)
}

const hasServiceKey = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' })
  try {
    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        return res.status(400).json({ ok: false, error: 'Body must be valid JSON' })
      }
    }
    if (!body || typeof body !== 'object') body = {}

    if (!process.env.RESEND_API_KEY) {
      log('error', 'Missing RESEND_API_KEY environment variable')
      return res.status(500).json({ ok: false, error: 'RESEND_API_KEY is not set in Vercel environment variables.' })
    }
    const from = process.env.EMAIL_FROM || 'STREET PANTS <onboarding@resend.dev>'

    // ---------------- TEST MODE ----------------
    if (body.test) {
      // Recipient: the address passed by the Admin page (the saved setting),
      // falling back to reading the saved setting server-side.
      const to = String(body.to ?? '').trim() || (await readSavedNotificationEmail())
      if (!to) return res.status(400).json({ ok: false, error: 'No notification email saved. Save one in Admin → Order Email Notifications first.' })
      if (!isEmail(to)) return res.status(400).json({ ok: false, error: `Invalid email address: ${to}` })
      const { subject, html } = buildTestEmail()
      const r = await sendViaResend({ from, to, subject, html })
      if (!r.ok) return res.status(502).json({ ok: false, error: r.error })
      return res.status(200).json({ ok: true })
    }

    // ---------------- ORDER MODE ----------------
    const orderId = String(body.orderId ?? body.order?.id ?? '')
    if (!orderId) return res.status(400).json({ ok: false, error: 'orderId is required' })

    // Recipient: ALWAYS and ONLY the email currently saved in
    // Admin → Order Email Notifications (read live from the EXISTING
    // site_settings table). No hardcoded addresses, no fallbacks.
    const to = await readSavedNotificationEmail()

    // Optional hardening: with a service key, trust the DB for the order too.
    let order = null
    let dbNotifiedRow = null
    if (hasServiceKey() && isUuid(orderId)) {
      const notifiedRow = await sbServiceFetch(`/site_settings?select=value&key=eq.notifiedOrders`)
        .then((rows) => (Array.isArray(rows) ? rows[0] : null))
        .catch(() => null)
      const notified = Array.isArray(notifiedRow?.value) ? notifiedRow.value : []
      if (notified.includes(orderId)) {
        log('info', 'Duplicate notification suppressed (db)', { orderId })
        return res.status(200).json({ ok: true, duplicate: true })
      }
      dbNotifiedRow = notifiedRow
      try {
        const raw = await sbServiceFetch(`/orders?id=eq.${encodeURIComponent(orderId)}&select=*,order_items(*)`, {
          headers: { Accept: 'application/vnd.pgrst.object+json' },
        })
        order = normalizeOrder(raw, orderId)
      } catch {
        order = null
      }
      if (!order) return res.status(404).json({ ok: false, error: 'Order not found' })
    } else {
      // No service key: use the order payload sent by the checkout
      // (built from the successfully created order).
      order = normalizeOrder(body.order, orderId)
      if (!order) {
        return res.status(400).json({ ok: false, error: 'order payload is required (or configure SUPABASE_SERVICE_ROLE_KEY for server-side loading)' })
      }
    }

    if (!to) {
      return res.status(400).json({ ok: false, error: 'No notification email saved. Save one in Admin → Order Email Notifications first.' })
    }
    if (!isEmail(to)) return res.status(400).json({ ok: false, error: `Saved notification email is not a valid address: ${to}` })

    // In-memory dedupe: one email per order per instance window.
    const prev = SENT.get(orderId)
    if (prev && Date.now() - prev < DEDUPE_MS) {
      log('info', 'Duplicate notification suppressed (memory)', { orderId })
      return res.status(200).json({ ok: true, duplicate: true })
    }

    const { subject, html } = buildOrderEmail(order, body.paymentMethod ? String(body.paymentMethod) : undefined)
    const r = await sendViaResend({ from, to, subject, html })
    if (!r.ok) {
      // The order stays created and untouched — email failure never affects it.
      return res.status(502).json({ ok: false, error: r.error })
    }

    SENT.set(orderId, Date.now())
    if (hasServiceKey() && isUuid(orderId)) {
      try {
        const notified = Array.isArray(dbNotifiedRow?.value) ? dbNotifiedRow.value : []
        notified.push(orderId)
        if (dbNotifiedRow) {
          await sbServiceFetch(`/site_settings?key=eq.notifiedOrders`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify({ value: notified }),
          })
        } else {
          await sbServiceFetch(`/site_settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify({ key: 'notifiedOrders', value: notified }),
          })
        }
      } catch {
        /* dedupe persistence is best-effort */
      }
    }

    log('info', 'Order email sent', { orderId, number: order.number, to })
    return res.status(200).json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    log('error', 'Unhandled handler error', { message: message.slice(0, 300) })
    return res.status(500).json({ ok: false, error: message.slice(0, 300) })
  }
}
