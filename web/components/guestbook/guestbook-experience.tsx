"use client"

import { useCallback, useReducer, useRef, useState } from "react"
import type { GuestbookEntryDto } from "@/app/actions/guestbook"
import { Clothesline } from "./clothesline"
import { PostcardComposer, type DropPoint } from "./postcard-composer"
import { LetterBox, type LetterBoxHandle } from "./letter-box"
import { LetterReader } from "./letter-reader"
import { guestbookReducer, initialState, lettersFromEntries, type Letter } from "./guestbook-state"
import { getPostcard } from "./postcards"
import { createSendSound, type SendSound } from "./send-sound"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function StepHint({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-2.5 font-[family-name:var(--font-thai)] text-[15px] md:text-base" style={{ color: "var(--c-ink-2)" }}>
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-hand)] text-[14px] leading-none"
        style={{ border: "1px solid var(--c-blush)", color: "var(--c-blush-deep)" }}
      >
        {n}
      </span>
      {children}
    </p>
  )
}

/** Guestbook as a little ritual: pick a postcard off the line, write on it,
    drop it into the box with everyone else's. The letter is saved before it
    flies, so it only lands in the box once it is really kept. */
export function GuestbookExperience({ entries }: { entries: GuestbookEntryDto[] }) {
  const [state, dispatch] = useReducer(guestbookReducer, entries, initialState)
  const [fromRect, setFromRect] = useState<DOMRect | null>(null)
  const boxWrapRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<LetterBoxHandle>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const sound = useRef<SendSound | null>(null)
  const saved = useRef<Letter | null>(null)

  const cancel = useCallback(() => dispatch({ type: "cancel" }), [])
  const closeReader = useCallback(() => dispatch({ type: "closeReader" }), [])
  const read = useCallback((id: number) => dispatch({ type: "read", id }), [])
  const landed = useCallback(() => sound.current?.land(), [])

  async function send(name: string, message: string, hpWebsite: string): Promise<string | null> {
    // Inside the submit gesture, so iOS lets the audio start
    sound.current ??= createSendSound()
    sound.current?.pickup()
    dispatch({ type: "send", name, message })

    const postcardId = state.postcardId!
    const form = new FormData()
    form.append("name", name.trim())
    form.append("message", message.trim())
    form.append("postcardId", String(postcardId))
    if (hpWebsite) form.append("hpWebsite", hpWebsite)

    let error: string | null = null
    try {
      const res = await fetch("/api/guestbook", { method: "POST", body: form })
      if (res.ok) {
        const entry = (await res.json()) as GuestbookEntryDto
        saved.current = { ...lettersFromEntries([entry])[0], postcardId }
      } else {
        error =
          res.status === 429
            ? "ตอนนี้มีคนส่งจดหมายพร้อมกันเยอะมาก รอสักครู่แล้วลองส่งใหม่นะ"
            : "ส่งไม่สำเร็จ ลองตรวจข้อความแล้วส่งใหม่อีกครั้งนะ"
      }
    } catch {
      error = "ส่งไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้งนะ"
    }
    if (error) dispatch({ type: "sendFailed" })
    return error
  }

  async function prepareDrop(): Promise<DropPoint | null> {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    boxWrapRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" })
    await wait(reduce ? 50 : 700)
    return boxRef.current?.getDropPoint() ?? null
  }

  function writeAnother() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    lineRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" })
  }

  const reading = state.letters.find((l) => l.id === state.readingId)

  return (
    <div>
      <div ref={lineRef}>
        <StepHint n={1}>เลือกหยิบโปสการ์ดสักใบจากราว</StepHint>
        <div className="relative left-1/2 mt-1 w-screen -translate-x-1/2">
          <Clothesline
            hiddenId={state.postcardId}
            onPick={(id, rect) => {
              setFromRect(rect)
              dispatch({ type: "pick", postcardId: id })
            }}
          />
        </div>
      </div>

      <div className="mt-2 space-y-3 text-center">
        <StepHint n={2}>เขียนคำอวยพรถึงบ่าวสาว</StepHint>
        <StepHint n={3}>หย่อนลงกล่องรวมกับจดหมายของทุกคน</StepHint>
      </div>

      <div ref={boxWrapRef} className="mt-4 md:mt-2">
        <LetterBox ref={boxRef} letters={state.letters} dropId={state.sentId} onPick={read} onLanded={landed} />
      </div>

      <div className="mt-2 min-h-[56px] text-center" aria-live="polite">
        {state.sentId !== null ? (
          <>
            <p className="font-[family-name:var(--font-hand)] text-[20px]" style={{ color: "var(--c-blush-deep)" }}>
              ขอบคุณสำหรับคำอวยพรนะ ♡ จดหมายของคุณอยู่ในกล่องแล้ว
            </p>
            <button
              type="button"
              onClick={writeAnother}
              className="mt-1 font-[family-name:var(--font-thai)] text-[15px] underline decoration-[var(--c-blush)] underline-offset-4 transition-colors hover:text-[var(--c-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-sage)]"
              style={{ color: "var(--c-muted)" }}
            >
              เขียนอีกใบ
            </button>
          </>
        ) : (
          <p className="font-[family-name:var(--font-thai)] text-[15px]" style={{ color: "var(--c-muted)" }}>
            {state.letters.length > 0
              ? `จดหมาย ${state.letters.length} ฉบับในกล่อง · แตะเพื่ออ่าน`
              : "กล่องยังว่างอยู่ · มาเป็นคนแรกที่ส่งคำอวยพรกัน"}
          </p>
        )}
      </div>

      {state.step !== "pick" && state.postcardId !== null && (
        <PostcardComposer
          postcard={getPostcard(state.postcardId)}
          from={fromRect}
          onCancel={cancel}
          onSend={send}
          onFlight={(ms) => sound.current?.whoosh(ms)}
          prepareDrop={prepareDrop}
          onDelivered={() => saved.current && dispatch({ type: "delivered", letter: saved.current })}
        />
      )}

      {reading && <LetterReader letter={reading} onClose={closeReader} />}
    </div>
  )
}
