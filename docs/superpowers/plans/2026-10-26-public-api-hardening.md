# Public API hardening — gateway secret + per-guest rate limits

Follows the open item in [guestbook redesign → Abuse testing](./2026-10-26-guestbook-postcard-redesign.md#abuse-testing-2026-10-26-local-only).
Goal: a curious guest with curl/Burp can't flood, lock out, or tamper — and real guests
at the venue (shared Wi-Fi, all posting at once) never hit a 429.

## Findings (audit 2026-10-26)

Every call from the site reaches Railway from Vercel's servers, so every API rate limit
is **one window shared by all guests**. And the Railway URL is public, so anyone can skip
the site entirely.

| # | Endpoint (anonymous) | Problem | Severity |
|---|---|---|---|
| 1 | `DELETE /api/photos/{id}` | Ownership = `deviceId`, but `GET /api/photos` returns every photo's `deviceId` (and it is in the storage URL path `full/{deviceId}/…`). **Anyone can delete everyone's photos.** | High |
| 2 | `POST /api/guestbook` | 30/min shared → one script fills the box and 429s every real guest | High |
| 3 | `POST /api/rsvps` | **5/min shared** → 6 guests RSVPing in the same minute already fail; trivial lock-out | High |
| 4 | `POST /api/auth/login` | 5/15 min shared → anyone can keep both admins locked out of `/admin` | Medium |
| 5 | `POST /api/photos/upload` | 100/hour shared → a busy photo booth runs out by itself; 10-per-guest cap is per `deviceId` (client-chosen, rotate freely) | Medium |
| 6 | `GET /api/table/search` | 30/min shared → "find my table" breaks when guests arrive together | Medium |
| 7 | `GET /api/photos` | 60/min shared, `no-store` → gallery breaks under load | Low |
| 8 | `deviceId` → storage path | not validated; goes straight into the Supabase object path | Low |

## Design

**1. Gateway secret (API only answers the Next server).**
- New secret: Vercel `API_GATEWAY_SECRET`, Railway `Gateway__Secret` (same value, 32+ random bytes).
- API middleware, first in the pipeline: every `/api/*` request must carry
  `X-Gateway-Secret` (constant-time compare) → else `403`. Direct curl to Railway is dead.
- Production refuses to start without the secret (fail closed). Dev/Testing may leave it unset.
- Web: one `apiFetch()` in `web/lib/api.ts` adds the header; every server-side call
  (actions, route handlers, `adminFetch`, `auth.ts`, change-password) goes through it.
  The browser never sees the secret or the Railway URL.

**2. Real guest IP → per-guest limits.**
- Next resolves the guest IP and sends it as `X-Guest-Ip` (trusted by the API only
  because the secret already passed).
- Resolution: the site is behind Cloudflare → Vercel, so Vercel's `x-real-ip` /
  `x-forwarded-for` is a Cloudflare edge IP. If that IP is in Cloudflare's published
  ranges, use `cf-connecting-ip`; otherwise use the Vercel IP itself. So a caller
  who bypasses Cloudflare and fakes `cf-connecting-ip` is keyed by their real IP.
- API normalises IPv6 to its /64 (one home = one /64; stops address rotation).
- Each public endpoint: a per-IP limit **and** a global ceiling (protects the DB from
  many IPs). Global ceilings sized well above a real wedding rush.

| Policy | Per guest IP | Global | Was (shared) |
|---|---|---|---|
| guestbook-post | 15 / min | 120 / min | 30 / min |
| rsvp-post | 15 / min | 60 / min | 5 / min |
| login-post | 5 / 15 min | 30 / 15 min | 5 / 15 min |
| photos-upload | 30 / 10 min | 100 / 10 min | 100 / hour |
| photos-delete *(new)* | 30 / min | 300 / min | none |
| table-search | 20 / min | 600 / min | 30 / min |
| photos-get | 120 / min | 1200 / min | 60 / min |
| guestbook-get | (server-cached, no guest IP) | 60 / min | 60 / min |

Venue Wi-Fi note: everyone on the venue Wi-Fi shares one public IP — guestbook/RSVP
per-IP set to 15/min for that (decided 2026-10-26).

**3. Photo ownership fix.**
- Public `PhotoDto` drops `deviceId`, gains `isMine` (computed from the `deviceId` the
  caller sends). The lightbox uses `isMine`.
- New uploads stored under `full/{photoId}.jpg` / `thumb/{photoId}.jpg` — no device id in URLs.
- API validates `deviceId` is a UUID (upload, list, delete) → `400` otherwise.
- Existing test photos keep old URLs (which leak their deviceId) — clear them from
  `/admin/photos` before the wedding.

Also fixed while in there: RSVP NUL / overlong fields → 500 (now 400, shared
`GuestText.Clean`), photo upload accepts only real JPEGs (magic bytes), display name
≤ 40 visible chars, filter name whitelisted.

## Pentest results (2026-10-27, local: API in Production mode + `next start` + throwaway Postgres)

| Attack | Result |
|---|---|
| Production start without `Gateway__Secret` | refuses to start |
| Direct API, no / wrong secret, 8 routes | 403 everywhere |
| Forged `X-Guest-Ip` straight to API | 403 |
| Guestbook via site, foreign Origin | 403 |
| Spoofed `cf-connecting-ip` (non-Cloudflare caller), 17 posts | 15 × 201 then 429 |
| 5 guests behind Cloudflare edge | all 201 (own limits) |
| Login brute force one IP | 5 × 401 then 429; other IP 401; real admin 200 |
| 20 RSVPs from 20 IPs in one minute (old limit: 5) | all 201 |
| RSVP NUL name / 10k name / guestCount 999 | 400 |
| Photo list contains deviceId | no |
| `deviceId=../../x` | 400 |
| HTML uploaded as .jpg | 400 |
| Delete photo with someone else's/random deviceId | 404 |
| Forged `alg:none` JWT on admin endpoint | 401 |
| Admin login + RSVP admin page through the gateway (browser) | works |

Not testable locally: real photo upload (needs Supabase Storage) — check on production.

## Rollout (zero downtime)

1. Generate secret: `openssl rand -base64 48`.
2. Add `API_GATEWAY_SECRET` on Vercel (Production) → deploy web. API ignores the extra header.
3. Add `Gateway__Secret` on Railway → deploy API. From now on direct calls get 403.
4. Verify: site guestbook/RSVP/photo/login/table search work; `curl` Railway directly → 403.

## Checklist

API
- [x] `GatewaySecretMiddleware` (constant-time, 403, fail-closed in Production)
- [x] `GuestIp` helper: read `X-Guest-Ip`, validate, IPv6 → /64
- [x] Rate limiter: per-IP policies + global ceiling per policy (table above)
- [x] Photo DTO: drop `deviceId`, add `isMine`; storage path by photo id; UUID validation
- [x] `[EnableRateLimiting("photos-delete")]` on owner delete
- [x] Unit tests: IP normalisation, deviceId validation
- [x] Integration tests: no/wrong secret → 403; per-IP limit isolates guests; `isMine`, no `deviceId` leak; other-device delete → 404
- [x] `dotnet build && dotnet test`

Web
- [x] `lib/api.ts`: `apiFetch()` + `guestIp()` (Cloudflare range check)
- [x] Route all server calls through it (rsvp, guestbook ×2, photos ×3, table, prewedding ×2, export.csv, adminFetch, auth login, change-password)
- [x] Photo gallery: `isMine` instead of `deviceId` compare
- [x] Vitest: `guestIp()` (Cloudflare vs direct vs spoofed header), `apiFetch` headers
- [x] `npm run lint && npm test && npm run build`

Pentest (local, API + web running, after implementation)
- [x] Direct API: no secret / wrong secret / secret in wrong case → 403 on every route
- [x] Spoofed `cf-connecting-ip` / `x-forwarded-for` on the Next routes doesn't change the limit key (locally simulated)
- [x] Flood guestbook from one IP → that IP 429s, a second IP still posts
- [x] Delete someone else's photo with a guessed/old deviceId → 404
- [x] Login brute force → 429 after 5 for that IP, admin from another IP can still log in
- [x] Re-run earlier guestbook abuse cases (XSS, NUL, bidi, oversize) — still held

Docs
- [x] CLAUDE.md env tables (+ `API_GATEWAY_SECRET`, `Gateway__Secret`)
- [x] PHASES.md item ticked
