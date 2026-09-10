import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/usePageTitle'
import Reveal from '../components/Reveal'
import SmartImage from '../components/SmartImage'
import { useCatalog } from '../context/CatalogContext'
import { aboutImages } from '../lib/siteImages'
import { useLang } from '../i18n/LanguageContext'

const MANIFESTO = [
  {
    n: '01',
    title: 'Street Culture',
    body: 'Born from the city. Every cut references the streets that raised us — no costume, no cosplay.',
  },
  {
    n: '02',
    title: 'Quality',
    body: 'Heavyweight fabrics, reinforced stitching, hardware that lasts. We build pants the way you build a reputation.',
  },
  {
    n: '03',
    title: 'Comfort',
    body: 'Made to move. Relaxed rises, articulated knees and soft finishes — so the city never slows you down.',
  },
  {
    n: '04',
    title: 'Silhouette',
    body: 'Modern proportions. Wide, straight and tapered — volume with intent, never sloppy.',
  },
  {
    n: '05',
    title: 'Confidence',
    body: 'Clothes that hold their own. Wear them like you mean it — everyday, everywhere.',
  },
]

export default function AboutPage() {
  usePageTitle('About')
  const { t } = useLang()
  const { settings } = useCatalog()
  return (
    <div className="bg-white">
      <section className="bg-navy-950 py-20 text-white md:py-28">
        <div className="container-sp">
          <Reveal>
            <p className="eyebrow text-white/50">{t('about.manifesto')}</p>
            <h2 className="mt-3 font-display text-4xl font-black uppercase tracking-tight sm:text-5xl">
              {t('about.stand')}
            </h2>
          </Reveal>
          <div className="mt-12">
            {MANIFESTO.map((m, i) => (
              <Reveal key={m.n} delay={i * 0.05}>
                <div className="grid gap-3 border-t border-white/10 py-8 md:grid-cols-12 md:gap-8">
                  <p className="font-mono text-[13px] text-white/40 md:col-span-1">{m.n}</p>
                  <h3 className="font-display text-2xl font-black uppercase tracking-tight md:col-span-4">{m.title}</h3>
                  <p className="max-w-md text-[15px] leading-relaxed text-white/65 md:col-span-7">{m.body}</p>
                </div>
              </Reveal>
            ))}
            <div className="border-t border-white/10" />
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="container-sp text-center">
          <Reveal>
            <p className="mx-auto max-w-3xl font-display text-[clamp(26px,4.4vw,52px)] font-black uppercase leading-[1.05] tracking-tight text-navy-950">
              {t('about.quote')}
              <br />
                          </p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-navy-900/50">
              — STREET PANTS, Cairo
            </p>
          </Reveal>
        </div>
      </section>

            {aboutImages(settings).length > 0 && (
        <section className="container-sp grid gap-5 py-14 md:grid-cols-2 md:py-20">
          {aboutImages(settings).map((url, i) => (
            <Reveal key={url + i} delay={i * 0.08}>
              <SmartImage src={url} alt="STREET PANTS campaign" className="aspect-[3/4] w-full" />
            </Reveal>
          ))}
        </section>
      )}

      <section className="border-t border-navy-900/10 bg-soft py-16 md:py-20">
        <div className="container-sp grid gap-10 md:grid-cols-3">
          <Reveal>
            <p className="eyebrow text-navy-800/60">{t('about.shipT')}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-ink/65">
              {t('about.shipB')}
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="eyebrow text-navy-800/60">{t('about.retT')}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-ink/65">
              {t('about.retB')}
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="eyebrow text-navy-800/60">{t('about.careT')}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-ink/65">
              {t('about.careB')}
            </p>
          </Reveal>
        </div>
        <div className="container-sp mt-14 text-center">
          <Reveal>
            <Link to="/shop" className="btn btn-primary">
              {t('about.cta')}
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
