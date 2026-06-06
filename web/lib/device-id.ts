const DEVICE_ID_KEY = "wedding_device_id"
const DISPLAY_NAME_KEY = "wedding_display_name"
const PHOTO_COUNT_KEY = "wedding_photo_count"

export const MAX_PHOTOS = 10

export function getDeviceId(): string {
  if (typeof window === "undefined") return ""
  const existing = localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_KEY, id)
  return id
}

export function getDisplayName(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(DISPLAY_NAME_KEY)
}

export function setDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_NAME_KEY, name.trim())
}

export function getPhotoCount(): number {
  if (typeof window === "undefined") return 0
  return parseInt(localStorage.getItem(PHOTO_COUNT_KEY) ?? "0", 10)
}

export function incrementPhotoCount(): number {
  const next = getPhotoCount() + 1
  localStorage.setItem(PHOTO_COUNT_KEY, String(next))
  return next
}

export function hasReachedLimit(): boolean {
  return getPhotoCount() >= MAX_PHOTOS
}
