"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react"
import { POSTCARDS } from "./postcards"

/** Rope height at both ends, measured from the top of the line */
const ROPE_TOP = 10

/** Wooden clothes peg straddling the rope at the top of each polaroid */
function Peg() {
  return (
    <span
      aria-hidden
      className="absolute left-1/2 top-[-13px] z-10 h-[30px] w-[11px] -translate-x-1/2 rounded-[2px]"
      style={{
        background: "linear-gradient(90deg, #B48A5E 0%, #DDBB92 45%, #C29A6E 100%)",
        boxShadow: "0 2px 3px rgba(90,64,38,0.35)",
      }}
    >
      <span className="absolute inset-x-0 top-[11px] h-[3px]" style={{ background: "#A7A49C" }} />
      <span className="absolute inset-y-0 left-1/2 w-px" style={{ background: "rgba(90,64,38,0.35)" }} />
    </span>
  )
}

/** Step 1 — polaroids pegged to a sagging twine. The rope is a quadratic curve,
    so each card is pushed down to the rope height at its current x and scaled
    up as it nears the centre; both are written straight to the DOM on scroll
    to keep React out of the per-frame path. Touch scrolls natively with snap;
    a mouse can drag the line or use the arrows. */
export function Clothesline({
  hiddenId,
  onPick,
}: {
  hiddenId: number | null
  onPick: (postcardId: number, from: DOMRect) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLUListElement>(null)
  const ropeRef = useRef<SVGPathElement>(null)
  const ropeSvgRef = useRef<SVGSVGElement>(null)
  const dragged = useRef(false)

  useEffect(() => {
    const wrap = wrapRef.current
    const scroller = scrollerRef.current
    if (!wrap || !scroller) return
    let frame = 0

    function layout() {
      frame = 0
      const w = wrap!.clientWidth
      const sag = Math.min(40, w * 0.055)
      ropeSvgRef.current!.setAttribute("viewBox", `0 0 ${w} ${ROPE_TOP + sag + 6}`)
      ropeSvgRef.current!.style.height = `${ROPE_TOP + sag + 6}px`
      ropeRef.current!.setAttribute("d", `M0 ${ROPE_TOP} Q${w / 2} ${ROPE_TOP + 2 * sag} ${w} ${ROPE_TOP}`)

      for (const item of scroller!.children as HTMLCollectionOf<HTMLElement>) {
        const cx = item.offsetLeft - scroller!.scrollLeft + item.offsetWidth / 2
        const u = Math.min(1, Math.max(0, cx / w))
        const dist = Math.min(1, Math.abs(cx - w / 2) / (w / 2))
        const hang = item.firstElementChild as HTMLElement
        hang.style.transform = `translateY(${4 * sag * u * (1 - u)}px) scale(${1.07 - 0.13 * dist})`
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(layout)
    }

    // Open on the middle card so there is a photo on each side
    const middle = scroller.children[Math.floor(POSTCARDS.length / 2)] as HTMLElement
    scroller.scrollLeft = middle.offsetLeft + middle.offsetWidth / 2 - scroller.clientWidth / 2
    layout()

    scroller.addEventListener("scroll", schedule, { passive: true })
    const resize = new ResizeObserver(schedule)
    resize.observe(wrap)
    return () => {
      scroller.removeEventListener("scroll", schedule)
      resize.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  function step(dir: 1 | -1) {
    const scroller = scrollerRef.current
    const first = scroller?.children[0] as HTMLElement | undefined
    if (!scroller || !first) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    scroller.scrollBy({ left: dir * (first.offsetWidth + 24), behavior: reduce ? "auto" : "smooth" })
  }

  /** Mouse drag scrolls the line; touch keeps native momentum scrolling */
  function onPointerDown(e: React.PointerEvent<HTMLUListElement>) {
    if (e.pointerType !== "mouse" || e.button !== 0) return
    const scroller = e.currentTarget
    const startX = e.clientX
    const startLeft = scroller.scrollLeft
    dragged.current = false

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      if (!dragged.current && Math.abs(dx) > 5) {
        dragged.current = true
        scroller.style.scrollSnapType = "none"
        scroller.style.cursor = "grabbing"
      }
      if (dragged.current) scroller.scrollLeft = startLeft - dx
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      scroller.style.cursor = ""
      // Restoring snap lets the browser settle on the nearest card
      scroller.style.scrollSnapType = ""
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  function pick(postcardId: number, e: React.MouseEvent<HTMLButtonElement>) {
    if (dragged.current) {
      dragged.current = false
      return
    }
    const photo = e.currentTarget.querySelector("img")
    onPick(postcardId, (photo ?? e.currentTarget).getBoundingClientRect())
  }

  return (
    <div ref={wrapRef} className="relative [--gb-card:clamp(150px,44vw,230px)]">
      <svg ref={ropeSvgRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 w-full" preserveAspectRatio="none">
        <path ref={ropeRef} fill="none" stroke="#A88A68" strokeWidth="1.8" strokeLinecap="round" />
      </svg>

      <ul
        ref={scrollerRef}
        aria-label="โปสการ์ดให้เลือก"
        onPointerDown={onPointerDown}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1)
          if (e.key === "ArrowLeft") step(-1)
        }}
        className="gb-no-scrollbar relative flex cursor-grab snap-x snap-mandatory gap-6 overflow-x-auto pb-14 md:pb-20"
        style={{ paddingInline: "calc(50% - var(--gb-card) / 2)", overscrollBehaviorX: "contain" }}
      >
        {POSTCARDS.map((card, i) => (
          <li key={card.id} className="shrink-0 snap-center" style={{ width: "var(--gb-card)", paddingTop: ROPE_TOP }}>
            <div className="origin-top will-change-transform">
              <div
                className="gb-sway relative origin-top"
                style={{ animationDuration: `${4.6 + (i % 3) * 0.7}s`, animationDelay: `${-i * 1.3}s` }}
              >
                <Peg />
                <button
                  type="button"
                  onClick={(e) => pick(card.id, e)}
                  aria-label={`เลือกโปสการ์ด “${card.caption}”`}
                  className="block w-full cursor-pointer rounded-[3px] px-[6%] pt-[6%] pb-[4%] text-center transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_30px_-16px_rgba(92,72,48,0.5),0_2px_4px_rgba(92,72,48,0.12)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--c-sage)]"
                  style={{
                    background: "#FDFBF6",
                    boxShadow: "0 14px 24px -16px rgba(92,72,48,0.45), 0 2px 4px rgba(92,72,48,0.1)",
                    visibility: hiddenId === card.id ? "hidden" : "visible",
                  }}
                >
                  <Image
                    src={card.src}
                    alt={card.alt}
                    width={600}
                    height={900}
                    sizes="230px"
                    draggable={false}
                    className="aspect-[4/5] w-full object-cover"
                    style={{ objectPosition: card.focus }}
                  />
                  <span
                    className="mt-[4%] block overflow-hidden pb-[0.15em] text-ellipsis whitespace-nowrap font-[family-name:var(--font-hand)] leading-[1.5]"
                    style={{ color: "var(--c-ink-2)", fontSize: "clamp(15px, 4.2vw, 19px)" }}
                  >
                    {card.caption}
                  </span>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {([-1, 1] as const).map((dir) => (
        <button
          key={dir}
          type="button"
          onClick={() => step(dir)}
          aria-label={dir < 0 ? "รูปก่อนหน้า" : "รูปถัดไป"}
          className={`absolute top-[42%] z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-sage)] ${dir < 0 ? "left-3 md:left-8" : "right-3 md:right-8"}`}
          style={{
            background: "color-mix(in srgb, var(--c-ivory) 80%, transparent)",
            border: "1px solid color-mix(in srgb, var(--c-blush) 70%, transparent)",
            color: "var(--c-blush-deep)",
          }}
        >
          {dir < 0 ? <RiArrowLeftSLine size={20} /> : <RiArrowRightSLine size={20} />}
        </button>
      ))}
    </div>
  )
}
