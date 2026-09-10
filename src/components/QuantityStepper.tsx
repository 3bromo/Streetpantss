import { Minus, Plus } from 'lucide-react'

interface Props {
  qty: number
  onChange: (qty: number) => void
  small?: boolean
}

export default function QuantityStepper({ qty, onChange, small = false }: Props) {
  return (
    <div className={`inline-flex items-center border border-navy-900/15 bg-white ${small ? 'h-9' : 'h-[50px]'}`}>
      <button
        aria-label="Decrease quantity"
        onClick={() => onChange(qty - 1)}
        className={`flex items-center justify-center text-navy-900 transition-colors duration-200 hover:bg-navy-900 hover:text-white ${
          small ? 'w-9' : 'w-11'
        }`}
      >
        <Minus size={14} />
      </button>
      <span className={`select-none text-center font-mono ${small ? 'w-8 text-[12px]' : 'w-10 text-[13px]'}`}>{qty}</span>
      <button
        aria-label="Increase quantity"
        onClick={() => onChange(qty + 1)}
        className={`flex items-center justify-center text-navy-900 transition-colors duration-200 hover:bg-navy-900 hover:text-white ${
          small ? 'w-9' : 'w-11'
        }`}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
