"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

const API = process.env.DOTNET_API_URL!

export type RsvpStatus = "pending" | "confirmed" | "cancelled"

export interface RsvpDto {
  id: number
  attending: boolean
  name: string
  guestCount: number
  dietary: string | null
  message: string | null
  status: RsvpStatus
  createdAt: string
  updatedAt: string
}

export interface RsvpStatsDto {
  total: number
  attending: number
  declining: number
  totalGuests: number
  confirmedGuests: number
  pending: number
  confirmed: number
  cancelled: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

async function getIdToken(): Promise<string> {
  const session = await auth()
  if (!session?.idToken) throw new Error("Not authenticated")
  return session.idToken
}

async function authHeaders() {
  const token = await getIdToken()
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export async function getStats(): Promise<RsvpStatsDto> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/rsvps/stats`, {
    headers,
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch RSVP stats: ${res.status}`)
  return res.json()
}

export async function getRsvps(
  page = 1,
  pageSize = 20,
  search = "",
  status = "",
): Promise<PagedResult<RsvpDto>> {
  const headers = await authHeaders()
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search) params.set("search", search)
  if (status && status !== "all") params.set("status", status)
  const res = await fetch(`${API}/api/rsvps?${params}`, { headers, cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to fetch RSVPs: ${res.status}`)
  return res.json()
}

export async function updateRsvpStatus(
  id: number,
  status: RsvpStatus,
): Promise<void> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/rsvps/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error(`Failed to update RSVP status: ${res.status}`)
  revalidatePath("/admin/rsvps")
}

export interface CreateRsvpInput {
  name: string
  attending: boolean
  guestCount: number
  dietary?: string
  message?: string
  status: RsvpStatus
}

export async function createRsvp(input: CreateRsvpInput): Promise<RsvpDto> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/rsvps/admin`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: input.name,
      attending: input.attending,
      guestCount: input.guestCount,
      dietary: input.dietary ?? null,
      message: input.message ?? null,
      status: input.status,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to create RSVP: ${res.status}`)
  }
  revalidatePath("/admin/rsvps")
  return res.json()
}

export async function deleteRsvp(id: number): Promise<void> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/rsvps/${id}`, {
    method: "DELETE",
    headers,
  })
  if (!res.ok) throw new Error(`Failed to delete RSVP: ${res.status}`)
  revalidatePath("/admin/rsvps")
}

export async function batchUpdateStatus(ids: number[], status: RsvpStatus): Promise<number> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/rsvps/batch-status`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ids, status }),
  })
  if (!res.ok) throw new Error(`Failed to batch update status: ${res.status}`)
  const data = await res.json()
  revalidatePath("/admin/rsvps")
  return data.updated
}

export async function regenerateGuests(rsvpId: number): Promise<void> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/seating/guests/regenerate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ rsvpId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to regenerate guests: ${res.status}`)
  }
  revalidatePath("/admin/rsvps")
}

export async function updateGuestCount(id: number, guestCount: number): Promise<RsvpDto> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/rsvps/${id}/guest-count`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ guestCount }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to update guest count: ${res.status}`)
  }
  revalidatePath("/admin/rsvps")
  return res.json()
}

export async function batchDelete(ids: number[]): Promise<number> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/rsvps/batch`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error(`Failed to batch delete: ${res.status}`)
  const data = await res.json()
  revalidatePath("/admin/rsvps")
  return data.deleted
}
