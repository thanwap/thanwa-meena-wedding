"use server"

const API = process.env.DOTNET_API_URL!

export interface PhotoRecord {
  id: string
  deviceId: string
  displayName: string
  fullUrl: string
  thumbUrl: string
  filterName: string
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

function toRecord(dto: ApiPhotoDto): PhotoRecord {
  return {
    id: dto.id,
    deviceId: dto.deviceId,
    displayName: dto.displayName,
    fullUrl: dto.fullUrl,
    thumbUrl: dto.thumbUrl,
    filterName: dto.filterName,
    createdAt: dto.createdAt,
  }
}

export async function getPhotos(options?: {
  cursor?: string
  limit?: number
  deviceId?: string
}): Promise<{ photos: PhotoRecord[]; nextCursor: string | null }> {
  const params = new URLSearchParams()
  if (options?.limit) params.set("limit", String(options.limit))
  if (options?.cursor) params.set("cursor", options.cursor)
  if (options?.deviceId) params.set("deviceId", options.deviceId)

  const res = await fetch(`${API}/api/photos?${params}`, { cache: "no-store" })

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
  const res = await fetch(`${API}/api/photos/upload`, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: body.error ?? "Upload failed, please try again" }
  }

  const dto: ApiPhotoDto = await res.json()
  return toRecord(dto)
}

export async function deletePhotoByOwner(
  photoId: string,
  deviceId: string,
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API}/api/photos/${photoId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  })

  if (res.status === 404) return { success: false, error: "Photo not found" }
  if (!res.ok) return { success: false, error: "Delete failed" }
  return { success: true }
}
