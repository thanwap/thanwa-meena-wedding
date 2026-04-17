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

export async function getRandomGuestbookEntries(count: number): Promise<GuestbookEntryDto[]> {
  const all = await getGuestbookEntries()
  const shuffled = [...all]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}
