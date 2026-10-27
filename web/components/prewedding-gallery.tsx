"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import type { PreweddingPhoto, TileSize } from "@/lib/prewedding"

/*
 * Tile sizes in the bento grid (2 columns on mobile, 4 on desktop):
 *   large — 2×2   tall — 1×2   wide — 2×1   small — 1×1
 * Photos without a tileSize get one from their aspect ratio (autoTileSize), so
 * portraits land in tall tiles and faces aren't cropped away. grid-flow-dense
 * back-fills any holes. Admins can pin a size per photo.
 *
 * Images are pre-optimised WebP from the API (thumb for tiles, full for the
 * lightbox), so next/image optimisation is skipped.
 */
export function autoTileSize(photo: Pick<PreweddingPhoto, "width" | "height">, index: number): TileSize {
  const ratio = photo.width / photo.height
  if (index === 0 && ratio >= 0.7) return "large"  // hero shot (3:4 or wider survives a ~square crop)
  if (ratio < 0.85) return "tall"                    // portrait → 1×2
  if (ratio >= 1.6) return "wide"                    // panorama / 16:9 → 2×1
  return "small"                                     // square-ish / 4:3 → 1×1
}

const SIZE_CLASS: Record<TileSize, string> = {
  large: "col-span-2 row-span-2",
  tall:  "row-span-2",
  wide:  "col-span-2",
  small: "",
}

function altText(photo: PreweddingPhoto, index: number) {
  return photo.title ?? `Pre-wedding photo ${index + 1}`
}

export function PreweddingGallery({ photos }: { photos: PreweddingPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 grid-flow-dense auto-rows-[150px] md:auto-rows-[210px] gap-2 md:gap-3">
        {photos.map((photo, i) => {
          const size = photo.tileSize ?? autoTileSize(photo, i)
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`View photo ${i + 1}${photo.title ? ` — ${photo.title}` : ""}`}
              className={`reveal group relative overflow-hidden rounded-xl cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--c-sage)] ${SIZE_CLASS[size]}`}
              style={{ background: "var(--c-ivory-dark)" }}
            >
              <Image
                src={photo.thumbUrl}
                alt={altText(photo, i)}
                fill
                unoptimized
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              {/* Soft editorial scrim + title on hover */}
              <div
                className="pointer-events-none absolute inset-0 flex items-end p-3 md:p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "linear-gradient(to top, rgba(28,42,24,0.55) 0%, transparent 55%)" }}
              >
                {photo.title && (
                  <span
                    className="font-[family-name:var(--font-display)] italic text-lg md:text-xl text-left"
                    style={{ color: "var(--c-ivory)" }}
                  >
                    {photo.title}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {openIndex !== null && (
        <Lightbox
          photos={photos}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  )
}

function Lightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: PreweddingPhoto[]
  index: number
  onIndexChange: (i: number) => void
  onClose: () => void
}) {
  const total  = photos.length
  const photo  = photos[index]
  const touchX = useRef<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const ratio  = photo.width / photo.height

  const prev = useCallback(() => onIndexChange((index - 1 + total) % total), [index, total, onIndexChange])
  const next = useCallback(() => onIndexChange((index + 1) % total), [index, total, onIndexChange])

  /* Keyboard: Esc closes, arrows navigate */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, prev, next])

  /* Warm the neighbours so prev/next feel instant */
  useEffect(() => {
    if (total < 2) return
    for (const i of [(index + 1) % total, (index - 1 + total) % total]) {
      const img = new window.Image()
      img.src = photos[i].fullUrl
    }
  }, [index, total, photos])

  /* Lock page scroll while open */
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    return () => { document.body.style.overflow = original }
  }, [])

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 50) (dx > 0 ? prev : next)()
    touchX.current = null
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 animate-[lightbox-in_0.3s_ease-out]"
      style={{ background: "rgba(12,14,11,0.94)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        ref={closeRef}
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 grid h-11 w-11 md:h-12 md:w-12 place-items-center rounded-full transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {total > 1 && (
        <>
          <NavButton side="left" label="Previous photo" onClick={prev} />
          <NavButton side="right" label="Next photo" onClick={next} />
        </>
      )}

      <figure className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {/* Box takes the photo's own aspect ratio, capped to the viewport */}
        <div
          className="relative overflow-hidden rounded-xl animate-[lightbox-in_0.35s_ease-out]"
          style={{
            aspectRatio: ratio,
            width: `min(90vw, 1200px, calc(72vh * ${ratio}))`,
            background: "rgba(255,255,255,0.04)",
          }}
          key={photo.id}
        >
          <Image
            src={photo.fullUrl}
            alt={altText(photo, index)}
            fill
            unoptimized
            priority
            className="object-cover"
          />
        </div>
        <figcaption className="mt-5 text-center" style={{ color: "#fff" }}>
          {photo.title && (
            <p className="font-[family-name:var(--font-display)] text-2xl md:text-3xl italic">{photo.title}</p>
          )}
          {photo.caption && (
            <p className="font-[family-name:var(--font-label)] text-[12px] tracking-[0.25em] uppercase mt-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              {photo.caption}
            </p>
          )}
          <p className="font-[family-name:var(--font-label)] text-[11px] tracking-[0.2em] mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            {index + 1} / {total}
          </p>
        </figcaption>
      </figure>
    </div>,
    document.body,
  )
}

function NavButton({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`absolute top-1/2 -translate-y-1/2 ${side === "left" ? "left-2 md:left-6" : "right-2 md:right-6"} z-10 grid h-11 w-11 md:h-14 md:w-14 place-items-center rounded-full transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
      style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={side === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  )
}
