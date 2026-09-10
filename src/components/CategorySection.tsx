import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import SectionHeading from './SectionHeading'
import Reveal from './Reveal'
import SmartImage from './SmartImage'
import { collections } from '../data/collections'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'
import { categoryImage } from '../lib/siteImages'
import { matchesCategory, displayCategory } from '../lib/categories'

export default function CategorySection() {
  const { t, lang } = useLang()
  const { products, settings } = useCatalog()
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="container-sp">
        <SectionHeading eyebrow={t('cat.eyebrow')} title={t('cat.title')} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
          {collections.map((c, i) => {
            const count = products.filter((p) => matchesCategory(p.category, c.slug)).length
            return (
              <Reveal key={c.slug} delay={i * 0.06} className={i === 0 ? 'col-span-2 md:col-span-1' : ''}>
                <Link
                  to={`/shop?category=${c.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden bg-navy-100/40 md:aspect-[3/4]"
                >
                  <SmartImage
                    src={categoryImage(settings, c.slug)}
                    alt={c.title}
                    className="absolute inset-0 transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/75 via-navy-950/10 to-transparent transition-opacity duration-500 group-hover:from-navy-950/85" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">
                        {count} {count === 1 ? t('cat.style') : t('cat.styles')}
                      </p>
                      <h3 className="mt-1 font-display text-xl font-black uppercase tracking-tight text-white md:text-2xl">
                        {displayCategory(c.slug, lang)}
                      </h3>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center border border-white/30 text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <ArrowUpRight size={17} className="rtl-flip" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
