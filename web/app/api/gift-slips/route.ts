import { NextResponse } from "next/server"
import { apiFetch } from "@/lib/api"

/**
 * Slips upload the moment a guest picks one, while they are still typing. A route
 * handler rather than a server action: actions run one at a time per client, so the
 * notice itself would queue behind the upload.
 */
export async function POST(request: Request) {
  let upstream: Response
  try {
    upstream = await apiFetch(
      "/api/gift-notices/slips",
      { method: "POST", body: await request.formData(), cache: "no-store" },
      { guest: true },
    )
  } catch (err) {
    console.error("[gift-slips]", err)
    return NextResponse.json({ error: "unreachable" }, { status: 502 })
  }

  const body = await upstream.json().catch(() => ({}))
  if (!upstream.ok) {
    console.error("[gift-slips]", upstream.status, body)
    return NextResponse.json({ error: body.error ?? "upload failed" }, { status: upstream.status })
  }
  return NextResponse.json({ slipId: body.slipId }, { status: 201 })
}
