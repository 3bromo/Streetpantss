import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/usePageTitle'
import { useLang } from '../i18n/LanguageContext'
import Reveal from '../components/Reveal'

export default function NotFoundPage() {
  usePageTitle('404')
  const { t } = useLang()
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-soft px-6 py-24 text-center">
      <Reveal>
        <p
          className="font-display text-[120px] font-black leading-none tracking-tight text-transparent sm:text-[180px]"
          style={{ WebkitTextStroke: '2px rgba(7,26,61,0.85)' }}
        >
          404
        </p>
        <p className="mt-4 font-display text-2xl font-black uppercase tracking-tight text-navy-950">{t('404.title')}</p>
        <p className="mt-2 text-[14px] text-ink/55">{t('404.sub')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn btn-dark">
            {t('404.home')}
          </Link>
          <Link to="/shop" className="btn btn-outline-dark">
            {t('404.shop')}
          </Link>
        </div>
      </Reveal>
    </div>
  )
}
