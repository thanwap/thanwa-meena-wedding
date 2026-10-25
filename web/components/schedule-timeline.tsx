"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { CoupleIcon, ConchIcon, DinnerIcon, KhanMakIcon, RingsIcon } from "@/components/schedule-icons"

const ITEMS = [
  { time: "13.00", thai: "พิธีแห่ขันหมากและรับไหว้", en: "Khan Mak Procession",     Icon: KhanMakIcon },
  { time: "14.45", thai: "พิธีหลั่งน้ำสังข์",         en: "Water Blessing Ceremony", Icon: ConchIcon   },
  { time: "17.30", thai: "พิธีกล่าวคำสัญญา",          en: "Vow Ceremony",            Icon: RingsIcon   },
  { time: "18.00", thai: "เชิญรับประทานอาหาร",        en: "Wedding Dinner",          Icon: DinnerIcon  },
  { time: "21.00", thai: "After Party",                en: "After Party",             Icon: CoupleIcon  },
]

// Layout: mobile is a vertical list (icon · dot · text), md+ is a horizontal
// row like the printed card (icon / dot on line / time / label).
// Mobile line x = icon column (72) + half dot column (16). Desktop line y =
// icon height (96) + gap (12) + half dot row (12).
// Desktop line sweep: total duration and per-item step (4 gaps between 5 items)
const DESKTOP_SWEEP_MS = 2800
const DESKTOP_STEP_MS  = DESKTOP_SWEEP_MS / (ITEMS.length - 1)

export function ScheduleTimeline() {
  const [activeIndex, setActiveIndex] = useState(-1)
  // fillRatio: 0–1, how far along the line should be filled
  const [fillRatio, setFillRatio]     = useState(0)
  const [isDesktop, setIsDesktop]     = useState(false)

  const sectionRef  = useRef<HTMLDivElement>(null)
  const lineRef     = useRef<HTMLDivElement>(null)
  const rafRef      = useRef<number | null>(null)

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)")

    const calc = () => {
      setIsDesktop(desktop.matches)
      const el = sectionRef.current
      if (!el) return

      const threshold = window.innerHeight * 0.72
      const rows = el.querySelectorAll<HTMLElement>("[data-row]")
      let latest = -1
      rows.forEach((row) => {
        const { top, height } = row.getBoundingClientRect()
        if (top + height / 2 < threshold) {
          latest = parseInt(row.dataset.row ?? "0", 10)
        }
      })
      setActiveIndex(latest)

      if (latest < 0 || !lineRef.current) {
        setFillRatio(0)
      } else if (desktop.matches) {
        // Rows share one baseline on desktop, so they activate together.
        setFillRatio(latest / (ITEMS.length - 1))
      } else {
        // Distance from line top to active dot centre
        const lineRect  = lineRef.current.getBoundingClientRect()
        const activeRow = rows[latest]
        if (activeRow) {
          const { top: rowTop, height: rowH } = activeRow.getBoundingClientRect()
          const ratio = (rowTop + rowH / 2 - lineRect.top) / lineRect.height
          setFillRatio(Math.max(0, Math.min(1, ratio)))
        }
      }
    }

    const onScroll = () => {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(() => {
        calc()
        rafRef.current = null
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    desktop.addEventListener("change", calc)
    calc()
    return () => {
      window.removeEventListener("scroll", onScroll)
      desktop.removeEventListener("change", calc)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const lineClass =
    "absolute left-[88px] top-0 bottom-0 w-px md:left-[10%] md:right-[10%] md:top-[120px] md:bottom-auto md:h-px md:w-auto"

  return (
    <div ref={sectionRef} className="mx-auto w-fit md:relative md:left-1/2 md:w-[min(56rem,calc(100vw-3rem))] md:-translate-x-1/2">
      <p
        className="font-[family-name:var(--font-label)] text-[12px] md:text-[14px] tracking-[0.5em] uppercase mb-8 md:mb-10 text-center"
        style={{ color: "var(--c-sage)" }}
      >
        Schedule
      </p>

      <div className="relative md:grid md:grid-cols-5">
        {/* Background track — always visible, faint */}
        <div
          ref={lineRef}
          aria-hidden
          className={`${lineClass} bg-[linear-gradient(to_bottom,transparent,var(--c-blush)_15%,var(--c-blush)_85%,transparent)] md:bg-[linear-gradient(to_right,transparent,var(--c-blush)_10%,var(--c-blush)_90%,transparent)]`}
          style={{ opacity: 0.5 }}
        />

        {/* Animated fill — grows to the active dot */}
        <div
          aria-hidden
          className={`${lineClass} origin-top [transform:scaleY(var(--fill))] md:origin-left md:[transform:scaleX(var(--fill))]`}
          style={{
            "--fill": fillRatio,
            background: "var(--c-blush-deep)",
            opacity: 0.7,
            transition: isDesktop
              ? `transform ${DESKTOP_SWEEP_MS}ms cubic-bezier(0.45,0,0.55,1)`
              : "transform 0.9s cubic-bezier(0.16,1,0.3,1)",
            willChange: "transform",
          } as CSSProperties}
        />

        {ITEMS.map(({ time, thai, en, Icon }, i) => {
          const dotActive = i <= activeIndex
          // Desktop: each item appears as the sweeping line reaches it
          const delay     = isDesktop && dotActive ? `${i * DESKTOP_STEP_MS}ms` : "0ms"

          return (
            <div
              key={i}
              data-row={i}
              className="relative flex items-center mb-6 last:mb-0 md:mb-0 md:flex-col md:text-center"
            >
              {/* Illustration */}
              <div
                className="shrink-0 flex items-end justify-center w-[72px] h-[64px] md:w-full md:h-[96px] md:mb-3"
                style={{
                  opacity: dotActive ? 1 : 0.55,
                  transform: dotActive ? "translateY(0)" : "translateY(4px)",
                  transition: `opacity 0.9s ease ${delay}, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}`,
                }}
              >
                <Icon className="h-[60px] w-[60px] md:h-[92px] md:w-[92px]" />
              </div>

              {/* Dot */}
              <div className="relative shrink-0 flex items-center justify-center w-8 md:w-full md:h-6">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: dotActive ? "var(--c-blush-deep)" : "var(--c-ivory)",
                    border: `1.5px solid ${dotActive ? "var(--c-blush-deep)" : "var(--c-blush)"}`,
                    transform: dotActive ? "scale(1.3)" : "scale(1)",
                    boxShadow: dotActive
                      ? "0 0 0 3px color-mix(in srgb, var(--c-blush-deep) 25%, transparent)"
                      : "none",
                    transition:
                      `background 0.5s ease ${delay}, border-color 0.5s ease ${delay}, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay}, box-shadow 0.5s ease ${delay}`,
                  }}
                />
              </div>

              {/* Content */}
              <div className="pl-3 md:pl-0 md:pt-3 md:px-2">
                <p
                  className="font-[family-name:var(--font-label)] text-[15px] md:text-lg tabular-nums"
                  style={{ color: "var(--c-muted)" }}
                >
                  {time}
                </p>
                <p
                  className="font-[family-name:var(--font-thai)] text-base md:text-[17px] leading-snug mt-0.5 md:mt-1 [text-wrap:balance]"
                  style={{ color: "var(--c-ink)" }}
                >
                  {thai}
                </p>
                {en !== thai && (
                  <p
                    className="font-[family-name:var(--font-label)] text-[12px] md:text-[12px] tracking-wider mt-1"
                    style={{ color: "var(--c-muted)" }}
                  >
                    {en}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
