"use client"

import { useState } from "react"
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
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Full size"
        style={{
          maxWidth: "90vw",
          maxHeight: "85vh",
          objectFit: "contain",
          borderRadius: 12,
          boxShadow: "0 24px 64px -12px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "rgba(255,255,255,0.15)",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          cursor: "pointer",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
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
    <div className="space-y-4">
      {entries.map((entry) => (
        <GuestbookCard key={entry.id} entry={entry} />
      ))}
    </div>
  )
}
