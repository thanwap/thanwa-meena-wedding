"use server"

import { apiFetch } from "@/lib/api"

export interface GiftNoticeInput {
  giver: string
  /** ISO instant */
  transferredAt: string
  amount: number | null
  slipId: string | null
}

export async function submitGiftNotice(
  input: GiftNoticeInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const res = await apiFetch(
      "/api/gift-notices",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
      { guest: true },
    )

    if (res.ok) return { success: true }
    if (res.status === 429) return { success: false, error: "ส่งถี่เกินไป ลองใหม่อีกครั้งในอีกสักครู่" }
    console.error("[submitGiftNotice]", res.status, await res.text().catch(() => ""))
    return { success: false, error: "ส่งไม่สำเร็จ ลองใหม่อีกครั้งนะ" }
  } catch (err) {
    console.error("[submitGiftNotice]", err)
    return { success: false, error: "เชื่อมต่อไม่ได้ ลองใหม่อีกครั้งนะ" }
  }
}
