# Hero Video — Fast, Pretty Loading

The hero reel (`/hero.mp4`, 6.3 MB, H.264 720×1280 + AAC) must never leave the
first screen looking empty while it loads.

Measured on the production build, 390×844, throttled to ~1.6 Mbps / 150 ms RTT:

| Time | What the guest sees |
|---|---|
| 0–2 s | Blank ivory with a grey top scrim — no logo, no picture |
| 2–3.5 s | White logo + date on blank ivory |
| ~3.5 s | Poster half-painted (top third only) |
| 4.45 s | Poster done — it is the **last** request, after all JS |
| ~6 s | Video playing |

LCP = logo at 2.76 s, served as the `w=1920` variant for a ~290px display.

---

## Bottlenecks & fixes

| # | Bottleneck | Fix |
|---|---|---|
| 1 | Nothing paints in the media area until the poster arrives | Inline a ~1 KB blurred placeholder (tiny base64 frame) as the media background — paints with the HTML |
| 2 | Poster is a `<video poster>` JPEG (154 KB), discovered late, normal priority | Render it as `next/image` `priority` under the video → preloaded in `<head>`, AVIF/WebP, sized per viewport |
| 3 | Swap poster → video is abrupt | Video starts at `opacity: 0`, cross-fades in on the `playing` event |
| 4 | Video download competes with poster/logo/fonts | `preload="none"`; the existing IntersectionObserver `play()` starts it after hydration |
| 5 | Guests on Save-Data / 2G still pull 6 MB | Skip autoplay when `navigator.connection.saveData` or `effectiveType` is `slow-2g`/`2g`; poster stays, sound button still plays it |
| 6 | ~~Logo image has no `sizes` → `w=1920` variant~~ | **Reverted** — source is 960px, so `w=1920` returns a 27 KB WebP while `w=640` is 49 KB. Left as is. |

### Considered, not doing

- **HEVC / AV1 sources** — at comparable quality: HEVC 5.9 MB, AV1 7.7 MB vs H.264 6.3 MB. Water and grass motion barely compress; not worth multiple sources.
- **540p mobile tier** — 4.6 MB (−27%), visibly softer on 3× phone screens. Playback already starts after ~2 s of buffer thanks to `+faststart`.
- **Fonts** — ~20 woff2 files (~350 KB) load before everything else. Separate task.

---

## Checklist

- [x] Blurred placeholder — static import of `hero-poster.jpg`, Next generates `blurDataURL` at build; rendered as its own background layer
- [x] `hero-video.tsx`: poster as `next/image` priority layer (fades in on load, so no half-drawn image), video fade-in on `playing`, `preload="none"`, Save-Data / 2G skip
- [x] Desktop backdrop requests a 320px variant instead of 100vw
- [x] Removed the 1.4 s `hero-media` fade-from-zero (it hid the placeholder)
- [x] Video bleeds 1px past the card + `max-w-none` (preflight's `max-width: 100%` let the poster show as a stripe on the right)
- [x] ~~`page.tsx`: logo `sizes`~~ — reverted, see #6
- [x] Tests: fade-in state, Save-Data / 2G skip, 4G autoplay
- [x] Re-run the throttled profile
- [x] `npm run lint && npm test && npm run build`

---

## Result (same throttle)

| Time | Before | After |
|---|---|---|
| 0.7 s | Blank ivory | Blurred green still of the reel |
| 2 s | Logo on blank ivory | Logo + date on the blur |
| 3.5 s | Poster half-painted | Blur (poster still downloading — never half-drawn) |
| ~3.9 s | — | Poster fades in (was 4.45 s) |
| ~6 s | Video playing | Video cross-fades in |

Poster bytes: 154 KB JPEG → 111 KB WebP. LCP unchanged (logo, ~2.8 s) —
it waits behind ~20 font files (~350 KB). Fonts are the next bottleneck.
