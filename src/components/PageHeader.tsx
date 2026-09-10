import Reveal from './Reveal'

interface Props {
  eyebrow: string
  title: string
  sub?: string
}

export default function PageHeader({ eyebrow, title, sub }: Props) {
  return (
    <section className="border-b border-navy-900/10 bg-white">
      <div className="container-sp py-14 md:py-20">
        <Reveal>
          <p className="eyebrow text-navy-800/60">{eyebrow}</p>
          <h1 className="mt-3 font-display text-5xl font-black uppercase leading-[0.92] tracking-tight text-navy-950 sm:text-6xl md:text-7xl">
            {title}
          </h1>
          {sub && <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink/60">{sub}</p>}
        </Reveal>
      </div>
    </section>
  )
}
