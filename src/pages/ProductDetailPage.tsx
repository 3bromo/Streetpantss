import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePageTitle } from '../lib/usePageTitle'
import ProductGallery from '../components/ProductGallery'
import ProductInfo from '../components/ProductInfo'
import RelatedProducts from '../components/RelatedProducts'
import Reveal from '../components/Reveal'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'
import { colorImages } from '../lib/categories'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getProduct, loading } = useCatalog()
  const { t } = useLang()
  const product = id ? getProduct(id) : undefined
  usePageTitle(product ? product.name : 'Product')

  // Controlled color — drives BOTH the color selector and the per-color gallery.
  const [galleryColor, setGalleryColor] = useState<string>(product?.colors[0]?.name ?? '')
  useEffect(() => {
    if (product?.colors?.length) setGalleryColor(product.colors[0].name)
  }, [product?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="bg-soft">
        <div className="container-sp pb-10 pt-6 md:pb-14">
          <div className="skeleton h-4 w-64" />
          <div className="mt-7 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <div className="skeleton aspect-[3/4] w-full" />
            </div>
            <div className="space-y-5 lg:col-span-5">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-10 w-3/4" />
              <div className="skeleton h-6 w-28" />
              <div className="skeleton h-24 w-full" />
              <div className="skeleton h-[52px] w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product || !product.published) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-soft px-6 text-center">
        <p className="font-display text-4xl font-black uppercase tracking-tight text-navy-950">Product not found</p>
        <p className="mt-2 text-[14px] text-ink/55">This pair may have sold out for good.</p>
        <Link to="/shop" className="btn btn-dark mt-8">
          Back to Shop
        </Link>
      </div>
    )
  }

  const images = colorImages(product, galleryColor)

  return (
    <div>
      <div className="bg-soft">
        <div className="container-sp pb-10 pt-6 md:pb-14">
          <Reveal y={12}>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-navy-900/50">
              <Link to="/" className="transition-colors hover:text-navy-900">
                {t('crumb.home')}
              </Link>
              {'  /  '}
              <Link to="/shop" className="transition-colors hover:text-navy-900">
                {t('crumb.shop')}
              </Link>
              {'  /  '}
              <span className="text-navy-950">{product.name}</span>
            </p>
          </Reveal>

          <div key={product.id} className="mt-7 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <Reveal y={16}>
                <ProductGallery key={`${product.id}-${galleryColor}`} images={images} name={product.name} />
              </Reveal>
            </div>
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24">
                <Reveal y={16} delay={0.08}>
                  <ProductInfo product={product} color={galleryColor} onColorChange={setGalleryColor} />
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </div>
      <RelatedProducts product={product} />
    </div>
  )
}
