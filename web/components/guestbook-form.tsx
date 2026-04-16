"use client"

import { useRef, useState, useTransition } from "react"

const MAX_IMAGES = 3
const MAX_SIZE_MB = 5

export function GuestbookForm() {
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hpRef = useRef<HTMLInputElement>(null)

  function handleFiles(selected: FileList | null) {
    if (!selected) return
    const arr = Array.from(selected)
    const remaining = MAX_IMAGES - files.length
    const toAdd = arr.slice(0, remaining)

    const oversized = toAdd.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024)
    if (oversized) {
      setError(`"${oversized.name}" exceeds ${MAX_SIZE_MB} MB limit.`)
      return
    }

    setError(null)
    setFiles((prev) => [...prev, ...toAdd])
    toAdd.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) =>
        setPreviews((prev) => [...prev, e.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  function removeImage(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError("Please enter your name."); return }
    if (!message.trim()) { setError("Please write a message."); return }

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append("name", name.trim())
        fd.append("message", message.trim())
        if (hpRef.current?.value) fd.append("hpWebsite", hpRef.current.value)
        files.forEach((f) => fd.append("images", f))

        const res = await fetch("/api/guestbook", { method: "POST", body: fd })
        const data = await res.json().catch(() => ({}))

        if (res.status === 429) {
          setError("Too many submissions. Please try again later.")
        } else if (!res.ok) {
          setError(data.error || `Submission failed (${res.status}).`)
        } else {
          setSuccess(true)
        }
      } catch {
        setError("An unexpected error occurred. Please try again.")
      }
    })
  }

  if (success) {
    return (
      <div className="text-center py-10">
        <p
          className="font-[family-name:var(--font-cormorant)] italic"
          style={{ fontSize: 28, color: "var(--c-blush-deep)" }}
        >
          ขอบคุณมากนะคะ ♡
        </p>
        <p
          className="font-[family-name:var(--font-sarabun)] text-base mt-3"
          style={{ color: "var(--c-ink-2)" }}
        >
          Thank you for your beautiful message!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Honeypot */}
      <input
        ref={hpRef}
        type="text"
        name="hp_website"
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: "none" }}
      />

      {/* Name */}
      <div>
        <label
          htmlFor="gb-name"
          className="font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.3em] uppercase block mb-2"
          style={{ color: "var(--c-muted)" }}
        >
          Your Name
        </label>
        <input
          id="gb-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          disabled={isPending}
          placeholder="Meena & Thanwa"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(232,195,190,0.6)",
            borderRadius: 8,
            padding: "12px 14px",
            fontFamily: "var(--font-sarabun)",
            fontSize: 16,
            color: "var(--c-ink)",
            outline: "none",
          }}
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="gb-message"
          className="font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.3em] uppercase block mb-2"
          style={{ color: "var(--c-muted)" }}
        >
          Your Message
        </label>
        <textarea
          id="gb-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          rows={4}
          disabled={isPending}
          placeholder="ขอให้รักกันยืนยาวนะคะ..."
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(232,195,190,0.6)",
            borderRadius: 8,
            padding: "12px 14px",
            fontFamily: "var(--font-sarabun)",
            fontSize: 16,
            color: "var(--c-ink)",
            outline: "none",
            resize: "vertical",
          }}
        />
      </div>

      {/* Image upload */}
      <div>
        <label
          className="font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.3em] uppercase block mb-2"
          style={{ color: "var(--c-muted)" }}
        >
          Photos (optional, max {MAX_IMAGES})
        </label>

        {previews.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {previews.map((src, idx) => (
              <div key={idx} className="relative" style={{ width: 80, height: 80 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`preview ${idx + 1}`}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid rgba(232,195,190,0.5)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--c-blush-deep)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 12,
                    lineHeight: 1,
                  }}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length < MAX_IMAGES && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 8,
                border: "1px dashed rgba(232,195,190,0.8)",
                background: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontFamily: "var(--font-josefin)",
                fontSize: 11,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "var(--c-muted)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--c-blush)" }}>
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Add photo
            </button>
          </>
        )}
      </div>

      {error && (
        <p
          className="font-[family-name:var(--font-sarabun)] text-sm"
          style={{ color: "#e05252" }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 8,
          border: "none",
          background: isPending
            ? "rgba(232,195,190,0.5)"
            : "linear-gradient(135deg, var(--c-blush) 0%, var(--c-blush-deep) 100%)",
          color: isPending ? "var(--c-muted)" : "#fff",
          fontFamily: "var(--font-josefin)",
          fontSize: 12,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          cursor: isPending ? "not-allowed" : "pointer",
          transition: "opacity 0.2s ease",
        }}
      >
        {isPending ? "Sending…" : "Leave a Message"}
      </button>
    </form>
  )
}
