import Image from "next/image"
import { Countdown } from "@/components/countdown"
import { RSVPForm } from "@/components/rsvp-form"
import { NavMenu } from "@/components/nav-menu"
import { GuestbookForm } from "@/components/guestbook-form"
import { GuestbookWall } from "@/components/guestbook-wall"
import { ScheduleTimeline } from "@/components/schedule-timeline"
import { PreweddingGallery } from "@/components/prewedding-gallery"
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
        className="relative flex min-h-svh flex-col items-center justify-center px-6 pb-16 pt-20 text-center"
      >
        {/* Grain texture overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
            backgroundSize: "256px 256px",
          }}
        />

        {/* Names — wedding logo */}
        <h1 className="hero-2 relative z-10 flex justify-center">
          <span className="sr-only">Meena &amp; Thanwa</span>
          <span className="logo-anim">
            <Image
              src="/wedding-logo-transparent.png"
              alt="Thanwa & Jittinan"
              width={960}
              height={460}
              priority
              className="h-auto w-full max-w-[72vw] md:max-w-[min(40vw,480px)]"
            />
          </span>
        </h1>

        {/* Hero image in decorative frame */}
        <div className="hero-3 relative mt-10 w-full max-w-[260px] md:max-w-[320px]">
          {/* Offset decorative border */}
          <div
            className="absolute inset-0 z-0"
            style={{
              border: "1px solid var(--c-blush)",
              transform: "translate(10px, 10px)",
              opacity: 0.6,
            }}
          />
          <div
            className="relative z-10 w-full overflow-hidden"
            style={{ aspectRatio: "3 / 4" }}
          >
            <Image
              src="/landing.png"
              alt="Meena & Thanwa"
              fill
              priority
              sizes="(min-width: 768px) 320px, 260px"
              className="object-contain"
            />
          </div>
        </div>

        {/* Date + hashtag */}
        <div className="hero-4 mt-10 space-y-2.5">
          <p
            className="font-[family-name:var(--font-label)] text-base md:text-xl tracking-[0.5em] uppercase"
            style={{ color: "var(--c-ink-2)" }}
          >
            26 &middot; 12 &middot; 2026
          </p>
          <p
            className="font-[family-name:var(--font-label)] text-[12px] md:text-[14px] tracking-[0.3em]"
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
            <div className="mb-5">
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
                className="font-[family-name:var(--font-label)] text-[13px] md:text-[15px] tracking-[0.35em] mb-4"
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
              className="font-[family-name:var(--font-label)] text-[12px] md:text-[14px] tracking-[0.3em] mt-3"
              style={{ color: "var(--c-blush-deep)" }}
            >
              BEFORE 12 DECEMBER 2026
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
              ฝากคำอวยพรและความประทับใจให้กับคู่บ่าวสาว
            </p>
          </div>

          <div className="reveal mb-12">
            <GuestbookForm />
          </div>

          <div className="reveal">
            <GuestbookWall entries={guestbookEntries} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          SECTION 7 — DRESS CODE
          ══════════════════════════════ */}
      <section
        id="dress"
        className="px-6 py-20 text-center"
      >
        <div className="mx-auto max-w-sm md:max-w-xl reveal">
          <SectionLabel>Dress Code</SectionLabel>

          <h2
            className="font-[family-name:var(--font-display)] font-light italic mt-3"
            style={{ fontSize: "clamp(36px, 10vw, 60px)" }}
          >
            Garden Whimsical
          </h2>
          <p
            className="font-[family-name:var(--font-script)] mt-1 mb-10"
            style={{
              fontSize: 48,
              color: "var(--c-blush-deep)",
              lineHeight: 1.3,
            }}
          >
            Pastel
          </p>

          {/* Colour swatches */}
          <div className="flex justify-center gap-5 mb-10">
            {[
              { hex: "#D4A5A8", name: "Dusty\nRose" },
              { hex: "#D8955A", name: "Apricot" },
              { hex: "#B2AECB", name: "Lavender" },
              { hex: "#A0965E", name: "Olive" },
              { hex: "#A86B45", name: "Cinnamon" },
            ].map((s) => (
              <div key={s.hex} className="flex flex-col items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full"
                  style={{
                    background: s.hex,
                    border: `1.5px solid ${s.hex}`,
                    boxShadow: "0 2px 8px -2px rgba(28,42,24,0.1)",
                  }}
                />
                <span
                  className="font-[family-name:var(--font-label)] text-center leading-tight whitespace-pre-line"
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    color: "var(--c-muted)",
                    maxWidth: 40,
                  }}
                >
                  {s.name}
                </span>
              </div>
            ))}
          </div>

          <Divider />

          <div className="mt-8 space-y-3">
            <p
              className="font-[family-name:var(--font-thai)] text-base md:text-lg leading-relaxed"
              style={{ color: "var(--c-ink-2)" }}
            >
              แต่งกายให้เข้ากับบรรยากาศสวนที่ดูโรแมนติกและสดใส
            </p>
            <p
              className="font-[family-name:var(--font-thai)] text-base md:text-lg"
              style={{ color: "var(--c-muted)" }}
            >
              ขอสงวนสีขาวและสีดำล้วนไว้สำหรับบ่าวสาว
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
