import { Link } from 'react-router-dom'
import Reveal from './Reveal'
import SmartImage from './SmartImage'
import { useLang } from '../i18n/LanguageContext'
import { storyImage } from '../lib/siteImages'
import { useCatalog } from '../context/CatalogContext'

export default function BrandStory() {
  const { t } = useLang()
  const { settings } = useCatalog()
  return (
    <section className="bg-soft py-12 md:py-16">
      <div className="container-sp grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <Link to="/about" className="group block overflow-hidden">
            <SmartImage
              src={storyImage(settings)}
              alt="STREET PANTS atelier"
              className="aspect-[4/5] w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
            />
          </Link>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="eyebrow text-navy-800/60">{t('story.eyebrow')}</p>
          <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.98] tracking-tight text-navy-950 sm:text-5xl">
            {t('story.title')}
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink/65">{t('story.p1')}</p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink/65">{t('story.p2')}</p>
          <div className="mt-9 grid max-w-md grid-cols-3 divide-x divide-navy-900/10 rtl:divide-x-reverse border-y border-navy-900/10 py-5">
            <div className="pr-4 rtl:pr-0 rtl:pl-4">
              <p className="font-display text-2xl font-black text-navy-950">2026</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/50">{t('story.est')}</p>
            </div>
            <div className="px-4">
              <p className="font-display text-2xl font-black text-navy-950">10</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/50">{t('story.sil')}</p>
            </div>
            <div className="pl-4 rtl:pl-0 rtl:pr-4">
              <p className="font-display text-2xl font-black text-navy-950">310</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/50">{t('story.gsm')}</p>
            </div>
          </div>
          <Link to="/about" className="btn btn-outline-dark mt-9">
            {t('story.cta')}
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
