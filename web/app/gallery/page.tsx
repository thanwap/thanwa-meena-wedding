import Script from "next/script"
import { PhotoGallery } from "@/components/photo-booth/photo-gallery"

export const metadata = {
  title: "Our Photos · Thanwa & Meena",
  description: "Wedding day photo gallery — Thanwa & Meena, 26 December 2026",
}

export default function GalleryPage() {
  return (
    <>
      <Script src="/pixels.js" strategy="afterInteractive" />
      <PhotoGallery />
    </>
  )
}
