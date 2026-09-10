import { Link } from 'react-router-dom'
import Reveal from './Reveal'
import SmartImage from './SmartImage'
import { useLang } from '../i18n/LanguageContext'

export default function CollectionSection() {
  const { t } = useLang()
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-sp grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <p className="eyebrow text-navy-800/60">{t('feat.eyebrow')}</p>
          <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-navy-950 sm:text-5xl lg:text-6xl">
            {t('feat.title')}
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink/65">{t('feat.text')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link to="/shop?category=street-pants" className="btn btn-primary">
              {t('feat.cta')}
            </Link>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-navy-900/45">{t('feat.meta')}</span>
          </div>
        </Reveal>
        <Reveal delay={0.12} className="order-1 lg:order-2">
          <Link to="/shop?category=street-pants" className="group block overflow-hidden">
            <SmartImage
              src="/images/editorial-3.jpg"
              alt="City Uniform 01"
              className="aspect-[4/3] w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04] lg:aspect-[16/11]"
            />
          </Link>
          <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-navy-900/40">
            <span>{t('feat.captionL')}</span>
            <span>{t('feat.captionR')}</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
