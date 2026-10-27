/** Scroll choreography for the invitation envelope. `p` is how far the guest
    has scrolled through the pinned section (0 → 1); every moving part is a
    pure function of it so scrolling back up plays the scene in reverse. */

export type InvitationFrame = {
  /** Whole scene shrinks while the card is pulled out, then grows to full size */
  sceneScale: number
  /** Scene drops (fraction of envelope height) while the flap is open, so the
      flap doesn't run into the heading */
  sceneShift: number
  /** Envelope flap angle, 0 = closed, 180 = fully open */
  flap: number
  /** Envelope slides down (% of its height) and fades once the card is free */
  envelopeY: number
  envelopeOpacity: number
  /** Card slides up out of the pocket (% of the envelope's height), then settles back to centre */
  cardY: number
  /** Card lies sideways in the landscape envelope and turns upright as it settles */
  cardRotate: number
  cardScale: number
  /** Card has cleared the pocket — draw it above the envelope from here on */
  cardOut: boolean
  /** Card turn, 0 = front, 180 = back */
  flip: number
  /** "Scroll to open" hint */
  hintOpacity: number
}

export const PHASE = {
  flap: [0.03, 0.22],
  // 0.22 – 0.3: hold with the flap open so the sunset liner gets a moment
  slide: [0.3, 0.54],
  settle: [0.54, 0.68],
  flip: [0.72, 0.9],
} as const

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Ease-in-out so each phase starts and stops softly */
const smooth = (t: number) => t * t * (3 - 2 * t)
const phase = ([from, to]: readonly [number, number], p: number) =>
  smooth(clamp01((p - from) / (to - from)))

const START = 0.7
const SMALL = 0.58

export function invitationFrame(rawP: number): InvitationFrame {
  const p = clamp01(rawP)
  const flap = phase(PHASE.flap, p)
  const slide = phase(PHASE.slide, p)
  const settle = phase(PHASE.settle, p)

  return {
    sceneScale: settle > 0 ? lerp(SMALL, 1, settle) : lerp(START, SMALL, slide),
    sceneShift: lerp(0, 0.22, flap) * (1 - slide),
    flap: flap * 180,
    envelopeY: lerp(0, 38, slide) + lerp(0, 70, settle),
    envelopeOpacity: 1 - phase([0.52, 0.6], p),
    // Squared so the card drops to centre faster than it grows — keeps it clear of the heading
    cardY: lerp(0, -62, slide) * (1 - settle) ** 2,
    cardRotate: lerp(-90, 0, settle),
    cardScale: lerp(0.92, 1, settle),
    cardOut: p >= PHASE.slide[1],
    flip: phase(PHASE.flip, p) * 180,
    hintOpacity: 1 - phase([0.01, 0.08], p),
  }
}
