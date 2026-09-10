import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import Reveal from './Reveal'

interface Props {
  eyebrow: string
  title: string
  link?: { to: string; label: string }
  dark?: boolean
  center?: boolean
}

export default function SectionHeading({ eyebrow, title, link, dark = false, center = false }: Props) {
  return (
    <Reveal
      className={`mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14 ${center ? 'justify-center text-center' : ''}`}
    >
      <div>
        <p className={`eyebrow ${dark ? 'text-white/50' : 'text-navy-800/60'}`}>{eyebrow}</p>
        <h2
          className={`mt-3 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl ${
            dark ? 'text-white' : 'text-navy-950'
          }`}
        >
          {title}
        </h2>
      </div>
      {link && (
        <Link
          to={link.to}
          className={`group inline-flex items-center gap-2 pb-1 font-mono text-[12px] uppercase tracking-[0.22em] transition-colors ${
            dark ? 'text-white/70 hover:text-white' : 'text-navy-900/60 hover:text-navy-900'
          }`}
        >
          {link.label}
          <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      )}
    </Reveal>
  )
}
