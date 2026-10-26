"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"
import { RiArrowGoBackLine, RiCloseLine, RiMailSendLine } from "@remixicon/react"
import type { Postcard } from "./postcards"
import { PostcardFace, INK, RULED } from "./postcard"
import { MESSAGE_MAX, NAME_MAX, validateLetter, type LetterErrors } from "./guestbook-state"

/** Where the letter should end up on screen, and how wide it is there */
export type DropPoint = { x: number; y: number; width: number }

const FLIGHT_MS = 1050

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Step 2 — the picked polaroid flies to the middle and flips over into a
    postcard to write on. On send it shrinks and flies to the box's slot,
    handing off to the 3D letter at exactly that size and spot. */
export function PostcardComposer({
  postcard,
  from,
  onCancel,
  onSend,
  prepareDrop,
  onDelivered,
  onFlight,
}: {
  postcard: Postcard
  /** Screen rect of the polaroid photo that was tapped */
  from: DOMRect | null
  onCancel: () => void
  /** Saves the letter; resolves to an error message to show, or null once it is kept */
  onSend: (name: string, message: string, hpWebsite: string) => Promise<string | null>
  /** Brings the box into view and reports where its slot is */
  prepareDrop: () => Promise<DropPoint | null>
  onDelivered: () => void
  /** The card has started flying to the box, for this long */
  onFlight?: (ms: number) => void
}) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const flyerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLFormElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<LetterErrors>({})
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const hpRef = useRef<HTMLInputElement>(null)

  // Lift → fly to centre → flip edge-on → the postcard flips in from the other side.
  // The size swap happens while the card is edge-on, so it reads as one object.
  useLayoutEffect(() => {
    const flyer = flyerRef.current
    const card = cardRef.current
    if (!flyer || !card) return
    const running: Animation[] = []
    let alive = true
    const play = (el: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      const a = el.animate(keyframes, { fill: "forwards", ...options })
      running.push(a)
      return a.finished
    }
    const reveal = () => {
      flyer.style.display = "none"
      card.style.opacity = "1"
      messageRef.current?.focus({ preventScroll: true })
    }

    async function intro() {
      if (!from || reducedMotion()) {
        reveal()
        await play(card!, [{ opacity: 0 }, { opacity: 1 }], { duration: 220 })
        return
      }
      const target = card!.getBoundingClientRect()
      const cx = target.left + target.width / 2
      const cy = Math.min(target.top + target.height / 2, window.innerHeight / 2)
      const dx = cx - (from.left + from.width / 2)
      const dy = cy - (from.top + from.height / 2)
      const s = Math.min(1.6, (target.width * 0.4) / from.width)
      const start = "perspective(900px) translate(0px, 0px) scale(1) rotate(0deg) rotateY(0deg)"
      const centred = `perspective(900px) translate(${dx}px, ${dy}px) scale(${s}) rotate(-3deg) rotateY(0deg)`
      const edgeOn = `perspective(900px) translate(${dx}px, ${dy}px) scale(${s}) rotate(-3deg) rotateY(90deg)`

      await play(flyer!, [{ transform: start }, { transform: centred }], { duration: 560, easing: "cubic-bezier(.2,.8,.2,1)" })
      if (!alive) return
      await play(flyer!, [{ transform: centred }, { transform: edgeOn }], { duration: 170, easing: "ease-in" })
      if (!alive) return
      reveal()
      await play(
        card!,
        [
          { transform: "perspective(1400px) rotateY(-90deg) scale(0.92)" },
          { transform: "perspective(1400px) rotateY(0deg) scale(1)" },
        ],
        { duration: 520, easing: "cubic-bezier(.2,.9,.3,1.12)" },
      )
    }
    intro().catch(() => {})
    return () => {
      alive = false
      running.forEach((a) => a.cancel())
    }
  }, [from])

  // Lock page scroll behind the overlay; Escape puts the card back
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  useEffect(() => {
    if (sending) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sending, onCancel])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (sending) return
    const found = validateLetter(name, message)
    setErrors(found)
    if (found.name || found.message) return

    setSending(true)
    setSaving(true)
    setSendError(null)
    // Nothing flies until the letter is saved — a failed send stays on the card
    const error = await onSend(name, message, hpRef.current?.value ?? "")
    setSaving(false)
    if (error) {
      setSendError(error)
      setSending(false)
      return
    }
    document.body.style.overflow = ""
    const card = cardRef.current!
    const reduce = reducedMotion()

    actionsRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" })
    const target = await prepareDrop()
    const r = card.getBoundingClientRect()
    backdropRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, fill: "forwards" })

    if (reduce || !target) {
      onFlight?.(300)
      await card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }).finished
    } else {
      const tx = target.x - (r.left + r.width / 2)
      const ty = target.y - (r.top + r.height / 2)
      const s = target.width / r.width
      onFlight?.(FLIGHT_MS)
      await card.animate(
        [
          { transform: "translate(0px, 0px) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
          { transform: "translate(0px, -16px) scale(1.02) rotate(-1.5deg)", opacity: 1, offset: 0.16 },
          { transform: `translate(${tx}px, ${ty}px) scale(${s}) rotate(3deg)`, opacity: 1, offset: 0.93 },
          { transform: `translate(${tx}px, ${ty}px) scale(${s * 0.96}) rotate(3deg)`, opacity: 0, offset: 1 },
        ],
        { duration: FLIGHT_MS, easing: "cubic-bezier(.5,0,.25,1)", fill: "forwards" },
      ).finished
    }
    onDelivered()
  }

  const fieldError = (id: string, text?: string) =>
    text ? (
      <p id={id} role="alert" className="mt-1 font-[family-name:var(--font-thai)] text-[14px]" style={{ color: "var(--c-blush-deep)" }}>
        {text}
      </p>
    ) : null

  // Portal out of the section: its scroll-reveal transform would trap position: fixed
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="เขียนโปสการ์ดถึงบ่าวสาว" className="fixed inset-0 z-[70]">
      <div
        ref={backdropRef}
        onClick={() => !sending && onCancel()}
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--c-ivory) 82%, transparent)" }}
      />

      {/* Polaroid stand-in for the fly-and-flip intro */}
      {from && (
        <div
          ref={flyerRef}
          aria-hidden
          className="pointer-events-none fixed z-10"
          style={{
            // px, not %: percentage padding would resolve against the viewport here
            padding: `${from.width * 0.06}px ${from.width * 0.06}px ${from.width * 0.16}px`,
            left: from.left - from.width * 0.06,
            top: from.top - from.width * 0.06,
            width: from.width * 1.12,
            background: "#FDFBF6",
            boxShadow: "0 24px 40px -20px rgba(92,72,48,0.55)",
          }}
        >
          <Image
            src={postcard.src}
            alt=""
            width={600}
            height={900}
            sizes="300px"
            className="aspect-[4/5] w-full object-cover"
            style={{ objectPosition: postcard.focus }}
          />
        </div>
      )}

      <div className="pointer-events-none relative h-full overflow-y-auto overscroll-contain">
        <div className="flex min-h-full flex-col items-center justify-center px-4 py-14">
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            aria-label="ปิด"
            className="pointer-events-auto absolute top-4 right-4 flex size-10 items-center justify-center rounded-full transition-colors hover:bg-[color-mix(in_srgb,var(--c-blush)_25%,transparent)] focus-visible:outline-2 focus-visible:outline-[var(--c-sage)] disabled:opacity-0"
            style={{ color: "var(--c-ink-2)" }}
          >
            <RiCloseLine size={22} />
          </button>

          <form
            ref={cardRef}
            onSubmit={handleSubmit}
            noValidate
            className="pointer-events-auto w-full max-w-[760px] [--gb-line:32px] md:[--gb-line:34px]"
            style={{ opacity: 0, willChange: "transform" }}
          >
            {/* Honeypot: hidden from people, filled in by naive bots */}
            <input ref={hpRef} type="text" name="hp_website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
            <PostcardFace postcard={postcard}>
              <label htmlFor="gb-message" className="sr-only">
                คำอวยพร
              </label>
              <textarea
                ref={messageRef}
                id="gb-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={MESSAGE_MAX}
                rows={6}
                disabled={sending}
                placeholder="ขอให้รักกันแบบนี้ไปนาน ๆ นะ…"
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "gb-message-error" : undefined}
                className="w-full resize-none bg-transparent font-[family-name:var(--font-hand)] text-[19px] outline-none placeholder:text-[color-mix(in_srgb,var(--c-muted)_70%,transparent)] md:text-[20px]"
                style={{ ...RULED, color: INK, minHeight: "calc(var(--gb-line) * 6)" }}
              />
              {fieldError("gb-message-error", errors.message)}

              <div className="mt-auto flex items-end gap-2 pt-4">
                <label htmlFor="gb-name" className="shrink-0 pb-1 font-[family-name:var(--font-hand)] text-[19px]" style={{ color: INK }}>
                  จาก
                </label>
                <input
                  id="gb-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={NAME_MAX}
                  disabled={sending}
                  autoComplete="name"
                  placeholder="ชื่อของคุณ"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "gb-name-error" : undefined}
                  className="min-w-0 flex-1 border-b bg-transparent pb-1 font-[family-name:var(--font-hand)] text-[20px] outline-none transition-colors placeholder:text-[color-mix(in_srgb,var(--c-muted)_70%,transparent)] focus:border-[var(--c-sage)]"
                  style={{ color: INK, borderColor: "var(--c-blush)" }}
                />
              </div>
              {fieldError("gb-name-error", errors.name)}
              {message.length > MESSAGE_MAX * 0.8 && (
                <p className="mt-2 text-right font-[family-name:var(--font-label)] text-[11px] tabular-nums" style={{ color: "var(--c-muted)" }}>
                  {message.length}/{MESSAGE_MAX}
                </p>
              )}
            </PostcardFace>

            {sendError && (
              <p role="alert" className="mt-5 text-center font-[family-name:var(--font-thai)] text-[15px]" style={{ color: "var(--c-blush-deep)" }}>
                {sendError}
              </p>
            )}
            <div ref={actionsRef} className="mt-7 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row sm:gap-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={sending}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-[family-name:var(--font-thai)] text-[15px] transition-colors hover:text-[var(--c-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-sage)]"
                style={{ color: "var(--c-muted)" }}
              >
                <RiArrowGoBackLine size={16} />
                เลือกรูปใหม่
              </button>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--c-blush)_0%,var(--c-blush-deep)_100%)] px-9 py-3.5 font-[family-name:var(--font-thai)] text-[17px] tracking-[0.04em] text-white shadow-[0_8px_22px_-10px_rgba(184,132,126,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[0.96] active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--c-sage)]"
              >
                <RiMailSendLine size={18} />
                {saving ? "กำลังส่ง…" : "ส่งจดหมาย"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
