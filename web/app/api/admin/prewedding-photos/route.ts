import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { apiFetch } from "@/lib/api"
import { PREWEDDING_CACHE_TAG } from "@/lib/prewedding"

/**
 * Upload goes through a route handler, not a server action: Next.js runs a client's
 * server actions one at a time, which would serialise the admin's parallel uploads.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const upstream = await apiFetch("/api/prewedding-photos", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.idToken}` },
    body: await request.formData(),
    cache: "no-store",
  })

  const body = await upstream.json().catch(() => ({}))
  if (!upstream.ok) {
    return NextResponse.json(
      { error: body.error ?? `Upload failed (HTTP ${upstream.status})` },
      { status: upstream.status },
    )
  }

  revalidateTag(PREWEDDING_CACHE_TAG, { expire: 0 })
  return NextResponse.json(body, { status: 201 })
}
