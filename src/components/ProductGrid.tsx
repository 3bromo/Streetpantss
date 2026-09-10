import { Product } from '../lib/types'
import ProductCard from './ProductCard'

interface Props {
  products: Product[]
  cols?: 3 | 4
  dark?: boolean
}

export default function ProductGrid({ products, cols = 4, dark = false }: Props) {
  return (
    <div
      className={
        cols === 3
          ? 'grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-14'
          : 'grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-14 xl:grid-cols-4'
      }
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} dark={dark} />
      ))}
    </div>
  )
}
