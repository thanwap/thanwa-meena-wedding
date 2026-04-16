# Guestbook ("ข้อความถึงบ่าวสาว") Feature

## Context

The "ข้อความถึงบ่าวสาว" message field currently lives inside the RSVP form as an optional textarea (`Rsvp.Message`, VARCHAR 1000). The user wants to:

1. **Separate it** into its own standalone section on the landing page
2. **Add 3 fields**: name, message, pictures (image upload)
3. **Add admin management** page

The existing `Rsvp.Message` field stays as-is for short notes — the new guestbook is a completely separate feature.

---

## Image Storage: Google Drive (via .NET API)

Upload images to a shared Google Drive folder via a **service account**.

- Browser posts multipart form (name + message + images) to Next.js proxy route
- Next.js proxy forwards multipart as-is to .NET `POST /api/guestbook`
- .NET uploads images to Google Drive, stores URLs, saves entry to DB
- Display URL format: `https://drive.google.com/thumbnail?id={fileId}&sz=w800`
- Uses `Google.Apis.Drive.v3` NuGet package in .NET
- Env vars (Render only — NOT Vercel):
  - `GoogleDrive__ServiceAccountKey` — base64-encoded JSON key
  - `GoogleDrive__FolderId` — target folder ID

---

## Phase 1: Backend (.NET API)

### 1.1 Entity

**New:** `api/WeddingApi/Entities/GuestbookEntry.cs`

| Field | Type | Constraints |
|-------|------|-------------|
| Id | int | PK, identity |
| Name | string | max 120, required |
| Message | string | max 2000, required |
| ImageUrls | string? | max 3000, nullable — JSON array of URLs |
| CreatedAt | DateTime | UTC |
| UpdatedAt | DateTime | UTC |
| DeletedAt | DateTime? | soft delete |

### 1.2 DTOs

**New:** `api/WeddingApi/Dtos/GuestbookDtos.cs`

- `GuestbookCreateFormRequest` — Name, Message, Images (List<IFormFile>), HpWebsite (honeypot) — used with `[FromForm]`
- `GuestbookDto` — Id, Name, Message, ImageUrls, CreatedAt (public display)
- `GuestbookAdminDto` — adds UpdatedAt (admin view)

### 1.3 DbContext

**Modify:** `api/WeddingApi/Data/AppDbContext.cs`
- Add `DbSet<GuestbookEntry>`
- `OnModelCreating`: table name `guestbook_entries`, max lengths, soft delete filter, index on `CreatedAt`

### 1.4 Migration

```bash
cd api/WeddingApi
dotnet ef migrations add AddGuestbookEntries
```

### 1.5 Google Drive Service

**New:** `api/WeddingApi/Services/IGoogleDriveService.cs` + `GoogleDriveService.cs`

NuGet: `Google.Apis.Drive.v3`

- Constructor reads `GoogleDrive:ServiceAccountKey` (base64 → JSON) and `GoogleDrive:FolderId` from config
- `UploadAsync(stream, filename, mimeType)` → uploads to folder, sets `anyone/reader` permission, returns thumbnail URL
- Registered as `AddSingleton` in Program.cs

### 1.6 Service

**New:** `api/WeddingApi/Services/IGuestbookService.cs` + `GuestbookService.cs`

- `CreateAsync(request)` — honeypot check, validate images (max 3, max 5MB, valid types), upload via `IGoogleDriveService`, store JSON URLs
- `ListPublicAsync()` — non-deleted, ordered by newest
- `ListAdminAsync()` — non-deleted, includes UpdatedAt
- `DeleteAsync(id)` — soft delete

### 1.7 Controller

**New:** `api/WeddingApi/Controllers/GuestbookController.cs`

Route: `api/guestbook` — accepts `[FromForm]` multipart for POST

| Endpoint | Auth | Rate Limit | Purpose |
|----------|------|------------|---------|
| `POST /` | anonymous | 3/min | Submit entry (multipart) |
| `GET /` | anonymous | — | Public list |
| `GET /admin` | JWT | — | Admin list |
| `DELETE /{id}` | JWT | — | Soft delete |

### 1.8 Program.cs

**Modify:** `api/WeddingApi/Program.cs`
- Register `AddSingleton<IGoogleDriveService, GoogleDriveService>()`
- Register `AddScoped<IGuestbookService, GuestbookService>()`
- Add `"guestbook-post"` rate limiter (3/min)

---

## Phase 2: Next.js Proxy Route

### 2.1 Proxy

**New:** `web/app/api/guestbook/route.ts`

- `POST` — receives multipart FormData from browser, forwards to `.NET POST /api/guestbook` as multipart, returns response

No Google Drive code in Next.js. No `googleapis` package. No separate upload route.

### 2.2 Removed files

- ~~`web/lib/google-drive.ts`~~ — deleted, logic moved to .NET
- ~~`web/app/api/guestbook/upload/route.ts`~~ — deleted, replaced by unified proxy

---

## Phase 3: Landing Page

### 3.1 Server Action

**Modify:** `web/app/actions/guestbook.ts`
- Remove `submitGuestbookEntry` — form now POSTs directly to `/api/guestbook` proxy
- Keep `getGuestbookEntries()` — fetches from `GET /api/guestbook`

### 3.2 Guestbook Form Component

**Modify:** `web/components/guestbook-form.tsx` (`"use client"`)

- On submit: build FormData (name, message, hp_website, image files) → `fetch POST /api/guestbook`
- No more two-step upload — single request covers everything
- Honeypot field, `useTransition` for pending state
- Success message after submission

### 3.3 Guestbook Wall Component

**New:** `web/components/guestbook-wall.tsx` (`"use client"`)

- Card layout showing name, message, image thumbnails
- Clickable images for full-size view
- Data fetched server-side in `page.tsx`, passed as props

### 3.4 Landing Page Section

**Modify:** `web/app/page.tsx`

Insert **SECTION 7 — GUESTBOOK** (`id="guestbook"`) between RSVP and DRESS CODE (which becomes section 8):
- Fetch entries server-side via `getGuestbookEntries()`
- Render `<GuestbookWall>` (display) + `<GuestbookForm>` (submit)

### 3.5 Navigation

**Modify:** `web/components/nav-menu.tsx`

Add between "rsvp" and "dress":
```ts
{ id: "guestbook", label: "Guestbook", th: "ข้อความ" },
```

---

## Phase 4: Admin Page

### 4.1 Server Actions

**New:** `web/app/admin/guestbook/actions.ts`
- `getGuestbookEntries()` — `GET /api/guestbook/admin` with auth
- `deleteGuestbookEntry(id)` — `DELETE /api/guestbook/{id}` with auth

### 4.2 Page

**New:** `web/app/admin/guestbook/page.tsx`
- Server component, fetches entries, renders `<GuestbookTable>`

### 4.3 Client Table

**New:** `web/app/admin/guestbook/guestbook-table.tsx`
- shadcn Table with columns: Name, Message (truncated), Images (thumbnails), Date, Actions
- Delete with confirmation dialog
- Search by name
- Click image thumbnail to view full size

### 4.4 Loading

**New:** `web/app/admin/guestbook/loading.tsx`

### 4.5 Admin Nav

**Modify:** `web/app/admin/layout.tsx` — add "Guestbook" link

---

## Files Summary

**New (14):**
| # | File |
|---|------|
| 1 | `api/WeddingApi/Entities/GuestbookEntry.cs` |
| 2 | `api/WeddingApi/Dtos/GuestbookDtos.cs` |
| 3 | `api/WeddingApi/Services/IGoogleDriveService.cs` |
| 4 | `api/WeddingApi/Services/GoogleDriveService.cs` |
| 5 | `api/WeddingApi/Services/IGuestbookService.cs` |
| 6 | `api/WeddingApi/Services/GuestbookService.cs` |
| 7 | `api/WeddingApi/Controllers/GuestbookController.cs` |
| 8 | `api/WeddingApi/Data/Migrations/*_AddGuestbookEntries.cs` |
| 9 | `web/app/api/guestbook/route.ts` |
| 10 | `web/app/actions/guestbook.ts` |
| 11 | `web/components/guestbook-form.tsx` |
| 12 | `web/components/guestbook-wall.tsx` |
| 13 | `web/app/admin/guestbook/actions.ts` |
| 14 | `web/app/admin/guestbook/page.tsx` |
| 15 | `web/app/admin/guestbook/guestbook-table.tsx` |
| 16 | `web/app/admin/guestbook/loading.tsx` |

**Modified (5):**
| # | File | Change |
|---|------|--------|
| 1 | `api/WeddingApi/Data/AppDbContext.cs` | Add DbSet + model config |
| 2 | `api/WeddingApi/Program.cs` | Register services + rate limiter |
| 3 | `web/app/page.tsx` | Add guestbook section |
| 4 | `web/components/nav-menu.tsx` | Add guestbook nav item |
| 5 | `web/app/admin/layout.tsx` | Add guestbook admin link |

**Deleted (2):**
| # | File | Reason |
|---|------|--------|
| 1 | `web/lib/google-drive.ts` | Logic moved to .NET |
| 2 | `web/app/api/guestbook/upload/route.ts` | Replaced by unified proxy route |

---

## Verification

1. `dotnet build && dotnet test` — API compiles, existing tests pass
2. `cd web && npm run lint && npm test && npm run build` — frontend checks
3. Verify `guestbook_entries` table created via migration
4. Test public submit: multipart with name + message + images → 201
5. Test public list: `GET /api/guestbook` returns entries
6. Test landing page: guestbook section visible, form works, wall displays entries
7. Test admin: `/admin/guestbook` lists entries, delete works
8. Test rate limit: rapid submits return 429 after 3/min
9. Test honeypot: filled `hp_website` → rejected
10. Test image limits: >3 images rejected, >5MB rejected, wrong type rejected
