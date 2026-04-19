"use server"

const API = process.env.DOTNET_API_URL!

interface TableSearchResult {
  tableName: string
  guests: string[]
}

interface GuestSearchResult {
  guestName: string
  table: TableSearchResult | null
}

export async function searchTable(
  name: string,
): Promise<{ results: GuestSearchResult[] } | { error: string }> {
  const trimmed = name.trim()
  if (trimmed.length < 2) {
    return { error: "กรุณาพิมพ์ชื่ออย่างน้อย 2 ตัวอักษร" }
  }

  try {
    const res = await fetch(
      `${API}/api/table/search?name=${encodeURIComponent(trimmed)}`,
      { cache: "no-store" },
    )

    if (res.status === 429) {
      return { error: "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่" }
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      return { error: body?.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่" }
    }

    const results: GuestSearchResult[] = await res.json()
    return { results }
  } catch {
    return { error: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่" }
  }
}
