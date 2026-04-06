// web/app/page.tsx
import Image from 'next/image'

export default function Page() {
  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* Background photo */}
      <Image
        src="/placeholder.jpg"
        alt="Thanwa and Meena"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.08) 100%)',
        }}
      />

      {/* Content — anchored bottom-center */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-6 text-center text-white">
        {/* Eyebrow */}
        <p
          className="mb-4 text-xs tracking-[0.35em] uppercase"
          style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-geist)' }}
        >
          Save the Date
        </p>

        {/* Names */}
        <h1
          className="text-4xl sm:text-5xl font-light tracking-wide leading-tight"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          <span className="block">Thanwa</span>
          <span
            className="block text-2xl sm:text-3xl my-1"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            &amp;
          </span>
          <span className="block">Meena</span>
        </h1>

        {/* Divider */}
        <div
          className="my-4 w-8"
          style={{ height: '1px', background: 'rgba(255,255,255,0.35)' }}
        />

        {/* Date */}
        <p
          className="text-sm tracking-[0.25em]"
          style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-geist)' }}
        >
          26 · 12 · 2026
        </p>

        {/* Venue */}
        <p
          className="mt-1 text-xs tracking-wide"
          style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-geist)' }}
        >
          The Cop Seminar and Resort, Pattaya
        </p>

        {/* Google Maps link */}
        <a
          href="https://maps.app.goo.gl/WysXSoYYKXm98CcD8"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-xs"
          style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-geist)' }}
        >
          📍 View on Google Maps
        </a>

        {/* Tagline */}
        <p
          className="mt-3 text-xs italic"
          style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-playfair)' }}
        >
          Join us as we celebrate our love
        </p>

        {/* Coming Soon badge */}
        <div
          className="mt-5 px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'var(--font-geist)',
            backdropFilter: 'blur(4px)',
          }}
        >
          WEBSITE COMING SOON
        </div>
      </div>
    </main>
  )
}
