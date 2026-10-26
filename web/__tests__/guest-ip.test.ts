// @vitest-environment node
import { describe, it, expect } from "vitest"
import { guestIp } from "../lib/guest-ip"

const CLOUDFLARE_EDGE = "172.68.1.10"

describe("guestIp", () => {
  it("uses cf-connecting-ip when the request came through Cloudflare", () => {
    const h = new Headers({ "x-real-ip": CLOUDFLARE_EDGE, "cf-connecting-ip": "203.0.113.7" })
    expect(guestIp(h)).toBe("203.0.113.7")
  })

  it("trusts cf-connecting-ip for Cloudflare's IPv6 edges too", () => {
    const h = new Headers({ "x-real-ip": "2606:4700:10::1", "cf-connecting-ip": "2001:db8::5" })
    expect(guestIp(h)).toBe("2001:db8::5")
  })

  it("ignores a forged cf-connecting-ip from a caller that skipped Cloudflare", () => {
    const h = new Headers({ "x-real-ip": "198.51.100.9", "cf-connecting-ip": "203.0.113.7" })
    expect(guestIp(h)).toBe("198.51.100.9")
  })

  it("falls back to the first x-forwarded-for entry", () => {
    const h = new Headers({ "x-forwarded-for": "198.51.100.9, 10.0.0.1" })
    expect(guestIp(h)).toBe("198.51.100.9")
  })

  it("keeps the Cloudflare edge when cf-connecting-ip is missing or garbage", () => {
    expect(guestIp(new Headers({ "x-real-ip": CLOUDFLARE_EDGE }))).toBe(CLOUDFLARE_EDGE)
    expect(guestIp(new Headers({ "x-real-ip": CLOUDFLARE_EDGE, "cf-connecting-ip": "1.2.3.4; DROP" }))).toBe(CLOUDFLARE_EDGE)
  })

  it("returns null when there is no usable address", () => {
    expect(guestIp(new Headers())).toBeNull()
    expect(guestIp(new Headers({ "x-real-ip": "not-an-ip" }))).toBeNull()
  })
})
