import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SmartImage from './SmartImage'
import { useLang } from '../i18n/LanguageContext'
import { useCatalog } from '../context/CatalogContext'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function Hero() {
  const { t } = useLang()
  const { settings } = useCatalog()
  return (
    <section className="relative -mt-[72px] flex min-h-[80svh] items-end overflow-hidden bg-soft">
      <div className="absolute inset-0">
        <SmartImage src={settings.heroImage} alt="STREET PANTS campaign" className="h-full w-full" priority />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/35 to-white/20" />

      <div className="container-sp relative z-10 pb-10 pt-28 sm:pb-14">
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
          className="eyebrow text-ink/55"
        >
          {t('hero.eyebrow')}
        </motion.p>

        <h1 className="mt-5">
          <span className="block overflow-hidden">
            <motion.span
              initial={{ y: '108%' }}
              animate={{ y: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease: EASE }}
              className="block font-display text-[clamp(54px,11vw,148px)] font-black uppercase leading-[0.92] tracking-tight text-ink"
            >
              {t('hero.title')}
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              initial={{ y: '108%' }}
              animate={{ y: 0 }}
              transition={{ delay: 0.42, duration: 0.9, ease: EASE }}
              className="text-outline block font-display text-[clamp(30px,6vw,84px)] font-black uppercase leading-[1.05] tracking-tight"
            >
              {t('hero.tagline')}
            </motion.span>
          </span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.7, ease: EASE }}
          className="mt-9 flex flex-wrap gap-3"
        >
          <Link to="/shop" className="btn btn-dark">
            {t('hero.shopNow')}
          </Link>
          <Link to="/collections" className="btn btn-outline-dark !bg-white/80">
            {t('hero.explore')}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.8 }}
          className="mt-8 hidden items-center justify-between border-t border-ink/15 pt-4 sm:flex"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-ink/50">{t('hero.drop')}</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-ink/50">{t('hero.scroll')}</p>
        </motion.div>
      </div>
    </section>
  )
}
