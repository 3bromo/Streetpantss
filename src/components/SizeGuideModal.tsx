import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

const ROWS = [
  ['M', '76', '96', '77'],
  ['L', '81', '100', '78'],
  ['XL', '86', '104', '79'],
  ['2XL', '91', '108', '80'],
]

export default function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg bg-white p-8 text-navy-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow text-navy-800/60">Fit Guide</p>
                <p className="mt-1 font-display text-xl font-black uppercase tracking-tight">Size Guide</p>
              </div>
              <button aria-label="Close size guide" onClick={onClose} className="p-1 transition-transform duration-300 hover:rotate-90">
                <X size={22} strokeWidth={1.6} />
              </button>
            </div>

            <table className="mt-6 w-full border-collapse">
              <thead>
                <tr className="border-b border-navy-900/15">
                  {['Size', 'Waist (cm)', 'Hip (cm)', 'Inseam (cm)'].map((h) => (
                    <th key={h} className="pb-3 pr-3 text-left font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-navy-900/55">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r[0]} className="border-b border-navy-900/10">
                    {r.map((cell, i) => (
                      <td key={i} className={`py-3 pr-3 ${i === 0 ? 'font-display font-bold' : 'font-mono text-[13px] text-ink/70'}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-5 text-[13px] leading-relaxed text-ink/60">
              Measurements are body measurements in centimeters. Between sizes? Our cuts run true — size up for a
              looser fit, down for a sharper one.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
