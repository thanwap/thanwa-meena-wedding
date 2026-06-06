"use client"

import { useEffect, useRef, useState } from "react"
import { uploadPhoto, type PhotoRecord } from "@/app/actions/photos"
import { setDisplayName, incrementPhotoCount } from "@/lib/device-id"
import type { FilterName } from "@/lib/image-filters"

interface Props {
  previewUrl: string
  fullBlob: Blob
  thumbBlob: Blob
  filterName: FilterName
  deviceId: string
  existingName: string | null
  onSaved: (photo: PhotoRecord) => void
  onRetake: () => void
}

export function PhotoPreview({
  previewUrl,
  fullBlob,
  thumbBlob,
  filterName,
  deviceId,
  existingName,
  onSaved,
  onRetake,
}: Props) {
  const [name, setName] = useState(existingName ?? "")
  const [needsName] = useState(!existingName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (needsName) inputRef.current?.focus()
  }, [needsName])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      inputRef.current?.focus()
      return
    }
    setSaving(true)
    setError(null)

    const fd = new FormData()
    fd.append("full", new File([fullBlob], "photo.jpg", { type: "image/jpeg" }))
    fd.append("thumb", new File([thumbBlob], "thumb.jpg", { type: "image/jpeg" }))
    fd.append("deviceId", deviceId)
    fd.append("displayName", trimmed)
    fd.append("filterName", filterName)

    const result = await uploadPhoto(fd)
    setSaving(false)

    if ("error" in result) {
      setError(result.error)
      return
    }

    setDisplayName(trimmed)
    incrementPhotoCount()
    URL.revokeObjectURL(previewUrl)
    onSaved(result)
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
      {/* Preview image */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Your photo"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      {/* Bottom panel */}
      <div
        style={{
          padding: "20px 24px",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 24px)",
          background: "rgba(10,10,10,0.95)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Name prompt (first time only) */}
        {needsName && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label
              style={{
                fontFamily: "var(--font-josefin)",
                fontSize: 10,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(232,195,190,0.8)",
              }}
            >
              ชื่อของคุณ · Your name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="กรอกชื่อก่อนบันทึก"
              maxLength={40}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(232,195,190,0.3)",
                borderRadius: 10,
                padding: "12px 14px",
                color: "#fff",
                fontFamily: "var(--font-sarabun)",
                fontSize: 16,
                outline: "none",
              }}
            />
          </div>
        )}

        {error && (
          <p
            style={{
              fontFamily: "var(--font-sarabun)",
              fontSize: 13,
              color: "#f87171",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          {/* Retake */}
          <button
            onClick={onRetake}
            disabled={saving}
            style={{
              flex: 1,
              padding: "13px 0",
              borderRadius: 12,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.8)",
              fontFamily: "var(--font-josefin)",
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            ถ่ายใหม่
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || (needsName && !name.trim())}
            style={{
              flex: 2,
              padding: "13px 0",
              borderRadius: 12,
              background:
                saving || (needsName && !name.trim())
                  ? "rgba(232,195,190,0.35)"
                  : "rgba(232,195,190,0.9)",
              border: "none",
              color: saving || (needsName && !name.trim()) ? "rgba(0,0,0,0.4)" : "#2d1b1a",
              fontFamily: "var(--font-josefin)",
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              cursor:
                saving || (needsName && !name.trim()) ? "not-allowed" : "pointer",
              transition: "background 0.2s ease",
            }}
          >
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  )
}
