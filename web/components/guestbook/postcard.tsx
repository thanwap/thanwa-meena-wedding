import Image from "next/image"
import type { Postcard } from "./postcards"

/** Ballpoint-blue ink for anything a guest "writes" on a card */
export const INK = "#34436A"

/** Perforated stamp with a cancellation postmark rolled across it */
function Stamp() {
  return (
    <div aria-hidden className="pointer-events-none absolute top-4 right-4 md:top-5 md:right-5">
      {/* Landscape so the wide hero logo stays legible; masked so it prints in stamp ink */}
      <div className="relative h-[58px] w-[84px] md:h-[68px] md:w-[98px]">
        {/* Only the paper edge is perforated — the hole mask tiles the whole box,
            so the logo sits on its own unmasked layer above it */}
        <div className="gb-stamp absolute inset-0" style={{ background: "var(--c-blush)" }} />
        <div className="absolute inset-[5px] flex items-center justify-center" style={{ background: "#FBF3EF" }}>
          <span
            className="block aspect-[957/427] w-[86%]"
            style={{
              background: "var(--c-blush-deep)",
              WebkitMask: "url(/wedding-logo-transparent.png) center / contain no-repeat",
              mask: "url(/wedding-logo-transparent.png) center / contain no-repeat",
            }}
          />
        </div>
      </div>
      <svg
        width="92"
        height="60"
        viewBox="0 0 92 60"
        className="absolute -top-1 -left-[68px] md:-left-[64px]"
        style={{ color: "rgba(72,84,64,0.45)" }}
      >
        <circle cx="30" cy="30" r="24" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="30" cy="30" r="17" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <text x="30" y="28" textAnchor="middle" fontSize="7" fill="currentColor" letterSpacing="0.6" fontFamily="var(--font-josefin)">
          PATTAYA
        </text>
        <text x="30" y="37" textAnchor="middle" fontSize="7" fill="currentColor" letterSpacing="0.4" fontFamily="var(--font-josefin)">
          26.12.26
        </text>
        {[22, 30, 38].map((y) => (
          // Waves stop at the stamp's edge so they don't run over the logo
          <path key={y} d={`M56 ${y} q4 -3 8 0 t8 0`} fill="none" stroke="currentColor" strokeWidth="1.2" />
        ))}
      </svg>
    </div>
  )
}

/** Shared postcard: photo half + writing half (stacked on phones). The writing
    side is filled by the caller — form fields when composing, the letter when reading. */
export function PostcardFace({
  postcard,
  children,
  className = "",
}: {
  postcard: Postcard
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`gb-paper grid w-full overflow-hidden rounded-[6px] md:grid-cols-[280px_minmax(0,1fr)] ${className}`}
      style={{ boxShadow: "0 30px 60px -30px rgba(92,72,48,0.55), 0 4px 10px -4px rgba(92,72,48,0.18)" }}
    >
      {/* Desktop: the column is the photo's own 2:3, so nothing is cropped away.
          Phones: a short strip cropped around the photo's focal point. */}
      <div className="relative h-[clamp(190px,52vw,270px)] md:h-auto md:min-h-[420px]">
        <Image
          src={postcard.src}
          alt={postcard.alt}
          fill
          sizes="(min-width: 768px) 280px, 92vw"
          className="object-cover"
          style={{ objectPosition: postcard.focus }}
        />
      </div>
      <div className="relative flex flex-col px-5 pt-6 pb-5 md:px-7 md:pt-7 md:pb-6">
        <Stamp />
        <p className="pr-32 font-[family-name:var(--font-hand)] text-[22px] leading-tight md:text-[24px]" style={{ color: INK }}>
          ถึง ธันวา &amp; มีนา
        </p>
        {/* Clear of the stamp and postmark */}
        <div className="mt-8 flex flex-1 flex-col md:mt-10">{children}</div>
      </div>
    </div>
  )
}

/** Ruled-paper lines that scroll with the text (background-attachment: local) */
export const RULED: React.CSSProperties = {
  lineHeight: "var(--gb-line)",
  backgroundImage:
    "repeating-linear-gradient(to bottom, transparent 0, transparent calc(var(--gb-line) - 1px), color-mix(in srgb, var(--c-blush) 70%, transparent) calc(var(--gb-line) - 1px), color-mix(in srgb, var(--c-blush) 70%, transparent) var(--gb-line))",
  backgroundAttachment: "local",
}
