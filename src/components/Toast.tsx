import { AnimatePresence, motion } from 'framer-motion'
import { useUI } from '../context/UIContext'

export default function ToastStack() {
  const { toasts } = useUI()
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[95] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 sm:left-6 sm:translate-x-0 sm:items-start sm:px-0">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full border border-white/10 bg-navy-950 px-5 py-4 text-white shadow-2xl"
          >
            <p className="font-display text-[12px] font-bold uppercase tracking-[0.18em]">{t.title}</p>
            {t.sub && <p className="mt-1 font-mono text-[11px] text-white/60">{t.sub}</p>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
