import SectionHeading from './SectionHeading'
import ProductGrid from './ProductGrid'
import Reveal from './Reveal'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'

export default function NewArrivals() {
  const { products } = useCatalog()
  const { t } = useLang()
  const items = products.filter((p) => p.isNew).slice(0, 4)
  return (
    <section className="bg-soft py-12 md:py-16">
      <div className="container-sp">
        <SectionHeading
          eyebrow={t('new.eyebrow')}
          title={t('new.title')}
          link={{ to: '/new-arrivals', label: t('common.viewAll') }}
        />
        <Reveal delay={0.05}>
          <ProductGrid products={items} />
        </Reveal>
      </div>
    </section>
  )
}
