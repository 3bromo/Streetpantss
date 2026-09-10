import { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { NEW_CATEGORIES, SIZE_KEYS, SIZE_LABELS, displayCategory } from '../lib/categories'

export const PRICE_RANGES = [
  { id: 'under-1000', label: 'Under 1,000 EGP', min: 0, max: 999 },
  { id: '1000-1299', label: '1,000 – 1,299 EGP', min: 1000, max: 1299 },
  { id: '1300-1499', label: '1,300 – 1,499 EGP', min: 1300, max: 1499 },
  { id: '1500-plus', label: '1,500+ EGP', min: 1500, max: Infinity },
]

export interface FilterState {
  cats: string[]
  sizes: string[]
  colors: string[]
  prices: string[]
}

export const EMPTY_FILTERS: FilterState = { cats: [], sizes: [], colors: [], prices: [] }

interface Props {
  state: FilterState
  counts: Record<string, number>
  /** Colors are fully dynamic — derived from the live catalog, admin-managed. */
  colors: { name: string; hex: string }[]
  onToggle: (key: keyof FilterState, value: string) => void
  onClear: () => void
  activeCount: number
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="font-display text-[12px] font-bold uppercase tracking-[0.2em] text-navy-950">{children}</p>
}

export default function Filters({ state, counts, colors, onToggle, onClear, activeCount }: Props) {
  const { t, lang } = useLang()
  return (
    <div className="space-y-9">
      <div className="flex items-center justify-between">
        <p className="eyebrow text-navy-800/60">Filters {activeCount > 0 ? `(${activeCount})` : ''}</p>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-navy-900/60 underline-offset-4 transition-colors hover:text-navy-900 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <SectionTitle>{t('filter.category')}</SectionTitle>
        <div className="mt-4 space-y-2.5">
          {NEW_CATEGORIES.map((c) => {
            const active = state.cats.includes(c.slug)
            return (
              <button
                key={c.slug}
                onClick={() => onToggle('cats', c.slug)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-[18px] w-[18px] items-center justify-center border transition-colors duration-200 ${
                      active ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/25 text-transparent'
                    }`}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className={`text-[13.5px] transition-colors ${active ? 'font-medium text-navy-950' : 'text-ink/70'}`}>
                    {displayCategory(c.slug, lang)}
                  </span>
                </span>
                <span className="font-mono text-[11px] text-navy-900/40">{counts[c.slug] ?? 0}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <SectionTitle>{t('filter.size')}</SectionTitle>
        <div className="mt-4 flex flex-wrap gap-2">
          {SIZE_KEYS.map((s) => {
            const active = state.sizes.includes(s)
            return (
              <button
                key={s}
                onClick={() => onToggle('sizes', s)}
                title={SIZE_LABELS[s][lang]}
                className={`h-10 min-w-[48px] px-2 border font-mono text-[12px] transition-all duration-200 ${
                  active ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 text-navy-900 hover:border-navy-900'
                }`}
              >
                {SIZE_LABELS[s][lang]}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <SectionTitle>{t('filter.color')}</SectionTitle>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
          {colors.map((c) => {
            const active = state.colors.includes(c.name)
            return (
              <button key={c.name} onClick={() => onToggle('colors', c.name)} className="group flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${
                    active ? 'border-navy-900' : 'border-transparent group-hover:border-navy-900/30'
                  }`}
                >
                  <span className="block h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                </span>
                <span className={`font-mono text-[9px] uppercase tracking-[0.12em] ${active ? 'text-navy-950' : 'text-navy-900/45'}`}>
                  {c.name.split(' ')[0]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <SectionTitle>{t('filter.price')}</SectionTitle>
        <div className="mt-4 space-y-2.5">
          {PRICE_RANGES.map((r) => {
            const active = state.prices.includes(r.id)
            return (
              <button key={r.id} onClick={() => onToggle('prices', r.id)} className="flex w-full items-center gap-3 text-left">
                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center border transition-colors duration-200 ${
                    active ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/25 text-transparent'
                  }`}
                >
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className={`font-mono text-[12px] ${active ? 'text-navy-950' : 'text-ink/70'}`}>{r.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
