import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Lock, Tag, X } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import Reveal from '../components/Reveal'
import SmartImage from '../components/SmartImage'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'
import { getBackend } from '../lib/backend'
import { Order, Discount } from '../lib/types'
import { effectivePrice } from '../lib/stock'
import { formatPrice } from '../lib/format'
import { sizeLabel } from '../lib/categories'
import { sendOrderNotification } from '../lib/notify'

const CITIES = ['Cairo', 'Giza', 'Alexandria', 'Mansoura', 'Tanta', 'Aswan', 'Other']

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-red-500">{error}</p>}
    </label>
  )
}

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[12px] text-navy-900/40">{n}</span>
      <h2 className="font-display text-lg font-black uppercase tracking-tight text-navy-950">{title}</h2>
    </div>
  )
}

export default function CheckoutPage() {
  usePageTitle('Checkout')
  const { items, count, clearCart } = useCart()
  const { getProduct, settings, refresh } = useCatalog()
  const { t, lang } = useLang()
  const backend = getBackend()
  const navigate = useNavigate()

  const [placed, setPlaced] = useState<Order | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    email: '',
    first: '',
    last: '',
    phone: '',
    address: '',
    city: 'Cairo',
    notes: '',
  })
  const [delivery, setDelivery] = useState<'standard' | 'express'>('standard')
  const [payment, setPayment] = useState<'cod' | 'card'>('cod')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // discount code
  const [codeInput, setCodeInput] = useState('')
  const [applied, setApplied] = useState<Discount | null>(null)
  const [codeError, setCodeError] = useState('')

  const subtotal = items.reduce((sum, i) => {
    const p = getProduct(i.productId)
    return sum + (p ? effectivePrice(p) * i.qty : 0)
  }, 0)

  const discountAmount = applied
    ? applied.type === 'percent'
      ? Math.round((subtotal * applied.value) / 100)
      : Math.min(applied.value, subtotal)
    : 0

  const shippingCost =
    items.length === 0
      ? 0
      : delivery === 'standard'
        ? subtotal - discountAmount >= settings.freeThreshold
          ? 0
          : settings.standardShipping
        : settings.expressShipping
  const total = Math.max(0, subtotal - discountAmount + shippingCost)

  const applyCode = async () => {
    if (!codeInput.trim()) return
    const d = await backend.validateDiscount(codeInput)
    if (!d) {
      setCodeError('Invalid or expired code')
      setApplied(null)
      return
    }
    setApplied(d)
    setCodeError('')
  }

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const placeOrder = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.first.trim()) errs.first = 'Required'
    if (!form.last.trim()) errs.last = 'Required'
    if (form.phone.replace(/\D/g, '').length < 8) errs.phone = 'Enter a valid phone number'
    if (!form.address.trim()) errs.address = 'Required'
    if (payment === 'card') {
      if (card.number.replace(/\s/g, '').length < 12) errs.cardNumber = 'Enter a valid card number'
      if (!card.name.trim()) errs.cardName = 'Required'
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(card.expiry)) errs.cardExpiry = 'MM/YY'
      if (card.cvc.length < 3) errs.cardCvc = 'CVC'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    try {
      const created = await backend.placeOrder({
        customerName: `${form.first} ${form.last}`,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        notes: form.notes || undefined,
        delivery,
        discountCode: applied?.code ?? null,
        discountAmount,
        items: items.map((i) => ({ productId: i.productId, color: i.color, size: i.size, qty: i.qty })),
      })
      // Receipt built from values already known client-side: under RLS the
      // anonymous customer cannot read `orders` back, and none is needed.
      const receipt: Order = {
        id: created.id,
        number: created.number,
        customerName: `${form.first} ${form.last}`,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        notes: form.notes || undefined,
        status: 'new',
        subtotal,
        shipping: shippingCost,
        discountCode: applied?.code ?? null,
        discountAmount,
        total,
        items: items.map((i) => {
          const p = getProduct(i.productId)
          return {
            productId: i.productId,
            name: p?.name ?? i.productId,
            color: i.color,
            size: i.size,
            qty: i.qty,
            unitPrice: p ? effectivePrice(p) : 0,
          }
        }),
        createdAt: new Date().toISOString(),
      }
      // Fire-and-forget order email notification (server-side, Resend).
      // Sends the exact order data + the notification email saved in Admin.
      void sendOrderNotification(
        created.id,
        payment,
        receipt,
        String((settings as unknown as Record<string, unknown>).orderNotificationEmail ?? ''),
      )
      clearCart()
      await refresh()
      setPlaced(receipt)
      window.scrollTo({ top: 0 })
    } catch (err) {
      setErrors({ phone: err instanceof Error ? err.message : 'Could not place the order. Please try again.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  // ---- success state ----
  if (placed) {
    return (
      <div className="bg-soft">
        <div className="container-sp flex min-h-[80vh] items-center py-16">
          <Reveal className="mx-auto w-full max-w-2xl">
            <div className="border border-navy-900/10 bg-white p-8 md:p-12">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-white">
                <Check size={24} strokeWidth={2.4} />
              </span>
              <p className="eyebrow mt-7 text-navy-800/60">{t('co.confirmed')}</p>
              <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-navy-950 sm:text-4xl">
                {t('co.thanks')}, {placed.customerName.split(' ')[0]}.
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-ink/60">
                Your order <span className="font-mono text-navy-950">{placed.number}</span> is confirmed. A
                confirmation email is on its way to {placed.email}.
              </p>

              <div className="mt-8 border-t border-navy-900/10 pt-6">
                {placed.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                    <p className="min-w-0 truncate text-[13px]">
                      <span className="font-display font-bold uppercase tracking-wide">{it.name}</span>
                      <span className="ml-2 font-mono text-[11px] uppercase text-navy-900/50">
                        {it.color} / {it.size} × {it.qty}
                      </span>
                    </p>
                    <p className="shrink-0 font-mono text-[13px]">{formatPrice(it.unitPrice * it.qty)}</p>
                  </div>
                ))}
                <div className="mt-4 space-y-2 border-t border-navy-900/10 pt-4">
                  <div className="flex justify-between text-[13px] text-ink/60">
                    <span>{t('cart.subtotal')}</span>
                    <span className="font-mono">{formatPrice(placed.subtotal)}</span>
                  </div>
                  {placed.discountAmount > 0 && (
                    <div className="flex justify-between text-[13px] text-navy-600">
                      <span>{t('co.discount')} {placed.discountCode ? `(${placed.discountCode})` : ''}</span>
                      <span className="font-mono">−{formatPrice(placed.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px] text-ink/60">
                    <span>{t('cart.shipping')}</span>
                    <span className="font-mono">{placed.shipping === 0 ? t('co.free') : formatPrice(placed.shipping)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-display text-[13px] font-bold uppercase tracking-[0.16em]">{t('cart.total')}</span>
                    <span className="font-mono text-[16px]">{formatPrice(placed.total)}</span>
                  </div>
                </div>
              </div>

              <Link to="/shop" className="btn btn-dark mt-6 w-full">
                {t('co.continue')}
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    )
  }

  // ---- empty cart guard ----
  if (items.length === 0) {
    return (
      <div className="bg-soft">
        <div className="container-sp flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
          <Reveal>
            <p className="eyebrow text-navy-800/60">{t('co.title')}</p>
            <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-navy-950">
              {t('co.emptyTitle')}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink/55">
              {t('co.emptySub')}
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/shop" className="btn btn-dark">
                Shop Now
              </Link>
              <button onClick={() => navigate(-1)} className="btn btn-outline-dark">
                {t('co.goBack')}
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-soft">
      <div className="container-sp py-12 md:py-16">
        <Reveal>
          <p className="eyebrow text-navy-800/60">{t('co.secure')}</p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight text-navy-950 sm:text-5xl">
            Checkout
          </h1>
        </Reveal>

        <form onSubmit={placeOrder} noValidate className="mt-10 grid items-start gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-7">
            <Reveal delay={0.05}>
              <section className="border border-navy-900/10 bg-white p-6 md:p-8">
                <SectionLabel n="01" title={t('co.contact')} />
                <div className="mt-5 space-y-4">
                  <Field label={t('co.email')} error={errors.email}>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" className={`input ${errors.email ? 'border-red-400' : ''}`} />
                  </Field>
                  <Field label={t('co.phone')} error={errors.phone}>
                    <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+20 1X XXX XXXX" className={`input ${errors.phone ? 'border-red-400' : ''}`} />
                  </Field>
                </div>
              </section>
            </Reveal>

            <Reveal delay={0.08}>
              <section className="border border-navy-900/10 bg-white p-6 md:p-8">
                <SectionLabel n="02" title={t('co.address')} />
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label={t('co.first')} error={errors.first}>
                    <input value={form.first} onChange={set('first')} placeholder="First name" className={`input ${errors.first ? 'border-red-400' : ''}`} />
                  </Field>
                  <Field label={t('co.last')} error={errors.last}>
                    <input value={form.last} onChange={set('last')} placeholder="Last name" className={`input ${errors.last ? 'border-red-400' : ''}`} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label={t('co.street')} error={errors.address}>
                      <input value={form.address} onChange={set('address')} placeholder="Street, building, apartment" className={`input ${errors.address ? 'border-red-400' : ''}`} />
                    </Field>
                  </div>
                  <Field label="City">
                    <select value={form.city} onChange={set('city')} className="input appearance-none">
                      {CITIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('co.notes')}>
                    <input value={form.notes} onChange={set('notes')} placeholder="Landmark, instructions…" className="input" />
                  </Field>
                </div>
              </section>
            </Reveal>

            <Reveal delay={0.1}>
              <section className="border border-navy-900/10 bg-white p-6 md:p-8">
                <SectionLabel n="03" title={t('co.delivery')} />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setDelivery('standard')}
                    className={`border p-5 text-left transition-all duration-300 ${
                      delivery === 'standard' ? 'border-navy-900 bg-navy-950 text-white' : 'border-navy-900/15 hover:border-navy-900/40'
                    }`}
                  >
                    <p className="font-display text-[13px] font-bold uppercase tracking-[0.14em]">{t('co.standard')}</p>
                    <p className={`mt-1 font-mono text-[11px] ${delivery === 'standard' ? 'text-white/60' : 'text-navy-900/50'}`}>
                      {t('co.stdDays')}
                    </p>
                    <p className="mt-3 font-mono text-[13px]">
                      {subtotal - discountAmount >= settings.freeThreshold ? t('co.free') : formatPrice(settings.standardShipping)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDelivery('express')}
                    className={`border p-5 text-left transition-all duration-300 ${
                      delivery === 'express' ? 'border-navy-900 bg-navy-950 text-white' : 'border-navy-900/15 hover:border-navy-900/40'
                    }`}
                  >
                    <p className="font-display text-[13px] font-bold uppercase tracking-[0.14em]">{t('co.express')}</p>
                    <p className={`mt-1 font-mono text-[11px] ${delivery === 'express' ? 'text-white/60' : 'text-navy-900/50'}`}>
                      {t('co.expDays')}
                    </p>
                    <p className="mt-3 font-mono text-[13px]">{formatPrice(settings.expressShipping)}</p>
                  </button>
                </div>
              </section>
            </Reveal>

            <Reveal delay={0.12}>
              <section className="border border-navy-900/10 bg-white p-6 md:p-8">
                <SectionLabel n="04" title={t('co.payment')} />
                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={() => setPayment('cod')}
                    className={`flex w-full items-center justify-between border p-5 text-left transition-all duration-300 ${
                      payment === 'cod' ? 'border-navy-900' : 'border-navy-900/15 hover:border-navy-900/40'
                    }`}
                  >
                    <div>
                      <p className="font-display text-[13px] font-bold uppercase tracking-[0.14em]">{t('co.cod')}</p>
                      <p className="mt-1 font-mono text-[11px] text-navy-900/50">{t('co.codSub')}</p>
                    </div>
                    <span className={`h-4 w-4 rounded-full border-2 ${payment === 'cod' ? 'border-navy-900 bg-navy-900' : 'border-navy-900/25'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayment('card')}
                    className={`flex w-full items-center justify-between border p-5 text-left transition-all duration-300 ${
                      payment === 'card' ? 'border-navy-900' : 'border-navy-900/15 hover:border-navy-900/40'
                    }`}
                  >
                    <div>
                      <p className="font-display text-[13px] font-bold uppercase tracking-[0.14em]">{t('co.card')}</p>
                      <p className="mt-1 font-mono text-[11px] text-navy-900/50">{t('co.cardSub')}</p>
                    </div>
                    <span className={`h-4 w-4 rounded-full border-2 ${payment === 'card' ? 'border-navy-900 bg-navy-900' : 'border-navy-900/25'}`} />
                  </button>

                  {payment === 'card' && (
                    <div className="grid gap-4 border border-navy-900/10 bg-soft p-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field label={t('co.cardNum')} error={errors.cardNumber}>
                          <input
                            value={card.number}
                            onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))}
                            placeholder="4242 4242 4242 4242"
                            inputMode="numeric"
                            className={`input ${errors.cardNumber ? 'border-red-400' : ''}`}
                          />
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        <Field label={t('co.cardName')} error={errors.cardName}>
                          <input
                            value={card.name}
                            onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                            placeholder="Full name"
                            className={`input ${errors.cardName ? 'border-red-400' : ''}`}
                          />
                        </Field>
                      </div>
                      <Field label={t('co.expiry')} error={errors.cardExpiry}>
                        <input
                          value={card.expiry}
                          onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
                          placeholder="MM/YY"
                          className={`input ${errors.cardExpiry ? 'border-red-400' : ''}`}
                        />
                      </Field>
                      <Field label={t('co.cvc')} error={errors.cardCvc}>
                        <input
                          value={card.cvc}
                          onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value }))}
                          placeholder="123"
                          inputMode="numeric"
                          className={`input ${errors.cardCvc ? 'border-red-400' : ''}`}
                        />
                      </Field>
                      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/45 sm:col-span-2">
                        <Lock size={12} /> {t('co.cardNote')}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Reveal delay={0.1}>
              <div className="border border-navy-900/10 bg-white p-7 lg:sticky lg:top-24">
                <p className="font-display text-lg font-black uppercase tracking-tight text-navy-950">{t('cart.summary')}</p>
                <ul className="mt-6 space-y-5 border-t border-navy-900/10 pt-6">
                  {items.map((item) => {
                    const p = getProduct(item.productId)
                    if (!p) return null
                    return (
                      <li key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-4">
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-navy-100/40">
                          <SmartImage src={p.images[0]} alt={p.name} className="h-full w-full" />
                          <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center bg-navy-900 px-1 font-mono text-[10px] text-white">
                            {item.qty}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-[13px] font-bold uppercase tracking-wide text-navy-950">
                            {p.name}
                          </p>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/50">
                            {item.color} / {sizeLabel(item.size, lang)}
                          </p>
                        </div>
                        <p className="shrink-0 font-mono text-[13px]">{formatPrice(effectivePrice(p) * item.qty)}</p>
                      </li>
                    )
                  })}
                </ul>

                <div className="mt-6 border-t border-navy-900/10 pt-5">
                  {applied ? (
                    <div className="flex items-center justify-between bg-soft px-3 py-2.5">
                      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-navy-800">
                        <Tag size={13} /> {applied.code} — {applied.type === 'percent' ? `${applied.value}%` : formatPrice(applied.value)} off
                      </p>
                      <button
                        type="button"
                        aria-label="Remove discount"
                        onClick={() => setApplied(null)}
                        className="p-1 text-navy-900/50 transition-colors hover:text-navy-950"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          value={codeInput}
                          onChange={(e) => {
                            setCodeInput(e.target.value)
                            setCodeError('')
                          }}
                          placeholder={t('co.codePh')}
                          aria-label="Discount code"
                          className={`input !h-[44px] flex-1 font-mono text-[12px] uppercase tracking-[0.14em] ${codeError ? 'border-red-400' : ''}`}
                        />
                        <button type="button" onClick={applyCode} className="btn btn-outline-dark btn-sm shrink-0">
                          {t('co.apply')}
                        </button>
                      </div>
                      {codeError && (
                        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-red-500">{codeError}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-2.5 border-t border-navy-900/10 pt-5">
                  <div className="flex justify-between text-[13px] text-ink/60">
                    <span>{t('cart.subtotal')} ({count} items)</span>
                    <span className="font-mono">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[13px] text-navy-600">
                      <span>{t('co.discount')}</span>
                      <span className="font-mono">−{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px] text-ink/60">
                    <span>{t('cart.shipping')}</span>
                    <span className="font-mono">{shippingCost === 0 ? t('co.free') : formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between border-t border-navy-900/10 pt-4">
                    <span className="font-display text-[13px] font-bold uppercase tracking-[0.16em]">{t('cart.total')}</span>
                    <span className="font-mono text-[17px] font-medium">{formatPrice(total)}</span>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="btn btn-dark mt-7 w-full disabled:opacity-50">
                  {submitting ? '…' : `${t('co.place')} — ${formatPrice(total)}`}
                </button>
                <Link
                  to="/cart"
                  className="mt-4 block text-center font-mono text-[11px] uppercase tracking-[0.2em] text-navy-900/55 transition-colors hover:text-navy-900"
                >
                  {t('co.back')}
                </Link>
              </div>
            </Reveal>
          </div>
        </form>
      </div>
    </div>
  )
}
