/**
 * Resize a canvas source to fit within maxPx on the longest edge,
 * then encode as JPEG at the given quality (0–1).
 */
export function compressToBlob(
  source: HTMLCanvasElement | HTMLImageElement | ImageBitmap,
  maxPx: number,
  quality: number,
): Promise<Blob> {
  const srcW =
    source instanceof HTMLCanvasElement
      ? source.width
      : source instanceof HTMLImageElement
        ? source.naturalWidth
        : (source as ImageBitmap).width
  const srcH =
    source instanceof HTMLCanvasElement
      ? source.height
      : source instanceof HTMLImageElement
        ? source.naturalHeight
        : (source as ImageBitmap).height

  const scale = Math.min(1, maxPx / Math.max(srcW, srcH))
  const w = Math.round(srcW * scale)
  const h = Math.round(srcH * scale)

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("toBlob returned null"))
      },
      "image/jpeg",
      quality,
    )
  })
}
