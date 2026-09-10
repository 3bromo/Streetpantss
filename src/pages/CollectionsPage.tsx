import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/usePageTitle'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import SmartImage from '../components/SmartImage'
import { collections } from '../data/collections'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'
import { categoryImage } from '../lib/siteImages'
import { matchesCategory, displayCategory } from '../lib/categories'

export default function CollectionsPage() {
  usePageTitle('Collections')
  const { products, settings } = useCatalog()
  const { t, lang } = useLang()
  return (
    <div className="bg-soft">
      <PageHeader eyebrow={t('col.eyebrow')} title={t('col.title')} sub={t('col.sub')} />

      <div className="container-sp space-y-16 py-14 md:space-y-24 md:py-20">
        {collections.map((c, i) => {
          const count = products.filter((p) => matchesCategory(p.category, c.slug)).length
          const reverse = i % 2 === 1
          return (
            <Reveal key={c.slug}>
              <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                <Link
                  to={`/shop?category=${c.slug}`}
                  className={`group block overflow-hidden ${reverse ? 'lg:order-2' : ''}`}
                >
                  <SmartImage
                    src={categoryImage(settings, c.slug)}
                    alt={`${c.title} collection`}
                    className="aspect-[4/3] w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                  />
                </Link>
                <div className={reverse ? 'lg:order-1' : ''}>
                  <p className="font-mono text-[12px] uppercase tracking-[0.3em] text-navy-800/50">
                    0{i + 1} — {c.tagline}
                  </p>
                  <h2 className="mt-3 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-navy-950 sm:text-5xl lg:text-6xl">
                    {c.title}
                  </h2>
                  <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/65">{c.description}</p>
                  <div className="mt-7 flex flex-wrap items-center gap-5">
                    <Link to={`/shop?category=${c.slug}`} className="btn btn-outline-dark">
                      {t('col.shop')} {c.title}
                    </Link>
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-navy-900/45">
                      {count} {count === 1 ? 'style' : 'styles'}
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
