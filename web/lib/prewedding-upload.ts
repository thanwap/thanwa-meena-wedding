import { compressToBlob } from "@/lib/image-compress"

export const ACCEPTED_TYPES = ["image/jpeg", "image/png"]
export const ACCEPT_ATTR = ".jpg,.jpeg,.png,image/jpeg,image/png"

/** Upper bound for one upload — Vercel caps a request body at 4.5 MB. */
export const PASSTHROUGH_BYTES = 4 * 1024 * 1024
/** Same as the API's full-size WebP edge, so the server never decodes more pixels than it keeps. */
export const PRESHRINK_MAX_EDGE = 2400

export function isAcceptedImage(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true
  return /\.(jpe?g|png)$/i.test(file.name)
}

/**
 * Anything larger than the final 2400px edge is pre-shrunk in the browser to a
 * high-quality JPEG. Keeps uploads small (camera originals are 8–25 MB, over Vercel's
 * body limit) and spares the API decoding full-resolution photos; the API then
 * produces the final WebP variants.
 */
export async function prepareForUpload(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  try {
    const fitsAlready = Math.max(bitmap.width, bitmap.height) <= PRESHRINK_MAX_EDGE
    if (fitsAlready && file.size <= PASSTHROUGH_BYTES) return file

    for (const quality of [0.92, 0.85, 0.78]) {
      const blob = await compressToBlob(bitmap, PRESHRINK_MAX_EDGE, quality)
      if (blob.size <= PASSTHROUGH_BYTES) return blob
    }
    throw new Error("Image is still too large after shrinking")
  } finally {
    bitmap.close()
  }
}
