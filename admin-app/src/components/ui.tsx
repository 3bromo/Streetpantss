import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { AlertTriangle, ArrowLeft, Inbox, RefreshCw, X } from 'lucide-react'
import { OrderStatus } from '../lib/types'

// ------------------------------------------------ snackbar

interface Snack {
  id: number
  msg: string
  kind: 'success' | 'error'
}

const SnackContext = createContext<{ show: (msg: string, kind?: 'success' | 'error') => void } | null>(null)

let snackId = 0

export function SnackProvider({ children }: { children: ReactNode }) {
  const [snacks, setSnacks] = useState<Snack[]>([])
  const show = useCallback((msg: string, kind: 'success' | 'error' = 'success') => {
    const id = ++snackId
    setSnacks((s) => [...s.slice(-1), { id, msg, kind }])
    window.setTimeout(() => setSnacks((s) => s.filter((x) => x.id !== id)), 2600)
  }, [])
  return (
    <SnackContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-6">
        {snacks.map((s) => (
          <div
            key={s.id}
            className={`snack pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-center font-display text-[12px] font-bold uppercase tracking-[0.12em] text-white shadow-lg ${
              s.kind === 'error' ? 'bg-red-700' : 'bg-navy-900'
            }`}
          >
            {s.msg}
          </div>
        ))}
      </div>
    </SnackContext.Provider>
  )
}

export function useSnack() {
  const ctx = useContext(SnackContext)
  if (!ctx) throw new Error('useSnack outside SnackProvider')
  return ctx
}

// ------------------------------------------------ primitives

export function Spinner({ light = false }: { light?: boolean }) {
  return (
    <div
      className={`h-6 w-6 animate-spin rounded-full border-2 ${
        light ? 'border-white/25 border-t-white' : 'border-navy-900/20 border-t-navy-900'
      }`}
    />
  )
}

export function FullLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card flex items-center gap-3 p-4">
          <div className="skel h-14 w-14" />
          <div className="flex-1 space-y-2">
            <div className="skel h-3.5 w-2/3" />
            <div className="skel h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-100 text-navy-800">
        <Inbox size={24} strokeWidth={1.6} />
      </span>
      <p className="mt-4 font-display text-[15px] font-black uppercase tracking-tight text-navy-950">{title}</p>
      {sub && <p className="mt-1.5 max-w-[240px] text-[13px] leading-relaxed text-ink/50">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
        <AlertTriangle size={24} strokeWidth={1.6} />
      </span>
      <p className="mt-4 font-display text-[15px] font-black uppercase tracking-tight text-navy-950">Something went wrong</p>
      <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-ink/55">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-ghost mt-5 h-11 px-6">
          <RefreshCw size={15} /> Retry
        </button>
      )}
    </div>
  )
}

// ------------------------------------------------ top bar

export function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-40 border-b border-navy-900/10 bg-soft/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-lg items-center gap-2 px-4">
        {onBack && (
          <button aria-label="Back" onClick={onBack} className="-ml-1 p-1.5 text-navy-950 active:opacity-60">
            <ArrowLeft size={22} strokeWidth={1.8} />
          </button>
        )}
        <p className="flex-1 truncate font-display text-[15px] font-black uppercase tracking-[0.08em] text-navy-950">
          {title}
        </p>
        {right}
      </div>
    </div>
  )
}

// ------------------------------------------------ sheet (bottom modal)

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-navy-950/60" onClick={onClose} />
      <div className="sheet absolute inset-x-0 bottom-0 mx-auto max-h-[88vh] max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-[15px] font-black uppercase tracking-[0.08em] text-navy-950">{title}</p>
          <button aria-label="Close" onClick={onClose} className="p-1.5 text-navy-900/50 active:opacity-60">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ------------------------------------------------ confirm dialog

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-navy-950/60" onClick={onClose} />
      <div className="fade-in relative w-full max-w-sm rounded-card bg-white p-6">
        <p className="font-display text-[15px] font-black uppercase tracking-tight text-navy-950">{title}</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink/60">{message}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy} className={`btn flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}>
            {busy ? <Spinner light /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------ small controls

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-navy-800' : 'bg-navy-900/20'}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
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

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

export function StatCard({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-card p-4 ${accent ? 'bg-navy-950 text-white' : 'card'}`}>
      <p className={`eyebrow ${accent ? 'text-white/50' : 'text-navy-900/50'}`}>{label}</p>
      <p className="mt-1.5 font-display text-[22px] font-black leading-none tracking-tight">{value}</p>
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input pr-10" />
      {value && (
        <button aria-label="Clear" onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-navy-900/40">
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export function Img({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={`relative overflow-hidden bg-navy-100/50 ${className}`}>
      {!loaded && <div className="skel absolute inset-0 rounded-none" />}
      <img src={src} alt={alt} loading="lazy" onLoad={() => setLoaded(true)} className={`h-full w-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}
