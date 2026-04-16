"use server"

const API = process.env.DOTNET_API_URL!

export interface GuestbookEntryDto {
  id: number
  name: string
  message: string
  imageUrls: string[]
  createdAt: string
}

export async function getGuestbookEntries(): Promise<GuestbookEntryDto[]> {
  try {
    const res = await fetch(`${API}/api/guestbook`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}
