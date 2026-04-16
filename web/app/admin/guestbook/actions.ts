"use server"

import { auth } from "@/auth"

const API = process.env.DOTNET_API_URL!

export interface GuestbookAdminDto {
  id: number
  name: string
  message: string
  imageUrls: string[]
  createdAt: string
  updatedAt: string
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

async function authHeaders() {
  const session = await auth()
  if (!session?.idToken) throw new Error("Not authenticated")
  return {
    Authorization: `Bearer ${session.idToken}`,
    "Content-Type": "application/json",
  }
}

export async function getGuestbookEntries(
  page = 1,
  pageSize = 20,
  search = "",
): Promise<PagedResult<GuestbookAdminDto>> {
  const headers = await authHeaders()
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search) params.set("search", search)
  const res = await fetch(`${API}/api/guestbook/admin?${params}`, {
    headers,
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch guestbook entries (${res.status})`)
  return res.json()
}

export async function deleteGuestbookEntry(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/guestbook/${id}`, {
      method: "DELETE",
      headers,
    })
    if (!res.ok && res.status !== 404) {
      return { success: false, error: `Delete failed (${res.status})` }
    }
    return { success: true }
  } catch (err) {
    console.error("[deleteGuestbookEntry]", err)
    return { success: false, error: "Unexpected error" }
  }
}
