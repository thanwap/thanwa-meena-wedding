"use server"

import { adminFetch } from "@/lib/admin-fetch"

export interface GiftNoticeDto {
  id: string
  giver: string
  transferredAt: string
  amount: number | null
  hasSlip: boolean
  /** Signed, expires after ~5 minutes */
  slipUrl: string | null
  verified: boolean
  createdAt: string
}

type Result<T = undefined> = { success: true; data: T } | { success: false; error: string }

async function errorFrom(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}))
  return body.error ?? `${fallback} (HTTP ${res.status})`
}

export async function getGiftNotices(): Promise<GiftNoticeDto[]> {
  const res = await adminFetch("/api/gift-notices", { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to fetch gift notices: ${res.status}`)
  return res.json()
}

export async function updateGiftNotice(
  id: string,
  fields: { amount: number | null; verified: boolean },
): Promise<Result<GiftNoticeDto>> {
  const res = await adminFetch(`/api/gift-notices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  })
  if (!res.ok) return { success: false, error: await errorFrom(res, "Update failed") }
  return { success: true, data: await res.json() }
}

export async function deleteGiftNotice(id: string): Promise<Result> {
  const res = await adminFetch(`/api/gift-notices/${id}`, { method: "DELETE" })
  if (!res.ok) return { success: false, error: await errorFrom(res, "Delete failed") }
  return { success: true, data: undefined }
}

export async function deleteAllSlips(): Promise<Result<number>> {
  const res = await adminFetch("/api/gift-notices/slips", { method: "DELETE" })
  if (!res.ok) return { success: false, error: await errorFrom(res, "Delete failed") }
  const body = await res.json()
  return { success: true, data: body.deleted }
}
