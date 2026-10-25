import { compressToBlob } from "@/lib/image-compress"

export const ACCEPTED_TYPES = ["image/jpeg", "image/png"]
export const ACCEPT_ATTR = ".jpg,.jpeg,.png,image/jpeg,image/png"

/** Files at or below this go up untouched — the API does the real WebP conversion. */
export const PASSTHROUGH_BYTES = 4 * 1024 * 1024
const PRESHRINK_MAX_EDGE = 3000

export function isAcceptedImage(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true
  return /\.(jpe?g|png)$/i.test(file.name)
}

/**
 * Vercel caps a request body at 4.5 MB, while camera originals are often 8–25 MB.
 * Big files are pre-shrunk in the browser to a high-quality JPEG (≤3000px) so they
 * fit through the server action; the API then produces the final WebP variants.
 */
export async function prepareForUpload(file: File): Promise<Blob> {
  if (file.size <= PASSTHROUGH_BYTES) return file

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  try {
    for (const quality of [0.92, 0.85, 0.78]) {
      const blob = await compressToBlob(bitmap, PRESHRINK_MAX_EDGE, quality)
      if (blob.size <= PASSTHROUGH_BYTES) return blob
    }
    throw new Error("Image is still too large after shrinking")
  } finally {
    bitmap.close()
  }
}
