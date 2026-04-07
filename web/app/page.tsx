import Image from "next/image"

const INK = "#1e3028"
const BG = "#F3F3EE"
const MAX_WIDTH = 420
const PAGE_PADDING = "28px 20px"
const IMAGE_ASPECT = "3 / 4"
const CARD_OVERLAP = 120

export default function Page() {
  return (
    <main
      className="flex min-h-svh w-full justify-center"
      style={{ background: BG, color: INK, padding: PAGE_PADDING }}
    >
      <div
        className="flex w-full flex-col items-center"
        style={{ maxWidth: MAX_WIDTH }}
      >
        <div
          className="relative w-full"
          style={{ aspectRatio: IMAGE_ASPECT }}
        >
          <Image
            src="/landing.png"
            alt="Thanwa and Meena"
            fill
            priority
            sizes="420px"
            className="object-contain"
          />
        </div>

        <div
          className="relative w-full text-center"
          style={{
            background: BG,
            border: `1px solid ${INK}38`,
            outline: `4px solid ${BG}`,
            outlineOffset: -10,
            padding: "28px 28px 32px",
            marginTop: -CARD_OVERLAP,
          }}
        >
          <p
            className="font-[family-name:var(--font-geist)] text-xs uppercase"
            style={{ letterSpacing: "0.35em" }}
          >
            Save the Date
          </p>

          <h1 className="font-[family-name:var(--font-playfair)] mt-6 text-4xl font-light leading-tight sm:text-5xl">
            <span className="block">Thanwa</span>
            <span className="my-1 block text-2xl sm:text-3xl" style={{ opacity: 0.4 }}>
              &amp;
            </span>
            <span className="block">Meena</span>
          </h1>

          <div
            className="mx-auto mt-6"
            style={{ width: 32, height: 1, background: `${INK}33` }}
          />

          <p
            className="font-[family-name:var(--font-geist)] mt-6 text-sm"
            style={{ letterSpacing: "0.25em" }}
          >
            26 · 12 · 2026
          </p>

          <p className="font-[family-name:var(--font-geist)] mt-4 text-sm">
            The Cop Seminar and Resort, Pattaya
          </p>

          <a
            href="https://maps.app.goo.gl/WysXSoYYKXm98CcD8"
            target="_blank"
            rel="noreferrer"
            className="font-[family-name:var(--font-geist)] mt-2 inline-block text-xs underline-offset-4 hover:underline"
          >
            📍 View on Google Maps
          </a>

          <p className="font-[family-name:var(--font-playfair)] mt-6 text-base italic">
            Join us as we celebrate our love
          </p>

          <span
            className="font-[family-name:var(--font-geist)] mt-6 inline-block rounded-full px-4 py-1.5 text-[10px]"
            style={{
              border: `1px solid ${INK}38`,
              letterSpacing: "0.25em",
            }}
          >
            WEBSITE COMING SOON
          </span>
        </div>
      </div>
    </main>
  )
}
