import { useEffect, useState } from 'react'

interface Props {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  priority?: boolean
}

/**
 * Cache-safe image component:
 * - First paint uses the given src (skeleton until loaded).
 * - When `src` changes (image replaced in admin), the NEW image is fully
 *   preloaded in the background BEFORE swapping, so users never see a broken
 *   frame, a blank area, or a stale cached image flash.
 * - On preload failure the previous image is kept (never a broken URL).
 */
export default function SmartImage({ src, alt, className = '', imgClassName = '', priority = false }: Props) {
  const [shown, setShown] = useState(src)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (src === shown) return
    let alive = true
    const pre = new Image()
    pre.onload = () => {
      if (!alive) return
      setLoaded(false)
      setShown(src)
    }
    pre.onerror = () => {
      /* keep the currently displayed image — never show a broken URL */
    }
    pre.src = src
    return () => {
      alive = false
    }
  }, [src, shown])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="skeleton absolute inset-0" aria-hidden="true" />}
      <img
        src={shown}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        draggable={false}
      />
    </div>
  )
}
