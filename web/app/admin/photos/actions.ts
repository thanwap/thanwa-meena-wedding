"use server"

import { adminFetch } from "@/lib/admin-fetch"

export interface AdminPhotoRecord {
  id: string
  displayName: string
  filterName: string
  fullUrl: string
  thumbUrl: string
  createdAt: string
}

interface ApiPhotoDto {
  id: string
  deviceId: string
  displayName: string
  filterName: string
  fullUrl: string
  thumbUrl: string
  createdAt: string
}

function toAdminRecord(dto: ApiPhotoDto): AdminPhotoRecord {
  return {
    id: dto.id,
    displayName: dto.displayName,
    filterName: dto.filterName,
    fullUrl: dto.fullUrl,
    thumbUrl: dto.thumbUrl,
    createdAt: dto.createdAt,
  }
}

export async function adminGetPhotos(options?: {
  cursor?: string
  limit?: number
}): Promise<{ photos: AdminPhotoRecord[]; nextCursor: string | null; total: number }> {
  const params = new URLSearchParams()
  if (options?.limit) params.set("limit", String(options.limit))
  if (options?.cursor) params.set("cursor", options.cursor)

  const res = await adminFetch(`/api/photos/admin?${params}`)

  if (!res.ok) {
    console.error("[adminGetPhotos]", res.status)
    return { photos: [], nextCursor: null, total: 0 }
  }

  const data = await res.json()
  return {
    photos: (data.photos ?? []).map(toAdminRecord),
    nextCursor: data.nextCursor ?? null,
    total: data.total ?? 0,
  }
}

export async function adminDeletePhotos(
  ids: string[],
): Promise<{ success: boolean; error?: string }> {
  if (ids.length === 0) return { success: true }

  const res = await adminFetch("/api/photos/admin/bulk", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { success: false, error: body.error ?? "Delete failed" }
  }

  return { success: true }
}
