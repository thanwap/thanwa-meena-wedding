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
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
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
          style={{ fontSize: 15, color: "var(--c-ink-2)", whiteSpace: "pre-wrap" }}
        >
          {entry.message}
        </p>

        {entry.imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
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
      {/* Card with fade transition */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
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
