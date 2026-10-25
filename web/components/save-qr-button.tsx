"use client"

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react"

function isIOS() {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

/**
 * iOS saves `<a download>` files to Files/Downloads, not Photos — and banking
 * apps only scan from Photos. On iOS we open the share sheet instead, whose
 * "Save Image" goes to Photos. Elsewhere (Android, desktop) the plain download
 * already lands in the gallery / Downloads, so the link is left alone.
 */
export function SaveQrButton({
  src,
  filename,
  className,
  style,
  children,
}: {
  src: string
  filename: string
  className?: string
  style?: React.CSSProperties
  children: ReactNode
}) {
  // Fetched ahead of the tap: iOS drops the user gesture if we await a fetch
  // before calling navigator.share().
  const fileRef = useRef<File | null>(null)

  useEffect(() => {
    if (!isIOS() || typeof navigator.canShare !== "function") return
    let cancelled = false
    fetch(src)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], filename, { type: blob.type || "image/jpeg" })
        if (!cancelled && navigator.canShare({ files: [file] })) fileRef.current = file
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [src, filename])

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    const file = fileRef.current
    if (!file) return // fall through to the normal download
    e.preventDefault()
    navigator.share({ files: [file] }).catch(() => {
      // AbortError = guest closed the sheet; nothing to do
    })
  }

  return (
    <a href={src} download={filename} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  )
}
