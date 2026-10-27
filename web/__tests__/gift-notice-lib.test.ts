import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/image-compress", () => ({ compressToBlob: vi.fn() }))

import { compressToBlob } from "@/lib/image-compress"
import {
  SLIP_MAX_EDGE,
  fromBangkokInput,
  parseAmount,
  prepareSlip,
  toBangkokInput,
  validateNotice,
} from "@/lib/gift-notice"

describe("Bangkok time input", () => {
  it("formats an instant as Bangkok wall time", () => {
    expect(toBangkokInput(new Date("2026-12-26T07:32:00Z"))).toBe("2026-12-26T14:32")
  })

  it("rolls over midnight", () => {
    expect(toBangkokInput(new Date("2026-12-26T18:05:00Z"))).toBe("2026-12-27T01:05")
  })

  it("reads the input back as +07:00", () => {
    expect(fromBangkokInput("2026-12-26T14:32")?.toISOString()).toBe("2026-12-26T07:32:00.000Z")
  })

  it("rejects anything else", () => {
    expect(fromBangkokInput("")).toBeNull()
    expect(fromBangkokInput("26/12/2026 14:32")).toBeNull()
  })
})

describe("parseAmount", () => {
  it("is null when blank", () => {
    expect(parseAmount("  ")).toBeNull()
  })

  it("accepts commas, baht sign and up to 2 decimals", () => {
    expect(parseAmount("1,500")).toBe(1500)
    expect(parseAmount("฿ 2000.50")).toBe(2000.5)
  })

  it("is NaN for nonsense, zero, negatives and 3 decimals", () => {
    for (const raw of ["abc", "0", "-5", "10.505", "20000000"]) expect(parseAmount(raw)).toBeNaN()
  })
})

describe("validateNotice", () => {
  const now = new Date("2026-12-26T08:00:00Z")
  const ok = { giver: "ต้อม & แนน", time: "2026-12-26T14:55", amount: "" }

  it("passes with giver and time only", () => {
    expect(validateNotice(ok, now)).toEqual({})
  })

  it("needs a giver", () => {
    expect(validateNotice({ ...ok, giver: "   " }, now).giver).toBeDefined()
  })

  it("needs a time that isn't in the future", () => {
    expect(validateNotice({ ...ok, time: "" }, now).time).toBeDefined()
    expect(validateNotice({ ...ok, time: "2026-12-26T16:00" }, now).time).toBeDefined()
  })

  it("allows a few minutes of clock drift", () => {
    expect(validateNotice({ ...ok, time: "2026-12-26T15:05" }, now)).toEqual({})
  })

  it("flags a bad amount", () => {
    expect(validateNotice({ ...ok, amount: "หนึ่งพัน" }, now).amount).toBeDefined()
  })
})

describe("prepareSlip", () => {
  beforeEach(() => vi.clearAllMocks())

  it("always re-encodes to a small JPEG and frees the bitmap", async () => {
    const close = vi.fn()
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 1170, height: 2532, close }))
    const out = new Blob(["jpeg"], { type: "image/jpeg" })
    vi.mocked(compressToBlob).mockResolvedValue(out)

    const result = await prepareSlip(new File(["x"], "slip.png", { type: "image/png" }))

    expect(result).toBe(out)
    expect(compressToBlob).toHaveBeenCalledWith(expect.anything(), SLIP_MAX_EDGE, expect.any(Number))
    expect(close).toHaveBeenCalled()
  })
})
