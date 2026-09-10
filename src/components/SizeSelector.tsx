import { Ruler } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { sizeLabel } from '../lib/categories'

interface Props {
  sizes: string[]
  value: string | null
  onChange: (size: string) => void
  onGuide: () => void
  error?: boolean
}

export default function SizeSelector({ sizes, value, onChange, onGuide, error = false }: Props) {
  const { t, lang } = useLang()
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-navy-900/60">
          {t('filter.size')} {value ? <span className="text-navy-950">— {sizeLabel(value, lang)}</span> : ''}
        </p>
        <button
          onClick={onGuide}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-navy-900/60 underline-offset-4 transition-colors hover:text-navy-900 hover:underline"
        >
          <Ruler size={13} /> Size Guide
        </button>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {sizes.map((s) => (
          <button
            key={s}
            aria-pressed={value === s}
            onClick={() => onChange(s)}
            className={`h-11 border font-mono text-[12px] transition-all duration-200 ${
              value === s
                ? 'border-navy-900 bg-navy-900 text-white'
                : error
                  ? 'border-red-400/70 text-navy-900 hover:border-navy-900'
                  : 'border-navy-900/15 text-navy-900 hover:border-navy-900'
            }`}
          >
            {sizeLabel(s, lang)}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-red-500">{t('pdp.selectSizeErr')}</p>
      )}
    </div>
  )
}
