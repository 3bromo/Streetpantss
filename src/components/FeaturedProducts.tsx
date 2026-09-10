import { Product } from '../lib/types'
import SectionHeading from './SectionHeading'
import ProductGrid from './ProductGrid'
import Reveal from './Reveal'

interface Props {
  eyebrow: string
  title: string
  products: Product[]
  dark?: boolean
  cols?: 3 | 4
  link?: { to: string; label: string }
}

export default function FeaturedProducts({ eyebrow, title, products, dark = false, cols = 4, link }: Props) {
  return (
    <div>
      <SectionHeading eyebrow={eyebrow} title={title} dark={dark} link={link} />
      <Reveal delay={0.05}>
        <ProductGrid products={products} dark={dark} cols={cols} />
      </Reveal>
    </div>
  )
}
