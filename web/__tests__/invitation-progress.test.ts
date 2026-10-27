import { describe, it, expect } from "vitest"
import { invitationFrame, PHASE } from "../lib/invitation-progress"

describe("invitationFrame", () => {
  it("starts with a closed envelope and the card tucked inside, front up", () => {
    const f = invitationFrame(0)
    expect(f.flap).toBe(0)
    expect(f.cardY).toBe(0)
    expect(f.cardRotate).toBe(-90)
    expect(f.cardOut).toBe(false)
    expect(f.flip).toBe(0)
    expect(f.envelopeOpacity).toBe(1)
    expect(f.hintOpacity).toBe(1)
  })

  it("opens the flap fully before the card starts to move", () => {
    const f = invitationFrame(PHASE.slide[0])
    expect(f.flap).toBe(180)
    expect(f.cardY).toBe(0)
    expect(f.hintOpacity).toBe(0)
  })

  it("frees the card and drops the envelope once the slide is done", () => {
    expect(invitationFrame(PHASE.slide[1] - 0.001).cardOut).toBe(false)
    expect(invitationFrame(PHASE.slide[1]).cardOut).toBe(true)
    const settled = invitationFrame(PHASE.settle[1])
    expect(settled.envelopeOpacity).toBe(0)
    expect(settled.cardY).toBeCloseTo(0)
    expect(settled.cardScale).toBe(1)
    expect(settled.cardRotate).toBe(0)
    expect(settled.sceneScale).toBe(1)
    expect(settled.flip).toBe(0)
  })

  it("ends on the back of the card and clamps out-of-range progress", () => {
    expect(invitationFrame(1).flip).toBe(180)
    expect(invitationFrame(1.4)).toEqual(invitationFrame(1))
    expect(invitationFrame(-0.3)).toEqual(invitationFrame(0))
  })

  it("turns the flap and the card monotonically as the guest scrolls", () => {
    let prev = invitationFrame(0)
    for (let p = 0.01; p <= 1; p += 0.01) {
      const f = invitationFrame(p)
      expect(f.flap).toBeGreaterThanOrEqual(prev.flap)
      expect(f.flip).toBeGreaterThanOrEqual(prev.flip)
      expect(f.envelopeOpacity).toBeLessThanOrEqual(prev.envelopeOpacity)
      prev = f
    }
  })
})
