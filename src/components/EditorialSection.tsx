import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SmartImage from './SmartImage'
import Reveal from './Reveal'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function EditorialSection() {
  const { settings } = useCatalog()
  const { t } = useLang()
  return (
    <section className="relative flex min-h-[62vh] items-end overflow-hidden bg-navy-950">
      <div className="absolute inset-0">
        <SmartImage src={settings.bannerImage} alt={settings.bannerTitle} className="h-full w-full" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-navy-950/30" />

      <div className="container-sp relative z-10 pb-10 pt-24 sm:pb-14">
        <Reveal>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="eyebrow text-white/60"
          >
            {t('edit.eyebrow')}
          </motion.p>
        </Reveal>
        <div className="overflow-hidden">
          <motion.h2
            initial={{ y: '105%' }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: EASE }}
            className="mt-4 font-display text-[clamp(44px,9vw,120px)] font-black uppercase leading-[0.94] tracking-tight text-white"
          >
            {settings.bannerTitle}
          </motion.h2>
        </div>
        <Reveal delay={0.15}>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">{t('edit.text')}</p>
          <Link to="/collections" className="btn btn-outline-light mt-8">
            {t('edit.cta')}
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
