import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

// Link-preview card for LINE / Facebook / Messenger — Garden Whimsical Pastel.
export const alt = "Meena & Thanwa — 26 December 2026 · The Cop Seminar and Resort, Pattaya"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Mirrors the --c-* palette in globals.css (Satori can't read CSS variables)
const c = {
  ivory: "#FAF7F0",
  blush: "#E8C3BE",
  blushDeep: "#B8847E",
  sage: "#8AA882",
  sageDeep: "#55704F",
  sageLight: "#C5D8C0",
  lavender: "#C2B3D2",
  champagne: "#DEC89C",
  ink2: "#485440",
  muted: "#877A6A",
}

function Flower({ size, petal, center }: { size: number; petal: string; center: string }) {
  const petals = [0, 72, 144, 216, 288]
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      {petals.map((deg) => (
        <ellipse key={deg} cx="0" cy="-24" rx="17" ry="25" fill={petal} transform={`rotate(${deg})`} />
      ))}
      <circle cx="0" cy="0" r="11" fill={center} />
    </svg>
  )
}

function Sprig({ size, rotate, color }: { size: number; rotate: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M50 96 C50 70 50 40 50 6" stroke={color} strokeWidth="2.5" fill="none" />
      {[18, 38, 58, 78].map((y, i) => (
        <g key={y}>
          <ellipse cx="38" cy={y} rx="12" ry="5.5" fill={color} transform={`rotate(-35 38 ${y})`} opacity={0.85 - i * 0.1} />
          <ellipse cx="62" cy={y + 8} rx="12" ry="5.5" fill={color} transform={`rotate(35 62 ${y + 8})`} opacity={0.85 - i * 0.1} />
        </g>
      ))}
    </svg>
  )
}

export default async function OpengraphImage() {
  const font = (file: string) => readFile(join(process.cwd(), "assets/og", file))
  const [script, serif, serifItalic, sans] = await Promise.all([
    font("GreatVibes-Regular.ttf"),
    font("CormorantGaramond-Medium.ttf"),
    font("CormorantGaramond-Italic.ttf"),
    font("JosefinSans-Regular.ttf"),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.ivory,
          backgroundImage: [
            `radial-gradient(circle at 6% 10%, ${c.blush} 0%, ${c.ivory}00 34%)`,
            `radial-gradient(circle at 96% 8%, ${c.lavender} 0%, ${c.ivory}00 32%)`,
            `radial-gradient(circle at 4% 96%, ${c.sageLight} 0%, ${c.ivory}00 34%)`,
            `radial-gradient(circle at 94% 94%, ${c.champagne} 0%, ${c.ivory}00 32%)`,
          ].join(", "),
          fontFamily: "Josefin",
        }}
      >
        {/* Double frame — Satori has no `inset`, so spell out each edge */}
        <div style={{ position: "absolute", top: 28, left: 28, right: 28, bottom: 28, display: "flex", border: `2px solid ${c.blush}`, borderRadius: 28 }} />
        <div style={{ position: "absolute", top: 40, left: 40, right: 40, bottom: 40, display: "flex", border: `1px solid ${c.sageLight}`, borderRadius: 20 }} />

        {/* Corner bouquets */}
        <div style={{ position: "absolute", top: 8, left: 14, display: "flex" }}>
          <Sprig size={130} rotate={-40} color={c.sage} />
        </div>
        <div style={{ position: "absolute", top: 44, left: 70, display: "flex" }}>
          <Flower size={74} petal={c.blush} center={c.champagne} />
        </div>
        <div style={{ position: "absolute", top: 112, left: 46, display: "flex" }}>
          <Flower size={40} petal={c.lavender} center={c.ivory} />
        </div>

        <div style={{ position: "absolute", top: 8, right: 14, display: "flex" }}>
          <Sprig size={130} rotate={40} color={c.sage} />
        </div>
        <div style={{ position: "absolute", top: 50, right: 72, display: "flex" }}>
          <Flower size={66} petal={c.lavender} center={c.champagne} />
        </div>
        <div style={{ position: "absolute", top: 120, right: 50, display: "flex" }}>
          <Flower size={36} petal={c.blush} center={c.ivory} />
        </div>

        <div style={{ position: "absolute", bottom: 8, left: 14, display: "flex" }}>
          <Sprig size={120} rotate={-140} color={c.sageDeep} />
        </div>
        <div style={{ position: "absolute", bottom: 52, left: 80, display: "flex" }}>
          <Flower size={58} petal={c.champagne} center={c.blushDeep} />
        </div>

        <div style={{ position: "absolute", bottom: 8, right: 14, display: "flex" }}>
          <Sprig size={120} rotate={140} color={c.sageDeep} />
        </div>
        <div style={{ position: "absolute", bottom: 50, right: 84, display: "flex" }}>
          <Flower size={62} petal={c.blush} center={c.champagne} />
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 8, color: c.blushDeep }}>
            YOU ARE INVITED TO THE WEDDING OF
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontFamily: "GreatVibes",
              fontSize: 148,
              lineHeight: 1.25,
              color: c.sageDeep,
              marginTop: 12,
            }}
          >
            <span>Meena</span>
            <span style={{ fontSize: 112, color: c.blushDeep, margin: "0 26px" }}>&amp;</span>
            <span>Thanwa</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
            <div style={{ display: "flex", width: 150, height: 1, backgroundColor: c.blush }} />
            <div style={{ display: "flex", margin: "0 18px" }}>
              <Flower size={26} petal={c.blush} center={c.champagne} />
            </div>
            <div style={{ display: "flex", width: 150, height: 1, backgroundColor: c.blush }} />
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Cormorant",
              fontWeight: 500,
              fontSize: 64,
              letterSpacing: 6,
              color: c.ink2,
              marginTop: 14,
            }}
          >
            26 · 12 · 2026
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Cormorant",
              fontStyle: "italic",
              fontSize: 32,
              color: c.muted,
              marginTop: 6,
            }}
          >
            The Cop Seminar and Resort, Pattaya
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "GreatVibes", data: script, weight: 400, style: "normal" },
        { name: "Cormorant", data: serif, weight: 500, style: "normal" },
        { name: "Cormorant", data: serifItalic, weight: 400, style: "italic" },
        { name: "Josefin", data: sans, weight: 400, style: "normal" },
      ],
    },
  )
}
