"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PIXELS_JS_FILTER, applyFilterToCanvas, type FilterName } from "@/lib/image-filters"
import { compressToBlob } from "@/lib/image-compress"
import { FilterSelector } from "./filter-selector"

const MAX_CAPTURE_PX = 2048
const THUMB_PX = 400

interface CapturedPhoto {
  fullBlob: Blob
  thumbBlob: Blob
  filterName: FilterName
  previewUrl: string
}

interface Props {
  photoCount: number
  maxPhotos: number
  onCapture: (photo: CapturedPhoto) => void
  onClose: () => void
}

export function CameraViewfinder({ photoCount, maxPhotos, onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const uploadCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facing, setFacing] = useState<"environment" | "user">("environment")
  const [filter, setFilter] = useState<FilterName>("none")
  const [error, setError] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<{ file: File; previewUrl: string } | null>(null)
  const atLimit = photoCount >= maxPhotos

  const startCamera = useCallback(async (facingMode: "environment" | "user") => {
    // Stop existing stream
    stream?.getTracks().forEach((t) => t.stop())
    setError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
    } catch {
      setError("Camera access denied. Use the upload button below instead.")
    }
  }, [stream])

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      startCamera(facing)
    } else {
      setError("Camera not available on this device.")
    }
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Live preview: draw video → canvas with pixels.js filter every animation frame
  useEffect(() => {
    if (!stream || pendingUpload) return
    const canvas = previewCanvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    let frameId: number
    let sized = false

    const draw = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        if (!sized) {
          // Cap preview resolution for performance
          const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight))
          canvas.width = Math.round(video.videoWidth * scale)
          canvas.height = Math.round(video.videoHeight * scale)
          sized = true
        }
        const { width: w, height: h } = canvas
        const ctx = canvas.getContext("2d")!
        // Mirror front camera in canvas draw rather than CSS transform
        if (facing === "user") {
          ctx.save()
          ctx.scale(-1, 1)
          ctx.drawImage(video, -w, 0, w, h)
          ctx.restore()
        } else {
          ctx.drawImage(video, 0, 0, w, h)
        }
        if (filter !== "none" && typeof window !== "undefined" && window.pixelsJS) {
          const imageData = ctx.getImageData(0, 0, w, h)
          window.pixelsJS.filterImgData(imageData, PIXELS_JS_FILTER[filter])
          ctx.putImageData(imageData, 0, 0)
        }
      }
      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameId)
  }, [stream, filter, facing, pendingUpload])

  // Upload preview: draw image to canvas with pixels.js filter (re-runs when filter changes)
  useEffect(() => {
    if (!pendingUpload) return
    const canvas = uploadCanvasRef.current
    if (!canvas) return

    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight))
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      if (filter !== "none" && typeof window !== "undefined" && window.pixelsJS) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        window.pixelsJS.filterImgData(imageData, PIXELS_JS_FILTER[filter])
        ctx.putImageData(imageData, 0, 0)
      }
    }
    img.src = pendingUpload.previewUrl
  }, [pendingUpload, filter])

  const flipCamera = () => {
    const next = facing === "environment" ? "user" : "environment"
    setFacing(next)
    startCamera(next)
  }

  const capture = async () => {
    if (!videoRef.current || capturing || atLimit) return
    setCapturing(true)
    try {
      const video = videoRef.current
      const vw = video.videoWidth || 1280
      const vh = video.videoHeight || 720
      const scale = Math.min(1, MAX_CAPTURE_PX / Math.max(vw, vh))
      const w = Math.round(vw * scale)
      const h = Math.round(vh * scale)

      // Draw + apply canvas filter
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(video, 0, 0, w, h)
      applyFilterToCanvas(ctx, w, h, filter, true)

      // Encode full + thumb
      const [fullBlob, thumbBlob] = await Promise.all([
        compressToBlob(canvas, MAX_CAPTURE_PX, 0.82),
        compressToBlob(canvas, THUMB_PX, 0.75),
      ])

      const previewUrl = URL.createObjectURL(fullBlob)
      onCapture({ fullBlob, thumbBlob, filterName: filter, previewUrl })
    } finally {
      setCapturing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || atLimit) return
    const previewUrl = URL.createObjectURL(file)
    setPendingUpload({ file, previewUrl })
    e.target.value = ""
  }

  const handleConfirmUpload = async () => {
    if (!pendingUpload || capturing || atLimit) return
    setCapturing(true)
    try {
      const bmp = await createImageBitmap(pendingUpload.file)
      const scale = Math.min(1, MAX_CAPTURE_PX / Math.max(bmp.width, bmp.height))
      const w = Math.round(bmp.width * scale)
      const h = Math.round(bmp.height * scale)

      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(bmp, 0, 0, w, h)
      bmp.close()
      applyFilterToCanvas(ctx, w, h, filter, true)

      const [fullBlob, thumbBlob] = await Promise.all([
        compressToBlob(canvas, MAX_CAPTURE_PX, 0.82),
        compressToBlob(canvas, THUMB_PX, 0.75),
      ])

      URL.revokeObjectURL(pendingUpload.previewUrl)
      setPendingUpload(null)
      const finalPreviewUrl = URL.createObjectURL(fullBlob)
      onCapture({ fullBlob, thumbBlob, filterName: filter, previewUrl: finalPreviewUrl })
    } catch {
      setError("Could not process this image.")
    } finally {
      setCapturing(false)
    }
  }

  const handleCancelUpload = () => {
    if (pendingUpload) {
      URL.revokeObjectURL(pendingUpload.previewUrl)
      setPendingUpload(null)
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "env(safe-area-inset-top, 16px) 16px 12px",
          paddingTop: "max(env(safe-area-inset-top, 0px), 16px)",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "none",
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {/* Photo count */}
        <div
          style={{
            fontFamily: "var(--font-josefin)",
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: atLimit ? "#f87171" : "rgba(255,255,255,0.85)",
            background: "rgba(0,0,0,0.35)",
            borderRadius: 20,
            padding: "5px 14px",
          }}
        >
          {atLimit ? "ครบ 10 รูปแล้ว" : `${photoCount} / ${maxPhotos}`}
        </div>

        {/* Flip camera */}
        <button
          onClick={flipCamera}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "none",
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 7h3l2-3h8l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 12.5a3 3 0 0 0 4.95 2.28M15 11.5a3 3 0 0 0-4.95-2.28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 9l1 2.5-2.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Video / upload preview / error area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {pendingUpload ? (
          <canvas
            ref={uploadCanvasRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : error ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: 32,
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: "rgba(255,255,255,0.4)" }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <p
              style={{
                fontFamily: "var(--font-sarabun)",
                color: "rgba(255,255,255,0.6)",
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              {error}
            </p>
          </div>
        ) : (
          <>
            {/* Hidden video — source for canvas drawing and for capture */}
            <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />
            {/* Canvas renders filtered live preview */}
            <canvas
              ref={previewCanvasRef}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </>
        )}
      </div>

      {/* Bottom controls */}
      <div
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 24px)",
          background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
          paddingTop: 12,
        }}
      >
        {/* Filter strip — always visible */}
        <FilterSelector current={filter} onChange={setFilter} />

        {pendingUpload ? (
          /* Upload confirm / cancel buttons */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              paddingTop: 16,
              paddingBottom: 8,
              paddingLeft: 24,
              paddingRight: 24,
            }}
          >
            <button
              onClick={handleCancelUpload}
              style={{
                flex: 1,
                padding: "13px 0",
                borderRadius: 12,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.8)",
                fontFamily: "var(--font-josefin)",
                fontSize: 11,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirmUpload}
              disabled={capturing}
              style={{
                flex: 2,
                padding: "13px 0",
                borderRadius: 12,
                background: capturing ? "rgba(232,195,190,0.35)" : "rgba(232,195,190,0.9)",
                border: "none",
                color: capturing ? "rgba(0,0,0,0.4)" : "#2d1b1a",
                fontFamily: "var(--font-josefin)",
                fontSize: 11,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                cursor: capturing ? "not-allowed" : "pointer",
                transition: "background 0.2s ease",
              }}
            >
              {capturing ? "กำลังประมวลผล…" : "ใช้รูปนี้"}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 40,
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            {/* Upload from gallery */}
            <label
              style={{
                cursor: atLimit ? "not-allowed" : "pointer",
                opacity: atLimit ? 0.4 : 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-josefin)",
                  fontSize: 8,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                คลัง
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                disabled={atLimit}
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>

            {/* Shutter */}
            <button
              onClick={capture}
              disabled={capturing || atLimit || !!error}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: atLimit ? "rgba(255,255,255,0.2)" : "#fff",
                border: "4px solid rgba(255,255,255,0.4)",
                cursor: capturing || atLimit || !!error ? "not-allowed" : "pointer",
                opacity: capturing ? 0.6 : 1,
                transition: "opacity 0.15s ease, transform 0.1s ease",
                boxShadow: "0 0 0 2px rgba(255,255,255,0.15)",
              }}
              onMouseDown={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.93)")
              }
              onMouseUp={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")
              }
            />

            {/* Spacer to balance layout */}
            <div style={{ width: 44 }} />
          </div>
        )}
      </div>
    </div>
  )
}
