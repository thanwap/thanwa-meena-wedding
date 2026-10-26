"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { RiVolumeMuteLine, RiVolumeUpLine } from "@remixicon/react"
import heroPoster from "@/public/hero-poster.jpg"

type NetworkInformation = { saveData?: boolean; effectiveType?: string }

/** Guests on Save-Data or 2G keep the poster instead of pulling the 6 MB reel */
function onSlowConnection() {
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection
  return Boolean(conn?.saveData || /2g/.test(conn?.effectiveType ?? ""))
}

/** Muted, looping pre-wedding reel for the hero, with a tap-to-unmute button.
    An inlined blur of the poster paints with the HTML, then the priority poster
    fades in over it; the video downloads only once play() is called
    after hydration and cross-fades in when frames actually arrive.
    React omits the `muted` attribute from SSR HTML, so iOS refuses to autoplay
    until we set it on the element and call play() ourselves. Pauses offscreen
    (sound included) to spare battery, and stays on the poster for
    reduced-motion or slow-connection guests until they turn the sound on. */
export function HeroVideo({
  className = "",
  buttonClassName = "",
}: {
  className?: string
  buttonClassName?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [posterLoaded, setPosterLoaded] = useState(false)
  const unmutedOnce = useRef(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    video.muted = true

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduceMotion.matches || onSlowConnection()) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Low Power Mode rejects autoplay — the poster stays up, which is fine
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  function toggleSound() {
    const video = ref.current
    if (!video) return
    const next = !muted
    video.muted = next
    if (!next) {
      // First unmute starts the song from the top instead of mid-verse
      if (!unmutedOnce.current) {
        video.currentTime = 0
        unmutedOnce.current = true
      }
      video.play().catch(() => {})
    }
    setMuted(next)
  }

  return (
    <>
      {/* Inlined blur paints with the HTML; the poster fades in over it only once
          fully decoded, so slow networks never show a half-drawn image */}
      <div
        aria-hidden
        className="absolute inset-0 scale-125 bg-cover bg-center blur-xl"
        style={{ backgroundImage: `url(${heroPoster.blurDataURL})` }}
      />
      <Image
        src={heroPoster}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 500px, 100vw"
        onLoad={() => setPosterLoaded(true)}
        className={`object-cover transition-opacity duration-500 ${posterLoaded ? "opacity-100" : "opacity-0"}`}
      />
      <video
        ref={ref}
        // 1px bleed on the desktop card: subpixel card widths would otherwise let the poster peek
        // out at an edge (max-w-none lifts preflight's video max-width: 100%). Mobile is full-bleed
        // and iOS doesn't clip composited video to overflow:hidden, so the bleed drew hairlines there
        className={`absolute inset-0 h-full w-full max-w-none lg:-top-px lg:-left-px lg:h-[calc(100%+2px)] lg:w-[calc(100%+2px)] transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"} ${className}`}
        src="/hero.mp4"
        muted
        loop
        playsInline
        preload="none"
        onPlaying={() => setPlaying(true)}
        aria-label="Pre-wedding film of Meena and Thanwa on the beach and hillside"
      />
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? "เปิดเสียง" : "ปิดเสียง"}
        aria-pressed={!muted}
        className={`inline-flex h-7 items-center before:absolute before:-inset-2 before:content-[''] gap-1.5 rounded-full border border-[rgba(250,247,240,0.45)] bg-[rgba(250,247,240,0.55)] px-2.5 text-[var(--c-ink-2)] backdrop-blur-sm transition-all duration-200 hover:bg-[rgba(250,247,240,0.8)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-sage)] ${buttonClassName}`}
      >
        {muted ? (
          <RiVolumeMuteLine size={14} aria-hidden />
        ) : (
          <RiVolumeUpLine size={14} aria-hidden />
        )}
        {muted && (
          <span className="font-[family-name:var(--font-thai)] text-[12px] font-light tracking-[0.06em]">
            เปิดเสียง
          </span>
        )}
      </button>
    </>
  )
}
