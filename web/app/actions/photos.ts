"use server"

import { apiFetch } from "@/lib/api"

export interface PhotoRecord {
  id: string
  displayName: string
  fullUrl: string
  thumbUrl: string
  filterName: string
  createdAt: string
  /** Taken on this device — the API never reveals other devices' ids */
  isMine: boolean
}

interface ApiPhotoDto {
  id: string
  displayName: string
  filterName: string
  fullUrl: string
  thumbUrl: string
  createdAt: string
  isMine: boolean
}

function toRecord(dto: ApiPhotoDto): PhotoRecord {
  return {
    id: dto.id,
    displayName: dto.displayName,
    fullUrl: dto.fullUrl,
    thumbUrl: dto.thumbUrl,
    filterName: dto.filterName,
    createdAt: dto.createdAt,
    isMine: dto.isMine,
  }
}

export async function getPhotos(options?: {
  cursor?: string
  limit?: number
  /** This device — marks its photos as `isMine` */
  deviceId?: string
  /** Only this device's photos (needs `deviceId`) */
  mine?: boolean
}): Promise<{ photos: PhotoRecord[]; nextCursor: string | null }> {
  const params = new URLSearchParams()
  if (options?.limit) params.set("limit", String(options.limit))
  if (options?.cursor) params.set("cursor", options.cursor)
  if (options?.deviceId) params.set("deviceId", options.deviceId)
  if (options?.mine) params.set("mine", "true")

  const res = await apiFetch(`/api/photos?${params}`, { cache: "no-store" }, { guest: true })

  if (!res.ok) {
    console.error("[getPhotos]", res.status, await res.text())
    return { photos: [], nextCursor: null }
  }

  const data = await res.json()
  return {
    photos: (data.photos ?? []).map(toRecord),
    nextCursor: data.nextCursor ?? null,
  }
}

export async function uploadPhoto(
  formData: FormData,
): Promise<PhotoRecord | { error: string }> {
  let res: Response
  try {
    res = await apiFetch("/api/photos/upload", { method: "POST", body: formData }, { guest: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[uploadPhoto] network error:", msg)
    return { error: `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (${msg})` }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.error("[uploadPhoto]", res.status, text)
    let detail = ""
    try {
      const body = JSON.parse(text)
      detail = body.error ?? body.message ?? body.title ?? ""
    } catch {
      detail = text.slice(0, 300)
    }
    const message = detail
      ? `อัปโหลดไม่สำเร็จ (HTTP ${res.status}): ${detail}`
      : `อัปโหลดไม่สำเร็จ (HTTP ${res.status})`
    return { error: message }
  }

  const dto: ApiPhotoDto = await res.json()
  return toRecord(dto)
}

export async function deletePhotoByOwner(
  photoId: string,
  deviceId: string,
): Promise<{ success: boolean; error?: string }> {
  const res = await apiFetch(
    `/api/photos/${encodeURIComponent(photoId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    },
    { guest: true },
  )

  if (res.status === 404) return { success: false, error: "Photo not found" }
  if (!res.ok) return { success: false, error: "Delete failed" }
  return { success: true }
}
