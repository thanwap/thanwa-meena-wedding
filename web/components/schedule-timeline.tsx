"use client"

import { useEffect, useRef, useState } from "react"

const ITEMS = [
  { time: "14:00", thai: "พิธีแห่ขันหมากและรับไหว้",  en: "Khan Mak Procession"      },
  { time: "15:00", thai: "พิธีหลั่งน้ำสังข์",          en: "Water Blessing Ceremony" },
  { time: "17:00", thai: "พิธีกล่าวคำสัญญา",           en: "Vow Ceremony"            },
  { time: "18:00", thai: "ร่วมรับประทานอาหาร",         en: "Wedding Reception"       },
  { time: "20:00", thai: "After Party",                 en: "After Party"             },
]

export function ScheduleTimeline() {
  const [activeIndex, setActiveIndex] = useState(-1)
  // fillRatio: 0–1, how far down the line should be filled
  const [fillRatio, setFillRatio]     = useState(0)

  const sectionRef  = useRef<HTMLDivElement>(null)
  const lineRef     = useRef<HTMLDivElement>(null)
  const rafRef      = useRef<number | null>(null)

  useEffect(() => {
    const calc = () => {
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

      // Calculate fill ratio: distance from line top to active dot centre
      if (latest >= 0 && lineRef.current) {
        const lineRect    = lineRef.current.getBoundingClientRect()
        const activeRow   = rows[latest]
        if (activeRow) {
          const { top: rowTop, height: rowH } = activeRow.getBoundingClientRect()
          const dotCenter = rowTop + rowH / 2
          const ratio     = (dotCenter - lineRect.top) / lineRect.height
          setFillRatio(Math.max(0, Math.min(1, ratio)))
        }
      } else {
        setFillRatio(0)
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
    calc()
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div ref={sectionRef}>
      <p
        className="font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.5em] uppercase mb-8 text-center"
        style={{ color: "var(--c-sage)" }}
      >
        Schedule
      </p>

      <div className="relative">
        {/* Background track — always visible, faint */}
        <div
          ref={lineRef}
          aria-hidden
          style={{
            position: "absolute",
            left: 88,
            top: 0,
            bottom: 0,
            width: 1,
            background:
              "linear-gradient(to bottom, transparent, var(--c-blush) 15%, var(--c-blush) 85%, transparent)",
            opacity: 0.25,
          }}
        />

        {/* Animated fill — grows to the active dot */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 88,
            top: 0,
            bottom: 0,
            width: 1,
            background: "var(--c-blush-deep)",
            opacity: 0.7,
            transformOrigin: "top center",
            transform: `scaleY(${fillRatio})`,
            transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
            willChange: "transform",
          }}
        />

        {ITEMS.map((item, i) => {
          const dotActive = i <= activeIndex

          return (
            <div
              key={i}
              data-row={i}
              className="relative flex items-center gap-0 mb-8 last:mb-0"
            >
              {/* Time */}
              <div className="shrink-0 text-right" style={{ width: 72 }}>
                <span
                  className="font-[family-name:var(--font-josefin)] text-base"
                  style={{ color: "var(--c-muted)" }}
                >
                  {item.time}
                </span>
              </div>

              {/* Dot */}
              <div className="relative shrink-0 flex justify-center" style={{ width: 32 }}>
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
                      "background 0.4s ease, border-color 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease",
                    flexShrink: 0,
                  }}
                />
              </div>

              {/* Content */}
              <div className="pl-3">
                <p
                  className="font-[family-name:var(--font-sarabun)] text-base leading-tight"
                  style={{ color: "var(--c-ink)" }}
                >
                  {item.thai}
                </p>
                <p
                  className="font-[family-name:var(--font-josefin)] text-[11px] tracking-wider mt-0.5"
                  style={{ color: "var(--c-muted)" }}
                >
                  {item.en}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
