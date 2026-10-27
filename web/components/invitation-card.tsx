"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { invitationFrame, PHASE } from "@/lib/invitation-progress"
import cardFront from "@/public/invitation/card-front.webp"
import cardBack from "@/public/invitation/card-back.webp"

const FRONT_ALT =
  "การ์ดเชิญด้านหน้า: #FROMMEENATOTHANWAFOREVER — for (let i = 0; i < years; i++) { trust++; love++; } " +
  "if (distance > 0) { console.log(\"Still connected\"); } return \"Stronger than ever\"; " +
  "ชื่อ Thanwa และ Jittinan, ✓ distance.tested → love.approved, 26.12.26, Kindly join us to celebrate our love"

const BACK_ALT =
  "การ์ดเชิญด้านหลัง: นายชาชีวัฒน์ พรหมลิ นางเปี่ยมสุข โพธิ์งาม และ นายกฤช พัวมณี นางนันทา พัวมณี " +
  "มีความยินดีขอเรียนเชิญท่านเพื่อเป็นเกียรติเนื่องในพิธีมงคลสมรสระหว่าง นางสาวจิตตินันทน์ พรหมลิ (มีน) " +
  "และ นายธันวา พัวมณี (บาส) วันเสาร์ที่ 26 ธันวาคม 2569 ณ THE COP Seminar & Resort พัทยา. " +
  "กำหนดการ 13.00 พิธีแห่ขันหมากและรับไหว้, 14.45 พิธีหลั่งน้ำสังข์, 17.30 พิธีกล่าวคำสัญญา, " +
  "18.00 เชิญรับประทานอาหาร, 21.00 After Party. กรุณาแจ้งการเข้าร่วมภายในวันที่ 12 ธันวาคม 2569 ตาม QR code. " +
  "Dress Code: Garden Whimsical Pastel"

const CARD_SIZES = "(min-width: 1024px) 400px, 72vw"

/** Envelope-to-card reveal under the hero. A sticky stage pins centred on
    screen while the guest scrolls past the empty runway below it;
    that scroll opens the flap, slides the
    card out and turns it over. Scroll position is written straight into CSS
    custom properties (one rAF per frame, only while the section is near the
    viewport) so React never re-renders mid-scroll. Once the card is out,
    guests can also turn it by tapping it or the button. The envelope is
    landscape, so the card rides in it sideways and turns upright on the way out. */
export function InvitationCard() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [out, setOut] = useState(false)
  const [turned, setTurned] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    if (!section || !stage) return

    let lastOut: boolean | null = null
    const apply = (p: number) => {
      const f = invitationFrame(p)
      const s = stage.style
      s.setProperty("--scene-scale", String(f.sceneScale))
      s.setProperty("--scene-shift", String(f.sceneShift))
      s.setProperty("--flap", `${f.flap}deg`)
      s.setProperty("--flap-z", f.flap > 90 ? "1" : "4")
      s.setProperty("--env-y", String(f.envelopeY))
      s.setProperty("--env-opacity", String(f.envelopeOpacity))
      s.setProperty("--card-y", String(f.cardY))
      s.setProperty("--card-rotate", `${f.cardRotate}deg`)
      s.setProperty("--card-scale", String(f.cardScale))
      s.setProperty("--card-z", f.cardOut ? "5" : "2")
      s.setProperty("--flip", `${f.flip}deg`)
      s.setProperty("--hint-opacity", String(f.hintOpacity))
      if (f.cardOut !== lastOut) {
        lastOut = f.cardOut
        setOut(f.cardOut)
      }
    }

    // Reduced motion: no pinning (see CSS) — show the card already out of the envelope
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(PHASE.settle[1])
      return
    }

    // The stage is only as tall as its content; pin it centred in the space
    // the fixed menu leaves free, and play the scene while it's pinned
    let stickTop = 0
    const measure = () => {
      const css = getComputedStyle(stage)
      const insetTop = parseFloat(css.getPropertyValue("--stage-inset-top")) || 0
      const insetBottom = parseFloat(css.getPropertyValue("--stage-inset-bottom")) || 0
      const free = window.innerHeight - insetTop - insetBottom
      stickTop = Math.round(Math.max(0, insetTop + (free - stage.offsetHeight) / 2))
      stage.style.top = `${stickTop}px`
    }

    let raf = 0
    const update = () => {
      raf = 0
      const rect = section.getBoundingClientRect()
      const travel = rect.height - stage.offsetHeight
      apply(travel > 0 ? (stickTop - rect.top) / travel : 0)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const onResize = () => {
      measure()
      schedule()
    }

    // Only listen to scroll while the section is on (or near) screen
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.addEventListener("scroll", schedule, { passive: true })
          window.addEventListener("resize", onResize, { passive: true })
          schedule()
        } else {
          window.removeEventListener("scroll", schedule)
          window.removeEventListener("resize", onResize)
        }
      },
      { rootMargin: "50% 0px" },
    )
    io.observe(section)
    const ro = new ResizeObserver(onResize)
    ro.observe(stage)
    measure()
    update()

    return () => {
      io.disconnect()
      ro.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Desktop: the card leans toward the cursor like paper held in the hand
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !out) return
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return

    let raf = 0
    let x = 0
    let y = 0
    const onMove = (e: PointerEvent) => {
      x = (e.clientX / window.innerWidth) * 2 - 1
      y = (e.clientY / window.innerHeight) * 2 - 1
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0
          stage.style.setProperty("--tilt-x", `${(-y * 6).toFixed(2)}deg`)
          stage.style.setProperty("--tilt-y", `${(x * 6).toFixed(2)}deg`)
        })
    }
    const onLeave = () => {
      stage.style.setProperty("--tilt-x", "0deg")
      stage.style.setProperty("--tilt-y", "0deg")
    }
    stage.addEventListener("pointermove", onMove)
    stage.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      stage.removeEventListener("pointermove", onMove)
      stage.removeEventListener("pointerleave", onLeave)
      onLeave()
    }
  }, [out])

  const flip = () => {
    if (out) setTurned((t) => !t)
  }

  return (
    <section ref={sectionRef} id="invitation" className="invitation" aria-labelledby="invitation-title">
      <div ref={stageRef} className="inv-stage">
        <header className="inv-head text-center">
          <p
            className="font-[family-name:var(--font-label)] text-[13px] md:text-[15px] tracking-[0.35em] uppercase"
            style={{ color: "var(--c-sage)" }}
          >
            The Invitation
          </p>
          <h2
            id="invitation-title"
            className="mt-2 font-[family-name:var(--font-display)] font-light italic"
            style={{ fontSize: "clamp(24px, 6.4vw, 38px)", lineHeight: 1.2 }}
          >
            {/* One sentence per line; the first may wrap (balanced) on phones */}
            <span className="block text-balance">10 years of us, and I still choose you.</span>{" "}
            <span className="block" style={{ color: "var(--c-blush-deep)" }}>
              Let’s say ‘I do’.
            </span>
          </h2>
        </header>

        <div className="inv-scene">
          {/* Envelope — inside panel, flap and pocket are separate layers so the
              card can slide between the panel and the pocket */}
          <div aria-hidden className="inv-env inv-env-back" />
          <div aria-hidden className="inv-env inv-flap">
            <svg className="inv-flap-face inv-flap-outer" viewBox="0 0 100 85" preserveAspectRatio="none">
              <defs>
                <linearGradient id="inv-flap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#F6F1D3" />
                  <stop offset="1" stopColor="#EDE5BA" />
                </linearGradient>
              </defs>
              <polygon points="0,0 100,0 50,85" fill="url(#inv-flap)" stroke="#D2C68F" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="inv-flap-face inv-flap-inner">
              <div className="inv-flap-liner" />
            </div>
          </div>
          <svg aria-hidden className="inv-env inv-pocket" viewBox="0 0 150 106" preserveAspectRatio="none">
            <defs>
              <linearGradient id="inv-side" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#F6F1D0" />
                <stop offset="1" stopColor="#ECE5BB" />
              </linearGradient>
              <linearGradient id="inv-bottom" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#F7F2D4" />
                <stop offset="1" stopColor="#EFE8C2" />
              </linearGradient>
            </defs>
            <polygon points="0,0 75,60 0,106" fill="url(#inv-side)" />
            <polygon points="0,0 75,60 0,106" fill="url(#inv-side)" transform="matrix(-1 0 0 1 150 0)" />
            <polygon points="0,106 75,52 150,106" fill="url(#inv-bottom)" />
            <path d="M0,106 L75,52 L150,106" fill="none" stroke="#D2C68F" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Card */}
          <div className="inv-card" onClick={flip}>
            <div className="inv-tilt">
              <div className="inv-turn inv-turn-scroll">
                <div className="inv-turn inv-turn-manual" data-turned={turned}>
                  <div className="inv-face">
                    <Image src={cardFront} alt={FRONT_ALT} sizes={CARD_SIZES} className="h-full w-full" />
                  </div>
                  <div className="inv-face inv-face-back">
                    <Image src={cardBack} alt={BACK_ALT} sizes={CARD_SIZES} className="h-full w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="inv-foot">
          <p
            className="inv-hint font-[family-name:var(--font-thai)] text-[15px] md:text-base"
            style={{ color: "var(--c-muted)" }}
          >
            เลื่อนลงเพื่อเปิดซอง
            <svg aria-hidden width="12" height="14" viewBox="0 0 12 14" fill="none" className="ml-2 inline-block">
              <path d="M6 1v11m0 0L1.5 7.5M6 12l4.5-4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
          <button
            type="button"
            onClick={flip}
            disabled={!out}
            aria-pressed={turned}
            className="inv-flip-btn btn-secondary"
          >
            <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 5.5A5 5 0 0 1 11.5 4M12 8.5A5 5 0 0 1 2.5 10M11.5 1.5V4H9M2.5 12.5V10H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            พลิกการ์ด
          </button>
        </div>
      </div>
      <div aria-hidden className="inv-runway" />
    </section>
  )
}
