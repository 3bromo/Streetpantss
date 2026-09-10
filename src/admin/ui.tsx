import { ReactNode } from 'react'
import { OrderStatus } from '../lib/types'

export function AdminPageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow text-navy-800/60">Admin</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-navy-950">{title}</h1>
        {sub && <p className="mt-2 max-w-xl text-[13.5px] text-ink/55">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`border border-navy-900/10 bg-white ${className}`}>{children}</div>
}

export function StatCard({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`border p-5 ${accent ? 'border-navy-900 bg-navy-950 text-white' : 'border-navy-900/10 bg-white'}`}>
      <p className={`font-mono text-[10px] uppercase tracking-[0.22em] ${accent ? 'text-white/50' : 'text-navy-900/50'}`}>
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-black tracking-tight">{value}</p>
    </div>
  )
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  new: 'bg-navy-800 text-white',
  confirmed: 'bg-navy-600 text-white',
  preparing: 'bg-navy-100 text-navy-900',
  shipped: 'bg-ink text-white',
  delivered: 'border border-navy-900/30 text-navy-900',
  cancelled: 'bg-ink/10 text-ink/50 line-through',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-navy-900/50 ${className}`}>
      {children}
    </th>
  )
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-[13px] text-ink/75 ${className}`}>{children}</td>
}

export function Spinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-900/20 border-t-navy-900" />
    </div>
  )
}
