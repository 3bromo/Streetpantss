import { useEffect, useState } from 'react'
import { CheckCircle2, Mail, Save, Send, XCircle } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import { getBackend } from '../lib/backend'
import { useUI } from '../context/UIContext'
import { testOrderEmail } from '../lib/notify'
import { AdminPageHead, Card, Spinner } from './ui'

/**
 * Order email notifications.
 * After every SUCCESSFUL checkout the website triggers a real server-side
 * email (Supabase Edge Function, with automatic fallback to the Vercel
 * serverless route /api/order-email). The order is emailed to the address
 * saved here — stored in site_settings (key: orderNotificationEmail).
 */
export default function AdminNotificationsPage() {
  usePageTitle('Admin — Order Emails')
  const backend = getBackend()
  const { pushToast } = useUI()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedEmail, setSavedEmail] = useState('')
  const [email, setEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null)
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    backend
      .getSettings()
      .then((s) => {
        const v = String((s as unknown as Record<string, unknown>).orderNotificationEmail ?? '').trim()
        setSavedEmail(v)
        setEmail(v)
      })
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    const v = email.trim()
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      pushToast({ title: 'Invalid email', sub: 'Enter a valid email address' })
      setSaveResult({ ok: false, message: 'Invalid email address — nothing was saved.' })
      return
    }
    setSaving(true)
    setSaveResult(null)
    try {
      await backend.updateSettings({ orderNotificationEmail: v } as never)
      // PROVE persistence: re-read the value straight from the database.
      const st = (await backend.getSettings()) as unknown as Record<string, unknown>
      const persisted = String(st.orderNotificationEmail ?? '').trim()
      if (persisted !== v) {
        setSaveResult({ ok: false, message: `The database still returns "${persisted || '(empty)'}" — the write was rejected.` })
        pushToast({ title: 'Could not save', sub: 'Write rejected by the database' })
      } else {
        setSavedEmail(v)
        setSaveResult({ ok: true, message: `Saved & persisted: ${persisted}` })
        pushToast({ title: 'Saved', sub: `Orders will be emailed to ${v}` })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const hint =
        msg.includes('row-level security') || msg.includes('42501')
          ? ' Your admin account lacks write permission on site_settings. Run ONCE in Supabase SQL Editor: update public.profiles set is_admin = true where email = \'<your admin login email>\';'
          : ''
      setSaveResult({ ok: false, message: msg + hint })
      pushToast({ title: 'Could not save', sub: msg })
    } finally {
      setSaving(false)
    }
  }

  /** Sends a REAL test email via the server-side route and shows the actual result. */
  const sendTest = async () => {
    const target = savedEmail.trim() || email.trim()
    if (!target) {
      setTestResult({ ok: false, error: 'Save a notification email first.' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const r = await testOrderEmail(target)
      setTestResult(r)
      if (r.ok) pushToast({ title: 'Test email sent', sub: `Check the inbox of ${target}` })
      else pushToast({ title: 'Test email failed', sub: r.error })
    } catch (e) {
      setTestResult({ ok: false, error: e instanceof Error ? e.message : String(e) })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <Spinner />

  const dirty = email.trim() !== savedEmail

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHead
        title="Order Email Notifications"
        sub="Get a real email for every new order placed on the website."
        actions={
          dirty ? (
            <button onClick={save} disabled={saving} className="btn btn-dark btn-sm">
              {saving ? <Spinner /> : (
                <>
                  <Save size={14} /> Save
                </>
              )}
            </button>
          ) : undefined
        }
      />

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ECEBE7] text-ink">
            <Mail size={18} />
          </span>
          <div>
            <p className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-navy-950">
              Order Notification Email
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy-900/45">
              Where new-order emails are delivered
            </p>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Email address</span>
          <input
            className="input mt-1.5 font-mono"
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="orders@streetpants.com"
          />
        </label>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-900/45">
          Leave empty to disable order emails.
        </p>

        {saveResult && (
          <div
            className={`mt-4 flex items-start gap-2.5 border px-4 py-3 ${
              saveResult.ok ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'
            }`}
          >
            {saveResult.ok ? (
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-700" />
            ) : (
              <XCircle size={17} className="mt-0.5 shrink-0 text-red-600" />
            )}
            <p className={`min-w-0 break-words font-mono text-[11px] leading-relaxed ${saveResult.ok ? 'text-emerald-800' : 'text-red-700'}`}>
              {saveResult.message}
            </p>
          </div>
        )}

        <div className="mt-5 border-t border-navy-900/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Notification Email</p>
              <p className="mt-1 truncate font-mono text-[13px] text-navy-950" dir="ltr">
                {savedEmail || '—'}
              </p>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Status</p>
              <p className={`mt-1 font-mono text-[12px] font-bold uppercase tracking-[0.14em] ${savedEmail ? 'text-emerald-700' : 'text-red-600'}`}>
                {savedEmail ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <button onClick={sendTest} disabled={testing || !savedEmail} className="btn btn-outline-dark disabled:cursor-not-allowed disabled:opacity-40">
              {testing ? <Spinner /> : <Send size={14} />} Send Test Email
            </button>
          </div>

          {testResult && (
            <div
              className={`mt-4 flex items-start gap-2.5 border px-4 py-3 ${
                testResult.ok ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-700" />
              ) : (
                <XCircle size={17} className="mt-0.5 shrink-0 text-red-600" />
              )}
              <div className="min-w-0">
                <p className={`font-mono text-[11px] uppercase tracking-[0.14em] ${testResult.ok ? 'text-emerald-800' : 'text-red-700'}`}>
                  {testResult.ok ? 'Test email sent successfully.' : 'Failed to send test email.'}
                </p>
                {testResult.error && (
                  <p className="mt-1 break-words font-mono text-[11px] text-red-700/85">{testResult.error}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <p className="font-display text-[12px] font-black uppercase tracking-[0.14em] text-navy-950">How it works</p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[13.5px] leading-relaxed text-ink/65">
          <li>When a customer completes checkout, the order is created first — then the email is triggered.</li>
          <li>The email is sent from the server (Resend) and contains the full order details.</li>
          <li>Each order is emailed exactly once — refreshes and retries never duplicate it.</li>
          <li>If the email fails for any reason, the order stays created and safe.</li>
          <li>
            Required server key: <code className="rounded bg-soft px-1.5 py-0.5 font-mono text-[11px]">RESEND_API_KEY</code> (already
            configured). Optional: <code className="rounded bg-soft px-1.5 py-0.5 font-mono text-[11px]">EMAIL_FROM</code> with a
            verified Resend domain to deliver to any address.
          </li>
          <li>
            Note: Resend's free default sender can only deliver to the Resend account owner's own inbox. If a test to another
            address fails with a 403, verify a domain in Resend (and set EMAIL_FROM) or sign up to Resend with this store email.
          </li>
        </ul>
      </Card>
    </div>
  )
}
