"use server"

import { PREWEDDING_CACHE_TAG, type PreweddingPhoto } from "@/lib/prewedding"

const API = process.env.DOTNET_API_URL!

/** Public read for the landing page. Cached until an admin change calls updateTag. */
export async function getPreweddingPhotos(): Promise<PreweddingPhoto[]> {
  try {
    const res = await fetch(`${API}/api/prewedding-photos`, {
      next: { tags: [PREWEDDING_CACHE_TAG] },
    })
    if (!res.ok) {
      console.error("[getPreweddingPhotos]", res.status)
      return []
    }
    return await res.json()
  } catch (err) {
    console.error("[getPreweddingPhotos]", err)
    return []
  }
}
