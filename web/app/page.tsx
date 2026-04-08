import Image from "next/image"
import { Countdown } from "@/components/countdown"
import { RSVPForm } from "@/components/rsvp-form"

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
      className="font-[family-name:var(--font-josefin)] text-[13px] tracking-[0.35em] uppercase"
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

export default function Page() {
  return (
    <main
      style={{
        background: "var(--c-ivory)",
        color: "var(--c-ink)",
        overflowX: "hidden",
      }}
    >
      {/* ══════════════════════════════
          SECTION 1 — HERO
          ══════════════════════════════ */}
      <section
        className="relative flex min-h-svh flex-col items-center justify-center px-6 pb-16 pt-14 text-center"
        style={{ background: "var(--c-ivory)" }}
      >
        {/* Grain texture overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
            backgroundSize: "256px 256px",
          }}
        />

        {/* Floating botanical top */}
        <div
          className="hero-1 float-anim pointer-events-none absolute top-8 left-1/2 -translate-x-1/2"
          style={{ color: "var(--c-sage)", width: 100 }}
        >
          <FloralAccent />
        </div>

        {/* Save the Date label */}
        <div className="hero-1 mb-6">
          <SectionLabel color="var(--c-muted)">Save the Date</SectionLabel>
        </div>

        {/* Names — wedding logo */}
        <h1 className="hero-2 relative z-10 flex justify-center">
          <span className="sr-only">Meena &amp; Thanwa</span>
          <Image
            src="/wedding-logo-transparent.png"
            alt="Thanwa & Tittinan"
            width={960}
            height={460}
            priority
            className="h-auto w-full max-w-[min(92vw,720px)]"
          />
        </h1>

        {/* Hero image in decorative frame */}
        <div className="hero-3 relative mt-10 w-full max-w-[260px]">
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
              sizes="260px"
              className="object-contain"
            />
          </div>
        </div>

        {/* Date + hashtag */}
        <div className="hero-4 mt-10 space-y-2.5">
          <p
            className="font-[family-name:var(--font-josefin)] text-base tracking-[0.5em] uppercase"
            style={{ color: "var(--c-ink-2)" }}
          >
            26 &middot; 12 &middot; 2026
          </p>
          <p
            className="font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.3em]"
            style={{ color: "var(--c-muted)" }}
          >
            #frommeenatothanwaforever
          </p>
        </div>

        {/* Countdown */}
        <div className="hero-5 mt-10">
          <Countdown />
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll absolute bottom-8 left-1/2 -translate-x-1/2">
          <svg
            width="20"
            height="32"
            viewBox="0 0 20 32"
            fill="none"
            style={{ color: "var(--c-muted)", opacity: 0.5 }}
          >
            <rect
              x="1"
              y="1"
              width="18"
              height="30"
              rx="9"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <circle cx="10" cy="9" r="2.5" fill="currentColor" className="scroll-dot" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════
          SECTION 2 — OUR STORY
          ══════════════════════════════ */}
      <section
        className="px-6 py-20 text-center"
        style={{ background: "var(--c-ivory-dark)" }}
      >
        <div className="mx-auto max-w-sm">
          <Divider />

          <div className="mt-12 reveal">
            <SectionLabel>Our Story</SectionLabel>

            <h2
              className="font-[family-name:var(--font-cormorant)] font-light italic mt-4 leading-snug"
              style={{ fontSize: "clamp(36px, 10vw, 48px)", color: "var(--c-ink)" }}
            >
              Coding guy,
              <br />
              lifesaving girl
            </h2>

            <p
              className="font-[family-name:var(--font-cormorant)] text-2xl italic mt-5"
              style={{ color: "var(--c-blush-deep)" }}
            >
              Started on Tinder, growing ever after
            </p>

            <div className="mt-6 space-y-1">
              <p
                className="font-[family-name:var(--font-sarabun)] text-base"
                style={{ color: "var(--c-ink-2)" }}
              >
                เขาเขียนโค้ด เธอรักษาคนเจ็บไข้
              </p>
              <p
                className="font-[family-name:var(--font-sarabun)] text-base"
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
                className="font-[family-name:var(--font-sarabun)] text-[17px] leading-[1.85]"
                style={{ color: "var(--c-ink)" }}
              >
                {text}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          SECTION 3 — THE COUPLE
          ══════════════════════════════ */}
      <section
        className="px-6 py-20"
        style={{ background: "var(--c-ivory)" }}
      >
        <div className="mx-auto max-w-sm">
          <div className="reveal mb-14 text-center">
            <SectionLabel>The Couple</SectionLabel>
            <h2
              className="font-[family-name:var(--font-cormorant)] font-light italic mt-3"
              style={{ fontSize: "clamp(36px, 10vw, 50px)" }}
            >
              He &amp; She
            </h2>
          </div>

          {/* Groom */}
          <div className="reveal mb-14">
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: "3 / 4" }}
            >
              <Image
                src="/thanwa.jpg"
                alt="Thanwa — The Groom"
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                className="object-cover object-top"
              />
            </div>
            <div className="mt-6 text-center">
              <p
                className="font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.5em] uppercase mb-2"
                style={{ color: "var(--c-sage)" }}
              >
                The Groom
              </p>
              <h3
                className="font-[family-name:var(--font-cormorant)] font-light mb-3"
                style={{ fontSize: 38 }}
              >
                Thanwa
              </h3>
              <p
                className="font-[family-name:var(--font-sarabun)] text-base leading-relaxed"
                style={{ color: "var(--c-ink-2)" }}
              >
                เขาเป็นโปรแกรมเมอร์ผู้หมกมุ่นอยู่กับ code
                <br />
                วันๆ มีแต่งานกับการออกกำลังกาย
              </p>
            </div>
          </div>

          <Divider />

          {/* Bride */}
          <div className="reveal mt-14">
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: "3 / 4" }}
            >
              <Image
                src="/meena.jpg"
                alt="Meena — The Bride"
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                className="object-cover object-top"
              />
            </div>
            <div className="mt-6 text-center">
              <p
                className="font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.5em] uppercase mb-2"
                style={{ color: "var(--c-blush-deep)" }}
              >
                The Bride
              </p>
              <h3
                className="font-[family-name:var(--font-cormorant)] font-light mb-3"
                style={{ fontSize: 38 }}
              >
                Meena
              </h3>
              <p
                className="font-[family-name:var(--font-sarabun)] text-base leading-relaxed"
                style={{ color: "var(--c-ink-2)" }}
              >
                เธอเป็นพยาบาลห้องฉุกเฉิน คอยดูแลชีวิตผู้คนมากมาย
                <br />
                ชีวิตก็มีแค่ ER กับหอพักพยาบาล
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          SECTION 4 — FIRST CONNECTION
          ══════════════════════════════ */}
      <section
        className="px-6 py-20 text-center"
        style={{ background: "var(--c-ivory-dark)" }}
      >
        <div className="mx-auto max-w-sm reveal">
          <SectionLabel>Where It All Began</SectionLabel>

          {/* Stylised Tinder match card */}
          <div className="relative mx-auto mt-10 w-52">
            {/* Back cards (stacked illusion) */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: "var(--c-lavender)",
                transform: "rotate(5deg) translateY(6px)",
                opacity: 0.45,
              }}
            />
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: "var(--c-blush)",
                transform: "rotate(2.5deg) translateY(3px)",
                opacity: 0.6,
              }}
            />
            {/* Main card */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: "var(--c-ivory)",
                boxShadow:
                  "0 8px 32px -8px rgba(28,42,24,0.12), 0 2px 8px -2px rgba(28,42,24,0.06)",
              }}
            >
              {/* Gradient top band */}
              <div
                style={{
                  height: 6,
                  background:
                    "linear-gradient(90deg, #FF4458 0%, #FF7854 100%)",
                }}
              />
              <div className="flex flex-col items-center px-6 py-8 gap-4">
                {/* Tinder flame */}
                <svg
                  width="38"
                  height="44"
                  viewBox="0 0 38 44"
                  fill="none"
                >
                  <path
                    d="M19 2C19 2 30 13 30 22C30 28.07 25.07 33 19 33C12.93 33 8 28.07 8 22C8 16.5 11 13.5 11 13.5C11 13.5 11 18.5 15.5 19.5C15.5 19.5 13 10 19 2Z"
                    fill="#FF4458"
                  />
                  <path
                    d="M19 17C19 17 23 21 23 24.5C23 26.43 21.43 28 19.5 28C17.57 28 16 26.43 16 24.5C16 21.5 18 20 18 20C18 20 18 22 19.5 22.5C19.5 22.5 18 19.5 19 17Z"
                    fill="#FF7854"
                  />
                </svg>

                <div>
                  <p
                    className="font-[family-name:var(--font-cormorant)] text-2xl italic"
                    style={{ color: "var(--c-ink)" }}
                  >
                    It&apos;s a Match!
                  </p>
                </div>

                <div
                  className="font-[family-name:var(--font-josefin)] text-[12px] tracking-[0.3em]"
                  style={{ color: "var(--c-muted)" }}
                >
                  Meena &amp; Thanwa
                </div>

                {/* Mock CTA button */}
                <div
                  className="mt-1 w-full rounded-full py-2.5 font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.35em] uppercase text-center"
                  style={{
                    background:
                      "linear-gradient(90deg, #FF4458 0%, #FF7854 100%)",
                    color: "#fff",
                  }}
                >
                  Send Message
                </div>

                <p
                  className="font-[family-name:var(--font-josefin)] text-[12px] tracking-wider"
                  style={{ color: "var(--c-muted)", opacity: 0.6 }}
                >
                  The rest is history ✦
                </p>
              </div>
            </div>
          </div>

          <p
            className="font-[family-name:var(--font-cormorant)] text-2xl italic mt-10 leading-relaxed"
            style={{ color: "var(--c-ink-2)" }}
          >
            &ldquo;Where it all began &mdash;
            <br />
            Our first match on Tinder&rdquo;
          </p>
        </div>
      </section>

      {/* ══════════════════════════════
          SECTION 5 — EVENT DETAILS
          ══════════════════════════════ */}
      <section
        className="px-6 py-20"
        style={{ background: "var(--c-ivory)" }}
      >
        <div className="mx-auto max-w-sm">
          {/* Header */}
          <div className="reveal mb-12 text-center">
            <SectionLabel>The Celebration</SectionLabel>
            <h2
              className="font-[family-name:var(--font-cormorant)] font-light italic mt-3 mb-6"
              style={{ fontSize: "clamp(36px, 10vw, 50px)" }}
            >
              Event Details
            </h2>

            {/* Date */}
            <div className="mb-5">
              <p
                className="font-[family-name:var(--font-cormorant)] text-3xl"
                style={{ color: "var(--c-ink)" }}
              >
                Saturday, 26 December 2026
              </p>
              <p
                className="font-[family-name:var(--font-sarabun)] text-base mt-1"
                style={{ color: "var(--c-muted)" }}
              >
                วันเสาร์ที่ 26 ธันวาคม 2569
              </p>
            </div>

            {/* Venue */}
            <div className="mb-6">
              <p
                className="font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.45em] uppercase mb-2"
                style={{ color: "var(--c-sage)" }}
              >
                Venue
              </p>
              <p
                className="font-[family-name:var(--font-cormorant)] text-3xl"
                style={{ color: "var(--c-ink)" }}
              >
                THE COP Seminar &amp; Resort
              </p>
              <p
                className="font-[family-name:var(--font-josefin)] text-[12px] tracking-[0.35em] mb-4"
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
                  fontFamily: "var(--font-josefin)",
                  fontSize: 12,
                  letterSpacing: "0.35em",
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
          <div className="reveal">
            <p
              className="font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.5em] uppercase mb-8 text-center"
              style={{ color: "var(--c-sage)" }}
            >
              Schedule
            </p>

            <div className="relative">
              {/* Vertical connecting line */}
              <div
                className="absolute top-2 bottom-2"
                style={{
                  left: 68,
                  width: 1,
                  background:
                    "linear-gradient(to bottom, transparent, var(--c-blush) 15%, var(--c-blush) 85%, transparent)",
                }}
              />

              {[
                {
                  time: "14:00",
                  thai: "พิธีแห่ขันหมากและรับไหว้",
                  en: "Khan Mak Procession",
                },
                {
                  time: "15:00",
                  thai: "พิธีหลั่งน้ำสังข์",
                  en: "Water Blessing Ceremony",
                },
                {
                  time: "17:00",
                  thai: "พิธีกล่าวคำสัญญา",
                  en: "Vow Ceremony",
                },
                {
                  time: "18:00",
                  thai: "ร่วมรับประทานอาหาร",
                  en: "Wedding Reception",
                },
                { time: "20:00", thai: "After Party", en: "After Party 🎉" },
              ].map((item, i) => (
                <div key={i} className="relative flex gap-0 mb-8 last:mb-0">
                  {/* Time */}
                  <div
                    className="shrink-0 text-right"
                    style={{ width: 60, paddingTop: 2 }}
                  >
                    <span
                      className="font-[family-name:var(--font-josefin)] text-base"
                      style={{ color: "var(--c-muted)" }}
                    >
                      {item.time}
                    </span>
                  </div>

                  {/* Dot */}
                  <div
                    className="relative shrink-0 flex justify-center"
                    style={{ width: 18, paddingTop: 4 }}
                  >
                    <div
                      className="timeline-dot w-2.5 h-2.5 rounded-full"
                      style={{
                        background: "var(--c-ivory)",
                        border: "1.5px solid var(--c-blush)",
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
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          SECTION 6 — RSVP
          ══════════════════════════════ */}
      <section
        className="px-6 py-20"
        style={{ background: "var(--c-ivory-dark)" }}
      >
        <div className="mx-auto max-w-sm">
          <div className="reveal mb-10 text-center">
            <SectionLabel>Kindly Reply</SectionLabel>
            <h2
              className="font-[family-name:var(--font-cormorant)] font-light italic mt-3 mb-5"
              style={{ fontSize: "clamp(36px, 10vw, 50px)" }}
            >
              RSVP
            </h2>
            <p
              className="font-[family-name:var(--font-sarabun)] text-base leading-relaxed"
              style={{ color: "var(--c-ink-2)" }}
            >
              เพื่อให้เราสามารถเตรียมการต้อนรับท่านได้อย่างดีที่สุด
              <br />
              โปรดแจ้งความประสงค์ในการเข้าร่วมงาน
            </p>
            <p
              className="font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.3em] mt-3"
              style={{ color: "var(--c-blush-deep)" }}
            >
              BEFORE 12 DECEMBER 2026
            </p>
          </div>

          <RSVPForm />
        </div>
      </section>

      {/* ══════════════════════════════
          SECTION 7 — DRESS CODE
          ══════════════════════════════ */}
      <section
        className="px-6 py-20 text-center"
        style={{ background: "var(--c-ivory)" }}
      >
        <div className="mx-auto max-w-sm reveal">
          <SectionLabel>Dress Code</SectionLabel>

          <h2
            className="font-[family-name:var(--font-cormorant)] font-light italic mt-3"
            style={{ fontSize: "clamp(36px, 10vw, 50px)" }}
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
              { hex: "#E8C3BE", name: "Blush\nPink" },
              { hex: "#8AA882", name: "Sage\nGreen" },
              { hex: "#C2B3D2", name: "Lavender" },
              { hex: "#FAF7F0", name: "Ivory", border: "#C2B3D2" },
              { hex: "#DEC89C", name: "Champagne" },
            ].map((s) => (
              <div key={s.hex} className="flex flex-col items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full"
                  style={{
                    background: s.hex,
                    border: `1.5px solid ${s.border ?? s.hex}`,
                    boxShadow: "0 2px 8px -2px rgba(28,42,24,0.1)",
                  }}
                />
                <span
                  className="font-[family-name:var(--font-josefin)] text-center leading-tight whitespace-pre-line"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.08em",
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
              className="font-[family-name:var(--font-sarabun)] text-base leading-relaxed"
              style={{ color: "var(--c-ink-2)" }}
            >
              แต่งกายให้เข้ากับบรรยากาศสวนที่ดูโรแมนติกและสดใส
            </p>
            <p
              className="font-[family-name:var(--font-sarabun)] text-base"
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
            className="font-[family-name:var(--font-josefin)] text-[12px] tracking-[0.45em]"
            style={{ color: "var(--c-ivory)", opacity: 0.45 }}
          >
            26 &middot; 12 &middot; 2026
          </p>
          <p
            className="font-[family-name:var(--font-josefin)] text-[12px] tracking-[0.3em]"
            style={{ color: "var(--c-ivory)", opacity: 0.25 }}
          >
            #FROMMEENATOTHANWAFOREVER
          </p>
        </div>

        <div className="mt-8">
          <Divider color="rgba(250,247,240,0.12)" />
        </div>

        <p
          className="font-[family-name:var(--font-josefin)] text-[12px] tracking-wider mt-6"
          style={{ color: "var(--c-ivory)", opacity: 0.2 }}
        >
          THE COP SEMINAR &amp; RESORT · PATTAYA
        </p>
      </footer>
    </main>
  )
}
