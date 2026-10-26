import { BlockList, isIP } from "node:net"

/**
 * Cloudflare's edge ranges (https://www.cloudflare.com/ips/, checked 2026-10-26).
 * Requests reach Vercel through Cloudflare, so Vercel only sees one of these.
 */
const CLOUDFLARE_V4 = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
  "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
  "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
]
const CLOUDFLARE_V6 = [
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32",
  "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32",
]

const cloudflare = new BlockList()
for (const cidr of CLOUDFLARE_V4) {
  const [net, bits] = cidr.split("/")
  cloudflare.addSubnet(net, Number(bits), "ipv4")
}
for (const cidr of CLOUDFLARE_V6) {
  const [net, bits] = cidr.split("/")
  cloudflare.addSubnet(net, Number(bits), "ipv6")
}

function isCloudflare(ip: string): boolean {
  const family = isIP(ip)
  return family !== 0 && cloudflare.check(ip, family === 4 ? "ipv4" : "ipv6")
}

/**
 * The guest's real IP, for per-guest rate limits.
 *
 * Vercel overwrites `x-real-ip` / `x-forwarded-for` with whoever connected to it, so a
 * client can't fake those. Behind Cloudflare that is a Cloudflare edge, and only then
 * is `cf-connecting-ip` trusted — someone who skips Cloudflare and sends their own
 * `cf-connecting-ip` is keyed by the address they actually connected from.
 */
export function guestIp(headers: Headers): string | null {
  const edge = (headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0])?.trim()
  if (!edge || !isIP(edge)) return null

  if (isCloudflare(edge)) {
    const client = headers.get("cf-connecting-ip")?.trim()
    if (client && isIP(client)) return client
  }
  return edge
}
