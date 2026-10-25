"use server"

import { updateTag } from "next/cache"
import { adminFetch } from "@/lib/admin-fetch"
import { PREWEDDING_CACHE_TAG, type PreweddingPhoto, type TileSize } from "@/lib/prewedding"

type Result<T = undefined> = { success: true; data: T } | { success: false; error: string }

async function errorFrom(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}))
  return body.error ?? `${fallback} (HTTP ${res.status})`
}

export async function adminGetPreweddingPhotos(): Promise<PreweddingPhoto[]> {
  const res = await adminFetch("/api/prewedding-photos", { cache: "no-store" })
  if (!res.ok) {
    console.error("[adminGetPreweddingPhotos]", res.status)
    return []
  }
  return res.json()
}

export async function adminUpdatePreweddingPhoto(
  id: string,
  fields: { title: string | null; caption: string | null; tileSize: TileSize | null },
): Promise<Result<PreweddingPhoto>> {
  const res = await adminFetch(`/api/prewedding-photos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  })
  if (!res.ok) return { success: false, error: await errorFrom(res, "Update failed") }

  updateTag(PREWEDDING_CACHE_TAG)
  return { success: true, data: await res.json() }
}

export async function adminReorderPreweddingPhotos(ids: string[]): Promise<Result> {
  const res = await adminFetch("/api/prewedding-photos/order", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) return { success: false, error: await errorFrom(res, "Reorder failed") }

  updateTag(PREWEDDING_CACHE_TAG)
  return { success: true, data: undefined }
}

export async function adminDeletePreweddingPhoto(id: string): Promise<Result> {
  const res = await adminFetch(`/api/prewedding-photos/${id}`, { method: "DELETE" })
  if (!res.ok) return { success: false, error: await errorFrom(res, "Delete failed") }

  updateTag(PREWEDDING_CACHE_TAG)
  return { success: true, data: undefined }
}
