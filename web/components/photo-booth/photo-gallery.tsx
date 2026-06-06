"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { getPhotos, deletePhotoByOwner, type PhotoRecord } from "@/app/actions/photos"
import {
  getDeviceId,
  getDisplayName,
  getPhotoCount,
  hasReachedLimit,
  MAX_PHOTOS,
} from "@/lib/device-id"
import { CameraViewfinder } from "./camera-viewfinder"
import { PhotoPreview } from "./photo-preview"
import { PhotoLightbox } from "./photo-lightbox"

type Tab = "all" | "mine"

interface CapturedPhoto {
  fullBlob: Blob
  thumbBlob: Blob
  filterName: import("@/lib/image-filters").FilterName
  previewUrl: string
}

export function PhotoGallery() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("all")
  const [showCamera, setShowCamera] = useState(false)
  const [captured, setCaptured] = useState<CapturedPhoto | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  // Lazy initializers — safe because this is a client-only component
  const [photoCount, setPhotoCount] = useState(() =>
    typeof window !== "undefined" ? getPhotoCount() : 0,
  )
  const [deviceId] = useState(() =>
    typeof window !== "undefined" ? getDeviceId() : "",
  )
  const [displayName, setDisplayNameState] = useState<string | null>(() =>
    typeof window !== "undefined" ? getDisplayName() : null,
  )
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadPhotos = useCallback(
    async (reset = false) => {
      if (loading && !reset) return
      const prevCursor = reset ? undefined : cursor ?? undefined
      const result = await getPhotos({
        cursor: prevCursor,
        limit: 24,
        deviceId: tab === "mine" ? (deviceId || undefined) : undefined,
      })
      setPhotos((prev) => (reset ? result.photos : [...prev, ...result.photos]))
      setCursor(result.nextCursor)
      setHasMore(result.nextCursor !== null)
      setLoading(false)
    },
    [cursor, loading, tab, deviceId],
  )

  // Load on mount and tab change — all setState calls inside local async fn (after await)
  useEffect(() => {
    if (!deviceId && tab === "mine") return
    async function load() {
      setLoading(true)
      const result = await getPhotos({
        cursor: undefined,
        limit: 24,
        deviceId: tab === "mine" ? (deviceId || undefined) : undefined,
      })
      setPhotos(result.photos)
      setCursor(result.nextCursor)
      setHasMore(result.nextCursor !== null)
      setLoading(false)
    }
    load()
  }, [tab, deviceId])

  // Infinite scroll sentinel
  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) loadPhotos(false)
      },
      { rootMargin: "200px" },
    )
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loading, loadPhotos])

  const handleCapture = (photo: CapturedPhoto) => {
    setShowCamera(false)
    setCaptured(photo)
  }

  const handleSaved = (photo: PhotoRecord) => {
    setCaptured(null)
    setPhotoCount((c) => c + 1)
    setDisplayNameState(getDisplayName())
    // Prepend to "all" tab photos
    if (tab === "all") {
      setPhotos((prev) => [photo, ...prev])
    } else {
      setPhotos((prev) => [photo, ...prev])
    }
  }

  const handleDelete = async (photoId: string) => {
    if (!deviceId) return
    const result = await deletePhotoByOwner(photoId, deviceId)
    if (result.success) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
      setLightboxIdx(null)
      setPhotoCount((c) => Math.max(0, c - 1))
    }
  }

  const lightboxPhoto = lightboxIdx !== null ? photos[lightboxIdx] : null

  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          background: "var(--c-ivory, #faf7f0)",
          paddingBottom: 60,
        }}
      >
        {/* Back link */}
        <div style={{ padding: "20px 24px 0" }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-josefin)",
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--c-muted, #7a8472)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← Home
          </Link>
        </div>

        {/* Header */}
        <div
          style={{
            textAlign: "center",
            padding: "32px 20px 32px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-josefin)",
              fontSize: 10,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "var(--c-blush, #e8c3be)",
              marginBottom: 10,
            }}
          >
            Thanwa &amp; Meena · 26.12.2026
          </p>
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(36px, 8vw, 56px)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--c-ink, #1c2a18)",
              margin: "0 0 8px",
              lineHeight: 1.15,
            }}
          >
            Our Photos
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sarabun)",
              fontSize: 14,
              color: "var(--c-muted, #7a8472)",
              marginBottom: 28,
            }}
          >
            {photoCount > 0
              ? `คุณถ่ายไปแล้ว ${photoCount} / ${MAX_PHOTOS} รูป`
              : "เก็บความทรงจำในวันพิเศษนี้ด้วยกัน"}
          </p>

          {/* Take a photo button */}
          <button
            onClick={() => setShowCamera(true)}
            disabled={hasReachedLimit()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              borderRadius: 999,
              background: hasReachedLimit()
                ? "rgba(232,195,190,0.3)"
                : "var(--c-blush-deep, #c4796b)",
              border: "none",
              color: hasReachedLimit() ? "var(--c-muted)" : "#fff",
              fontFamily: "var(--font-josefin)",
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              cursor: hasReachedLimit() ? "not-allowed" : "pointer",
              boxShadow: hasReachedLimit()
                ? "none"
                : "0 4px 20px -4px rgba(196,121,107,0.45)",
              transition: "box-shadow 0.2s ease",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {hasReachedLimit() ? "ครบ 10 รูปแล้ว" : "ถ่ายรูป"}
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 4,
            marginBottom: 24,
            padding: "0 20px",
          }}
        >
          {(["all", "mine"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 24px",
                borderRadius: 999,
                background: tab === t ? "var(--c-ink, #1c2a18)" : "transparent",
                border:
                  tab === t
                    ? "1px solid transparent"
                    : "1px solid rgba(28,42,24,0.15)",
                color: tab === t ? "#fff" : "var(--c-muted)",
                fontFamily: "var(--font-josefin)",
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {t === "all" ? "ทุกรูป" : "ของฉัน"}
            </button>
          ))}
        </div>

        {/* Masonry grid */}
        <div
          style={{
            columnCount: 2,
            columnGap: 6,
            padding: "0 6px",
            maxWidth: 900,
            margin: "0 auto",
          }}
          className="sm:columns-3"
        >
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              onClick={() => setLightboxIdx(idx)}
              style={{
                breakInside: "avoid",
                marginBottom: 6,
                borderRadius: 8,
                overflow: "hidden",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbUrl}
                alt={`Photo by ${photo.displayName}`}
                loading="lazy"
                style={{ width: "100%", display: "block" }}
              />
              {/* Name label on hover - visible always on mobile */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "20px 8px 6px",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
                  opacity: 0,
                  transition: "opacity 0.2s ease",
                }}
                className="photo-name-overlay"
              >
                <p
                  style={{
                    fontFamily: "var(--font-sarabun)",
                    fontSize: 11,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  {photo.displayName}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && photos.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--c-muted)",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }}
            >
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <p style={{ fontFamily: "var(--font-sarabun)", fontSize: 14 }}>
              {tab === "mine"
                ? "คุณยังไม่มีรูปในอัลบั้ม ถ่ายรูปก่อนเลย!"
                : "ยังไม่มีรูปในอัลบั้ม เป็นคนแรกที่ถ่ายเลย!"}
            </p>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div
              style={{
                display: "inline-block",
                width: 20,
                height: 20,
                border: "2px solid rgba(196,121,107,0.2)",
                borderTopColor: "var(--c-blush-deep, #c4796b)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>

      {/* Camera overlay */}
      {showCamera && (
        <CameraViewfinder
          photoCount={photoCount}
          maxPhotos={MAX_PHOTOS}
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Preview overlay */}
      {captured && deviceId && (
        <PhotoPreview
          previewUrl={captured.previewUrl}
          fullBlob={captured.fullBlob}
          thumbBlob={captured.thumbBlob}
          filterName={captured.filterName}
          deviceId={deviceId}
          existingName={displayName}
          onSaved={handleSaved}
          onRetake={() => {
            URL.revokeObjectURL(captured.previewUrl)
            setCaptured(null)
            setShowCamera(true)
          }}
        />
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto}
          isOwner={lightboxPhoto.deviceId === deviceId}
          onClose={() => setLightboxIdx(null)}
          onDelete={handleDelete}
          onPrev={lightboxIdx! > 0 ? () => setLightboxIdx((i) => i! - 1) : null}
          onNext={
            lightboxIdx! < photos.length - 1
              ? () => setLightboxIdx((i) => i! + 1)
              : null
          }
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .photo-name-overlay { opacity: 0; }
        @media (hover: none) { .photo-name-overlay { opacity: 1 !important; } }
        .sm\\:columns-3 { column-count: 3; }
        @media (max-width: 640px) { .sm\\:columns-3 { column-count: 2; } }
      `}</style>
    </>
  )
}
