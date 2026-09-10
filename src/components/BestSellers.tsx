import SectionHeading from './SectionHeading'
import ProductGrid from './ProductGrid'
import Reveal from './Reveal'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'

export default function BestSellers() {
  const { products } = useCatalog()
  const { t } = useLang()
  const items = products.filter((p) => p.isBestSeller).slice(0, 4)
  return (
    <section className="bg-navy-900 py-12 md:py-16">
      <div className="container-sp">
        <SectionHeading
          eyebrow={t('best.eyebrow')}
          title={t('best.title')}
          link={{ to: '/best-sellers', label: t('common.viewAll') }}
          dark
        />
        <Reveal delay={0.05}>
          <ProductGrid products={items} dark />
        </Reveal>
        <Reveal delay={0.1} className="mt-14 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">{t('best.note')}</p>
        </Reveal>
      </div>
    </section>
  )
}
