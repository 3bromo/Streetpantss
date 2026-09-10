// ============================================================================
// STREET PANTS — order email notification (Supabase Edge Function).
//
//   POST { orderId, paymentMethod }   → emails the order (deduped, 1 per order)
//   POST { test: true, to: "email" }  → sends a real test email
//
// NOTE: the website also has a Vercel serverless fallback (api/order-email.ts)
// so emails work even before this function is deployed. If both exist, the
// shared dedupe list (site_settings.notifiedOrders) guarantees ONE email.
//
// Deploy (one time, from your machine with the Supabase CLI):
//   supabase functions deploy send-order-notification --no-verify-jwt
//   supabase secrets set RESEND_API_KEY=re_xxx
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<from Dashboard → Settings → API>
// Optional:
//   supabase secrets set EMAIL_FROM="STREET PANTS <orders@yourdomain.com>"
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const money = (n: unknown): string => `${Number(n ?? 0).toLocaleString('en-US')} EGP`
const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const paymentLabel = (p?: string): string => {
  const v = String(p ?? '').toLowerCase()
  if (v === 'cod' || v === 'cash') return 'Cash on Delivery'
  if (v === 'card') return 'Card'
  return v ? v.toUpperCase() : '—'
}

function buildOrderEmail(order: any, paymentMethod?: string): { subject: string; html: string } {
  const items: any[] = order.order_items ?? []
  const rows = items
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
          <tr><td style="padding:6px 0;color:#6B6B6B;">Delivery Address</td><td style="padding:6px 0;text-align:right;">${esc(order.address)}, ${esc(order.city)}</td></tr>
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
        <p style="margin-top:24px;font-size:12px;color:#6B6B6B;">Order ID: ${esc(order.id)}</p>
      </div>
      <div style="background:#F7F6F2;padding:14px 24px;font-size:11px;color:#6B6B6B;">
        STREET PANTS — Premium streetwear. Designed in Cairo.
      </div>
    </div>
  </div>`

  return { subject: `New STREET PANTS Order #${order.number}`, html }
}

function buildTestEmail(): { subject: string; html: string } {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { ok: false, error: 'POST only' })

  try {
    const body = await req.json().catch(() => ({}))
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
    if (!RESEND_API_KEY) return json(500, { ok: false, error: 'RESEND_API_KEY secret is not set.' })
    const from = Deno.env.get('EMAIL_FROM') ?? 'STREET PANTS <onboarding@resend.dev>'

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !serviceKey) return json(500, { ok: false, error: 'Missing Supabase env' })
    const admin = createClient(supabaseUrl, serviceKey)

    // ---------------- TEST MODE ----------------
    if (body.test) {
      let to = String(body.to ?? '').trim()
      if (!to) {
        const { data: row } = await admin.from('site_settings').select('value').eq('key', 'orderNotificationEmail').maybeSingle()
        to = String(row?.value ?? '').trim()
      }
      if (!to) return json(400, { ok: false, error: 'No notification email saved in Admin → Order Email Notifications.' })
      const { subject, html } = buildTestEmail()
      const sendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, html }),
      })
      const sendBody = await sendRes.json().catch(() => ({}))
      if (!sendRes.ok) return json(502, { ok: false, error: (sendBody as any)?.message ?? `Resend HTTP ${sendRes.status}` })
      return json(200, { ok: true })
    }

    // ---------------- ORDER MODE ----------------
    const orderId = String(body.orderId ?? '')
    if (!orderId) return json(400, { ok: false, error: 'orderId is required' })

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('*, order_items (*)')
      .eq('id', orderId)
      .maybeSingle()
    if (orderErr) return json(500, { ok: false, error: orderErr.message })
    if (!order) return json(404, { ok: false, error: 'Order not found' })

    // Dedupe: one email per order, ever.
    const { data: notifiedRow } = await admin.from('site_settings').select('value').eq('key', 'notifiedOrders').maybeSingle()
    const notified: string[] = Array.isArray(notifiedRow?.value) ? notifiedRow.value : []
    if (notified.includes(orderId)) return json(200, { ok: true, duplicate: true })

    // Recipient: the email saved in Admin → Order Email Notifications.
    const { data: emailRow } = await admin.from('site_settings').select('value').eq('key', 'orderNotificationEmail').maybeSingle()
    const to = String(emailRow?.value ?? '').trim() || String(Deno.env.get('ORDER_NOTIFICATION_EMAIL') ?? '').trim()
    if (!to) return json(400, { ok: false, error: 'No notification email saved in Admin → Order Email Notifications.' })

    const { subject, html } = buildOrderEmail(order, body.paymentMethod ? String(body.paymentMethod) : undefined)
    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    })
    const sendBody = await sendRes.json().catch(() => ({}))
    if (!sendRes.ok) {
      // The order stays created and untouched — email failure never affects it.
      return json(502, { ok: false, error: (sendBody as any)?.message ?? `Resend HTTP ${sendRes.status}` })
    }

    notified.push(orderId)
    await admin.from('site_settings').upsert({ key: 'notifiedOrders', value: notified }, { onConflict: 'key' })

    return json(200, { ok: true })
  } catch (e) {
    return json(500, { ok: false, error: e instanceof Error ? e.message : String(e) })
  }
})
