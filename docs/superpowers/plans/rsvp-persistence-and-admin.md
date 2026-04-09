# Plan: RSVP Persistence + Admin Management

**Date:** 2026-04-08
**Goals:**
1. Make the public RSVP form actually save submissions — via the .NET API → Supabase
   (never touch Supabase directly from Next.js).
2. Give the admin (thanwa + meena) a page to view, search, export, and manage
   the collected RSVPs.

---

## Current state

- `web/components/rsvp-form.tsx`: client-side form only, `handleSubmit` has a
  `// TODO: wire to Supabase` comment. Nothing is persisted.
- `api/WeddingApi`: only has `Config` CRUD. No `Rsvp` entity, service, or
  controller.
- Admin: only `/admin/configs` exists. No RSVP screen.

Field inventory from the form:
- `attending: boolean | null`  (ยืนยันเข้าร่วม / ไม่สะดวก)
- `name: string`               (ชื่อ-นามสกุล)
- `guests: "1" | … | "6+"`     (จำนวนผู้เข้าร่วม)
- `hasDietary: boolean` + `dietary: string`
- `message: string`            (ข้อความถึงบ่าวสาว)

---

## Architecture

```
Landing page (RSVPForm)
  ↓ server action (web/app/actions/rsvp.ts)
  ↓ POST ${DOTNET_API_URL}/api/rsvps           ← anonymous, rate-limited
  ↓ .NET RsvpService.CreateAsync
  ↓ Supabase (rsvps table)

Admin RSVP page (/admin/rsvps)
  ↓ server actions (web/app/admin/rsvps/actions.ts)
  ↓ GET/DELETE/PATCH ${DOTNET_API_URL}/api/rsvps   ← bearer JWT
  ↓ .NET RsvpController → RsvpService
  ↓ Supabase
```

Public create endpoint is **anonymous** (visitors have no account) but must
reject abuse. Admin endpoints require the existing HS256 bearer JWT.

---

## Data model

### `rsvps` table (new)

| Column        | Type           | Notes                                       |
|---------------|----------------|---------------------------------------------|
| `id`          | identity PK    |                                             |
| `attending`   | bool           | `true` = ยืนยันเข้าร่วม, `false` = ไม่สะดวก |
| `name`        | varchar(120)   | required even on decline (TBD — see Q1)     |
| `guest_count` | smallint       | 1..10; `"6+"` in UI → coerced to 6 for now  |
| `dietary`     | varchar(300)?  | null when `hasDietary` is false             |
| `message`     | varchar(1000)? |                                             |
| `status`      | varchar(20)    | `pending`/`confirmed`/`cancelled` (admin-managed) |
| `created_at`  | timestamptz    |                                             |
| `updated_at`  | timestamptz    |                                             |
| `deleted_at`  | timestamptz?   | soft-delete (match Config convention)       |

Indexes: `created_at desc` (listing), `name` (search).

### DTOs

```csharp
// Public create
public record RsvpCreateRequest(
    bool Attending,
    string Name,
    int GuestCount,
    string? Dietary,
    string? Message);

// Admin list/detail
public record RsvpDto(
    int Id,
    bool Attending,
    string Name,
    int GuestCount,
    string? Dietary,
    string? Message,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt);

// Admin update (status only for now)
public record RsvpUpdateRequest(string Status);
```

---

## API surface

| Verb   | Path                    | Auth       | Purpose                          |
|--------|-------------------------|------------|----------------------------------|
| POST   | `/api/rsvps`            | Anonymous  | Public RSVP submission           |
| GET    | `/api/rsvps`            | Bearer     | List (newest first)              |
| GET    | `/api/rsvps/{id}`       | Bearer     | Detail                           |
| PATCH  | `/api/rsvps/{id}`       | Bearer     | Update status                    |
| DELETE | `/api/rsvps/{id}`       | Bearer     | Soft-delete                      |
| GET    | `/api/rsvps/export.csv` | Bearer     | CSV export                       |
| GET    | `/api/rsvps/stats`      | Bearer     | Totals (count, guests, statuses) |

Optional / later: pagination query params, server-side search.

### Abuse protection on public `POST`
- Basic payload validation (length caps) at controller level.
- Honeypot field in the web form (`hp_website`, hidden, rejected if filled).
- IP rate limit (fixed window, e.g. 5/min) via ASP.NET rate limiter middleware
  scoped to that one route. No cross-service state required.

---

## Admin UI

Route: `/admin/rsvps` (protected by existing `proxy.ts`).

Components:
- **Stats bar** — total submissions, attending, declining, total guest headcount.
- **Filter / search bar** — free-text on name, status chip filters.
- **Table** — columns: name · attending · guests · status · created · actions.
- **Row actions** — view details (modal or drawer), mark status, delete.
- **Export CSV** button → hits `/api/rsvps/export.csv` with bearer token.

Use existing shadcn primitives (same as `/admin/configs`).

Admin nav: add "RSVPs" link between "Configs" and "Change password" in
`web/app/admin/layout.tsx`.

---

## Checklist

### .NET API
- [x] `Rsvp` entity (`api/WeddingApi/Entities/Rsvp.cs`)
- [x] Add `DbSet<Rsvp>` to `AppDbContext`, configure `rsvps` table + indexes + soft-delete query filter
- [x] EF migration: `AddRsvps`
- [x] `RsvpDtos.cs` (create / read / update)
- [x] `IRsvpService` / `RsvpService`: Create, List, Get, UpdateStatus, SoftDelete, ExportCsv, Stats
- [x] `RsvpController` with anonymous POST and authorized others
- [x] Basic input validation (lengths, guest count range, required fields)
- [x] Honeypot field check on POST
- [x] Rate limiter on POST `/api/rsvps` only
- [x] Unit tests: RsvpService CRUD + soft-delete + stats aggregation
- [x] Integration tests: POST anonymous succeeds, GET anonymous → 401, admin flows end-to-end

### Next.js — public form
- [x] Replace `handleSubmit` TODO with server action (`web/app/actions/rsvp.ts`) that POSTs to `${DOTNET_API_URL}/api/rsvps`
- [x] Add hidden honeypot input
- [x] Coerce guest count (`"6+"` → `6`)
- [x] Surface submission errors inline (not just optimistic success)
- [x] Keep existing thank-you / decline UI
- [x] Update `__tests__/rsvp-form.test.tsx` for the server-action flow (mock fetch or action)

### Next.js — admin
- [x] New route `web/app/admin/rsvps/page.tsx` (server component, fetches list)
- [x] `web/app/admin/rsvps/actions.ts` (server actions calling .NET with bearer)
- [x] `RsvpsTable` client component (filter, search, row actions)
- [x] Stats bar component
- [x] Export CSV button (forwards bearer, triggers browser download)
- [x] Detail drawer/modal for full record view
- [x] Add "RSVPs" link to `admin/layout.tsx`

### Env / ops
- [x] No new env vars expected — reuses `DOTNET_API_URL` and existing auth
- [ ] Run `dotnet ef database update` against Supabase with `DESIGN_TIME_DB` set
- [ ] Verify Supabase `rsvps` table exists

### Verification (web/)
- [x] `npm run lint`
- [x] `npm test`
- [x] `npm run build`

### Verification (api/)
- [x] `dotnet build`
- [x] `dotnet test`

### E2E tests — Playwright MCP (run against local `npm run dev` + `dotnet run`)

These are run by me (Claude) using the Playwright MCP browser tools before
declaring implementation complete. Both dev servers must be running first.

**Public RSVP flow**
- [x] Navigate to `http://localhost:3000`, scroll to RSVP section
- [x] Click "ยืนยันเข้าร่วม" → fields appear (name, guests, dietary, message)
- [x] Fill form → submit → thank-you message displays (`ขอบคุณมาก!`)
- [x] Navigate to `http://localhost:3000/admin/rsvps` → submission appears in table with correct data
- [x] Click "ไม่สะดวก" → decline UI appears (no form fields)
- [ ] Submit decline → recorded as `attending=false` in admin
  — **KNOWN GAP**: decline path shows polite UI message but does NOT submit to API.
    Declines are not persisted. Decision: leave as-is (guests who decline don't need tracking)
    or add a silent auto-submit — needs product decision before fixing.

**Honeypot**
- [x] Submit with `hp_website` filled (via JS injection) → .NET returns `{"error":"rejected"}`, thank-you does NOT show

**Admin RSVP page**
- [x] Log in as `thanwa` → navigate to `/admin/rsvps`
- [x] Stats bar shows correct total, attending count, guest headcount
- [x] Search by name → table filters correctly
- [x] Click status badge → update to `confirmed` → UI refreshes
- [x] Click row action "Delete" → row disappears from table
- [x] Click "Export CSV" → file download starts, CSV contains the submitted row
- [x] Click row to open detail drawer → all fields visible

**Auth guard**
- [x] Visit `/admin/rsvps` while logged out → redirect to `/admin/login`

**Error state**
- [x] Stop .NET API → submit RSVP → inline error message shown (not just silent failure)

### Deploy (user actions)
- [ ] Run migration against production Supabase
- [x] Tag `v1.2.0` after all checks pass (tagged as v1.2.0 and v1.2.1)
- [ ] Verify production flow end-to-end

---

## Open questions (please answer before I start implementation)

1. **Decline submissions** — do we save rows where `attending=false`? If yes, is
   `name` still required? (My default: save declines, require name.)
2. **Duplicate prevention** — if someone submits twice with the same name, do we:
   (a) allow duplicates, (b) block, (c) update their existing row?
   (My default: allow duplicates, admin can manually dedupe.)
3. **Guest count `"6+"`** — just store as `6`, or add a `guest_count_note` field
   so the planner sees "6+"? (My default: store `6`, ignore the plus.)
4. **Public metrics** — should the landing page show anything like
   "XX guests confirmed", or keep counts admin-only? (My default: admin-only.)
5. **Status field values** — proposing `pending | confirmed | cancelled`. OK?
   Or different labels (e.g. Thai)?
6. **Email notifications** — on new RSVP, notify you & Meena? If yes, which
   channel (email via Resend/Supabase, Slack, LINE, etc.)? (My default:
   out of scope for this PR — add later.)
7. **CSV export** — required for v1, or nice-to-have for v1.1? (My default: v1.)
8. **Pagination** — expected total RSVPs (<200? <1000?). If small, client-side
   table + filter is fine; larger needs server-side paging. (My default: no
   pagination until we have 200 rows.)

---

## Notes & risks

- Public `POST /api/rsvps` exposes the .NET API to the internet with no auth.
  Rate limiting + honeypot + input validation are mandatory. If abuse becomes a
  problem, add Turnstile/hCaptcha later (out of scope for v1).
- The admin already assumes HS256 bearer tokens from the credentials system —
  no auth work required.
- Soft-delete matches the existing `Config` convention; don't hard-delete.
- Vercel preview deploys point at the same production .NET API, so preview
  submissions WILL land in production data — consider a `X-Env` header filter
  if that becomes a problem (not in scope for v1).
