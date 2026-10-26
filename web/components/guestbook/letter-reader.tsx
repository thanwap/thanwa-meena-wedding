"use client"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { RiCloseLine } from "@remixicon/react"
import { getPostcard } from "./postcards"
import { PostcardFace, INK, RULED } from "./postcard"
import type { Letter } from "./guestbook-state"

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
}

/** A letter pulled out of the box to read */
export function LetterReader({ letter, onClose }: { letter: Letter; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  // Portal out of the section: its scroll-reveal transform would trap position: fixed
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`จดหมายจาก ${letter.name}`} className="fixed inset-0 z-[70]">
      <div
        onClick={onClose}
        className="gb-fade-in absolute inset-0 backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--c-ivory) 82%, transparent)" }}
      />
      <div className="pointer-events-none relative h-full overflow-y-auto overscroll-contain">
        <div className="flex min-h-full flex-col items-center justify-center px-4 py-14">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="pointer-events-auto absolute top-4 right-4 flex size-10 items-center justify-center rounded-full transition-colors hover:bg-[color-mix(in_srgb,var(--c-blush)_25%,transparent)] focus-visible:outline-2 focus-visible:outline-[var(--c-sage)]"
            style={{ color: "var(--c-ink-2)" }}
          >
            <RiCloseLine size={22} />
          </button>

          <div className="gb-letter-in pointer-events-auto w-full max-w-[760px] [--gb-line:32px] md:[--gb-line:34px]">
            <PostcardFace postcard={getPostcard(letter.postcardId)}>
              <p
                className="max-h-[calc(var(--gb-line)*8)] overflow-y-auto font-[family-name:var(--font-hand)] text-[19px] break-words whitespace-pre-wrap md:text-[20px]"
                style={{ ...RULED, color: INK }}
              >
                {letter.message}
              </p>
              <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                <p className="font-[family-name:var(--font-hand)] text-[20px]" style={{ color: INK }}>
                  จาก {letter.name}
                </p>
                <p className="shrink-0 pb-1 font-[family-name:var(--font-thai)] text-[13px]" style={{ color: "var(--c-muted)" }}>
                  {formatDate(letter.createdAt)}
                </p>
              </div>
            </PostcardFace>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
