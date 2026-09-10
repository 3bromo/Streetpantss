import { useCatalog } from '../context/CatalogContext'

export default function AnnouncementBar() {
  const { settings } = useCatalog()
  const half = Array(3).fill(settings.announcement).join('      ·      ') + '      ·      '
  return (
    <div className="relative z-[60] overflow-hidden bg-navy-950 py-2.5">
      <div className="animate-marquee flex w-max">
        <span className="eyebrow !text-[10px] whitespace-pre text-white/70">{half}</span>
        <span className="eyebrow !text-[10px] whitespace-pre text-white/70" aria-hidden="true">
          {half}
        </span>
      </div>
    </div>
  )
}
