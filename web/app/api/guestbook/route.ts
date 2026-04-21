import { NextRequest, NextResponse } from "next/server"

const API = process.env.DOTNET_API_URL!

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  const expectedOrigin = request.nextUrl.origin
  if (!origin || origin !== expectedOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const formData = await request.formData()

    const res = await fetch(`${API}/api/guestbook`, {
      method: "POST",
      body: formData,
    })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[api/guestbook POST]", err)
    return NextResponse.json({ error: "Submission failed" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const res = await fetch(`${API}/api/guestbook`, { next: { revalidate: 60 } })
    if (!res.ok) return NextResponse.json([], { status: res.status })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[api/guestbook GET]", err)
    return NextResponse.json([], { status: 500 })
  }
}
