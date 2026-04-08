"use client"

import { useState, useEffect, startTransition } from "react"

const TARGET = new Date("2026-12-26T00:00:00+07:00").getTime()

function getTimeLeft(now: number) {
  const diff = Math.max(0, TARGET - now)
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export function Countdown() {
  const [time, setTime] = useState<ReturnType<typeof getTimeLeft> | null>(null)

  useEffect(() => {
    const update = () => {
      startTransition(() => setTime(getTimeLeft(Date.now())))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  if (time === null) return null

  const units = [
    { value: time.days, label: "Days" },
    { value: time.hours, label: "Hours" },
    { value: time.minutes, label: "Min" },
    { value: time.seconds, label: "Sec" },
  ]

  return (
    <div className="flex items-end gap-4 sm:gap-6">
      {units.map(({ value, label }, i) => (
        <div key={label} className="flex items-end gap-4 sm:gap-6">
          <div className="flex flex-col items-center gap-1">
            <span
              className="font-[family-name:var(--font-cormorant)] font-light leading-none tabular-nums"
              style={{
                fontSize: "clamp(44px, 13vw, 64px)",
                color: "var(--c-ink)",
              }}
            >
              {String(value).padStart(2, "0")}
            </span>
            <span
              className="font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.4em] uppercase"
              style={{ color: "var(--c-muted)" }}
            >
              {label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span
              className="font-[family-name:var(--font-cormorant)] font-light pb-4 leading-none"
              style={{ fontSize: "clamp(28px, 8vw, 40px)", color: "var(--c-muted)", opacity: 0.5 }}
            >
              :
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
