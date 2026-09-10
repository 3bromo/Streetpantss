import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/usePageTitle'
import PageHeader from '../components/PageHeader'
import FeaturedProducts from '../components/FeaturedProducts'
import Reveal from '../components/Reveal'
import SmartImage from '../components/SmartImage'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'

export default function NewArrivalsPage() {
  usePageTitle('New Arrivals')
  const { products, settings } = useCatalog()
  const { t } = useLang()
  const newArrivals = products.filter((p) => p.isNew)
  return (
    <div className="bg-soft">
      <PageHeader eyebrow={t('newPage.eyebrow')} title={t('newPage.title')} sub={t('newPage.sub')} />

      <div className="container-sp pt-10 md:pt-14">
        <Reveal>
          <div className="relative overflow-hidden">
            <SmartImage
              src="/images/editorial-2.jpg"
              alt="New arrivals editorial"
              className="aspect-[16/9] w-full md:aspect-[21/9]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-950/70 via-navy-950/20 to-transparent rtl:bg-gradient-to-l" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-6 sm:px-12">
                <p className="eyebrow text-white/60">{t('newPage.landed')}</p>
                <p className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                  City Uniform / 01
                </p>
                <Link
                  to="/collections"
                  className="mt-5 hidden font-mono text-[12px] uppercase tracking-[0.22em] text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline sm:inline-block"
                >
                  {t('newPage.campaign')}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="container-sp py-14 md:py-20">
        <FeaturedProducts
          eyebrow={t('new.eyebrow')}
          title={t('newPage.title')}
          products={newArrivals}
        />
      </div>
    </div>
  )
}
