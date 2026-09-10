import { Order } from './types'

/**
 * Order email notification — REAL server-side email via the Vercel
 * serverless route `/api/order-email` (Resend, server-side keys only).
 *
 * The checkout sends the order data it already has (built from the
 * successfully created order) plus the notification email saved in
 * Admin → Order Email Notifications. The server validates everything,
 * dedupes per order id, and returns 200 ONLY when Resend accepts the email.
 *
 * Checkout is NEVER blocked or broken by email failures: an email failure
 * can never cancel, delete or roll back a successfully created order.
 */
export async function sendOrderNotification(
  orderId: string,
  paymentMethod?: string,
  order?: Order | null,
  notificationEmail?: string,
): Promise<void> {
  try {
    const res = await fetch('/api/order-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        paymentMethod,
        order: order ?? undefined,
        to: notificationEmail || undefined,
      }),
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null
      console.warn('[notify] order email skipped:', j?.error ?? `HTTP ${res.status}`)
    }
  } catch (e) {
    console.warn('[notify] order email skipped:', e)
  }
}

/**
 * Admin "Send Test Email" — sends a REAL test email to the saved address.
 * Returns the ACTUAL result/error from the backend (never fakes success).
 */
export async function testOrderEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/order-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true, to }),
    })
    const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
    if (res.ok && j?.ok) return { ok: true }
    return { ok: false, error: j?.error ?? `HTTP ${res.status}` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
