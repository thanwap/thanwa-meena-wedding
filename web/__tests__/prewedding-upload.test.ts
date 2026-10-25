import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/image-compress", () => ({ compressToBlob: vi.fn() }))

import { compressToBlob } from "@/lib/image-compress"
import { isAcceptedImage, prepareForUpload, PASSTHROUGH_BYTES } from "@/lib/prewedding-upload"

const mockCompress = vi.mocked(compressToBlob)

function fileOfSize(bytes: number, name = "photo.jpg", type = "image/jpeg") {
  const file = new File(["x"], name, { type })
  Object.defineProperty(file, "size", { value: bytes })
  return file
}

beforeEach(() => {
  vi.clearAllMocks()
  stubBitmap(6000, 4000)
})

function stubBitmap(width: number, height: number) {
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width, height, close: vi.fn() }))
}

describe("isAcceptedImage", () => {
  it("accepts jpeg and png by MIME type", () => {
    expect(isAcceptedImage(fileOfSize(1, "a", "image/jpeg"))).toBe(true)
    expect(isAcceptedImage(fileOfSize(1, "a", "image/png"))).toBe(true)
  })

  it("accepts by extension when the MIME type is missing", () => {
    expect(isAcceptedImage(fileOfSize(1, "IMG_1.JPEG", ""))).toBe(true)
  })

  it("rejects other formats", () => {
    expect(isAcceptedImage(fileOfSize(1, "a.gif", "image/gif"))).toBe(false)
    expect(isAcceptedImage(fileOfSize(1, "a.heic", "image/heic"))).toBe(false)
  })
})

describe("prepareForUpload", () => {
  it("sends files already within 2400px and the size limit untouched", async () => {
    stubBitmap(2400, 1600)
    const file = fileOfSize(PASSTHROUGH_BYTES)
    expect(await prepareForUpload(file)).toBe(file)
    expect(mockCompress).not.toHaveBeenCalled()
  })

  it("pre-shrinks small files with more than 2400px to 2400px JPEG", async () => {
    const shrunk = new Blob(["y"])
    mockCompress.mockResolvedValueOnce(shrunk)

    expect(await prepareForUpload(fileOfSize(3 * 1024 * 1024))).toBe(shrunk)
    expect(mockCompress).toHaveBeenCalledWith(expect.anything(), 2400, 0.92)
  })

  it("pre-shrinks large files to 2400px JPEG", async () => {
    const shrunk = new Blob(["y"])
    mockCompress.mockResolvedValueOnce(shrunk)

    expect(await prepareForUpload(fileOfSize(12 * 1024 * 1024))).toBe(shrunk)
    expect(mockCompress).toHaveBeenCalledWith(expect.anything(), 2400, 0.92)
  })

  it("steps quality down until the result fits", async () => {
    const tooBig = { size: PASSTHROUGH_BYTES + 1 } as Blob
    const fits = new Blob(["z"])
    mockCompress.mockResolvedValueOnce(tooBig).mockResolvedValueOnce(fits)

    expect(await prepareForUpload(fileOfSize(20 * 1024 * 1024))).toBe(fits)
    expect(mockCompress).toHaveBeenLastCalledWith(expect.anything(), 2400, 0.85)
  })

  it("throws when even the lowest quality is too large", async () => {
    mockCompress.mockResolvedValue({ size: PASSTHROUGH_BYTES + 1 } as Blob)

    await expect(prepareForUpload(fileOfSize(30 * 1024 * 1024))).rejects.toThrow(/too large/)
  })
})
