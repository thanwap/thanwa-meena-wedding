import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiUrl = process.env.DOTNET_API_URL
  if (!apiUrl) {
    return NextResponse.json(
      { error: "API URL not configured" },
      { status: 500 },
    )
  }

  const upstream = await fetch(`${apiUrl}/api/rsvps/export.csv`, {
    headers: { Authorization: `Bearer ${session.idToken}` },
    cache: "no-store",
  })

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream error: ${upstream.status}` },
      { status: upstream.status },
    )
  }

  const csv = await upstream.text()

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="rsvps.csv"',
    },
  })
}
