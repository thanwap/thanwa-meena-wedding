"use client"

import { useEffect, useImperativeHandle, useRef, useState } from "react"
import Image from "next/image"
import type { Letter } from "./guestbook-state"
import type { DropPoint } from "./postcard-composer"
import type { LetterBoxScene } from "./letter-box-scene"
import { focusFractions, getPostcard } from "./postcards"

export interface LetterBoxHandle {
  getDropPoint(): DropPoint | null
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas")
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"))
  } catch {
    return false
  }
}

/** Seeded scatter so CSS-fallback letters keep their spot between renders */
function scatter(id: number) {
  const r = (n: number) => (Math.abs(Math.sin(id * 12.9898 + n * 78.233)) * 43758.5453) % 1
  return { left: 6 + r(1) * 60, bottom: 4 + r(2) * 22, rotate: (r(3) - 0.5) * 34 }
}

/** No-WebGL stand-in: a glassy CSS box with the letters fanned inside */
function FallbackBox({
  letters,
  dropId,
  onPick,
  onLanded,
  slotRef,
}: {
  letters: Letter[]
  dropId: number | null
  onPick: (id: number) => void
  onLanded: (id: number) => void
  slotRef: React.Ref<HTMLDivElement>
}) {
  return (
    <div className="absolute inset-x-[8%] top-[18%] bottom-[8%]">
      <div
        ref={slotRef}
        aria-hidden
        className="absolute top-0 left-1/2 h-[6px] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "rgba(255,255,255,0.9)", boxShadow: "inset 0 1px 2px rgba(92,72,48,0.35)" }}
      />
      <div
        className="absolute inset-0 overflow-hidden rounded-[10px] backdrop-blur-[2px]"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.3) 100%)",
          border: "1.5px solid rgba(255,255,255,0.9)",
          boxShadow: "inset 0 0 0 1px rgba(184,132,126,0.18), 0 24px 40px -26px rgba(92,72,48,0.55)",
        }}
      >
        {letters.slice(-18).map((l) => {
          const s = scatter(l.id)
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onPick(l.id)}
              onAnimationEnd={() => l.id === dropId && onLanded(l.id)}
              aria-label={`อ่านจดหมายจาก ${l.name}`}
              className={`absolute flex w-[30%] gap-[4%] rounded-[2px] p-[2%] transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-[var(--c-sage)] ${l.id === dropId ? "gb-drop-in" : ""}`}
              style={{
                left: `${s.left}%`,
                bottom: `${s.bottom}%`,
                rotate: `${s.rotate}deg`,
                background: "#FBF8F1",
                boxShadow: "0 6px 12px -6px rgba(92,72,48,0.45)",
              }}
            >
              <Image
                src={getPostcard(l.postcardId).src}
                alt=""
                width={120}
                height={180}
                className="aspect-[3/4] w-[42%] object-cover"
                style={{ objectPosition: getPostcard(l.postcardId).focus }}
              />
              <span className="min-w-0 flex-1 truncate pt-[6%] text-left font-[family-name:var(--font-hand)] text-[clamp(9px,2.4vw,13px)]" style={{ color: "#34436A" }}>
                {l.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Step 3 — the clear wishing box everyone's letters end up in. three.js loads
    only once the section is close to the viewport and renders only while
    visible; devices without WebGL get the CSS box instead. */
export function LetterBox({
  letters,
  dropId,
  onPick,
  onLanded,
  ref,
}: {
  letters: Letter[]
  /** A just-sent letter that should fall in through the slot */
  dropId: number | null
  onPick: (id: number) => void
  /** The dropped letter has come to rest on the pile */
  onLanded: (id: number) => void
  ref?: React.Ref<LetterBoxHandle>
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<LetterBoxScene | null>(null)
  const latest = useRef({ letters, dropId, onPick, onLanded })
  const [mode, setMode] = useState<"idle" | "3d" | "fallback">("idle")

  useEffect(() => {
    latest.current = { letters, dropId, onPick, onLanded }
  })

  // Load the scene when the box is within ~a screen of the viewport
  useEffect(() => {
    const wrap = wrapRef.current
    const mount = mountRef.current
    if (!wrap || !mount) return
    let cancelled = false
    let visible = false

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        near.disconnect()
        if (!hasWebGL()) {
          setMode("fallback")
          return
        }
        Promise.all([import("./letter-box-scene"), document.fonts?.ready])
          .then(([{ createLetterBoxScene }]) => {
            if (cancelled) return
            const handFont = getComputedStyle(document.documentElement).getPropertyValue("--font-hand").trim() || "cursive"
            const scene = createLetterBoxScene(mount, {
              onPick: (id) => latest.current.onPick(id),
              onLand: (id) => latest.current.onLanded(id),
              reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
              handFont,
            })
            scene.setLetters(toScene(latest.current.letters))
            scene.setActive(visible)
            sceneRef.current = scene
            setMode("3d")
          })
          .catch(() => !cancelled && setMode("fallback"))
      },
      { rootMargin: "400px 0px" },
    )
    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sceneRef.current?.setActive(visible)
    })
    near.observe(wrap)
    onScreen.observe(wrap)
    return () => {
      cancelled = true
      near.disconnect()
      onScreen.disconnect()
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setLetters(toScene(letters), dropId)
  }, [letters, dropId])

  useImperativeHandle(ref, () => ({
    getDropPoint() {
      if (sceneRef.current) return sceneRef.current.getDropPoint()
      const slot = slotRef.current?.getBoundingClientRect()
      const wrap = wrapRef.current?.getBoundingClientRect()
      if (!slot || !wrap) return null
      return { x: slot.left + slot.width / 2, y: slot.top - wrap.width * 0.06, width: wrap.width * 0.22 }
    },
  }))

  return (
    <div ref={wrapRef} className="relative mx-auto aspect-[1/1] w-full max-w-[760px] sm:aspect-[4/3] md:aspect-[16/10]">
      <div ref={mountRef} className="absolute inset-0" />
      {mode === "fallback" && (
        <FallbackBox letters={letters} dropId={dropId} onPick={onPick} onLanded={onLanded} slotRef={slotRef} />
      )}

      {/* The canvas is decorative to assistive tech; letters stay reachable here */}
      {mode === "3d" && (
        <ul className="sr-only">
          {letters.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onPick(l.id)}>
                อ่านจดหมายจาก {l.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function toScene(letters: Letter[]) {
  return letters.map((l) => {
    const card = getPostcard(l.postcardId)
    return { id: l.id, name: l.name, message: l.message, photoSrc: card.src, photoFocus: focusFractions(card.focus) }
  })
}
