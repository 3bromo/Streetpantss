import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, RotateCcw, Truck } from 'lucide-react'
import { Product } from '../lib/types'
import { formatPrice } from '../lib/format'
import { effectivePrice, isLowStock, variantStock } from '../lib/stock'
import { canonSize, displayCategory, sizeLabel } from '../lib/categories'
import { useCart } from '../context/CartContext'
import { useLang } from '../i18n/LanguageContext'
import { useProductText } from '../i18n/useProductText'
import ColorSelector from './ColorSelector'
import SizeSelector from './SizeSelector'
import QuantityStepper from './QuantityStepper'
import SizeGuideModal from './SizeGuideModal'

interface Props {
  product: Product
  /** Controlled color — kept in sync with the per-color gallery on the detail page. */
  color: string
  onColorChange: (name: string) => void
}

export default function ProductInfo({ product, color, onColorChange }: Props) {
  const { addItem } = useCart()
  const { t, lang } = useLang()
  const { name, description } = useProductText(product)
  const navigate = useNavigate()
  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [sizeError, setSizeError] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [openAcc, setOpenAcc] = useState<string | null>('details')

  const price = effectivePrice(product)
  const onSale = product.salePrice != null && product.salePrice < product.price
  const selectedStock = size ? variantStock(product, color, canonSize(size)) : null

  const handleAdd = (goCheckout = false) => {
    if (!size) {
      setSizeError(true)
      return
    }
    addItem(product, color, canonSize(size), qty, { silent: goCheckout })
    if (goCheckout) {
      navigate('/checkout')
    }
  }

  const accordions = [
    {
      id: 'details',
      title: t('pdp.details'),
      body: (
        <ul className="list-disc space-y-1.5 pl-4 rtl:pl-0 rtl:pr-4">
          {product.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ),
    },
    {
      id: 'material',
      title: t('pdp.material'),
      body: (
        <div className="space-y-2">
          <p>{product.material}</p>
          <p>{product.fit}</p>
        </div>
      ),
    },
    { id: 'shipping', title: t('pdp.shipping'), body: <p>{t('about.shipB')}</p> },
    { id: 'returns', title: t('pdp.returns'), body: <p>{t('about.retB')}</p> },
    { id: 'care', title: t('pdp.care'), body: <p>{product.care}</p> },
  ]

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-navy-900/50">
        {displayCategory(product.category, lang)} — {product.sku || `SP/${product.id.slice(0, 4).toUpperCase()}`}
      </p>
      <h1 className="mt-2 font-display text-3xl font-black uppercase leading-[0.98] tracking-tight text-navy-950 sm:text-4xl">
        {name}
      </h1>
      <div className="mt-4 flex items-baseline gap-3">
        <p className="font-mono text-[17px] text-navy-900">{formatPrice(price)}</p>
        {onSale && <p className="font-mono text-[13px] text-navy-900/40 line-through">{formatPrice(product.price)}</p>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {isLowStock(product) && (
          <p className="inline-block bg-ink px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white">
            {t('pdp.low')}
          </p>
        )}
        {size && selectedStock === 0 && (
          <p className="inline-block bg-ink px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white">
            {color} / {sizeLabel(size, lang)} — {t('pdp.out')}
          </p>
        )}
        {size && selectedStock !== null && selectedStock > 0 && selectedStock <= 3 && (
          <p className="inline-block bg-navy-800 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white">
            {t('pdp.only')} {selectedStock} {t('pdp.left')} {color} / {sizeLabel(size, lang)}
          </p>
        )}
      </div>

      <p className="mt-5 text-[15px] leading-relaxed text-ink/65">{description}</p>

      <div className="mt-8 space-y-7 border-t border-navy-900/10 pt-8">
        <ColorSelector colors={product.colors} value={color} onChange={onColorChange} />
        <SizeSelector
          sizes={product.sizes.map((s) => canonSize(s))}
          value={size ? canonSize(size) : null}
          onChange={(s) => {
            setSize(s)
            setSizeError(false)
          }}
          onGuide={() => setGuideOpen(true)}
          error={sizeError}
        />
        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper qty={qty} onChange={(q) => setQty(Math.max(1, q))} />
          <button
            onClick={() => handleAdd(false)}
            disabled={selectedStock === 0}
            className="btn btn-dark min-w-[200px] flex-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {selectedStock === 0 ? t('pdp.out') : `${t('pdp.add')} — ${formatPrice(price * qty)}`}
          </button>
        </div>
        <button
          onClick={() => handleAdd(true)}
          disabled={selectedStock === 0}
          className="btn btn-outline-dark w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('pdp.buy')}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 border-y border-navy-900/10 py-4">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/60">
          <Truck size={15} /> {t('pdp.freeShip')}
        </p>
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-navy-900/60">
          <RotateCcw size={15} /> {t('pdp.returns14')}
        </p>
      </div>

      <div className="mt-4">
        {accordions.map((acc) => {
          const open = openAcc === acc.id
          return (
            <div key={acc.id} className="border-b border-navy-900/10">
              <button
                onClick={() => setOpenAcc(open ? null : acc.id)}
                aria-expanded={open}
                className="flex w-full items-center justify-between py-4 text-left"
              >
                <span className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">
                  {acc.title}
                </span>
                <ChevronDown
                  size={17}
                  className={`text-navy-900/50 transition-transform duration-300 rtl:-scale-x-100 ${open ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pb-5 text-[13.5px] leading-relaxed text-ink/60">{acc.body}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <SizeGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  )
}
