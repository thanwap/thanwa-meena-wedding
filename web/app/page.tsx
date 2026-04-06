// web/app/page.tsx
import Image from 'next/image'

const INK = '#1e3028'
const BG = '#F3F3EE'

// ─── Layout knobs ─────────────────────────────────────────────────
const MAX_WIDTH = 420          // px — card + image max width
const PAGE_PADDING = '28px 20px'
const IMAGE_ASPECT = '3 / 4'  // width / height ratio of illustration

// How far the text card slides UP over the image.
// Increase to cover more of the image; decrease to move card lower.
const CARD_OVERLAP = 120        // px
// ──────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <main
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: BG, padding: PAGE_PADDING }}
    >
      <div className="w-full flex flex-col items-center" style={{ maxWidth: MAX_WIDTH }}>

        {/* Illustration — no border */}
        <div className="relative w-full" style={{ aspectRatio: IMAGE_ASPECT }}>
          <Image
            src="/landing.png"
            alt="Thanwa and Meena"
            fill
            priority
            className="object-contain"
            sizes={`${MAX_WIDTH}px`}
          />
        </div>

        {/* Text card — overlaps image by CARD_OVERLAP px */}
        <div
          className="flex flex-col items-center text-center w-full"
          style={{
            marginTop: -CARD_OVERLAP,
            position: 'relative',
            zIndex: 1,
            backgroundColor: BG,
            border: `1px solid rgba(30,48,40,0.22)`,
            outline: `4px solid ${BG}`,
            outlineOffset: '-10px',
            padding: '28px 28px 32px',
          }}
        >
          {/* Eyebrow */}
          <p
            className="mb-3 text-xs tracking-[0.35em] uppercase"
            style={{ color: 'rgba(30,48,40,0.5)', fontFamily: 'var(--font-geist)' }}
          >
            Save the Date
          </p>

          {/* Names */}
          <h1
            className="text-4xl sm:text-5xl font-light tracking-wide leading-tight"
            style={{ color: INK, fontFamily: 'var(--font-playfair)' }}
          >
            <span className="block">Thanwa</span>
            <span
              className="block text-2xl sm:text-3xl my-1"
              style={{ color: 'rgba(30,48,40,0.4)' }}
            >
              &amp;
            </span>
            <span className="block">Meena</span>
          </h1>

          {/* Divider */}
          <div
            className="my-4 w-8"
            style={{ height: '1px', background: 'rgba(30,48,40,0.2)' }}
          />

          {/* Date */}
          <p
            className="text-sm tracking-[0.25em]"
            style={{ color: 'rgba(30,48,40,0.85)', fontFamily: 'var(--font-geist)' }}
          >
            26 · 12 · 2026
          </p>

          {/* Venue */}
          <p
            className="mt-1 text-xs tracking-wide"
            style={{ color: 'rgba(30,48,40,0.55)', fontFamily: 'var(--font-geist)' }}
          >
            The Cop Seminar and Resort, Pattaya
          </p>

          {/* Google Maps link */}
          <a
            href="https://maps.app.goo.gl/WysXSoYYKXm98CcD8"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-xs"
            style={{ color: 'rgba(30,48,40,0.38)', fontFamily: 'var(--font-geist)' }}
          >
            📍 View on Google Maps
          </a>

          {/* Tagline */}
          <p
            className="mt-3 text-xs italic"
            style={{ color: 'rgba(30,48,40,0.5)', fontFamily: 'var(--font-playfair)' }}
          >
            Join us as we celebrate our love
          </p>

          {/* Coming Soon badge */}
          <div
            className="mt-5 px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase"
            style={{
              background: 'rgba(30,48,40,0.05)',
              border: '1px solid rgba(30,48,40,0.2)',
              color: 'rgba(30,48,40,0.6)',
              fontFamily: 'var(--font-geist)',
            }}
          >
            WEBSITE COMING SOON
          </div>
        </div>

      </div>
    </main>
  )
}
