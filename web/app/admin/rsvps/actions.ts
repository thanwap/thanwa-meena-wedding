"use server"

import { revalidatePath } from "next/cache"
import { adminFetch } from "@/lib/admin-fetch"

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

export async function getStats(): Promise<RsvpStatsDto> {
  const res = await adminFetch("/api/rsvps/stats", { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to fetch RSVP stats: ${res.status}`)
  return res.json()
}

export async function getRsvps(
  page = 1,
  pageSize = 20,
  search = "",
  status = "",
): Promise<PagedResult<RsvpDto>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search) params.set("search", search)
  if (status && status !== "all") params.set("status", status)
  const res = await adminFetch(`/api/rsvps?${params}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to fetch RSVPs: ${res.status}`)
  return res.json()
}

export async function updateRsvpStatus(id: number, status: RsvpStatus): Promise<void> {
  const res = await adminFetch(`/api/rsvps/${id}`, {
    method: "PATCH",
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
  const res = await adminFetch("/api/rsvps/admin", {
    method: "POST",
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
  const res = await adminFetch(`/api/rsvps/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Failed to delete RSVP: ${res.status}`)
  revalidatePath("/admin/rsvps")
}

export async function batchUpdateStatus(ids: number[], status: RsvpStatus): Promise<number> {
  const res = await adminFetch("/api/rsvps/batch-status", {
    method: "POST",
    body: JSON.stringify({ ids, status }),
  })
  if (!res.ok) throw new Error(`Failed to batch update status: ${res.status}`)
  const data = await res.json()
  revalidatePath("/admin/rsvps")
  return data.updated
}

export async function regenerateGuests(rsvpId: number): Promise<void> {
  const res = await adminFetch("/api/seating/guests/regenerate", {
    method: "POST",
    body: JSON.stringify({ rsvpId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to regenerate guests: ${res.status}`)
  }
  revalidatePath("/admin/rsvps")
}

export async function updateGuestCount(id: number, guestCount: number): Promise<RsvpDto> {
  const res = await adminFetch(`/api/rsvps/${id}/guest-count`, {
    method: "PATCH",
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
  const res = await adminFetch("/api/rsvps/batch", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error(`Failed to batch delete: ${res.status}`)
  const data = await res.json()
  revalidatePath("/admin/rsvps")
  return data.deleted
}
