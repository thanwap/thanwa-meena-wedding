"use client"

import { useState, useEffect, useCallback } from "react"
import type { GuestbookEntryDto } from "@/app/actions/guestbook"

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

function ImageLightbox({
  src,
  onClose,
}: {
  src: string
  onClose: () => void
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(28,42,24,0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "zoom-out",
        padding: 48,
      }}
    >
      <div style={{ position: "relative", display: "inline-flex" }} onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Full size"
          style={{
            maxWidth: "90vw",
            maxHeight: "80vh",
            objectFit: "contain",
            borderRadius: 12,
            boxShadow: "0 24px 64px -12px rgba(0,0,0,0.5)",
            display: "block",
          }}
        />
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: -16,
            right: -16,
            background: "rgba(20,20,20,0.75)",
            border: "1.5px solid rgba(255,255,255,0.25)",
            borderRadius: "50%",
            width: 36,
            height: 36,
            cursor: "pointer",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

const LANDSCAPES = [
  // 0 — Pine forest + mountains
  <svg key="0" width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 80 L0 52 C15 52 25 35 45 38 C65 41 78 22 105 26 C132 30 142 45 162 43 C182 41 198 12 224 17 C250 22 263 40 284 38 C305 36 320 8 346 14 C372 20 386 36 400 33 L400 80 Z" fill="#D4C0BC"/>
    <path d="M0 80 L0 62 C18 62 28 50 48 53 C68 56 82 44 102 47 C122 50 138 56 158 53 C178 50 194 38 216 42 C238 46 255 54 276 51 C297 48 313 38 334 41 C355 44 374 52 400 48 L400 80 Z" fill="#B5C8A0"/>
    <path d="M15 55 L5 80 L25 80 Z M30 60 L22 80 L38 80 Z M48 50 L36 80 L60 80 Z M65 58 L56 80 L74 80 Z M82 52 L71 80 L93 80 Z M100 56 L92 80 L108 80 Z M118 48 L105 80 L131 80 Z M138 58 L129 80 L147 80 Z M155 52 L144 80 L166 80 Z M175 55 L166 80 L184 80 Z M194 50 L182 80 L206 80 Z M214 58 L206 80 L222 80 Z M232 52 L221 80 L243 80 Z M252 56 L243 80 L261 80 Z M270 49 L258 80 L282 80 Z M290 58 L282 80 L298 80 Z M308 52 L297 80 L319 80 Z M328 55 L319 80 L337 80 Z M348 48 L335 80 L361 80 Z M368 56 L359 80 L377 80 Z M385 52 L374 80 L396 80 Z" fill="#6B8A5C"/>
  </svg>,

  // 1 — Rolling hills + wildflowers
  <svg key="1" width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 80 L0 50 Q50 30 100 45 Q150 58 200 40 Q250 22 300 42 Q350 60 400 38 L400 80 Z" fill="#D4C0BC"/>
    <path d="M0 80 L0 65 Q80 45 160 58 Q240 70 320 55 Q360 48 400 60 L400 80 Z" fill="#B5C8A0"/>
    <path d="M0 80 L0 73 Q100 69 200 73 Q300 77 400 71 L400 80 Z" fill="#8FAD7A"/>
    <line x1="30" y1="73" x2="30" y2="77" stroke="#6B8A5C" strokeWidth="0.8"/>
    <circle cx="30" cy="72" r="2.2" fill="#E8C3BE"/>
    <line x1="68" y1="72" x2="68" y2="76" stroke="#6B8A5C" strokeWidth="0.8"/>
    <circle cx="68" cy="71" r="1.8" fill="#C4B0C8"/>
    <line x1="105" y1="73" x2="105" y2="77" stroke="#6B8A5C" strokeWidth="0.8"/>
    <circle cx="105" cy="72" r="2.2" fill="#E8C3BE"/>
    <line x1="145" y1="72" x2="145" y2="76" stroke="#6B8A5C" strokeWidth="0.8"/>
    <circle cx="145" cy="71" r="1.8" fill="#F2C4CE"/>
    <line x1="182" y1="73" x2="182" y2="77" stroke="#6B8A5C" strokeWidth="0.8"/>
    <circle cx="182" cy="72" r="2.2" fill="#C4B0C8"/>
    <line x1="220" y1="72" x2="220" y2="76" stroke="#6B8A5C" strokeWidth="0.8"/>
    <circle cx="220" cy="71" r="1.8" fill="#E8C3BE"/>
    <line x1="258" y1="73" x2="258" y2="77" stroke="#6B8A5C" strokeWidth="0.8"/>
    <circle cx="258" cy="72" r="2.2" fill="#F2C4CE"/>
    <line x1="295" y1="72" x2="295" y2="76" stroke="#6B8A5C" strokeWidth="0.8"/>
    <circle cx="295" cy="71" r="1.8" fill="#E8C3BE"/>
    <line x1="332" y1="73" x2="332" y2="77" stroke="#6B8A5C" strokeWidth="0.8"/>
    <circle cx="332" cy="72" r="2.2" fill="#C4B0C8"/>
    <line x1="370" y1="72" x2="370" y2="76" stroke="#6B8A5C" strokeWidth="0.8"/>
    <circle cx="370" cy="71" r="1.8" fill="#E8C3BE"/>
  </svg>,

  // 2 — Cherry blossom grove
  <svg key="2" width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 80 L0 68 Q200 62 400 68 L400 80 Z" fill="#C8D8B0"/>
    <line x1="55" y1="70" x2="55" y2="44" stroke="#8B6E5A" strokeWidth="2.5"/>
    <line x1="55" y1="56" x2="43" y2="50" stroke="#8B6E5A" strokeWidth="1.2"/>
    <circle cx="55" cy="36" r="16" fill="#F2C4CE" opacity="0.85"/>
    <circle cx="43" cy="44" r="9" fill="#F2C4CE" opacity="0.75"/>
    <circle cx="67" cy="42" r="8" fill="#F2C4CE" opacity="0.7"/>
    <line x1="150" y1="70" x2="150" y2="38" stroke="#8B6E5A" strokeWidth="3.5"/>
    <line x1="150" y1="52" x2="164" y2="46" stroke="#8B6E5A" strokeWidth="1.5"/>
    <line x1="150" y1="48" x2="136" y2="42" stroke="#8B6E5A" strokeWidth="1.2"/>
    <circle cx="150" cy="26" r="21" fill="#F2C4CE" opacity="0.88"/>
    <circle cx="164" cy="38" r="11" fill="#F2C4CE" opacity="0.75"/>
    <circle cx="136" cy="36" r="10" fill="#F2C4CE" opacity="0.72"/>
    <line x1="255" y1="70" x2="255" y2="42" stroke="#8B6E5A" strokeWidth="3"/>
    <line x1="255" y1="54" x2="268" y2="48" stroke="#8B6E5A" strokeWidth="1.2"/>
    <circle cx="255" cy="32" r="18" fill="#F2C4CE" opacity="0.85"/>
    <circle cx="268" cy="42" r="10" fill="#F2C4CE" opacity="0.72"/>
    <circle cx="243" cy="40" r="9" fill="#F2C4CE" opacity="0.7"/>
    <line x1="350" y1="70" x2="350" y2="46" stroke="#8B6E5A" strokeWidth="2.5"/>
    <circle cx="350" cy="36" r="16" fill="#F2C4CE" opacity="0.82"/>
    <circle cx="362" cy="44" r="9" fill="#F2C4CE" opacity="0.7"/>
    <ellipse cx="100" cy="58" rx="2.5" ry="1.2" transform="rotate(-25 100 58)" fill="#F2C4CE" opacity="0.7"/>
    <ellipse cx="200" cy="52" rx="2.5" ry="1.2" transform="rotate(20 200 52)" fill="#F2C4CE" opacity="0.65"/>
    <ellipse cx="305" cy="55" rx="2.5" ry="1.2" transform="rotate(-15 305 55)" fill="#F2C4CE" opacity="0.7"/>
    <ellipse cx="22" cy="60" rx="2" ry="1" transform="rotate(30 22 60)" fill="#F2C4CE" opacity="0.6"/>
    <ellipse cx="390" cy="62" rx="2" ry="1" transform="rotate(-20 390 62)" fill="#F2C4CE" opacity="0.6"/>
  </svg>,

  // 3 — Lakeside with reeds
  <svg key="3" width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 80 L0 52 Q50 38 100 44 Q150 50 200 42 Q250 34 300 42 Q350 50 400 44 L400 80 Z" fill="#C5D0B8"/>
    <path d="M0 80 L0 50 Q200 44 400 50 L400 80 Z" fill="#B8D4D8" opacity="0.75"/>
    <path d="M20 58 Q45 55 70 58 Q95 61 120 58" stroke="white" strokeWidth="0.9" fill="none" opacity="0.45"/>
    <path d="M100 65 Q135 62 170 65 Q205 68 240 65" stroke="white" strokeWidth="0.9" fill="none" opacity="0.45"/>
    <path d="M220 60 Q255 57 290 60 Q325 63 360 60" stroke="white" strokeWidth="0.9" fill="none" opacity="0.45"/>
    <ellipse cx="200" cy="54" rx="35" ry="3.5" fill="white" opacity="0.18"/>
    <line x1="12" y1="80" x2="12" y2="48" stroke="#6B8A5C" strokeWidth="1.2"/>
    <line x1="20" y1="80" x2="20" y2="44" stroke="#6B8A5C" strokeWidth="1"/>
    <line x1="28" y1="80" x2="28" y2="50" stroke="#6B8A5C" strokeWidth="0.9"/>
    <ellipse cx="12" cy="46" rx="2" ry="5" fill="#8B6E3A"/>
    <ellipse cx="20" cy="42" rx="2" ry="5" fill="#8B6E3A"/>
    <ellipse cx="28" cy="48" rx="1.5" ry="4" fill="#8B6E3A"/>
    <line x1="372" y1="80" x2="372" y2="48" stroke="#6B8A5C" strokeWidth="1.2"/>
    <line x1="380" y1="80" x2="380" y2="44" stroke="#6B8A5C" strokeWidth="1"/>
    <line x1="388" y1="80" x2="388" y2="50" stroke="#6B8A5C" strokeWidth="0.9"/>
    <ellipse cx="372" cy="46" rx="2" ry="5" fill="#8B6E3A"/>
    <ellipse cx="380" cy="42" rx="2" ry="5" fill="#8B6E3A"/>
    <ellipse cx="388" cy="48" rx="1.5" ry="4" fill="#8B6E3A"/>
  </svg>,

  // 4 — Garden meadow with rounded bushes
  <svg key="4" width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 80 L0 55 Q100 35 200 50 Q300 65 400 48 L400 80 Z" fill="#D4C0BC"/>
    <path d="M0 80 L0 69 Q200 63 400 69 L400 80 Z" fill="#A8C090"/>
    <ellipse cx="35" cy="68" rx="22" ry="13" fill="#7A9E68"/>
    <ellipse cx="78" cy="71" rx="15" ry="9" fill="#8AAE78"/>
    <ellipse cx="118" cy="67" rx="23" ry="14" fill="#6B8A5C"/>
    <ellipse cx="162" cy="70" rx="17" ry="10" fill="#7A9E68"/>
    <ellipse cx="202" cy="68" rx="20" ry="12" fill="#8AAE78"/>
    <ellipse cx="244" cy="71" rx="15" ry="9" fill="#6B8A5C"/>
    <ellipse cx="283" cy="67" rx="22" ry="13" fill="#7A9E68"/>
    <ellipse cx="324" cy="70" rx="17" ry="10" fill="#8AAE78"/>
    <ellipse cx="363" cy="68" rx="21" ry="13" fill="#6B8A5C"/>
    <circle cx="35" cy="58" r="2.5" fill="#E8C3BE"/>
    <circle cx="118" cy="56" r="2.5" fill="#F2C4CE"/>
    <circle cx="202" cy="58" r="2.5" fill="#E8C3BE"/>
    <circle cx="283" cy="57" r="2.5" fill="#F2C4CE"/>
    <circle cx="363" cy="57" r="2.5" fill="#E8C3BE"/>
    <circle cx="35" cy="58" r="1" fill="white" opacity="0.6"/>
    <circle cx="118" cy="56" r="1" fill="white" opacity="0.6"/>
    <circle cx="202" cy="58" r="1" fill="white" opacity="0.6"/>
    <circle cx="283" cy="57" r="1" fill="white" opacity="0.6"/>
    <circle cx="363" cy="57" r="1" fill="white" opacity="0.6"/>
  </svg>,
]

function GuestbookCard({ entry }: { entry: GuestbookEntryDto }) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  return (
    <>
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
      <div
        style={{
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(232,195,190,0.4)",
          borderRadius: 12,
          padding: "20px 22px",
          backdropFilter: "blur(8px)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          overflow: "hidden",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3 shrink-0">
          <p
            className="font-[family-name:var(--font-cormorant)] italic"
            style={{ fontSize: 20, color: "var(--c-ink)", lineHeight: 1.2 }}
          >
            {entry.name}
          </p>
          <p
            className="font-[family-name:var(--font-josefin)] shrink-0"
            style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--c-muted)", paddingTop: 4 }}
          >
            {formatDate(entry.createdAt)}
          </p>
        </div>

        <p
          className="font-[family-name:var(--font-sarabun)] leading-relaxed"
          style={{ fontSize: 15, color: "var(--c-ink-2)", whiteSpace: "pre-wrap", overflowY: "auto", flex: 1 }}
        >
          {entry.message}
        </p>

        {entry.imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 shrink-0">
            {entry.imageUrls.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxSrc(url)}
                style={{ background: "none", border: "none", padding: 0, cursor: "zoom-in" }}
                aria-label={`View photo ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`photo ${i + 1}`}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid rgba(232,195,190,0.4)",
                    transition: "opacity 0.2s ease",
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {entry.imageUrls.length === 0 && (
          <div className="shrink-0 mt-auto" style={{ opacity: 0.28 }}>
            {LANDSCAPES[entry.id % LANDSCAPES.length]}
          </div>
        )}
      </div>
    </>
  )
}

export function GuestbookWall({ entries }: { entries: GuestbookEntryDto[] }) {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  const go = useCallback(
    (next: number) => {
      setVisible(false)
      setTimeout(() => {
        setCurrent(next)
        setVisible(true)
      }, 300)
    },
    [],
  )

  const prev = () => go((current - 1 + entries.length) % entries.length)
  const next = useCallback(() => go((current + 1) % entries.length), [current, entries.length, go])

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (entries.length <= 1) return
    const id = setTimeout(next, 6000)
    return () => clearTimeout(id)
  }, [current, entries.length, next])

  if (entries.length === 0) {
    return (
      <p
        className="text-center font-[family-name:var(--font-sarabun)]"
        style={{ color: "var(--c-muted)", fontSize: 15 }}
      >
        Be the first to leave a message ♡
      </p>
    )
  }

  return (
    <div>
      {/* Card with fade transition — fixed height so layout doesn't shift between entries */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
          height: 250,
        }}
      >
        <GuestbookCard entry={entries[current]} />
      </div>

      {/* Controls */}
      {entries.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-5">
          {/* Prev */}
          <button
            onClick={prev}
            aria-label="Previous"
            style={{
              background: "none",
              border: "1px solid rgba(232,195,190,0.6)",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              color: "var(--c-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {entries.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  background: i === current ? "var(--c-blush-deep)" : "rgba(232,195,190,0.4)",
                  border: "none",
                  borderRadius: "50%",
                  width: i === current ? 8 : 6,
                  height: i === current ? 8 : 6,
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Next */}
          <button
            onClick={next}
            aria-label="Next"
            style={{
              background: "none",
              border: "1px solid rgba(232,195,190,0.6)",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              color: "var(--c-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
