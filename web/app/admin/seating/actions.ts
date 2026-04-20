"use server"

import { revalidatePath } from "next/cache"
import { adminFetch } from "@/lib/admin-fetch"
import type { SeatingOverviewDto, WeddingTableDto, GuestDto } from "./types"

export async function getSeatingOverview(): Promise<SeatingOverviewDto> {
  const res = await adminFetch("/api/seating", { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to fetch seating overview: ${res.status}`)
  return res.json()
}

export async function createTable(data: {
  name: string
  capacity: number
  shape: string
}): Promise<WeddingTableDto> {
  const res = await adminFetch("/api/seating/tables", {
    method: "POST",
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to create table: ${res.status}`)
  revalidatePath("/admin/seating")
  return res.json()
}

export async function updateTable(
  id: number,
  data: { name?: string; capacity?: number; shape?: string },
): Promise<WeddingTableDto> {
  const res = await adminFetch(`/api/seating/tables/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to update table: ${res.status}`)
  revalidatePath("/admin/seating")
  return res.json()
}

export async function updateTablePosition(
  id: number,
  positionX: number,
  positionY: number,
): Promise<void> {
  const res = await adminFetch(`/api/seating/tables/${id}/position`, {
    method: "PATCH",
    body: JSON.stringify({ positionX, positionY }),
  })
  if (!res.ok) throw new Error(`Failed to update table position: ${res.status}`)
}

export async function deleteTable(id: number): Promise<void> {
  const res = await adminFetch(`/api/seating/tables/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Failed to delete table: ${res.status}`)
  revalidatePath("/admin/seating")
}

export async function updateGuest(
  id: number,
  data: { name?: string; tableId?: number },
): Promise<GuestDto> {
  const res = await adminFetch(`/api/seating/guests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Failed to update guest: ${res.status} ${body}`)
  }
  return res.json()
}

export async function unassignGuest(id: number): Promise<void> {
  const res = await adminFetch(`/api/seating/guests/${id}/unassign`, { method: "PATCH" })
  if (!res.ok) throw new Error(`Failed to unassign guest: ${res.status}`)
}
