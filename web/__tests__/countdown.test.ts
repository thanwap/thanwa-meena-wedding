import { describe, it, expect } from "vitest"

// Pure logic extracted from countdown.tsx for testing
function daysUntilWedding(now: number): number {
  const target = new Date("2026-12-26T00:00:00+07:00").getTime()
  const diff = target - now
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const WEDDING_DATE = new Date("2026-12-26T00:00:00+07:00").getTime()

describe("daysUntilWedding", () => {
  it("returns a positive number when the wedding is in the future", () => {
    const oneYearBefore = WEDDING_DATE - 365 * 24 * 60 * 60 * 1000
    expect(daysUntilWedding(oneYearBefore)).toBe(365)
  })

  it("returns 1 on the day before the wedding", () => {
    const dayBefore = WEDDING_DATE - 24 * 60 * 60 * 1000
    expect(daysUntilWedding(dayBefore)).toBe(1)
  })

  it("returns 0 on the wedding day itself", () => {
    expect(daysUntilWedding(WEDDING_DATE)).toBe(0)
  })

  it("returns 0 (not negative) after the wedding has passed", () => {
    const dayAfter = WEDDING_DATE + 24 * 60 * 60 * 1000
    expect(daysUntilWedding(dayAfter)).toBe(0)
  })

  it("rounds up partial days", () => {
    // 1.5 days before → should round up to 2
    const halfDayBefore = WEDDING_DATE - 1.5 * 24 * 60 * 60 * 1000
    expect(daysUntilWedding(halfDayBefore)).toBe(2)
  })
})
