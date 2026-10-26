// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const apiFetch = vi.fn()
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}))

const { getRandomGuestbookEntries } = await import("../app/actions/guestbook")
const { getPreweddingPhotos } = await import("../app/actions/prewedding")

const down = () => apiFetch.mockResolvedValue(new Response("", { status: 502 }))
const unreachable = () => apiFetch.mockRejectedValue(new TypeError("fetch failed"))

describe("landing page reads when the API is down", () => {
  beforeEach(() => {
    apiFetch.mockReset()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => {
    delete process.env.NEXT_PHASE
    vi.restoreAllMocks()
  })

  it("throw at runtime so ISR keeps the last good page instead of an empty box", async () => {
    down()
    await expect(getRandomGuestbookEntries(24)).rejects.toThrow("API unavailable")
    await expect(getPreweddingPhotos()).rejects.toThrow("API unavailable")
    unreachable()
    await expect(getRandomGuestbookEntries(24)).rejects.toThrow("API unavailable")
  })

  it("render empty during next build so a deploy doesn't need the API", async () => {
    process.env.NEXT_PHASE = "phase-production-build"
    down()
    await expect(getRandomGuestbookEntries(24)).resolves.toEqual([])
    unreachable()
    await expect(getPreweddingPhotos()).resolves.toEqual([])
  })

  it("return the entries when the API answers", async () => {
    apiFetch.mockResolvedValue(Response.json([{ id: 1, name: "Mint" }]))
    await expect(getRandomGuestbookEntries(24)).resolves.toEqual([{ id: 1, name: "Mint" }])
  })
})
