import { useState, FormEvent } from 'react'
import { Check } from 'lucide-react'
import Reveal from './Reveal'
import { useLang } from '../i18n/LanguageContext'

export default function Newsletter() {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'error' | 'done'>('idle')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState('error')
      return
    }
    setState('done')
  }

  return (
    <section className="bg-navy-800 py-12 text-white md:py-16">
      <div className="container-sp max-w-3xl text-center">
        <Reveal>
          <p className="eyebrow text-white/50">{t('news.eyebrow')}</p>
          <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
            {t('news.title')}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/65">{t('news.text')}</p>

          {state === 'done' ? (
            <div className="mx-auto mt-10 flex max-w-md flex-col items-center border border-white/20 px-6 py-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900">
                <Check size={20} strokeWidth={2.4} />
              </span>
              <p className="mt-4 font-display text-lg font-black uppercase tracking-wide">{t('news.successTitle')}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">{t('news.successText')}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mx-auto mt-10 max-w-md">
              <div className="flex border border-white/25 bg-white/5 focus-within:border-white">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (state === 'error') setState('idle')
                  }}
                  placeholder={t('news.placeholder')}
                  aria-label="Email"
                  className="h-[52px] w-full bg-transparent px-5 font-mono text-[12px] uppercase tracking-[0.14em] text-white placeholder:text-white/35"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-white px-6 font-display text-[12px] font-bold uppercase tracking-[0.18em] text-navy-950 transition-colors duration-300 hover:bg-navy-100"
                >
                  {t('news.signup')}
                </button>
              </div>
              <p
                className={`mt-3 font-mono text-[11px] uppercase tracking-[0.18em] ${
                  state === 'error' ? 'text-white' : 'text-white/40'
                }`}
              >
                {state === 'error' ? t('news.error') : t('news.note')}
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
