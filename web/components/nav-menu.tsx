"use client"

import { useEffect, useRef, useState } from "react"

const NAV_ITEMS = [
  { id: "hero",      label: "Home",      th: "หน้าแรก" },
  { id: "story",     label: "Our Story", th: "เรื่องของเรา" },
  { id: "couple",    label: "The Couple",th: "บ่าวสาว" },
  { id: "beginning", label: "Beginning", th: "จุดเริ่มต้น" },
  { id: "details",   label: "Details",   th: "รายละเอียด" },
  { id: "rsvp",      label: "RSVP",      th: "ตอบรับ" },
  { id: "guestbook", label: "Guestbook", th: "ข้อความ" },
  { id: "dress",     label: "Dress Code",th: "การแต่งกาย" },
]

export function NavMenu() {
  const [active, setActive]   = useState("hero")
  const [mounted, setMounted] = useState(false)
  const [open, setOpen]       = useState(false)
  const overlayRef            = useRef<HTMLDivElement>(null)

  /* Trigger entrance animation on first paint */
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  /* Track active section */
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { rootMargin: "-40% 0px -55% 0px" }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  /* Lock body scroll when overlay open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  function scrollTo(id: string) {
    setOpen(false)
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    }, open ? 300 : 0)
  }

  return (
    <>
      {/* ── Desktop top bar (md+) ─────────────────── */}
      <nav
        aria-label="Page sections"
        className="hidden md:block"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(250, 247, 240, 0.9)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(232, 195, 190, 0.35)",
          transform: mounted ? "translateY(0)" : "translateY(-100%)",
          opacity: mounted ? 1 : 0,
          transition: "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
        }}
      >
        <ul
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: 0,
            padding: "0 16px",
            listStyle: "none",
          }}
        >
          {NAV_ITEMS.map(({ id, label }, i) => (
            <li key={id} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "var(--c-blush)",
                    opacity: 0.4,
                    margin: "0 4px",
                    flexShrink: 0,
                  }}
                />
              )}
              <button
                onClick={() => scrollTo(id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "14px 12px",
                  fontFamily: "var(--font-josefin)",
                  fontSize: 10,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: active === id ? "var(--c-blush-deep)" : "var(--c-muted)",
                  position: "relative",
                  transition: "color 0.25s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
                {active === id && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 3,
                      height: 3,
                      borderRadius: "50%",
                      background: "var(--c-blush-deep)",
                    }}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Mobile floating pill (< md) ──────────── */}
      <div
        className="md:hidden"
        style={{
          position: "fixed",
          bottom: 28,
          left: "50%",
          transform: `translateX(-50%) translateY(${mounted ? "0" : "80px"})`,
          opacity: mounted ? 1 : 0,
          transition: "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
          zIndex: 50,
        }}
      >
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 22px",
            borderRadius: 999,
            background: "rgba(250, 247, 240, 0.94)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(232, 195, 190, 0.55)",
            boxShadow: "0 4px 24px -4px rgba(28,42,24,0.14)",
            cursor: "pointer",
          }}
        >
          {/* Diamond icon */}
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" style={{ color: "var(--c-blush-deep)" }}>
            <path d="M7 1L13 7L7 13L1 7Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-josefin)",
              fontSize: 10,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "var(--c-ink)",
            }}
          >
            Menu
          </span>
          {/* Active section indicator */}
          <span
            style={{
              fontFamily: "var(--font-josefin)",
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--c-blush-deep)",
              opacity: 0.8,
            }}
          >
            · {NAV_ITEMS.find(n => n.id === active)?.label ?? ""}
          </span>
        </button>
      </div>

      {/* ── Mobile overlay ────────────────────────── */}
      <div
        ref={overlayRef}
        className="md:hidden"
        onClick={(e) => { if (e.target === overlayRef.current) setOpen(false) }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          background: "rgba(28, 42, 24, 0.35)",
          backdropFilter: open ? "blur(4px)" : "blur(0px)",
          WebkitBackdropFilter: open ? "blur(4px)" : "blur(0px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease, backdrop-filter 0.3s ease",
        }}
      >
        {/* Drawer panel */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--c-ivory)",
            borderRadius: "24px 24px 0 0",
            padding: "12px 0 40px",
            transform: open ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Drag handle */}
          <div style={{ display: "flex", justifyContent: "center", paddingBottom: 20 }}>
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "var(--c-blush)",
                opacity: 0.45,
              }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              position: "absolute",
              top: 16,
              right: 20,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--c-muted)",
              padding: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          {/* Nav items */}
          <ul style={{ listStyle: "none", margin: 0, padding: "0 32px" }}>
            {NAV_ITEMS.map(({ id, label, th }, i) => (
              <li key={id}>
                {i > 0 && (
                  <div
                    style={{
                      height: 1,
                      background: "var(--c-blush)",
                      opacity: 0.2,
                      margin: "0 0",
                    }}
                  />
                )}
                <button
                  onClick={() => scrollTo(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "16px 0",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Active dot */}
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: active === id ? "var(--c-blush-deep)" : "transparent",
                        border: `1.5px solid ${active === id ? "var(--c-blush-deep)" : "var(--c-blush)"}`,
                        flexShrink: 0,
                        transition: "background 0.2s ease",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: 26,
                        fontStyle: "italic",
                        fontWeight: 300,
                        color: active === id ? "var(--c-ink)" : "var(--c-ink-2)",
                        transition: "color 0.2s ease",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-sarabun)",
                      fontSize: 13,
                      color: "var(--c-muted)",
                      opacity: 0.7,
                    }}
                  >
                    {th}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
