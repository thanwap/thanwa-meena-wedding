"use server"

import { GUESTBOOK_TAG } from "@/lib/cache-tags"

const API = process.env.DOTNET_API_URL!

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
  try {
    const res = await fetch(`${API}/api/guestbook`, {
      next: { revalidate: 60, tags: [GUESTBOOK_TAG] },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getRandomGuestbookEntries(count: number): Promise<GuestbookEntryDto[]> {
  try {
    const res = await fetch(`${API}/api/guestbook?count=${count}`, {
      next: { revalidate: 60, tags: [GUESTBOOK_TAG] },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}
