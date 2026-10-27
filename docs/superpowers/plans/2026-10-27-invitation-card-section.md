# Invitation Card section — scroll-driven envelope reveal

New landing section directly under the Hero. As the guest scrolls, an envelope
(modelled on the real cream envelope with the sunset-painting liner) opens, the
invitation card slides out, settles in the centre, then flips to show the back.

Source assets: `to-ai/section-invitation-card/`
- `1.png` — card front (code poem, "Thanwa / Jittinan" script, 26.12.26), 1240×1748
- `2.png` — card back (Thai invitation, schedule, QR, dress code), 1240×1748
- `physical-card/*.jpg` — real photos; used for envelope colour + liner art

## Design

**Scroll choreography** (one sticky stage, section 220svh tall, progress `p` 0→1):

| p           | What happens                                                        |
|-------------|---------------------------------------------------------------------|
| 0.00 – 0.12 | Envelope rises in, slight tilt settling to flat                     |
| 0.12 – 0.32 | Flap rotates open (`rotateX` 0 → 180°), sunset liner revealed; z-order swaps at 90° so the open flap sits behind the card |
| 0.32 – 0.58 | Card slides up out of the pocket (pocket front stays in front of it) |
| 0.58 – 0.70 | Envelope sinks and fades; card scales up to centre                  |
| 0.70 – 0.92 | Card flips (`rotateY` 0 → 180°) — front → back                     |
| 0.92 – 1.00 | Hold on the back, then section releases                             |

- Progress drives everything through CSS custom properties set from one
  `requestAnimationFrame`-throttled scroll listener (JS, not
  `animation-timeline`, because iOS < 18 is still common among guests).
  Only `transform` / `opacity` animate.
- After the card is out, **tap / click / Enter** on the card (or a small
  "พลิกการ์ด" button) flips it manually, independent of scroll — so guests can
  look at both sides without scrubbing.
- Desktop only: a gentle pointer tilt (±6°) on the card once it's out, for a
  paper-in-hand feel. Disabled on touch.
- Small caption under the stage: label "The Invitation" + hint
  "เลื่อนลงเพื่อเปิดซอง" that fades out once the flap opens.

**Envelope** — built in CSS/SVG, not a photo cut-out. **Landscape** (1.5 × card width wide, 1.06 × tall): the portrait card rides inside it sideways and turns upright (−90° → 0°) while it settles:
- Body + pocket: cream `#F4EFC9`-ish sampled from the photos, faint paper grain,
  tinted shadow (warm, not black).
- Flap: triangle via `clip-path`, outside cream, inside = sunset liner image
  cropped from `S__189169827_0.jpg` → `public/invitation/liner.jpg`.
- Pocket front = two side triangles + bottom triangle (classic envelope fold).

**Card** — `next/image` front/back, converted to WebP (~1000px wide) in
`public/invitation/card-front.webp`, `card-back.webp`. Paper grain overlay +
soft emboss-like edge highlight. Proper `alt` with the card's text (back alt
includes date, venue, schedule, RSVP deadline).

**Reduced motion** (`prefers-reduced-motion: reduce`): no pinning, no scrub.
Render a static layout — open envelope with the card front above, plus the
manual flip button. Section height collapses to normal.

**Sizing**: card `min(78vw, 360px)` on mobile, up to `420px` on desktop;
stage uses `100svh`, `overflow: clip` so nothing causes horizontal scroll.

## Files

- `web/components/invitation-card.tsx` — client component (stage, envelope, card, scroll + flip logic)
- `web/lib/invitation-progress.ts` — pure fn: `p` → `{ flap, cardY, envelopeY, envelopeOpacity, scale, flip }` (easing + phase ranges), unit-testable
- `web/app/page.tsx` — insert `<section id="invitation">` between Hero and Pre-wedding gallery
- `web/components/nav-menu.tsx` — add `{ id: "invitation", label: "Invitation", th: "การ์ดเชิญ" }` after Home
- `web/app/globals.css` — envelope/card 3D styles (`perspective`, `backface-visibility`, `transform-style: preserve-3d`), reduced-motion fallback
- `web/public/invitation/` — `card-front.webp`, `card-back.webp`, `liner.jpg`
- `web/__tests__/invitation-progress.test.ts` — phase mapping (clamping, monotonic, key thresholds)
- `web/__tests__/invitation-card.test.tsx` — renders both sides w/ alt text; manual flip toggles `aria-pressed`; reduced-motion renders static

Note: inserting a section shifts the ivory / ivory-dark alternation below it —
that's automatic via `.landing-sections` nth-of-type, nothing to fix.

## Checklist

- [x] Prepare assets (WebP front/back, crop liner from photo)
- [x] `invitation-progress.ts` + tests
- [x] `InvitationCard` component (envelope, flap, pocket, card 3D flip)
- [x] Scroll progress hook (rAF, passive listener, resize-safe)
- [x] Manual flip (click/tap/keyboard) + desktop pointer tilt
- [x] Reduced-motion static fallback
- [x] Wire into `page.tsx` + nav item
- [x] Component tests
- [x] Visual check in browser (mobile 390px + desktop 1440px, Chromium) — **WebKit/real iPhone not yet checked**
- [x] `npm run lint && npm test && npm run build`

## Open questions

1. "animate ตาม mouse ที่เลื่อน scroll" — interpreted as **scroll-scrubbed**
   (wheel/trackpad/touch scroll drives the animation, reversible when scrolling
   back up), plus the subtle desktop pointer tilt. Say if you meant something else.
2. Raw files in `to-ai/` stay untracked (not committed); only the optimised
   copies go into `web/public/invitation/`.
