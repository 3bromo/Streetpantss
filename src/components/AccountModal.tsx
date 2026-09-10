import { useState, FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useUI } from '../context/UIContext'

export default function AccountModal() {
  const { accountOpen, setAccountOpen } = useUI()
  const [tab, setTab] = useState<'signin' | 'register'>('signin')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setDone(true)
  }

  const close = () => {
    setAccountOpen(false)
    setDone(false)
    setEmail('')
    setName('')
    setPassword('')
  }

  return (
    <AnimatePresence>
      {accountOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md bg-white p-8 text-navy-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-xl font-black uppercase tracking-tight">Account</p>
              <button aria-label="Close" onClick={close} className="p-1 transition-transform duration-300 hover:rotate-90">
                <X size={22} strokeWidth={1.6} />
              </button>
            </div>

            {done ? (
              <div className="mt-8 border border-navy-900/10 bg-soft p-6 text-center">
                <p className="font-display text-[15px] font-black uppercase tracking-wide">You&apos;re on the list.</p>
                <p className="mt-2 text-[13px] leading-relaxed text-ink/60">
                  This is a preview storefront — accounts go live at launch. Until then, check out as a guest.
                </p>
                <button onClick={close} className="btn btn-primary btn-sm mt-5">
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-2 border border-navy-900/15">
                  <button
                    onClick={() => setTab('signin')}
                    className={`h-11 font-display text-[12px] font-bold uppercase tracking-[0.16em] transition-colors ${
                      tab === 'signin' ? 'bg-navy-900 text-white' : 'text-navy-900/60 hover:text-navy-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setTab('register')}
                    className={`h-11 font-display text-[12px] font-bold uppercase tracking-[0.16em] transition-colors ${
                      tab === 'register' ? 'bg-navy-900 text-white' : 'text-navy-900/60 hover:text-navy-900'
                    }`}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={submit} className="mt-6 space-y-3">
                  {tab === 'register' && (
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      aria-label="Full name"
                      className="input"
                    />
                  )}
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    aria-label="Email address"
                    className="input"
                  />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    aria-label="Password"
                    className="input"
                  />
                  <button type="submit" className="btn btn-primary w-full">
                    {tab === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>
                <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/40">
                  Preview only — no real account is created.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
