"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { createPortal } from "react-dom"
import { RiCheckLine, RiCloseLine, RiImageAddLine } from "@remixicon/react"
import { submitGiftNotice } from "@/app/actions/gift-notice"
import {
  GIVER_MAX,
  fromBangkokInput,
  parseAmount,
  prepareSlip,
  toBangkokInput,
  validateNotice,
  type NoticeErrors,
  type NoticeFields,
} from "@/lib/gift-notice"

/**
 * Boxed, unlike the underlined text fields, so the prefilled date and time read as tappable.
 * 16px stops iOS zooming in. Light color-scheme: next-themes sets `dark` on <html> for
 * dark-mode visitors, which turns the native picker icons white on this light page.
 */
const PICKER =
  "w-full min-w-0 appearance-none [color-scheme:light] rounded-xl border border-[color-mix(in_srgb,var(--c-sage)_45%,transparent)] bg-[color-mix(in_srgb,var(--c-sage)_6%,transparent)] px-3 py-2.5 font-[family-name:var(--font-thai)] text-[16px] text-[var(--c-ink)] tabular-nums outline-none transition-colors focus:border-[var(--c-sage)] aria-invalid:border-[var(--c-blush-deep)] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60"

const LABEL = "mb-1.5 block font-[family-name:var(--font-thai)] text-[14px] tracking-[0.02em] text-[var(--c-muted)]"

type Slip =
  | { status: "none" }
  | { status: "uploading"; preview: string | null }
  | { status: "done"; preview: string; slipId: string }
  | { status: "failed"; preview: string | null; message: string }

/** Button under the PromptPay QR + the form it opens. */
export function GiftNotice({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
          <path d="M2 6.5h9M6.5 2v9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        แจ้งการโอน
      </button>
      {open && <GiftNoticeDialog onClose={() => setOpen(false)} />}
    </>
  )
}

function GiftNoticeDialog({ onClose }: { onClose: () => void }) {
  const [fields, setFields] = useState<NoticeFields>(() => ({
    giver: "",
    // Most guests fill this in right after transferring, so "now" is usually right as is
    time: toBangkokInput(new Date()),
    amount: "",
  }))
  const [errors, setErrors] = useState<NoticeErrors>({})
  const [slip, setSlip] = useState<Slip>({ status: "none" })
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const giverRef = useRef<HTMLInputElement>(null)
  // The in-flight upload, so submit can wait for it instead of making the guest wait first
  const uploadRef = useRef<{ promise: Promise<string | null>; abort: AbortController } | null>(null)
  const previewRef = useRef<string | null>(null)

  useEffect(() => {
    giverRef.current?.focus({ preventScroll: true })
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
      uploadRef.current?.abort.abort()
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [onClose])

  function setField(name: keyof NoticeFields, value: string) {
    setFields((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }))
  }

  function setPreview(url: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = url
  }

  function clearSlip() {
    uploadRef.current?.abort.abort()
    uploadRef.current = null
    setPreview(null)
    setSlip({ status: "none" })
    if (fileRef.current) fileRef.current.value = ""
  }

  /** Shrink + upload straight away; resolves to the slip id, or null if it failed. */
  function startUpload(file: File) {
    uploadRef.current?.abort.abort()
    const abort = new AbortController()
    // Mark it busy before shrinking starts, so an early submit waits for this slip
    setPreview(null)
    setSlip({ status: "uploading", preview: null })

    const promise = (async (): Promise<string | null> => {
      let blob: Blob
      try {
        blob = await prepareSlip(file)
      } catch {
        if (abort.signal.aborted) return null
        setPreview(null)
        setSlip({ status: "failed", preview: null, message: "เปิดไฟล์นี้ไม่ได้ ลองเลือกเป็นรูปภาพ (JPG/PNG)" })
        return null
      }
      if (abort.signal.aborted) return null

      const preview = URL.createObjectURL(blob)
      setPreview(preview)
      setSlip({ status: "uploading", preview })

      try {
        const body = new FormData()
        body.append("file", blob, "slip.jpg")
        const res = await fetch("/api/gift-slips", { method: "POST", body, signal: abort.signal })
        if (!res.ok) throw new Error(String(res.status))
        const { slipId } = (await res.json()) as { slipId: string }
        if (abort.signal.aborted) return null
        setSlip({ status: "done", preview, slipId })
        return slipId
      } catch {
        if (abort.signal.aborted) return null
        setSlip({ status: "failed", preview, message: "อัปโหลดสลิปไม่สำเร็จ" })
        return null
      }
    })()

    uploadRef.current = { promise, abort }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validateNotice(fields)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSending(true)
    setSendError(null)
    try {
      let slipId: string | null = null
      if (slip.status === "done") slipId = slip.slipId
      else if (slip.status === "uploading") slipId = (await uploadRef.current?.promise) ?? null

      if (slip.status !== "none" && !slipId) {
        setSendError("สลิปยังอัปโหลดไม่สำเร็จ ลองอีกครั้ง หรือลบสลิปออกแล้วส่งเฉพาะข้อมูลก็ได้")
        return
      }

      const result = await submitGiftNotice({
        giver: fields.giver.trim(),
        transferredAt: fromBangkokInput(fields.time)!.toISOString(),
        amount: parseAmount(fields.amount),
        slipId,
      })
      if (result.success) setSent(true)
      else setSendError(result.error)
    } finally {
      setSending(false)
    }
  }

  const fieldError = (id: string, text?: string) =>
    text ? (
      <p id={id} role="alert" className="mt-1 font-[family-name:var(--font-thai)] text-[14px] text-[var(--c-blush-deep)]">
        {text}
      </p>
    ) : null

  // Portal out of the section: its scroll-reveal transform would trap position: fixed
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="gift-notice-title" className="fixed inset-0 z-[70]">
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--c-ivory) 82%, transparent)" }}
      />

      <div className="pointer-events-none relative h-full overflow-y-auto overscroll-contain">
        <div className="flex min-h-full items-center justify-center px-4 py-10">
          <div
            className="pointer-events-auto relative w-full max-w-[440px] rounded-3xl px-6 pt-8 pb-7 md:px-9"
            style={{
              background: "var(--c-ivory)",
              boxShadow: "0 30px 60px -30px color-mix(in srgb, var(--c-sage) 55%, transparent), 0 0 0 1px color-mix(in srgb, var(--c-sage) 18%, transparent)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              aria-label="ปิด"
              className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full text-[var(--c-ink-2)] transition-colors hover:bg-[color-mix(in_srgb,var(--c-sage)_12%,transparent)] focus-visible:outline-2 focus-visible:outline-[var(--c-sage)] disabled:opacity-0"
            >
              <RiCloseLine size={22} />
            </button>

            {sent ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--c-sage)_18%,transparent)] text-[var(--c-sage)]">
                  <RiCheckLine size={28} />
                </div>
                <h2 id="gift-notice-title" className="font-[family-name:var(--font-thai)] text-xl text-[var(--c-ink)]">
                  ได้รับแล้ว ขอบคุณมากนะ
                </h2>
                <p className="mt-2 font-[family-name:var(--font-thai)] text-[15px] text-[var(--c-muted)]">
                  เราจะเก็บความรักครั้งนี้ไว้อย่างดี
                </p>
                <button type="button" onClick={onClose} className="btn-secondary mt-7">
                  ปิด
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h2 id="gift-notice-title" className="font-[family-name:var(--font-thai)] text-xl text-[var(--c-ink)]">
                  แจ้งการโอน
                </h2>
                <p className="mt-1 font-[family-name:var(--font-thai)] text-[14px] leading-relaxed text-[var(--c-muted)] [text-wrap:pretty]">
                  แอปธนาคารไม่โชว์ชื่อเต็มของผู้โอน บอกเราหน่อยว่าซองนี้มาจากใคร
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="gn-giver" className={LABEL}>ชื่อผู้ให้</label>
                    <input
                      ref={giverRef}
                      id="gn-giver"
                      className="rsvp-input"
                      value={fields.giver}
                      onChange={(e) => setField("giver", e.target.value)}
                      maxLength={GIVER_MAX}
                      placeholder="เช่น ต้อม & แนน หรือ ครอบครัวพัวมณี"
                      autoComplete="name"
                      disabled={sending}
                      aria-invalid={Boolean(errors.giver)}
                      aria-describedby={errors.giver ? "gn-giver-error" : undefined}
                    />
                    {fieldError("gn-giver-error", errors.giver)}
                  </div>

                  <fieldset aria-describedby={errors.time ? "gn-time-error" : "gn-time-hint"}>
                    <legend className={LABEL}>วันและเวลาที่โอน</legend>
                    <div className="grid grid-cols-[1.4fr_1fr] gap-3">
                      <input
                        id="gn-date"
                        type="date"
                        aria-label="วันที่โอน"
                        className={PICKER}
                        value={fields.time.slice(0, 10)}
                        onChange={(e) => e.target.value && setField("time", `${e.target.value}T${fields.time.slice(11)}`)}
                        max={toBangkokInput(new Date()).slice(0, 10)}
                        disabled={sending}
                        aria-invalid={Boolean(errors.time)}
                      />
                      <input
                        id="gn-time"
                        type="time"
                        aria-label="เวลาที่โอน"
                        className={PICKER}
                        value={fields.time.slice(11)}
                        onChange={(e) => e.target.value && setField("time", `${fields.time.slice(0, 10)}T${e.target.value.slice(0, 5)}`)}
                        disabled={sending}
                        aria-invalid={Boolean(errors.time)}
                      />
                    </div>
                    {fieldError("gn-time-error", errors.time) ?? (
                      <p id="gn-time-hint" className="mt-1.5 font-[family-name:var(--font-thai)] text-[13px] leading-relaxed text-[var(--c-muted)] opacity-90">
                        ใส่เวลาตอนนี้ไว้ให้แล้ว ถ้าโอนไปก่อนหน้านี้ แตะเพื่อเปลี่ยนตามเวลาในแอปธนาคาร
                      </p>
                    )}
                  </fieldset>

                  <div>
                    <label htmlFor="gn-amount" className={LABEL}>ยอดเงิน (ไม่บังคับ)</label>
                    <input
                      id="gn-amount"
                      className="rsvp-input tabular-nums"
                      inputMode="decimal"
                      value={fields.amount}
                      onChange={(e) => setField("amount", e.target.value)}
                      placeholder="บาท"
                      disabled={sending}
                      aria-invalid={Boolean(errors.amount)}
                      aria-describedby={errors.amount ? "gn-amount-error" : undefined}
                    />
                    {fieldError("gn-amount-error", errors.amount)}
                  </div>

                  <div>
                    <span className={LABEL}>สลิป (ไม่บังคับ)</span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="peer sr-only"
                      id="gn-slip"
                      disabled={sending}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) startUpload(file)
                      }}
                    />
                    {slip.status === "none" ? (
                      <label
                        htmlFor="gn-slip"
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--c-sage)_60%,transparent)] px-4 py-4 font-[family-name:var(--font-thai)] text-[15px] text-[var(--c-sage)] transition-colors hover:bg-[color-mix(in_srgb,var(--c-sage)_8%,transparent)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--c-sage)]"
                      >
                        <RiImageAddLine size={18} aria-hidden />
                        เลือกรูปสลิป
                      </label>
                    ) : (
                      <SlipRow slip={slip} onRemove={clearSlip} onRetry={() => fileRef.current?.click()} disabled={sending} />
                    )}
                  </div>
                </div>

                {sendError && (
                  <p role="alert" className="mt-5 font-[family-name:var(--font-thai)] text-[15px] text-[var(--c-blush-deep)]">
                    {sendError}
                  </p>
                )}

                <button type="submit" disabled={sending} className="btn-primary mt-7 w-full">
                  {sending ? (slip.status === "uploading" ? "กำลังอัปโหลดสลิป…" : "กำลังส่ง…") : "ส่ง"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function SlipRow({
  slip,
  onRemove,
  onRetry,
  disabled,
}: {
  slip: Exclude<Slip, { status: "none" }>
  onRemove: () => void
  onRetry: () => void
  disabled: boolean
}) {
  const preview = slip.preview
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[color-mix(in_srgb,var(--c-sage)_8%,transparent)] p-2.5 pr-3">
      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--c-ivory-dark)]">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={preview} alt="สลิปที่เลือก" className="h-full w-full object-cover" />
        )}
        {slip.status === "uploading" && (
          <div className="absolute inset-0 animate-pulse bg-[color-mix(in_srgb,var(--c-ivory)_45%,transparent)]" />
        )}
      </div>
      <p
        className="min-w-0 flex-1 font-[family-name:var(--font-thai)] text-[14px]"
        style={{ color: slip.status === "failed" ? "var(--c-blush-deep)" : "var(--c-ink-2)" }}
        aria-live="polite"
      >
        {slip.status === "uploading" && "กำลังอัปโหลด…"}
        {slip.status === "done" && "แนบสลิปแล้ว"}
        {slip.status === "failed" && (
          <>
            {slip.message}{" "}
            <button type="button" onClick={onRetry} disabled={disabled} className="underline underline-offset-4">
              เลือกใหม่
            </button>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="ลบสลิป"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--c-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--c-sage)_14%,transparent)] focus-visible:outline-2 focus-visible:outline-[var(--c-sage)]"
      >
        <RiCloseLine size={18} />
      </button>
    </div>
  )
}
