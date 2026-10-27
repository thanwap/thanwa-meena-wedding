import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { apiFetch } from "@/lib/api"

export async function GET() {
  const session = await auth()
  if (!session?.idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const upstream = await apiFetch("/api/gift-notices/export.csv", {
    headers: { Authorization: `Bearer ${session.idToken}` },
    cache: "no-store",
  })

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream error: ${upstream.status}` },
      { status: upstream.status },
    )
  }

  // Bytes, not text(): text() would drop the BOM Excel needs to read Thai as UTF-8
  return new NextResponse(await upstream.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gift-notices.csv"',
    },
  })
}
