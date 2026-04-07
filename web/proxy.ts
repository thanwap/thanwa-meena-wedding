import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const session = await auth()
  if (!session) {
    const callbackUrl = encodeURIComponent(
      request.nextUrl.pathname + request.nextUrl.search
    )
    return NextResponse.redirect(
      new URL(`/api/auth/signin?callbackUrl=${callbackUrl}`, request.url)
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
