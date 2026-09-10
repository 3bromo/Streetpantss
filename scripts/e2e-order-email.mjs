import http from 'node:http'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

// env MUST exist before the module loads (RESEND_BASE / SB_URL read at load time)
process.env.RESEND_API_KEY = 're-local-test'
process.env.RESEND_BASE_URL = 'http://127.0.0.1:9102'
process.env.SUPABASE_URL = 'http://127.0.0.1:9101'

const ORDER_ID = '11111111-2222-4333-8444-555555555555'
const ORDER_ID2 = 'cccccccc-dddd-4eee-8fff-cccccccccccc'
const resendCaptures = []
let fail403Next = false
let notifiedOrders = []
let savedEmail = '3broosnfro15@gmail.com'

// ---------- mock Supabase REST ----------
const sb = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  let raw = ''
  req.on('data', (c) => (raw += c))
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json')
    if (url.pathname === '/rest/v1/orders') {
      const wantId = (url.searchParams.get('id') || '').replace(/^eq\./, '')
      if (wantId !== ORDER_ID && wantId !== ORDER_ID2) {
        res.statusCode = 404
        return res.end(JSON.stringify({ message: 'no rows' }))
      }
      return res.end(
        JSON.stringify({
          id: wantId,
          number: 'SP-1024',
          customer_name: 'Ahmed Hassan',
          email: 'customer@example.com',
          phone: '+20 100 555 0123',
          address: '12 Tahrir St, Dokki',
          city: 'Giza',
          status: 'new',
          subtotal: 2598,
          shipping: 75,
          discount_code: 'WELCOME10',
          discount_amount: 100,
          total: 2573,
          created_at: '2026-08-14T15:30:00.000Z',
          order_items: [{ name: 'Street Cargo Pants', color: 'Black', size: 'S', qty: 1, unit_price: 1499 }],
        }),
      )
    }
    if (url.pathname === '/rest/v1/site_settings' && req.method === 'GET') {
      const key = (url.searchParams.get('key') || '').replace(/^eq\./, '')
      if (key === 'notifiedOrders') return res.end(JSON.stringify(notifiedOrders.length ? [{ value: notifiedOrders }] : []))
      if (key === 'orderNotificationEmail') return res.end(JSON.stringify([{ value: savedEmail }]))
      return res.end('[]')
    }
    if (url.pathname === '/rest/v1/site_settings' && (req.method === 'PATCH' || req.method === 'POST')) {
      notifiedOrders = JSON.parse(raw).value ?? notifiedOrders
      res.statusCode = req.method === 'PATCH' ? 204 : 201
      return res.end(req.method === 'PATCH' ? undefined : '{}')
    }
    res.statusCode = 404
    res.end('{}')
  })
})

// ---------- mock Resend ----------
const resend = http.createServer((req, res) => {
  let raw = ''
  req.on('data', (c) => (raw += c))
  req.on('end', () => {
    if (fail403Next) {
      fail403Next = false
      res.statusCode = 403
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify({ statusCode: 403, name: 'forbidden', message: 'You are not allowed to send to this address' }))
    }
    resendCaptures.push(JSON.parse(raw))
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ id: 'mock-' + resendCaptures.length }))
  })
})

// ---------- mount the real handler ----------
const handler = require(process.env.HANDLER_CJS || '/home/user/order-email-test.cjs').default
const api = http.createServer((req, res) => {
  let raw = ''
  req.on('data', (c) => (raw += c))
  req.on('end', () => {
    const wrapped = {
      status(c) {
        res.statusCode = c
        return this
      },
      json(b) {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(b))
        return this
      },
    }
    handler({ method: req.method, body: raw }, wrapped)
  })
})

const listen = (s, p) => new Promise((r) => s.listen(p, '127.0.0.1', r))
await listen(sb, 9101)
await listen(resend, 9102)
await listen(api, 9103)

const post = async (body) => {
  const r = await fetch('http://127.0.0.1:9103/api/order-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: r.status, json: await r.json() }
}

let pass = true
const check = (name, cond, extra = '') => {
  console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : ''))
  pass = pass && cond
}

// client receipt shape exactly like CheckoutPage builds (camelCase)
const clientReceipt = {
  id: ORDER_ID,
  number: 'SP-2048',
  customerName: 'Sara Ali',
  email: 'sara@example.com',
  phone: '+20 122 000 1111',
  address: '5 Zamalek St',
  city: 'Cairo',
  status: 'new',
  subtotal: 1499,
  shipping: 0,
  discountCode: null,
  discountAmount: 0,
  total: 1499,
  items: [{ productId: 'street-cargo-pants', name: 'Street Cargo Pants', color: 'Beige', size: 'M', qty: 1, unitPrice: 1499 }],
  createdAt: '2026-08-14T16:00:00.000Z',
}

console.log('--- A) order mode, recipient LIVE from existing settings ---')
delete process.env.SUPABASE_SERVICE_ROLE_KEY
const savedEmailBefore = savedEmail
let r = await post({ orderId: ORDER_ID, paymentMethod: 'cod', order: clientReceipt })
check('A1 200 with client payload, no service key', r.status === 200 && r.json.ok === true, `status=${r.status}`)
let cap = resendCaptures[0]
check('A2 subject', cap?.subject === 'New STREET PANTS Order #SP-2048', cap?.subject)
check('A3 recipient = exactly the saved admin setting', cap?.to?.[0] === savedEmailBefore, cap?.to?.[0])
const h1 = cap?.html ?? ''
check('A4 fields mapped (name/size/color/qty)', h1.includes('Sara Ali') && h1.includes('Size: M') && h1.includes('Color: Beige') && h1.includes('Qty: 1'))
check('A5 totals present', h1.includes('1,499 EGP') && h1.includes('Cash on Delivery'))
r = await post({ orderId: ORDER_ID, paymentMethod: 'cod', order: clientReceipt })
check('A6 duplicate suppressed (memory)', r.status === 200 && r.json.duplicate === true)
check('A7 still 1 email', resendCaptures.length === 1)
savedEmail = 'newowner@shop.com' // admin changes the email in the panel
r = await post({ orderId: '55555555-5555-4555-8555-555555555555', paymentMethod: 'cod', order: { ...clientReceipt, number: 'SP-5001', id: '55555555-5555-4555-8555-555555555555' } })
cap = resendCaptures[resendCaptures.length - 1]
check('A8 next order goes to NEW saved email (old stops)', r.status === 200 && cap?.to?.[0] === 'newowner@shop.com', cap?.to?.[0])
savedEmail = '' // admin clears the field
r = await post({ orderId: '66666666-6666-4666-8666-666666666666', paymentMethod: 'cod', order: { ...clientReceipt, number: 'SP-6001', id: '66666666-6666-4666-8666-666666666666' }, to: 'fallback@x.com' })
check('A9 empty saved email → 400, nothing sent', r.status === 400, `status=${r.status}`)
savedEmail = '3broosnfro15@gmail.com'
r = await post({ orderId: '77777777-7777-4777-8777-777777777777', paymentMethod: 'cod' })
check('A10 missing order payload → 400', r.status === 400, `status=${r.status}`)

console.log('--- B) Resend 403 handling ---')
fail403Next = true
r = await post({ orderId: '44444444-4444-4444-8444-444444444444', paymentMethod: 'card', order: { ...clientReceipt, number: 'SP-403', id: '44444444-4444-4444-8444-444444444444' } })
check('B1 403 → 502 with actionable hint', r.status === 502 && String(r.json.error).includes('Resend account'), JSON.stringify(r.json).slice(0, 120))

console.log('--- C) optional service key: server-side load + db dedupe ---')
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk-local-test'
notifiedOrders = []
r = await post({ orderId: ORDER_ID2, paymentMethod: 'cod' })
check('C1 200 via DB load', r.status === 200 && r.json.ok === true && !r.json.duplicate, `status=${r.status}`)
cap = resendCaptures[resendCaptures.length - 1]
check('C2 db-path recipient = saved setting', cap?.to?.[0] === '3broosnfro15@gmail.com', cap?.to?.[0])
check('C3 db dedupe recorded', notifiedOrders.includes(ORDER_ID2))
r = await post({ orderId: ORDER_ID2, paymentMethod: 'cod' })
check('C4 duplicate suppressed (db)', r.status === 200 && r.json.duplicate === true)

console.log('--- D) test mode + validation ---')
r = await post({ test: true, to: 'owner@shop.com' })
check('D1 test 200', r.status === 200)
check('D2 test subject', resendCaptures[resendCaptures.length - 1]?.subject === 'STREET PANTS — Test Email')
r = await post({ test: true })
check('D3 test without `to` → saved setting', r.status === 200 && resendCaptures[resendCaptures.length - 1]?.to?.[0] === '3broosnfro15@gmail.com')
r = await post({ test: true, to: 'nope' })
check('D4 bad email → 400', r.status === 400)
r = await post({})
check('D5 no orderId → 400', r.status === 400)
const g = await fetch('http://127.0.0.1:9103/api/order-email')
check('D6 GET → 405', g.status === 405)

console.log('ALL E2E:', pass)
process.exit(pass ? 0 : 1)
