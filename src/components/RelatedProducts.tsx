import { useMemo } from 'react'
import { Product } from '../lib/types'
import { useCatalog } from '../context/CatalogContext'
import SectionHeading from './SectionHeading'
import ProductGrid from './ProductGrid'
import Reveal from './Reveal'

export default function RelatedProducts({ product }: { product: Product }) {
  const { products } = useCatalog()
  const related = useMemo(() => {
    const same = products.filter((p) => p.category === product.category && p.id !== product.id)
    const others = products.filter((p) => p.category !== product.category && p.id !== product.id)
    return [...same, ...others].slice(0, 4)
  }, [products, product])

  if (related.length === 0) return null

  return (
    <section className="border-t border-navy-900/10 bg-white py-20 md:py-28">
      <div className="container-sp">
        <SectionHeading
          eyebrow="Keep Exploring"
          title="You May Also Like"
          link={{ to: '/shop', label: 'Shop All' }}
        />
        <Reveal delay={0.05}>
          <ProductGrid products={related} />
        </Reveal>
      </div>
    </section>
  )
}
