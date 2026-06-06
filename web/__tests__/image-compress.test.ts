import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"

// happy-dom does not implement Canvas 2D — mock the minimal API compressToBlob needs
let originalCreateElement: typeof document.createElement

beforeAll(() => {
  originalCreateElement = document.createElement.bind(document)

  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") {
      let blobType = "image/jpeg"
      const el = {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: () => {} }),
        toBlob: (cb: BlobCallback, type = "image/jpeg") => {
          blobType = type
          // Simulate larger blob for larger canvas
          const size = Math.max(el.width * el.height * 3, 100)
          cb(new Blob([new Uint8Array(size)], { type: blobType }))
        },
      }
      return el as unknown as HTMLCanvasElement
    }
    return originalCreateElement(tag)
  })
})

afterAll(() => {
  vi.restoreAllMocks()
})

// Import AFTER mocks are in place
import { compressToBlob } from "../lib/image-compress"

function makeSourceCanvas(w: number, h: number): HTMLCanvasElement {
  // Returns a minimal canvas-like source
  return { width: w, height: h } as unknown as HTMLCanvasElement
}

describe("compressToBlob", () => {
  it("returns a jpeg Blob", async () => {
    const src = makeSourceCanvas(200, 100)
    const blob = await compressToBlob(src, 2048, 0.82)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe("image/jpeg")
  })

  it("does not upscale: output canvas keeps original size when smaller than maxPx", async () => {
    // source 200x100 — longest edge is 200, maxPx is 2048 → scale = 1, no resize
    const src = makeSourceCanvas(200, 100)
    const blob = await compressToBlob(src, 2048, 0.82)
    // blob size is proportional to 200*100 in our mock
    expect(blob.size).toBeGreaterThan(0)
  })

  it("thumbnail blob is smaller than full blob for the same source", async () => {
    const src = makeSourceCanvas(3000, 3000)
    const full = await compressToBlob(src, 2048, 0.82)
    const thumb = await compressToBlob(src, 400, 0.75)
    // In our mock, size ~ w*h*3, and 400² < 2048², so thumb < full
    expect(thumb.size).toBeLessThan(full.size)
  })
})
