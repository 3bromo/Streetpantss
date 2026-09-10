import { Link } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import { useLang } from '../i18n/LanguageContext'
import SocialLinksSection from './SocialLinksSection'

const SHOP_LINKS = [
  { to: '/shop', key: 'footer.shopAll' },
  { to: '/new-arrivals', key: 'nav.new' },
  { to: '/best-sellers', key: 'nav.best' },
  { to: '/collections', key: 'nav.collections' },
]

const COMPANY_LINKS = [
  { to: '/about', key: 'nav.about' },
  { to: '/collections', key: 'footer.editorial' },
  { to: '/search', key: 'footer.search' },
  { to: '/cart', key: 'footer.cart' },
]

const HELP_LINKS = [
  { to: '/about', key: 'footer.shipping' },
  { to: '/about', key: 'footer.returns' },
  { to: '/about', key: 'footer.size' },
  { to: '/about', key: 'footer.contact' },
]

export default function Footer() {
  const { settings } = useCatalog()
  const { t } = useLang()
  return (
    <footer className="bg-soft pt-16 text-ink md:pt-24">
      <div className="container-sp">
        <div className="grid gap-12 pb-16 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <p className="font-display text-2xl font-black uppercase tracking-[0.06em]">{settings.storeName}</p>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ink/55">{t('footer.tag')}</p>
            <p className="mt-4 font-mono text-[11px] tracking-[0.08em] text-ink/45">
              {settings.phone} · {settings.email}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <div>
              <p className="eyebrow text-ink/40">{t('footer.shop')}</p>
              <ul className="mt-5 space-y-3">
                {SHOP_LINKS.map((l) => (
                  <li key={l.key}>
                    <Link to={l.to} className="text-[13px] text-ink/60 transition-colors duration-300 hover:text-ink">
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-ink/40">{t('footer.company')}</p>
              <ul className="mt-5 space-y-3">
                {COMPANY_LINKS.map((l) => (
                  <li key={l.key}>
                    <Link to={l.to} className="text-[13px] text-ink/60 transition-colors duration-300 hover:text-ink">
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-ink/40">{t('footer.help')}</p>
              <ul className="mt-5 space-y-3">
                {HELP_LINKS.map((l) => (
                  <li key={l.key}>
                    <Link to={l.to} className="text-[13px] text-ink/60 transition-colors duration-300 hover:text-ink">
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <SocialLinksSection />

        <div className="select-none overflow-hidden border-t border-ink/10 py-6">
          <p className="text-outline-soft whitespace-nowrap text-center font-display text-[13vw] font-black uppercase leading-[0.85] tracking-tight md:text-[9vw]">
            {settings.storeName}
          </p>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-ink/10 py-6 sm:flex-row">
          <p className="font-mono text-[10px] tracking-[0.14em] text-ink/40">{t('footer.rights')}</p>
          <p className="font-mono text-[10px] tracking-[0.14em] text-ink/40">
            {t('footer.pay')} · {settings.currency}
          </p>
        </div>
      </div>
    </footer>
  )
}
