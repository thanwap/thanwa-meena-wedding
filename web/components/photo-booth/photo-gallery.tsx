"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { getPhotos, deletePhotoByOwner, type PhotoRecord } from "@/app/actions/photos"
import {
  getDeviceId,
  getDisplayName,
  getPhotoCount,
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
  const [photoCount, setPhotoCount] = useState(0)
  const [deviceId, setDeviceId] = useState("")
  const [displayName, setDisplayNameState] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Read client-only storage after hydration to avoid SSR mismatch.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setPhotoCount(getPhotoCount())
    setDeviceId(getDeviceId())
    setDisplayNameState(getDisplayName())
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // Sync photoCount from server once deviceId is known — localStorage can drift.
  useEffect(() => {
    if (!deviceId) return
    getPhotos({ deviceId, limit: MAX_PHOTOS + 1 }).then(({ photos, nextCursor }) => {
      if (!nextCursor) {
        setPhotoCount(photos.length)
      }
    })
  }, [deviceId])

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

  // Skeleton tile heights to mimic varied masonry content
  const skeletonHeights = [220, 300, 180, 260, 340, 200, 280, 160, 310, 240, 190, 270]

  return (
    <>
      <div style={{ minHeight: "100dvh", background: "var(--c-ivory, #faf7f0)", paddingBottom: 80 }}>

        {/* Split header — left title, right action */}
        <div className="gallery-header">
          <div>
            <Link
              href="/"
              style={{
                fontFamily: "var(--font-josefin)",
                fontSize: 10,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--c-muted, #7a8472)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 16,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Home
            </Link>
            <h1
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--c-ink, #1c2a18)",
                margin: "0 0 4px",
                lineHeight: 1.1,
              }}
            >
              Our Photos
            </h1>
            <p
              style={{
                fontFamily: "var(--font-josefin)",
                fontSize: 10,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "var(--c-blush, #e8c3be)",
                margin: 0,
              }}
            >
              Thanwa &amp; Meena · 26.12.2026
            </p>
          </div>

          {/* Right: count + CTA */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            {photoCount > 0 && (
              <p
                style={{
                  fontFamily: "var(--font-sarabun)",
                  fontSize: 12,
                  color: "var(--c-muted, #7a8472)",
                  margin: 0,
                  textAlign: "right",
                }}
              >
                {photoCount} / {MAX_PHOTOS} รูป
              </p>
            )}
            <button
              onClick={() => setShowCamera(true)}
              disabled={photoCount >= MAX_PHOTOS}
              className="shoot-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {photoCount >= MAX_PHOTOS ? "ครบ 10 รูปแล้ว" : "ถ่ายรูป"}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(28,42,24,0.07)", margin: "0 0 18px" }} />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "0 16px 18px" }}>
          {(["all", "mine"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tab-pill ${tab === t ? "tab-pill--active" : ""}`}
            >
              {t === "all" ? "ทุกรูป" : "ของฉัน"}
            </button>
          ))}
        </div>

        {/* Pinterest masonry grid — full width */}
        <div className="pin-grid">

          {/* Shimmer skeletons while loading */}
          {loading && skeletonHeights.map((h, i) => (
            <div
              key={`sk-${i}`}
              className="pin-skeleton"
              style={{ height: h, animationDelay: `${i * 60}ms` }}
            />
          ))}

          {/* Photo tiles */}
          {!loading && photos.map((photo, idx) => (
            <div
              key={photo.id}
              onClick={() => setLightboxIdx(idx)}
              className="pin-tile"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbUrl}
                alt={`Photo by ${photo.displayName}`}
                loading="lazy"
                style={{ width: "100%", display: "block" }}
              />
              <div className="pin-overlay">
                <p
                  style={{
                    fontFamily: "var(--font-sarabun)",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.92)",
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
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "80px 20px",
              gap: 16,
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              style={{ opacity: 0.25 }}
            >
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="var(--c-ink, #1c2a18)"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="13" r="4" stroke="var(--c-ink, #1c2a18)" strokeWidth="1.5" />
            </svg>
            <p
              style={{
                fontFamily: "var(--font-sarabun)",
                fontSize: 14,
                color: "var(--c-muted, #7a8472)",
                margin: 0,
                textAlign: "center",
              }}
            >
              {tab === "mine"
                ? "คุณยังไม่มีรูปในอัลบั้ม ถ่ายรูปก่อนเลย!"
                : "ยังไม่มีรูปในอัลบั้ม เป็นคนแรกที่ถ่ายเลย!"}
            </p>
          </div>
        )}

        {/* Load-more spinner (infinite scroll) */}
        {!loading && hasMore && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div className="load-spinner" />
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
        /* ── Header ── */
        .gallery-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 28px 20px 20px;
          gap: 16px;
        }

        /* ── Shoot button ── */
        .shoot-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 22px;
          border-radius: 999px;
          border: none;
          background: var(--c-blush-deep, #c4796b);
          color: #fff;
          font-family: var(--font-josefin);
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 4px 18px -4px rgba(196,121,107,0.4);
          transition: transform 0.15s cubic-bezier(0.16,1,0.3,1), box-shadow 0.15s ease;
          white-space: nowrap;
        }
        .shoot-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px -4px rgba(196,121,107,0.5); }
        .shoot-btn:active { transform: scale(0.98); }
        .shoot-btn:disabled {
          background: rgba(232,195,190,0.35);
          color: var(--c-muted, #7a8472);
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        /* ── Tabs ── */
        .tab-pill {
          padding: 7px 20px;
          border-radius: 999px;
          background: transparent;
          border: 1px solid rgba(28,42,24,0.14);
          color: var(--c-muted, #7a8472);
          font-family: var(--font-josefin);
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        .tab-pill--active {
          background: var(--c-ink, #1c2a18);
          border-color: transparent;
          color: #fff;
        }

        /* ── Pinterest masonry grid ── */
        .pin-grid {
          columns: 2;
          column-gap: 3px;
          padding: 0 3px;
        }
        @media (min-width: 480px) { .pin-grid { columns: 3; } }
        @media (min-width: 768px) { .pin-grid { columns: 4; } }
        @media (min-width: 1024px) { .pin-grid { columns: 5; } }
        @media (min-width: 1280px) { .pin-grid { columns: 6; } }

        /* ── Photo tile ── */
        .pin-tile {
          break-inside: avoid;
          margin-bottom: 3px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          display: block;
          transform: translateZ(0);
          transition: transform 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        .pin-tile:hover { transform: scale(1.012); z-index: 1; }
        .pin-tile:active { transform: scale(0.99); }

        /* ── Hover overlay ── */
        .pin-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 28px 10px 8px;
          background: linear-gradient(to top, rgba(28,20,14,0.62), transparent);
          opacity: 0;
          transition: opacity 0.22s ease;
        }
        .pin-tile:hover .pin-overlay { opacity: 1; }
        @media (hover: none) { .pin-overlay { opacity: 1 !important; } }

        /* ── Skeleton shimmer ── */
        .pin-skeleton {
          break-inside: avoid;
          margin-bottom: 3px;
          background: linear-gradient(
            90deg,
            rgba(28,42,24,0.06) 0%,
            rgba(28,42,24,0.11) 40%,
            rgba(28,42,24,0.06) 80%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Load-more spinner ── */
        .load-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 1.5px solid rgba(196,121,107,0.2);
          border-top-color: var(--c-blush-deep, #c4796b);
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Mobile header stack ── */
        @media (max-width: 480px) {
          .gallery-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }
          .gallery-header > div:last-child {
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  )
}
