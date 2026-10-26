# Guestbook redesign — "เลือกหยิบ postcard เพื่ออวยพรบ่าวสาว"

Ref sketch: `my-images/IMG_6642.JPG` · Photos: `my-images/step-1/*.jpg` (5 × portrait 2:3)

**Scope: frontend only.** Backend (store chosen postcard id, drop image upload) comes
after the design is approved.

## Decisions (confirmed 2026-10-26)

| Topic | Decision |
|---|---|
| Step 3 box | three.js 3D acrylic box, lazy-loaded when section is near viewport |
| Photo in letter | Postcard layout — photo on one half, writing on the other (stacked on mobile) |
| Old slideshow wall | Removed — all letters live in the box, tap one to read |
| Photos | Resize to ~900px WebP into `web/public/guestbook/` (originals untouched) |
| Image upload | Removed from the frontend |

## Flow

**Step 1 — Clothesline.** A sagging twine (SVG path) with 5 polaroids hung by wooden
pegs, each with a gentle idle sway (rotate around peg, staggered). Horizontally
scrollable: native scroll-snap + drag, ‹ › buttons, centre card slightly larger
(like the reference). Caption in handwriting under each photo. Tap/Enter on a card
→ peg pops, card lifts off the line.

**Step 2 — Postcard.** The lifted polaroid flies to centre and flips (rotateY 180°)
to reveal the postcard: photo half + writing half with "ถึง ธันวา & มีนา",
ruled lines, message textarea, "จาก …" name field, decorative stamp + postmark
(26.12.2026 · Pattaya). All typed text renders in a handwriting font. Buttons:
"ส่งจดหมาย" (send) and "เลือกรูปใหม่" (back to step 1). Inline validation
(name + message required, same max lengths as today: 120 / 2000).

**Step 3 — Into the box.** On send, the postcard shrinks, tilts and flies down into
the three.js box; it then lands as a 3D card among the other guests' letters
(simple hand-rolled tumble/settle, no physics library). Box: clear acrylic
(`MeshPhysicalMaterial` transmission), soft garden lighting, paper-cutout couple
figure standing on the lid (per sketch). Slight drag-to-rotate. Tapping a letter in
the box opens it in a reader overlay (photo + handwriting message + name).
A "เขียนอีกใบ" link restarts at step 1.

## Data in this phase

- Box is seeded from existing `getRandomGuestbookEntries` (read-only); each entry
  gets a postcard photo by `id % 5` until the backend stores the real choice.
- **Send is local-only** — no network call, the new letter is added to the box in
  memory. Avoids writing test entries to the DB while we iterate on design.
  Wiring to the API is part of the backend phase.

## Fallbacks / a11y

- No WebGL → static CSS acrylic box with the letters fanned inside.
- `prefers-reduced-motion` → no sway, flips become crossfades, letter drops in place.
- Clothesline cards are buttons with alt text; keyboard ← → scrolls; focus rings.
- Mobile first: clothesline shows ~1.6 cards, postcard stacks vertically, canvas DPR capped at 2.

## Font

Handwriting for the letter: **Sriracha** (Google Fonts, Thai + Latin, ballpoint feel),
added via `next/font/google` as `--font-hand`. Mali stays for existing headings.

## Files

- `web/public/guestbook/postcard-{1..5}.webp` — new
- `web/components/guestbook/` — new: `guestbook-experience.tsx` (orchestrates the
  steps), `guestbook-state.ts` (reducer + validation), `clothesline.tsx`,
  `postcard.tsx` (shared face), `postcard-composer.tsx`, `letter-reader.tsx`,
  `letter-box.tsx` (React wrapper + CSS fallback), `letter-box-scene.ts`
  (plain three.js, dynamic import), `postcards.ts` (photo list + captions)
- `web/app/page.tsx` — guestbook section uses `<GuestbookExperience entries=… />`
- `web/app/layout.tsx` — add Sriracha
- Delete `web/components/guestbook-form.tsx`, `web/components/guestbook-wall.tsx`
- Dependency: `three` + `@types/three`

## Checklist

- [x] Convert photos to WebP
- [x] Add `three`, Sriracha font
- [x] Clothesline (step 1)
- [x] Postcard flip + form (step 2)
- [x] three.js letter box + send animation (step 3)
- [x] Letter reader, fallback, reduced motion
- [x] Wire into `page.tsx`, delete old components
- [x] Unit test for the step state machine / validation
- [x] `npm run lint && npm test && npm run build`
- [x] Visual check in browser (mobile + desktop) and screenshots for review

## Notes from implementation

- Overlays render through a portal to `body`: the section's `.reveal` animation
  sets a transform, which would otherwise trap `position: fixed`.
- `getRandomGuestbookEntries` now fetches 24 so the box looks full; the scene
  shows at most 28 letters (texture memory on phones).
- Captions in `postcards.ts` are first drafts — edit freely.

## Backend phase (started 2026-10-26)

Decisions:
- `guestbook_entries.postcard_id` (int, nullable). Old rows stay null; the frontend
  keeps assigning them a card by id.
- Create request: drop `Images`, add required `PostcardId` (1–99, so new photos
  don't need an API change). Name ≤ 120 / message ≤ 2000 validated in the API
  (today an over-long value reaches Postgres and 500s).
- Stop HTML-encoding name/message on save — React escapes on render, and the
  encoding broke `&` and pushed long text past the column limits. DTOs
  HTML-decode so rows saved before this read correctly.
- `guestbook-post` limiter is one global window of 3/min — the 4th guest in any
  minute on the night would get a 429. Raise to 30/min. Not partitioned by IP:
  the API only sees Vercel's IP, and a forwarded-IP header could be spoofed by
  anyone calling the API directly.
- Image upload removed from the guestbook service; legacy `ImageUrls` stay in the
  DTOs so the admin table still shows them.
- Frontend: send waits for the API (button shows "กำลังส่ง…"); the letter flies into
  the box only after a 2xx, using the saved entry. Errors show inline on the card.
- Admin table shows the chosen postcard.

Checklist:
- [x] Entity + DbContext + migration `AddGuestbookPostcardId`
- [x] DTOs, service, controller validation, limiter
- [x] Unit tests (service) + integration tests (POST/GET)
- [x] `dotnet build && dotnet test`
- [x] Frontend: DTO type, reducer (`sendFailed`, `delivered` with saved letter), composer submit + errors, honeypot
- [x] Admin table postcard column
- [x] `npm run lint && npm test && npm run build`
- [x] End-to-end against local API
- [x] Expire the `guestbook` cache tag after a successful POST, so a guest who
  reloads sees their own letter (reads were cached 60s)

Deploy order: **web first, then API.** The new API requires `postcardId`, so the
current production web (which doesn't send it) would get 400s if the API went
out first; the new web works against the old API (the field is just ignored).
The migration does **not** run on API startup (`Database.Migrate()` is only in the
seed CLI) — apply it to Supabase by hand before the API deploy:
`DESIGN_TIME_DB=… dotnet ef database update` (see CLAUDE.md). It only adds a
nullable column, so applying it early is safe for the running API.


## Feedback round 1 (2026-10-26)

- [x] Caption clipped Thai below-base vowels (ุ) — caption no longer `leading-none` + `truncate`
- [x] Postcard photo proportions — desktop photo column is 280px at the photo's own 2:3; phones crop around a per-photo `focus`
- [x] Pointer cursor on polaroids
- [x] More room between step hints 2 / 3
- [x] Box tilts up/down as well as turning (mouse: any direction; touch: drag must start sideways so vertical swipes still scroll the page)
- [x] Two new photos (ids 6, 7) — 7 cards on the line
- [x] Less empty space above the clothesline (smaller sag + margin)
- [x] Faces cropped out (champagne shot) — per-photo `focus` used on the line, postcard, flyer and 3D texture

## Abuse testing (2026-10-26, local only)

Held: XSS in name/message (stored verbatim, React/canvas never execute it — no
dialogs, no injected nodes), SQL injection (EF parameters), postcardId tampering
(range + binding → 400), over-posting (ignored), smuggled file upload (ignored),
honeypot, length limits, admin endpoints without / with forged JWT (401),
Next proxy rejects missing or foreign Origin.

Fixed:
- [x] NUL byte → 500 (Postgres rejects it). Control chars other than \n \r \t are stripped.
- [x] Bidi overrides (U+202A–202E, U+2066–2069) stripped — a name could render reversed.
- [x] Zero-width-only name/message was accepted as "not blank". API and client now require visible text.

Open (needs a decision):
- [ ] Spam / lock-out: the API is public, so a script can skip the site (Origin is
  forgeable outside a browser) and post 30 letters a minute indefinitely — filling
  the box and, because the window is shared, blocking real guests with 429s.
  Proposed: the Next route sends a shared secret header the API requires on POST
  (direct calls rejected), plus the guest's IP from Vercel's `x-forwarded-for`
  (set by Vercel, not the client) so the API can limit per guest, e.g. 5/min each
  under a higher overall cap. Needs one new env var on Vercel + Railway.
