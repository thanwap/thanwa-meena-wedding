"use server"

import { GUESTBOOK_TAG } from "@/lib/cache-tags"
import { apiFetch, failedCachedRead } from "@/lib/api"

export interface GuestbookEntryDto {
  id: number
  name: string
  message: string
  /** Postcard the guest wrote on; null for entries from before the postcard guestbook */
  postcardId: number | null
  imageUrls: string[]
  createdAt: string
}

export async function getGuestbookEntries(): Promise<GuestbookEntryDto[]> {
  let res: Response
  try {
    res = await apiFetch("/api/guestbook", {
      next: { revalidate: 60, tags: [GUESTBOOK_TAG] },
    })
  } catch (err) {
    return failedCachedRead([], "getGuestbookEntries", err)
  }
  if (!res.ok) return failedCachedRead([], "getGuestbookEntries", `HTTP ${res.status}`)
  return res.json()
}

export async function getRandomGuestbookEntries(count: number): Promise<GuestbookEntryDto[]> {
  let res: Response
  try {
    res = await apiFetch(`/api/guestbook?count=${count}`, {
      next: { revalidate: 60, tags: [GUESTBOOK_TAG] },
    })
  } catch (err) {
    return failedCachedRead([], "getRandomGuestbookEntries", err)
  }
  if (!res.ok) return failedCachedRead([], "getRandomGuestbookEntries", `HTTP ${res.status}`)
  return res.json()
}
