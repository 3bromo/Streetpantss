import { ProductColor } from '../lib/types'

interface Props {
  colors: ProductColor[]
  value: string
  onChange: (name: string) => void
}

export default function ColorSelector({ colors, value, onChange }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-navy-900/60">Color</p>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-navy-950">{value}</p>
      </div>
      <div className="mt-3 flex gap-3">
        {colors.map((c) => (
          <button
            key={c.name}
            aria-label={`Select color ${c.name}`}
            aria-pressed={value === c.name}
            onClick={() => onChange(c.name)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ${
              value === c.name ? 'border-navy-900' : 'border-transparent hover:border-navy-900/30'
            }`}
          >
            <span
              className="block h-8 w-8 rounded-full border border-black/10"
              style={{ backgroundColor: c.hex, boxShadow: 'inset 0 0 0 2px #ffffff' }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
