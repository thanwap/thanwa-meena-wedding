"use server"

import { PREWEDDING_CACHE_TAG, type PreweddingPhoto } from "@/lib/prewedding"
import { apiFetch, failedCachedRead } from "@/lib/api"

/** Public read for the landing page. Cached until an admin change calls updateTag. */
export async function getPreweddingPhotos(): Promise<PreweddingPhoto[]> {
  let res: Response
  try {
    res = await apiFetch("/api/prewedding-photos", {
      next: { tags: [PREWEDDING_CACHE_TAG] },
    })
  } catch (err) {
    return failedCachedRead([], "getPreweddingPhotos", err)
  }
  if (!res.ok) return failedCachedRead([], "getPreweddingPhotos", `HTTP ${res.status}`)
  return res.json()
}
