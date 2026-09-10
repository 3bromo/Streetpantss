import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'
import { useProductText } from '../i18n/useProductText'
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '../lib/format'
import { sizeLabel } from '../lib/categories'
import { CartItem } from '../lib/types'
import QuantityStepper from './QuantityStepper'
import SmartImage from './SmartImage'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

function CartLineInner({ item }: { item: CartItem }) {
  const { getProduct } = useCatalog()
  const { closeDrawer, setQty, removeItem } = useCart()
  const { lang } = useLang()
  const p = getProduct(item.productId)
  const { name } = useProductText(p!)
  if (!p) return null
  return (
    <li className="flex gap-4">
      <Link to={`/product/${p.id}`} onClick={closeDrawer} className="block h-28 w-[84px] shrink-0 overflow-hidden bg-navy-100/40">
        <SmartImage src={p.images[0]} alt={name} className="h-full w-full" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/product/${p.id}`}
              onClick={closeDrawer}
              className="block truncate font-display text-[13px] font-bold uppercase tracking-[0.08em] text-navy-950 hover:opacity-70"
            >
              {name}
            </Link>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-navy-900/50">
              {item.color} / {sizeLabel(item.size, lang)}
            </p>
          </div>
          <button
            aria-label="Remove item"
            onClick={() => removeItem(item.productId, item.color, item.size)}
            className="p-1 text-navy-900/40 transition-colors hover:text-navy-950"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <QuantityStepper small qty={item.qty} onChange={(q) => setQty(item.productId, item.color, item.size, q)} />
          <p className="font-mono text-[13px] text-navy-900">{formatPrice(p.price * item.qty)}</p>
        </div>
      </div>
    </li>
  )
}

export default function CartDrawer() {
  const { items, count, subtotal, drawerOpen, closeDrawer } = useCart()
  const { t } = useLang()
  const navigate = useNavigate()

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const progress = Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1)

  const go = (to: string) => {
    closeDrawer()
    navigate(to)
  }

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-navy-950/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeDrawer}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[81] flex h-full w-full max-w-md flex-col bg-white shadow-2xl rtl:right-auto rtl:left-0"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: EASE }}
            role="dialog"
            aria-label={t('cart.title')}
          >
            <div className="flex items-center justify-between border-b border-navy-900/10 px-6 py-5">
              <p className="font-display text-lg font-black uppercase tracking-tight text-navy-950">
                {t('cart.title')} {count > 0 ? `(${count})` : ''}
              </p>
              <button aria-label="Close" onClick={closeDrawer} className="p-1 transition-transform duration-300 hover:rotate-90">
                <X size={24} strokeWidth={1.6} />
              </button>
            </div>

            {items.length > 0 && (
              <div className="border-b border-navy-900/10 px-6 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy-900/60">
                  {remaining > 0 ? `${formatPrice(remaining)} ${t('cart.away')}` : t('cart.unlocked')}
                </p>
                <div className="mt-2 h-[3px] w-full bg-navy-900/10">
                  <div className="h-full bg-navy-800 transition-all duration-500" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-navy-900/15 text-navy-900/40">
                  <ShoppingBag size={30} strokeWidth={1.4} />
                </span>
                <p className="mt-6 font-display text-2xl font-black uppercase tracking-tight text-navy-950">
                  {t('cart.empty')}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-ink/55">{t('cart.emptySub')}</p>
                <button onClick={() => go('/shop')} className="btn btn-dark mt-8">
                  {t('cart.shopNow')}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <ul className="space-y-6">
                    {items.map((item) => (
                      <CartLineInner key={`${item.productId}-${item.color}-${item.size}`} item={item} />
                    ))}
                  </ul>
                </div>

                <div className="border-t border-navy-900/10 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">
                      {t('cart.subtotal')}
                    </p>
                    <p className="font-mono text-[15px] text-navy-950">{formatPrice(subtotal)}</p>
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/45">{t('cart.shipNote')}</p>
                  <button onClick={() => go('/checkout')} className="btn btn-dark mt-4 w-full">
                    {t('cart.checkout')}
                  </button>
                  <button onClick={() => go('/cart')} className="btn btn-outline-dark mt-2.5 w-full">
                    {t('cart.viewCart')}
                  </button>
                  <button
                    onClick={closeDrawer}
                    className="mt-4 w-full text-center font-mono text-[11px] uppercase tracking-[0.2em] text-navy-900/55 transition-colors hover:text-navy-900"
                  >
                    {t('cart.continue')}
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
