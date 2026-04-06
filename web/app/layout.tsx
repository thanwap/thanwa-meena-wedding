// web/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Geist } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Thanwa & Meena — 26.12.2026',
  description:
    'Save the Date — Join us as we celebrate our love. The Cop Seminar and Resort, Pattaya.',
  openGraph: {
    title: 'Thanwa & Meena — Save the Date',
    description: '26 December 2026 · The Cop Seminar and Resort, Pattaya',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${geist.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
