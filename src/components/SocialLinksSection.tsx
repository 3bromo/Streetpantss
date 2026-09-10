import { Link2 } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { useCatalog } from '../context/CatalogContext'
import Reveal from './Reveal'

export interface SocialLink {
  id: string
  name: string
  url: string
  icon: string
  enabled: boolean
  order: number
}

export function getSocialLinks(settings: Record<string, unknown>): SocialLink[] {
  const raw = settings?.socialLinks
  if (Array.isArray(raw) && raw.length > 0) {
    return (raw as SocialLink[])
      .filter((s) => s && s.enabled !== false && s.url)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }
  // Fallback to legacy settings until the admin configures the section
  const legacy: SocialLink[] = []
  if (settings?.instagram)
    legacy.push({ id: 'ig', name: 'Instagram', url: String(settings.instagram), icon: 'instagram', enabled: true, order: 0 })
  if (settings?.youtube)
    legacy.push({ id: 'yt', name: 'YouTube', url: String(settings.youtube), icon: 'youtube', enabled: true, order: 1 })
  if (settings?.whatsapp)
    legacy.push({
      id: 'wa',
      name: 'WhatsApp',
      url: `https://wa.me/${String(settings.whatsapp).replace(/\D/g, '')}`,
      icon: 'whatsapp',
      enabled: true,
      order: 2,
    })
  return legacy
}

export function SocialIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const p = { width: size, height: size, fill: 'currentColor', viewBox: '0 0 24 24' }
  switch (icon) {
    case 'instagram':
      return (
        <svg {...p}>
          <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-3.3-.1-4.8-1.7-4.9-4.9-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8C2.3 4 3.9 2.4 7.1 2.3c1.3-.1 1.7-.1 4.9-.1zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z" />
        </svg>
      )
    case 'facebook':
      return (
        <svg {...p}>
          <path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.3-1.4 1.5-1.4h1.4V5.5c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v2.3H8.5V14H11v7h2.5z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg {...p}>
          <path d="M16.6 3c.4 2.1 1.8 3.6 4 3.8v2.9c-1.5.1-2.9-.4-4.1-1.2v6.1c0 3.7-2.6 6.4-6.2 6.4a6.1 6.1 0 0 1-6.2-6.2c0-3.6 2.8-6.3 6.4-6.2.3 0 .7 0 1 .1v3a3.2 3.2 0 0 0-1.1-.2 3.2 3.2 0 0 0-3.2 3.2c0 1.8 1.4 3.2 3.1 3.2 1.8 0 3.2-1.3 3.2-3.3V3h3.1z" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg {...p}>
          <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1 2.2-.2 3.6a11 11 0 0 0 4.6 4.3c1.7.7 2.4.8 3.2.6.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z" />
        </svg>
      )
    case 'x':
      return (
        <svg {...p}>
          <path d="M17.8 3h2.9l-6.4 7.3L21.8 21h-5.9l-4.6-6-5.3 6H3.1l6.9-7.8L2.5 3h6l4.2 5.5L17.8 3zm-1 16.2h1.6L7.6 4.7H5.9l10.9 14.5z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg {...p}>
          <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" />
        </svg>
      )
    case 'snapchat':
      return (
        <svg {...p}>
          <path d="M12 2.5c3 0 5.4 2.3 5.4 5.6 0 .7 0 1.3-.1 1.9.5.2 1-.2 1.4-.2.6 0 1.3.4 1.3 1 0 .8-1.5 1.1-2 1.8-.3.4.7 2.3 2.7 3 .6.2.6.8 0 1.1-.9.5-2 .6-2.4 1-.2.3-.2.9-.6 1-.6.2-1.4-.2-2.4 0-.9.2-1.6 1.3-3.3 1.3s-2.4-1.1-3.3-1.3c-1-.2-1.8.2-2.4 0-.4-.1-.4-.7-.6-1-.4-.4-1.5-.5-2.4-1-.6-.3-.6-.9 0-1.1 2-.7 3-2.6 2.7-3-.5-.7-2-1-2-1.8 0-.6.7-1 1.3-1 .4 0 .9.4 1.4.2-.1-.6-.1-1.2-.1-1.9 0-3.3 2.4-5.6 5.4-5.6z" />
        </svg>
      )
    case 'telegram':
      return (
        <svg {...p}>
          <path d="M21.9 4.4 18.9 19c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6L18.5 7c.4-.3-.1-.5-.6-.2L7.6 13.2 3.2 11.8c-.9-.3-.9-1 .2-1.4L20.6 3c.8-.3 1.5.2 1.3 1.4z" />
        </svg>
      )
    default:
      return <Link2 size={size} />
  }
}

export default function SocialLinksSection() {
  const { lang } = useLang()
  const { settings } = useCatalog()
  const links = getSocialLinks(settings as unknown as Record<string, unknown>)
  if (links.length === 0) return null

  const title =
    lang === 'ar'
      ? String((settings as unknown as Record<string, unknown>)?.socialTitleAr || 'تابعنا')
      : String((settings as unknown as Record<string, unknown>)?.socialTitleEn || 'Follow Us')

  return (
    <Reveal>
        <div className="border-t border-ink/10 pt-10">
        <p className="text-center font-display text-[15px] font-black uppercase tracking-[0.2em] text-ink/60">
          {title}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {links.map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              aria-label={s.name}
              title={s.name}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink hover:text-ink"
            >
              <SocialIcon icon={s.icon} />
            </a>
          ))}
        </div>
      </div>
    </Reveal>
  )
}
