import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/usePageTitle'
import PageHeader from '../components/PageHeader'
import FeaturedProducts from '../components/FeaturedProducts'
import Reveal from '../components/Reveal'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'

export default function BestSellersPage() {
  usePageTitle('Best Sellers')
  const { products } = useCatalog()
  const { t } = useLang()
  const bestSellers = products.filter((p) => p.isBestSeller)
  return (
    <div className="bg-soft">
      <PageHeader eyebrow={t('bestPage.eyebrow')} title={t('bestPage.title')} sub={t('bestPage.sub')} />
      <div className="container-sp py-14 md:py-20">
        <FeaturedProducts eyebrow={t('bestPage.proven')} title={t('bestPage.icons')} products={bestSellers} />
      </div>
      <Reveal>
        <section className="bg-navy-900 py-16 text-center text-white md:py-20">
          <div className="container-sp">
            <p className="eyebrow text-white/50">{t('bestPage.cant')}</p>
            <p className="mx-auto mt-3 max-w-lg font-display text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
              {t('bestPage.start')}
            </p>
            <Link to="/shop" className="btn btn-light mt-8">
              {t('bestPage.everything')}
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  )
}
