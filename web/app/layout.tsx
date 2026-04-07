import type { Metadata, Viewport } from "next"
import { Geist, Playfair_Display } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

export const metadata: Metadata = {
  title: "Thanwa & Meena — 26.12.2026",
  description:
    "Save the Date — Join us as we celebrate our love. The Cop Seminar and Resort, Pattaya.",
  openGraph: {
    title: "Thanwa & Meena — Save the Date",
    description: "26 December 2026 · The Cop Seminar and Resort, Pattaya",
    type: "website",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", playfair.variable, geist.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
