import { Link } from 'react-router-dom'
import { ShoppingBag, X } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import SmartImage from '../components/SmartImage'
import QuantityStepper from '../components/QuantityStepper'
import ProductGrid from '../components/ProductGrid'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '../lib/format'

export default function CartPage() {
  usePageTitle('Cart')
  const { items, count, subtotal, removeItem, setQty, clearCart } = useCart()
  const { products, getProduct } = useCatalog()
  const { t } = useLang()
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4)

  if (items.length === 0) {
    return (
      <div className="bg-soft">
        <PageHeader eyebrow={t('cart.summary')} title={t('cart.title')} />
        <div className="container-sp py-16 md:py-24">
          <Reveal className="mx-auto flex max-w-lg flex-col items-center border border-navy-900/10 bg-white px-6 py-20 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-navy-900/15 text-navy-900/40">
              <ShoppingBag size={30} strokeWidth={1.4} />
            </span>
            <p className="mt-6 font-display text-3xl font-black uppercase tracking-tight text-navy-950">
              {t('cart.empty')}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink/55">
              {t('cart.emptySub')}
            </p>
            <Link to="/shop" className="btn btn-dark mt-8">
              {t('cart.shopNow')}
            </Link>
          </Reveal>

          <div className="mt-20">
            <Reveal>
              <p className="eyebrow text-navy-800/60">{t('cart.popular')}</p>
            </Reveal>
            <div className="mt-6">
              <Reveal delay={0.05}>
                <ProductGrid products={bestSellers.slice(0, 4)} />
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-soft">
      <PageHeader eyebrow={`${t('cart.summary')} — ${count} ${count === 1 ? t('cart.item') : t('cart.items')}`} title={t('cart.title')} />
      <div className="container-sp grid gap-10 py-12 md:py-16 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Reveal>
            <ul className="divide-y divide-navy-900/10 border-y border-navy-900/10">
              {items.map((item) => {
                const p = getProduct(item.productId)
                if (!p) return null
                return (
                  <li key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-5 py-6">
                    <Link to={`/product/${p.id}`} className="block h-36 w-[104px] shrink-0 overflow-hidden bg-navy-100/40 sm:h-40 sm:w-[120px]">
                      <SmartImage src={p.images[0]} alt={p.name} className="h-full w-full" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/45">
                            {p.category.replace('-', ' ')}
                          </p>
                          <Link
                            to={`/product/${p.id}`}
                            className="mt-1 block font-display text-[15px] font-bold uppercase tracking-[0.06em] text-navy-950 hover:opacity-70"
                          >
                            {p.name}
                          </Link>
                          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-navy-900/55">
                            {item.color} / Size {item.size}
                          </p>
                        </div>
                        <button
                          aria-label="Remove item"
                          onClick={() => removeItem(item.productId, item.color, item.size)}
                          className="p-1.5 text-navy-900/40 transition-colors hover:text-navy-950"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                        <QuantityStepper small qty={item.qty} onChange={(q) => setQty(item.productId, item.color, item.size, q)} />
                        <p className="font-mono text-[14px] text-navy-950">{formatPrice(p.price * item.qty)}</p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/shop"
                className="font-mono text-[12px] uppercase tracking-[0.2em] text-navy-900/60 underline-offset-4 transition-colors hover:text-navy-900 hover:underline"
              >
                {t('cart.continue')}
              </Link>
              <button
                onClick={clearCart}
                className="font-mono text-[12px] uppercase tracking-[0.2em] text-navy-900/40 underline-offset-4 transition-colors hover:text-navy-950 hover:underline"
              >
                {t('cart.clear')}
              </button>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-4">
          <Reveal delay={0.08}>
            <div className="border border-navy-900/10 bg-white p-7 lg:sticky lg:top-24">
              <p className="font-display text-lg font-black uppercase tracking-tight text-navy-950">{t('cart.summary')}</p>
              <div className="mt-6 space-y-3 border-t border-navy-900/10 pt-6">
                <div className="flex justify-between">
                  <span className="text-[13px] text-ink/60">{t('cart.subtotal')} ({count} {count === 1 ? t('cart.item') : t('cart.items')})</span>
                  <span className="font-mono text-[13px]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[13px] text-ink/60">{t('cart.shipping')}</span>
                  <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-navy-900/50">
                    {t('cart.shipNote')}
                  </span>
                </div>
                {subtotal < FREE_SHIPPING_THRESHOLD && (
                  <p className="bg-soft px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-900/60">
                    {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} {t('cart.away')}
                  </p>
                )}
                <div className="flex justify-between border-t border-navy-900/10 pt-4">
                  <span className="font-display text-[13px] font-bold uppercase tracking-[0.16em]">{t('cart.total')}</span>
                  <span className="font-mono text-[16px] font-medium">{formatPrice(subtotal)}</span>
                </div>
              </div>
              <Link to="/checkout" className="btn btn-dark mt-7 w-full">
                {t('cart.proceed')}
              </Link>
              <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-navy-900/45">
                COD · Visa · Mastercard
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
