import Image, { getImageProps } from "next/image"
import { Countdown } from "@/components/countdown"
import { RSVPForm } from "@/components/rsvp-form"
import { NavMenu } from "@/components/nav-menu"
import { GuestbookForm } from "@/components/guestbook-form"
import { GuestbookWall } from "@/components/guestbook-wall"
import { ScheduleTimeline } from "@/components/schedule-timeline"
import { PreweddingGallery } from "@/components/prewedding-gallery"
import { SaveQrButton } from "@/components/save-qr-button"
import { HeroVideo } from "@/components/hero-video"
import { getRandomGuestbookEntries } from "@/app/actions/guestbook"
import { getPreweddingPhotos } from "@/app/actions/prewedding"

/* ── Shared ornament components ────────────────── */

function Diamond() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="shrink-0"
      style={{ color: "var(--c-blush)" }}
    >
      <path
        d="M7 1L13 7L7 13L1 7Z"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M7 4L10 7L7 10L4 7Z"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
      />
    </svg>
  )
}

function Divider({ color = "var(--c-blush)" }: { color?: string }) {
  return (
    <div className="flex items-center gap-4 py-2" style={{ color }}>
      <div className="flex-1" style={{ height: 1, background: color, opacity: 0.4 }} />
      <Diamond />
      <div className="flex-1" style={{ height: 1, background: color, opacity: 0.4 }} />
    </div>
  )
}

function SectionLabel({
  children,
  color = "var(--c-sage)",
}: {
  children: React.ReactNode
  color?: string
}) {
  return (
    <p
      className="font-[family-name:var(--font-label)] text-[13px] md:text-[15px] tracking-[0.35em] uppercase"
      style={{ color }}
    >
      {children}
    </p>
  )
}

/* ─── Botanical SVG accent (top of page) ─────── */
function FloralAccent({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M60 70 C60 70 40 55 30 40 C20 25 25 10 35 15 C42 18 45 30 45 30 C45 30 38 20 42 14 C46 8 56 10 58 20 C59 25 58 35 58 35"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M60 70 C60 70 80 55 90 40 C100 25 95 10 85 15 C78 18 75 30 75 30 C75 30 82 20 78 14 C74 8 64 10 62 20 C61 25 62 35 62 35"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M60 72 L60 20"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.25"
      />
      <ellipse cx="40" cy="28" rx="6" ry="10" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.2" transform="rotate(-30 40 28)" />
      <ellipse cx="80" cy="28" rx="6" ry="10" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.2" transform="rotate(30 80 28)" />
      <ellipse cx="55" cy="18" rx="5" ry="8" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.2" transform="rotate(-10 55 18)" />
      <ellipse cx="65" cy="18" rx="5" ry="8" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.2" transform="rotate(10 65 18)" />
    </svg>
  )
}

/* ─── Hero logo — white over the reel on mobile, ink on desktop ─── */
/** Art-directed with <picture> so each device downloads only its own colour,
    instead of recolouring one PNG with CSS filters */
function HeroLogo() {
  const common = { alt: "Thanwa & Jittinan", width: 960, height: 460, priority: true }
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, src: "/wedding-logo-transparent.png" })
  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({ ...common, src: "/wedding-logo-white.png" })
  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={desktop} />
      <img
        {...rest}
        srcSet={mobile}
        alt={common.alt}
        className="h-auto w-full max-w-[46vw] lg:max-w-[440px]"
      />
    </picture>
  )
}

/* ─── Dress code palette ─────────────────────── */
const DRESS_PALETTE = [
  { hex: "#D4A5A8", name: "Dusty Rose" },
  { hex: "#D8955A", name: "Apricot" },
  { hex: "#B2AECB", name: "Lavender" },
  { hex: "#A0965E", name: "Olive" },
  { hex: "#A86B45", name: "Cinnamon" },
]

/** Colours each character with the next palette colour. Splits on grapheme
    clusters so Thai vowels and tone marks stay attached to their consonant. */
function PaletteText({ text }: { text: string }) {
  const graphemes = Array.from(
    new Intl.Segmenter("th", { granularity: "grapheme" }).segment(text),
    (s) => s.segment,
  )
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {graphemes.map((g, i) => (
          <span key={i} style={{ color: DRESS_PALETTE[i % DRESS_PALETTE.length].hex }}>
            {g}
          </span>
        ))}
      </span>
    </>
  )
}

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */

export default async function Page() {
  const [guestbookEntries, preweddingPhotos] = await Promise.all([
    getRandomGuestbookEntries(5),
    getPreweddingPhotos(),
  ])
  return (
    <main
      className="landing-sections"
      style={{
        background: "var(--c-ivory)",
        color: "var(--c-ink)",
        overflowX: "hidden",
      }}
    >
      <NavMenu hiddenIds={preweddingPhotos.length === 0 ? ["prewedding"] : []} />
      {/* ══════════════════════════════
          SECTION 1 — HERO
          ══════════════════════════════ */}
      <section
        id="hero"
        className="relative overflow-hidden lg:grid lg:min-h-svh lg:grid-cols-[auto_minmax(0,540px)] lg:grid-rows-[1fr_auto_auto_1fr] lg:items-center lg:justify-center lg:gap-x-20 lg:px-12 lg:pt-24 lg:pb-16"
      >
        {/* Desktop ambient backdrop — blurred still of the reel washed into ivory.
            blur-3xl hides the detail, so a small variant is plenty */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
          <Image
            src="/hero-poster.jpg"
            alt=""
            fill
            sizes="320px"
            className="scale-110 object-cover opacity-45 blur-3xl"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, transparent 0%, color-mix(in srgb, var(--c-ivory) 70%, transparent) 55%, var(--c-ivory) 100%)",
            }}
          />
        </div>

        {/* Grain texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
            backgroundSize: "256px 256px",
          }}
        />

        {/* Reel — full-bleed on mobile, framed 9:16 card on desktop */}
        <div className="relative h-svh w-full lg:row-span-4 lg:h-[min(80svh,880px)] lg:w-auto lg:aspect-[9/16]">
          {/* Offset decorative border (desktop) */}
          <div
            aria-hidden
            className="absolute inset-0 hidden lg:block"
            style={{
              border: "1px solid var(--c-blush)",
              transform: "translate(14px, 14px)",
              opacity: 0.7,
            }}
          />
          {/* clip-path forces iOS Safari to clip the composited video, which overflow alone doesn't */}
          <div className="relative h-full w-full overflow-hidden [clip-path:inset(0)] lg:shadow-[0_30px_60px_-24px_rgba(72,84,64,0.45)]">
            <HeroVideo
              className="object-cover"
              buttonClassName="absolute right-4 bottom-[27svh] z-10 lg:bottom-4"
            />
            {/* Mobile scrims: darken the sky behind the logo, fade the foot into the page */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[50%] lg:hidden"
              style={{ background: "linear-gradient(to bottom, rgba(28,42,24,0.58) 0%, rgba(28,42,24,0.24) 55%, transparent 100%)" }}
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[40%] lg:hidden"
              style={{ background: "linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--c-ivory) 75%, transparent) 62%, var(--c-ivory) 100%)" }}
            />
          </div>
        </div>

        {/* Names — wedding logo (white over the reel on mobile, ink and centred beside it on desktop) */}
        <h1 className="hero-2 absolute inset-x-0 top-[max(5svh,32px)] z-20 flex justify-center px-6 lg:static lg:col-start-2 lg:row-start-2 lg:px-0">
          <span className="sr-only">Meena &amp; Thanwa</span>
          {/* Soft shade behind the white logo — a gradient, not a CSS filter: iOS Safari
              drew the old brightness/invert/drop-shadow stack as a visible rectangle */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[95%] -translate-x-1/2 -translate-y-1/2 lg:hidden"
            style={{ background: "radial-gradient(closest-side, rgba(28,42,24,0.3), transparent)" }}
          />
          <span className="logo-anim">
            <HeroLogo />
          </span>
        </h1>

        <div className="relative z-20 -mt-[22svh] flex flex-col items-center px-6 pb-16 text-center lg:col-start-2 lg:row-start-3 lg:mt-0 lg:px-0 lg:pb-0">
          {/* Date + hashtag */}
          <div className="hero-4 space-y-3 lg:mt-10">
            {/* Same face and size as the countdown digits */}
            <p
              className="whitespace-nowrap font-[family-name:var(--font-display)] font-light leading-none tracking-[0.04em] lining-nums"
              style={{ color: "var(--c-ink)", fontSize: "clamp(44px, 13vw, 72px)" }}
            >
              26<span className="mx-[0.18em]" style={{ color: "var(--c-blush-deep)", opacity: 0.6 }}>&middot;</span>12<span className="mx-[0.18em]" style={{ color: "var(--c-blush-deep)", opacity: 0.6 }}>&middot;</span>2026
            </p>
            <p
              className="font-[family-name:var(--font-label)] text-[14px] md:text-[17px] tracking-[0.3em]"
              style={{ color: "var(--c-muted)" }}
            >
              #frommeenatothanwaforever
            </p>
          </div>

          {/* Countdown */}
          <div className="hero-5 mt-10">
            <Countdown />
          </div>

          {/* RSVP button */}
          <div className="hero-5 mt-10">
            <a
              href="#rsvp"
              className="inline-flex items-center rounded-full px-10 py-3.5 font-[family-name:var(--font-thai)] text-[17px] md:text-lg tracking-[0.06em] text-white bg-[linear-gradient(135deg,var(--c-blush)_0%,var(--c-blush-deep)_100%)] shadow-[0_8px_22px_-10px_rgba(184,132,126,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[0.96] hover:shadow-[0_12px_26px_-10px_rgba(184,132,126,0.7)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--c-sage)]"
            >
              ตอบรับคำเชิญ
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          SECTION 2 — OUR STORY
          ══════════════════════════════ */}
      <section
        id="story"
        className="px-8 py-20 text-center"
      >
        <div className="mx-auto max-w-lg md:max-w-2xl">
          <Divider />

          <div className="mt-12 reveal">
            <SectionLabel>Our Story</SectionLabel>

            <h2
              className="font-[family-name:var(--font-display)] font-light italic mt-4 leading-snug"
              style={{ fontSize: "clamp(36px, 10vw, 60px)", color: "var(--c-ink)" }}
            >
              Coding guy,
              <br />
              lifesaving girl
            </h2>

            <p
              className="font-[family-name:var(--font-display)] text-2xl md:text-3xl italic mt-5"
              style={{ color: "var(--c-blush-deep)" }}
            >
              Started on Tinder, growing ever after
            </p>

            <div className="mt-6 space-y-1">
              <p
                className="font-[family-name:var(--font-thai)] text-base md:text-lg"
                style={{ color: "var(--c-ink-2)" }}
              >
                เขาเขียนโค้ด เธอรักษาคนเจ็บไข้
              </p>
              <p
                className="font-[family-name:var(--font-thai)] text-base md:text-lg"
                style={{ color: "var(--c-muted)" }}
              >
                เริ่มต้นจากแอพไฟ และเติบโตไปด้วยกัน
              </p>
            </div>

            <div className="mt-10">
              <Divider />
            </div>
          </div>

          <div className="mt-10 space-y-6 text-left reveal">
            {[
              "เขาเป็นโปรแกรมเมอร์ผู้หมกมุ่นอยู่กับ code วันๆ มีแต่งานกับการออกกำลังกาย ชีวิตเรียบง่ายแต่เต็มไปด้วยตรรกะและระบบ",
              "เธอเป็นพยาบาลห้องฉุกเฉิน คอยดูแลชีวิตผู้คนมากมาย ชีวิตก็มีแค่ ER กับหอพักพยาบาล ทุกวันคือการต่อสู้กับเวลาและความไม่แน่นอน",
              "สองคนที่โลกต่างกันโดยสิ้นเชิง — แต่จักรวาลก็มีวิธีของมันเอง",
              "ในวันที่แอพหาคู่จับพวกเขามาพบกัน ไม่มีใครรู้ว่าการ swipe ครั้งนั้นจะเปลี่ยนชีวิตทั้งสองไปตลอดกาล บทสนทนาแรกๆ ที่เริ่มจากความอยากรู้จัก ค่อยๆ กลายเป็นนัดแรก นัดที่สอง และวันที่ไม่อยากนับอีกต่อไป",
              "เขาเรียนรู้ที่จะหยุดพักจากหน้าจอ เธอเรียนรู้ที่จะพักผ่อนจากความเครียด และทั้งคู่เรียนรู้ที่จะเติมเต็มกันและกัน — เขาเป็นระบบ เธอเป็นความอบอุ่น เขาวางแผน เธอรับมือกับทุกสถานการณ์",
              "วันนี้พวกเขาพร้อมก้าวเข้าสู่บทใหม่ของชีวิตด้วยกัน และขอเชิญทุกคนที่พวกเขารักมาเป็นสักขีพยานในวันพิเศษนี้ เพื่อสร้างความทรงจำบทใหม่ร่วมกันตลอดไป",
            ].map((text, i) => (
              <p
                key={i}
                className="font-[family-name:var(--font-thai)] text-[17px] md:text-[20px] leading-[1.85]"
                style={{ color: "var(--c-ink)" }}
              >
                {text}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          SECTION 3 — PRE-WEDDING GALLERY
          (hidden until admins upload photos)
          ══════════════════════════════ */}
      {preweddingPhotos.length > 0 && (
        <section
          id="prewedding"
          className="px-4 md:px-6 py-20"
        >
          <div className="mx-auto max-w-sm md:max-w-4xl">
            <div className="reveal mb-14 text-center">
              <h2
                className="font-[family-name:var(--font-display)] font-light italic"
                style={{ fontSize: "clamp(36px, 10vw, 60px)" }}
              >
                Our Gallery
              </h2>
            </div>

            <PreweddingGallery photos={preweddingPhotos} />
          </div>
        </section>
      )}

      {/* ══════════════════════════════
          SECTION 4 — EVENT DETAILS
          ══════════════════════════════ */}
      <section
        id="details"
        className="px-6 py-20"
      >
        <div className="mx-auto max-w-sm md:max-w-xl">
          {/* Header */}
          <div className="reveal mb-12 text-center">
            <SectionLabel>The Celebration</SectionLabel>
            <h2
              className="font-[family-name:var(--font-display)] font-light italic mt-3 mb-6"
              style={{ fontSize: "clamp(36px, 10vw, 60px)" }}
            >
              Event Details
            </h2>

            {/* Date */}
            <div className="mb-9">
              <p
                className="font-[family-name:var(--font-display)] text-3xl md:text-4xl"
                style={{ color: "var(--c-ink)" }}
              >
                Saturday, 26 December 2026
              </p>
              <p
                className="font-[family-name:var(--font-thai)] text-base md:text-lg mt-1"
                style={{ color: "var(--c-muted)" }}
              >
                วันเสาร์ที่ 26 ธันวาคม 2569
              </p>
            </div>

            {/* Venue */}
            <div className="mb-6">
              <p
                className="font-[family-name:var(--font-label)] text-[12px] md:text-[14px] tracking-[0.45em] uppercase mb-2"
                style={{ color: "var(--c-sage)" }}
              >
                Venue
              </p>
              <p
                className="font-[family-name:var(--font-display)] text-3xl md:text-4xl"
                style={{ color: "var(--c-ink)" }}
              >
                THE COP Seminar &amp; Resort
              </p>
              <p
                className="font-[family-name:var(--font-label)] text-[13px] md:text-[15px] tracking-[0.35em] mt-1 mb-6"
                style={{ color: "var(--c-muted)" }}
              >
                PATTAYA
              </p>
              <a
                href="https://maps.app.goo.gl/WysXSoYYKXm98CcD8"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2 transition-opacity hover:opacity-70"
                style={{
                  border: "1px solid var(--c-sage)",
                  color: "var(--c-sage)",
                  fontFamily: "var(--font-label)",
                  fontSize: 13,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                <svg
                  width="9"
                  height="11"
                  viewBox="0 0 9 11"
                  fill="none"
                >
                  <path
                    d="M4.5 0C2.57 0 1 1.57 1 3.5C1 6.12 4.5 11 4.5 11C4.5 11 8 6.12 8 3.5C8 1.57 6.43 0 4.5 0ZM4.5 4.75C3.81 4.75 3.25 4.19 3.25 3.5C3.25 2.81 3.81 2.25 4.5 2.25C5.19 2.25 5.75 2.81 5.75 3.5C5.75 4.19 5.19 4.75 4.5 4.75Z"
                    fill="currentColor"
                  />
                </svg>
                View on Maps
              </a>
            </div>

            <Divider />
          </div>

          {/* Schedule timeline */}
          <ScheduleTimeline />

          {/* Dress code */}
          <div
            id="dress"
            className="reveal mt-20 md:mt-24 rounded-[28px] px-6 pt-12 pb-11 md:px-12 text-center"
            style={{
              background: "var(--c-ivory)",
              border: "1px solid color-mix(in srgb, var(--c-blush) 55%, transparent)",
              boxShadow: "0 18px 40px -28px rgba(184,132,126,0.45)",
            }}
          >
            <SectionLabel>Dress Code</SectionLabel>

            <h2
              className="font-[family-name:var(--font-display)] font-light italic mt-3"
              style={{ fontSize: "clamp(36px, 10vw, 56px)", lineHeight: 1.1 }}
            >
              Garden Whimsical
            </h2>
            <p
              className="font-[family-name:var(--font-script)] -mt-1"
              style={{
                fontSize: 48,
                color: "var(--c-blush-deep)",
                lineHeight: 1.3,
              }}
            >
              Pastel
            </p>
            <p
              className="font-[family-name:var(--font-script-thai)] text-[26px] md:text-[30px] mt-1 mb-9"
            >
              <PaletteText text="สีสันสดใสในสวน" />
            </p>

            {/* Colour swatches — fixed-width columns so labels never shift spacing */}
            <ul className="mx-auto mb-10 grid w-fit grid-cols-5 gap-x-1.5 md:gap-x-4">
              {DRESS_PALETTE.map((s) => (
                <li key={s.hex} className="flex w-14 md:w-16 flex-col items-center gap-2.5">
                  <span
                    aria-hidden
                    className="block h-10 w-10 md:h-11 md:w-11 rounded-full"
                    style={{
                      background: s.hex,
                      boxShadow: `0 0 0 3px var(--c-ivory), 0 0 0 4px color-mix(in srgb, ${s.hex} 45%, transparent), 0 6px 14px -6px ${s.hex}`,
                    }}
                  />
                  <span
                    className="font-[family-name:var(--font-label)] text-[11px] md:text-[12px] leading-tight tracking-[0.06em]"
                    style={{ color: "var(--c-muted)" }}
                  >
                    {s.name}
                  </span>
                </li>
              ))}
            </ul>

            <Divider />

            {/* Thai has no spaces between words, so each phrase is kept whole
                and lines only break between phrases */}
            <p
              className="mt-7 font-[family-name:var(--font-thai)] text-base md:text-lg leading-relaxed"
              style={{ color: "var(--c-ink-2)" }}
            >
              <span className="inline-block">เป็นงานแต่งงานในสวน</span>{" "}
              <span className="inline-block">ใต้ต้นไม้ใหญ่</span>{" "}
              <span className="inline-block">แต่งตัวตามสบาย</span>
            </p>
            <p
              className="mt-2 font-[family-name:var(--font-thai)] text-[15px] md:text-base leading-relaxed"
              style={{ color: "var(--c-muted)" }}
            >
              <span className="inline-block">อาจมียุง</span>{" "}
              <span className="inline-block">และลมเย็นจากทะเล</span>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          SECTION 5 — RSVP
          ══════════════════════════════ */}
      <section
        id="rsvp"
        className="px-6 py-20"
      >
        <div className="mx-auto max-w-sm md:max-w-xl">
          <div className="reveal mb-10 text-center">
            <SectionLabel>Kindly Reply</SectionLabel>
            <h2
              className="font-[family-name:var(--font-display)] font-light italic mt-3 mb-5"
              style={{ fontSize: "clamp(36px, 10vw, 60px)" }}
            >
              RSVP
            </h2>
            <p
              className="font-[family-name:var(--font-thai)] text-base md:text-lg leading-relaxed"
              style={{ color: "var(--c-ink-2)" }}
            >
              เพื่อให้เราสามารถเตรียมการต้อนรับท่านได้อย่างดีที่สุด
              <br />
              โปรดแจ้งความประสงค์ในการเข้าร่วมงาน
            </p>
            <p
              className="font-[family-name:var(--font-thai)] text-sm md:text-base tracking-wide mt-3"
              style={{ color: "var(--c-blush-deep)" }}
            >
              ภายในวันที่ 12 ธันวาคม 2026
            </p>
          </div>

          <RSVPForm />
        </div>
      </section>

      {/* ══════════════════════════════
          SECTION 6 — GUESTBOOK
          ══════════════════════════════ */}
      <section
        id="guestbook"
        className="px-6 py-20"
      >
        <div className="mx-auto max-w-sm md:max-w-xl">
          <div className="reveal mb-10 text-center">
            <SectionLabel>Guestbook</SectionLabel>
            <h2
              className="font-[family-name:var(--font-display)] font-light italic mt-3 mb-5"
              style={{ fontSize: "clamp(36px, 10vw, 60px)" }}
            >
              ข้อความถึงบ่าวสาว
            </h2>
            <p
              className="font-[family-name:var(--font-thai)] text-base md:text-lg leading-relaxed"
              style={{ color: "var(--c-ink-2)" }}
            >
              ฝากคำอวยพรให้กับคู่บ่าวสาว
            </p>
          </div>

          <div className="reveal mb-12">
            <GuestbookForm />
          </div>

          <div className="reveal">
            <GuestbookWall entries={guestbookEntries} />
          </div>

          {/* Digital gift envelope — PromptPay QR. The page shows only the
              code; "save" hands over the full bank slip so banking apps can
              read it from the photo library (guests can't scan their own screen). */}
          <div
            className="reveal mt-20 rounded-[28px] px-6 pt-12 pb-11 md:px-12 text-center"
            style={{
              background: "var(--c-ivory)",
              border: "1px solid color-mix(in srgb, var(--c-blush) 55%, transparent)",
              boxShadow: "0 18px 40px -28px rgba(184,132,126,0.45)",
            }}
          >
            <SectionLabel>Wedding Gift</SectionLabel>
            <h3
              className="font-[family-name:var(--font-display)] font-light italic mt-3"
              style={{ fontSize: "clamp(30px, 8vw, 44px)", lineHeight: 1.2 }}
            >
              กล่องใส่ซองดิจิทัล
            </h3>

            <div
              className="mx-auto mt-8 w-full max-w-[220px] md:max-w-[240px] rounded-2xl bg-white p-3"
              style={{ boxShadow: "0 0 0 1px color-mix(in srgb, var(--c-blush) 60%, transparent), 0 10px 24px -16px rgba(184,132,126,0.6)" }}
            >
              <Image
                src="/promptpay-qr-code.jpg"
                alt="PromptPay QR code สำหรับโอนเงินให้บ่าวสาว"
                width={455}
                height={455}
                unoptimized
                className="h-auto w-full"
              />
            </div>

            <p
              className="font-[family-name:var(--font-label)] text-[11px] md:text-[12px] tracking-[0.35em] uppercase mt-5"
              style={{ color: "var(--c-sage)" }}
            >
              PromptPay
            </p>
            <p
              className="font-[family-name:var(--font-thai)] text-base md:text-lg mt-1"
              style={{ color: "var(--c-ink)" }}
            >
              <span className="inline-block">ธันวา พัวมณี</span>{" "}
              <span className="inline-block">&amp; จิตตินันทน์ พรหมลิ</span>
            </p>

            <SaveQrButton
              src="/promptpay-qr.jpg"
              filename="thanwa-meena-promptpay.jpg"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-[family-name:var(--font-thai)] text-[15px] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--c-sage)_10%,transparent)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--c-sage)]"
              style={{ border: "1px solid var(--c-sage)", color: "var(--c-sage)" }}
            >
              <svg width="12" height="13" viewBox="0 0 12 13" fill="none" aria-hidden>
                <path d="M6 1v8m0 0L2.5 5.5M6 9l3.5-3.5M1 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              บันทึก QR
            </SaveQrButton>
            <p
              className="font-[family-name:var(--font-thai)] text-[13px] md:text-sm leading-relaxed mt-3"
              style={{ color: "var(--c-muted)" }}
            >
              <span className="inline-block">บันทึกรูปแล้วเปิดจากเมนูสแกน</span>{" "}
              <span className="inline-block">ในแอปธนาคาร</span>
            </p>

            <div className="mt-9">
              <Divider />
            </div>
            <p
              className="font-[family-name:var(--font-thai)] text-base md:text-lg leading-relaxed mt-6"
              style={{ color: "var(--c-ink-2)" }}
            >
              <span className="inline-block">ขอบคุณสำหรับทุกความรัก</span>
              <span className="inline-block">และคำอวยพร ✨</span>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER
          ══════════════════════════════ */}
      <footer
        className="px-6 py-14 text-center"
        style={{ background: "var(--c-ink)" }}
      >
        <div
          className="float-anim pointer-events-none mb-5 inline-block"
          style={{ color: "var(--c-blush)", opacity: 0.4, width: 70 }}
        >
          <FloralAccent />
        </div>

        <p
          className="font-[family-name:var(--font-script)]"
          style={{ fontSize: 46, color: "var(--c-blush)", lineHeight: 1.1 }}
        >
          Meena &amp; Thanwa
        </p>

        <div className="mt-4 space-y-1.5">
          <p
            className="font-[family-name:var(--font-label)] text-[13px] md:text-[15px] tracking-[0.45em]"
            style={{ color: "var(--c-ivory)", opacity: 0.45 }}
          >
            26 &middot; 12 &middot; 2026
          </p>
          <p
            className="font-[family-name:var(--font-label)] text-[12px] md:text-[13px] tracking-[0.3em]"
            style={{ color: "var(--c-ivory)", opacity: 0.25 }}
          >
            #FROMMEENATOTHANWAFOREVER
          </p>
        </div>

        <div className="mt-8">
          <Divider color="rgba(250,247,240,0.12)" />
        </div>

        <p
          className="font-[family-name:var(--font-label)] text-[12px] md:text-[13px] tracking-wider mt-6"
          style={{ color: "var(--c-ivory)", opacity: 0.2 }}
        >
          THE COP SEMINAR &amp; RESORT · PATTAYA
        </p>
      </footer>
    </main>
  )
}
