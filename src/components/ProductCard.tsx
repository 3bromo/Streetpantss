import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Plus } from 'lucide-react'
import { Product } from '../lib/types'
import { formatPrice } from '../lib/format'
import { effectivePrice, isLowStock, isOutOfStock, variantStock } from '../lib/stock'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useLang } from '../i18n/LanguageContext'
import { useProductText } from '../i18n/useProductText'
import { displayCategory, sizeLabel } from '../lib/categories'
import SmartImage from './SmartImage'

export default function ProductCard({ product, dark = false }: { product: Product; dark?: boolean }) {
  const { addItem } = useCart()
  const { has, toggle } = useWishlist()
  const { t, lang } = useLang()
  const { name } = useProductText(product)
  const [qaOpen, setQaOpen] = useState(false)
  const [qaColor, setQaColor] = useState<string | null>(null)
  const wishlisted = has(product.id)
  const secondary = product.images[1]
  const out = isOutOfStock(product)
  const onSale = product.salePrice != null && product.salePrice < product.price

  const openQuickOrder = () => {
    // One color → safely auto-selected; otherwise the customer chooses.
    setQaColor(product.colors.length === 1 ? product.colors[0].name : null)
    setQaOpen(true)
  }

  /** Stock for a color/size combo from the existing product_variants data. */
  const sizeAvailable = (size: string) => !!qaColor && variantStock(product, qaColor, size) > 0

  const quickAdd = (size: string) => {
    if (!qaColor || !sizeAvailable(size)) return
    addItem(product, qaColor, size, 1)
    setQaOpen(false)
  }

  return (
    <div className="group relative">
      <div className="relative aspect-[3/4] overflow-hidden bg-navy-100/40">
        <Link to={`/product/${product.id}`} aria-label={name} className="absolute inset-0 block">
          <SmartImage
            src={product.images[0]}
            alt={name}
            className="absolute inset-0 transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
          />
          {secondary && (
            <SmartImage
              src={secondary}
              alt={name}
              className="absolute inset-0 opacity-0 transition-all duration-[900ms] ease-out group-hover:scale-[1.05] group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5 rtl:left-auto rtl:right-3">
          {product.isNew && (
            <span className="bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-navy-900">{t('card.new')}</span>
          )}
          {product.isBestSeller && (
            <span className="bg-navy-900 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white">
              {t('card.best')}
            </span>
          )}
          {onSale && (
            <span className="bg-navy-600 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white">{t('card.sale')}</span>
          )}
          {!out && isLowStock(product) && (
            <span className="bg-ink px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white">{t('card.low')}</span>
          )}
          {out && (
            <span className="bg-ink px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white">{t('card.out')}</span>
          )}
        </div>

        <button
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={() => toggle(product.id, product.name)}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all duration-300 hover:scale-110 rtl:right-auto rtl:left-3 ${
            wishlisted ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
        >
          <Heart size={16} className={wishlisted ? 'fill-navy-800 text-navy-800' : 'text-navy-900'} />
        </button>

        <div className="absolute inset-x-0 bottom-0 z-10 transition-transform duration-300 ease-out sm:translate-y-full sm:group-hover:translate-y-0">
          {out ? (
            <div className="flex w-full items-center justify-center bg-ink/90 py-3.5 font-display text-[11px] font-bold uppercase tracking-[0.22em] text-white/70 backdrop-blur">
              {t('card.out')}
            </div>
          ) : qaOpen ? (
            <div className="bg-white/95 px-3 py-3 backdrop-blur">
              <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-navy-900/60">
                {t('card.selectColor')}
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    aria-pressed={qaColor === c.name}
                    onClick={() => setQaColor(c.name)}
                    className={`flex items-center gap-1.5 border px-2 py-1.5 transition-colors duration-200 ${
                      qaColor === c.name
                        ? 'border-navy-900 bg-navy-900 text-white'
                        : 'border-navy-900/15 text-navy-900 hover:border-navy-900'
                    }`}
                  >
                    <span className="h-3.5 w-3.5 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} />
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em]">{c.name}</span>
                  </button>
                ))}
              </div>
              <p className="mb-2 mt-2.5 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-navy-900/60">
                {qaColor ? t('card.selectSize') : t('card.selectSizeAfterColor')}
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {product.sizes.map((s) => {
                  const available = sizeAvailable(s)
                  return (
                    <button
                      key={s}
                      disabled={!available}
                      onClick={() => quickAdd(s)}
                      title={sizeLabel(s, lang)}
                      className={`h-8 min-w-[36px] px-1 border font-mono text-[10px] transition-colors duration-200 ${
                        available
                          ? 'border-navy-900/15 text-navy-900 hover:bg-navy-900 hover:text-white'
                          : 'cursor-not-allowed border-navy-900/10 text-navy-900/30 line-through'
                      }`}
                    >
                      {sizeLabel(s, lang)}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <button
              onClick={openQuickOrder}
              className="flex w-full items-center justify-center gap-2 bg-navy-950/90 py-3.5 font-display text-[11px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur transition-colors duration-300 hover:bg-navy-800"
            >
              <Plus size={14} /> {t('card.quickAdd')}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-mono text-[10px] uppercase tracking-[0.22em] ${dark ? 'text-white/45' : 'text-navy-900/45'}`}>
            {displayCategory(product.category, lang)}
          </p>
          <Link
            to={`/product/${product.id}`}
            className={`mt-1 block truncate font-display text-[14px] font-bold uppercase tracking-[0.08em] transition-opacity duration-300 hover:opacity-70 ${
              dark ? 'text-white' : 'text-navy-950'
            }`}
          >
            {name}
          </Link>
          <div className="mt-2 flex gap-1.5">
            {product.colors.map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-3 w-3 rounded-full border border-black/15"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right rtl:text-left">
          {onSale && (
            <p className={`font-mono text-[11px] line-through ${dark ? 'text-white/40' : 'text-navy-900/40'}`}>
              {formatPrice(product.price)}
            </p>
          )}
          <p className={`font-mono text-[13px] ${dark ? 'text-white/80' : 'text-navy-900'}`}>
            {formatPrice(effectivePrice(product))}
          </p>
        </div>
      </div>
    </div>
  )
}
