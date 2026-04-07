"use client"

import { useState, useEffect } from "react"

export function Countdown() {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    const target = new Date("2026-12-26T00:00:00+07:00")
    const diff = target.getTime() - Date.now()
    setDays(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))))
  }, [])

  if (days === null) return null

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="font-[family-name:var(--font-cormorant)] font-light leading-none tabular-nums"
        style={{ fontSize: "clamp(52px, 16vw, 72px)", color: "var(--c-ink)" }}
      >
        {days}
      </span>
      <span
        className="font-[family-name:var(--font-josefin)] text-[12px] tracking-[0.45em] uppercase"
        style={{ color: "var(--c-muted)" }}
      >
        Days to Go
      </span>
    </div>
  )
}
