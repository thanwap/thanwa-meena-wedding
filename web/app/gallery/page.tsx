import Script from "next/script"
import { notFound } from "next/navigation"
import { PhotoGallery } from "@/components/photo-booth/photo-gallery"

export const metadata = {
  title: "Our Photos · Thanwa & Meena",
  description: "Wedding day photo gallery — Thanwa & Meena, 26 December 2026",
}

/** Gallery is hidden for now (404). Flip to true to bring it back. */
const GALLERY_ENABLED = false

export default function GalleryPage() {
  if (!GALLERY_ENABLED) notFound()

  return (
    <>
      <Script src="/pixels.js" strategy="afterInteractive" />
      <PhotoGallery />
    </>
  )
}
