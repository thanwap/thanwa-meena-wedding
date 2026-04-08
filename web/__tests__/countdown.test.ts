import { describe, it, expect } from "vitest"

const TARGET = new Date("2026-12-26T00:00:00+07:00").getTime()

function getTimeLeft(now: number) {
  const diff = Math.max(0, TARGET - now)
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

describe("getTimeLeft", () => {
  it("returns all zeros on the wedding date", () => {
    const t = getTimeLeft(TARGET)
    expect(t).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it("returns all zeros after the wedding has passed", () => {
    const t = getTimeLeft(TARGET + 1000 * 60 * 60)
    expect(t).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it("returns correct days when exactly N days remain", () => {
    const t = getTimeLeft(TARGET - 10 * 24 * 60 * 60 * 1000)
    expect(t.days).toBe(10)
    expect(t.hours).toBe(0)
    expect(t.minutes).toBe(0)
    expect(t.seconds).toBe(0)
  })

  it("breaks time into hours/minutes/seconds correctly", () => {
    const diff = 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 4 * 60 * 1000 + 5 * 1000
    const t = getTimeLeft(TARGET - diff)
    expect(t.days).toBe(2)
    expect(t.hours).toBe(3)
    expect(t.minutes).toBe(4)
    expect(t.seconds).toBe(5)
  })

  it("hours do not exceed 23", () => {
    const t = getTimeLeft(TARGET - 25 * 60 * 60 * 1000)
    expect(t.days).toBe(1)
    expect(t.hours).toBe(1)
  })
})
