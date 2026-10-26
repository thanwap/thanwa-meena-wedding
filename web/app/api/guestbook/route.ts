import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { GUESTBOOK_TAG } from "@/lib/cache-tags"
import { apiFetch } from "@/lib/api"

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  const expectedOrigin = request.nextUrl.origin
  if (!origin || origin !== expectedOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const formData = await request.formData()

    const res = await apiFetch("/api/guestbook", { method: "POST", body: formData }, { guest: true })

    const data = await res.json().catch(() => ({}))
    // Expire now, not stale-while-revalidate: a guest who reloads should find their letter in the box
    if (res.ok) revalidateTag(GUESTBOOK_TAG, { expire: 0 })
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[api/guestbook POST]", err)
    return NextResponse.json({ error: "Submission failed" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const res = await apiFetch("/api/guestbook", { next: { revalidate: 60 } })
    if (!res.ok) return NextResponse.json([], { status: res.status })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[api/guestbook GET]", err)
    return NextResponse.json([], { status: 500 })
  }
}
