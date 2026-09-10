import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import SmartImage from './SmartImage'

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')

  // ---- Lightbox state ----
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const count = images.length
  const hasMany = count > 1

  const openLightbox = (i: number) => {
    setCurrentImageIndex(i)
    setIsLightboxOpen(true)
  }
  const closeLightbox = () => setIsLightboxOpen(false)
  // Infinite loop navigation.
  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % count)
  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + count) % count)

  // ---- Keyboard navigation + scroll lock (only while open) ----
  useEffect(() => {
    if (!isLightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      else if (e.key === 'ArrowRight') nextImage()
      else if (e.key === 'ArrowLeft') prevImage()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen, count])

  return (
    <div>
      <div
        className="relative aspect-[3/4] cursor-zoom-in overflow-hidden bg-navy-100/40"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const y = ((e.clientY - rect.top) / rect.height) * 100
          setOrigin(`${x}% ${y}%`)
        }}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onClick={() => openLightbox(index)}
        title="Click to open full-screen"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <img
              src={images[index]}
              alt={`${name} — view ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 ease-out"
              style={{ transform: zoom ? 'scale(1.7)' : 'scale(1)', transformOrigin: origin }}
            />
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute bottom-3 right-3 bg-navy-950/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur">
          {index + 1} / {images.length}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-3">
        {images.map((img, i) => (
          <button
            key={`${img}-${i}`}
            onClick={() => setIndex(i)}
            aria-label={`View image ${i + 1} of ${name}`}
            className={`relative aspect-[3/4] overflow-hidden border transition-all duration-300 ${
              i === index ? 'border-navy-900' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <SmartImage src={img} alt="" className="h-full w-full" />
          </button>
        ))}
      </div>

      {/* ================= FULL-SCREEN LIGHTBOX ================= */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${name} — full-screen image viewer`}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeLightbox} /* backdrop click closes */
          >
            {/* Current image — clicks on the image itself do NOT close */}
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={images[currentImageIndex]}
                alt={`${name} — image ${currentImageIndex + 1} of ${count}`}
                className="max-w-[90vw] max-h-[90vh] object-contain transition-all duration-300 select-none"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
                draggable={false}
              />
            </AnimatePresence>

            {/* Close button — top right */}
            <button
              aria-label="Close full-screen viewer"
              onClick={(e) => {
                e.stopPropagation()
                closeLightbox()
              }}
              className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 p-2.5 text-white backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-white/25"
            >
              <X size={22} strokeWidth={2} />
            </button>

            {/* Navigation arrows — hidden when there is only one image */}
            {hasMany && (
              <>
                <button
                  aria-label="Previous image"
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2.5 text-white backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-white/25 sm:left-5"
                >
                  <ChevronLeft size={24} strokeWidth={2} className="rtl:-scale-x-100" />
                </button>
                <button
                  aria-label="Next image"
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2.5 text-white backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-white/25 sm:right-5"
                >
                  <ChevronRight size={24} strokeWidth={2} className="rtl:-scale-x-100" />
                </button>
              </>
            )}

            {/* Counter — bottom center */}
            <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/80 backdrop-blur">
              {currentImageIndex + 1} / {count}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
