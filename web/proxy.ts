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
      new URL(`/admin/login?callbackUrl=${callbackUrl}`, request.url)
    )
  }

  const isSuperAdminRoute = request.nextUrl.pathname.startsWith("/admin/users")
  if (isSuperAdminRoute && session.role !== "super_admin") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protect everything under /admin EXCEPT the login page itself
    "/admin/((?!login).*)",
    "/admin",
  ],
}
