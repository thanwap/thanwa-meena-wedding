"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { SeatingOverviewDto, WeddingTableDto, GuestDto } from "./types"

const API = process.env.DOTNET_API_URL!

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

export async function getSeatingOverview(): Promise<SeatingOverviewDto> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/seating`, { headers, cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to fetch seating overview: ${res.status}`)
  return res.json()
}

export async function createTable(data: {
  name: string
  capacity: number
  shape: string
}): Promise<WeddingTableDto> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/seating/tables`, {
    method: "POST",
    headers,
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
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/seating/tables/${id}`, {
    method: "PATCH",
    headers,
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
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/seating/tables/${id}/position`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ positionX, positionY }),
  })
  if (!res.ok) throw new Error(`Failed to update table position: ${res.status}`)
  revalidatePath("/admin/seating")
}

export async function deleteTable(id: number): Promise<void> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/seating/tables/${id}`, {
    method: "DELETE",
    headers,
  })
  if (!res.ok) throw new Error(`Failed to delete table: ${res.status}`)
  revalidatePath("/admin/seating")
}

export async function generateGuests(rsvpId: number): Promise<GuestDto[]> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/seating/guests/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ rsvpId }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Failed to generate guests: ${res.status} ${body}`)
  }
  revalidatePath("/admin/seating")
  return res.json()
}

export async function generateAllGuests(): Promise<GuestDto[]> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/seating/guests/generate-all`, {
    method: "POST",
    headers,
  })
  if (!res.ok) throw new Error(`Failed to generate guests: ${res.status}`)
  revalidatePath("/admin/seating")
  return res.json()
}

export async function updateGuest(
  id: number,
  data: { name?: string; tableId?: number },
): Promise<GuestDto> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/seating/guests/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Failed to update guest: ${res.status} ${body}`)
  }
  revalidatePath("/admin/seating")
  return res.json()
}

export async function unassignGuest(id: number): Promise<void> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/seating/guests/${id}/unassign`, {
    method: "PATCH",
    headers,
  })
  if (!res.ok) throw new Error(`Failed to unassign guest: ${res.status}`)
  revalidatePath("/admin/seating")
}
