import { headers } from "next/headers"
import { guestIp } from "@/lib/guest-ip"

const API = process.env.DOTNET_API_URL!

/**
 * Every call to the .NET API goes through here. The API only answers requests that carry
 * the gateway secret, so its public URL is useless without the site in front of it.
 *
 * `guest: true` forwards the visitor's IP for the API's per-guest rate limits — only for
 * calls made while handling a guest's request (not for cached, shared reads).
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  { guest = false }: { guest?: boolean } = {},
): Promise<Response> {
  const requestHeaders = new Headers(init.headers)
  const secret = process.env.API_GATEWAY_SECRET
  if (secret) requestHeaders.set("X-Gateway-Secret", secret)
  else if (process.env.NODE_ENV === "production") console.error("[apiFetch] API_GATEWAY_SECRET is not set — the API will answer 403")

  if (guest) {
    const ip = guestIp(await headers())
    if (ip) requestHeaders.set("X-Guest-Ip", ip)
  }

  return fetch(`${API}${path}`, { ...init, headers: requestHeaders })
}
