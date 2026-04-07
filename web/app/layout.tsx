import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond, Josefin_Sans, Great_Vibes, Sarabun, Geist } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
})

const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-josefin",
})

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-script",
})

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400"],
  variable: "--font-sarabun",
})

// Keep Geist for admin UI (shadcn components)
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

export const metadata: Metadata = {
  title: "Meena & Thanwa — 26.12.2026",
  description:
    "You are invited to celebrate the wedding of Meena & Thanwa · The Cop Seminar and Resort, Pattaya · 26 December 2026",
  openGraph: {
    title: "Meena & Thanwa — 26.12.2026",
    description:
      "You are invited · 26 December 2026 · The Cop Seminar and Resort, Pattaya",
    type: "website",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        cormorant.variable,
        josefin.variable,
        greatVibes.variable,
        sarabun.variable,
        geist.variable,
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
