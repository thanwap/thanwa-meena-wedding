"use client"

import { useEffect } from "react"
import type { PhotoRecord } from "@/app/actions/photos"
import { FILTER_PRESETS } from "@/lib/image-filters"

interface Props {
  photo: PhotoRecord
  isOwner: boolean
  onClose: () => void
  onDelete: (id: string) => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
}

export function PhotoLightbox({ photo, isOwner, onClose, onDelete, onPrev, onNext }: Props) {
  // Close on Escape, navigate on arrow keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onPrev?.()
      if (e.key === "ArrowRight") onNext?.()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose, onPrev, onNext])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const filterLabel = FILTER_PRESETS.find((p) => p.id === photo.filterName)?.label ?? photo.filterName
  const dateStr = new Date(photo.createdAt).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          zIndex: 10,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Prev arrow */}
      {onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "50%",
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            zIndex: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Next arrow */}
      {onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "50%",
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            zIndex: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "75vh",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.fullUrl}
          alt={`Photo by ${photo.displayName}`}
          style={{
            maxWidth: "90vw",
            maxHeight: "75vh",
            objectFit: "contain",
            borderRadius: 8,
            display: "block",
          }}
        />
      </div>

      {/* Info + actions */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 20,
            fontStyle: "italic",
            fontWeight: 300,
            color: "rgba(255,255,255,0.9)",
            margin: 0,
          }}
        >
          {photo.displayName}
        </p>
        <p
          style={{
            fontFamily: "var(--font-sarabun)",
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            margin: 0,
          }}
        >
          {filterLabel} · {dateStr}
        </p>

        {isOwner && (
          <button
            onClick={() => onDelete(photo.id)}
            style={{
              marginTop: 8,
              background: "none",
              border: "1px solid rgba(248,113,113,0.4)",
              borderRadius: 8,
              padding: "6px 18px",
              color: "#f87171",
              fontFamily: "var(--font-josefin)",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            ลบรูปนี้
          </button>
        )}
      </div>
    </div>
  )
}
