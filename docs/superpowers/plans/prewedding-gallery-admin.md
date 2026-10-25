# Pre-wedding Gallery — Admin-managed Photos

Make the landing-page **Pre-wedding** bento gallery dynamic: admins upload,
caption, reorder and delete photos at `/admin/prewedding`; uploads are
converted to **WebP** (two sizes) on the .NET API and served from Supabase
Storage.

Builds on the static bento grid + lightbox in
`web/components/prewedding-gallery.tsx` (currently uncommitted placeholders).

---

## Design decisions

| Decision | Answer | Why |
|---|---|---|
| Where WebP conversion happens | **.NET API**, `SixLabors.ImageSharp` (pure managed, no native libs in Docker) | Safari can't encode WebP from `<canvas>`, so browser-side conversion is unreliable. Server gives consistent output. |
| Accepted input | `.jpg` / `.jpeg` / `.png` (checked by magic bytes, not just extension) | As requested |
| Output variants | `full` — max **2400px** long edge, WebP q≈82 · `thumb` — max **900px**, WebP q≈78 | Thumb for the grid (a "large" tile is ~480 CSS px → 900px covers 2× DPR), full for the lightbox |
| Metadata | Auto-orient from EXIF, then **strip all EXIF** (incl. GPS) | Phone photos rotate correctly; no location leak |
| Getting big originals past Vercel | Browser **pre-shrinks** to ≤3000px JPEG q0.92 (reuse `lib/image-compress.ts`) before the server action → one file per request | Vercel function body limit is 4.5 MB; camera originals are 8–25 MB. Final quality is decided by the server's WebP pass. |
| Storage | Existing public `photos` bucket, prefix `prewedding/full/` and `prewedding/thumb/` | No manual bucket setup on Supabase |
| DB | New `prewedding_photos` table (EF migration `AddPreweddingPhotos`) | Kept separate from guest photo-booth `photos` |
| Rendering on landing | `next/image` with **`unoptimized`**, explicit `srcSet` isn't needed — grid uses `thumbUrl`, lightbox uses `fullUrl` | Files are already optimised WebP; skips Vercel image-optimisation quota + double compression |
| Width/height stored | Yes (of the full variant) | Lightbox knows aspect ratio before load (no jump) |
| Tile size | Optional per photo (`large`/`tall`/`wide`/`small`); empty = auto pattern | Same as current component |
| Ordering | `SortOrder` int; drag-to-reorder in admin with `@dnd-kit/react` (already a dep) | Editorial control of the hero shot |
| Empty state | Section is hidden on landing when there are 0 photos (nav item too) | No broken empty grid |
| Cache | Landing fetch `next: { tags: ["prewedding"] }`; admin actions call `revalidateTag("prewedding")` | Changes show immediately without making the page slower |

---

## API (.NET) — `api/WeddingApi`

**Entity** `PreweddingPhoto`
```
Id Guid · FullPath string · ThumbPath string · Width int · Height int
Title string? · Caption string? · TileSize string? · SortOrder int · CreatedAt DateTime
```

**Endpoints** (`PreweddingPhotosController`, route `api/prewedding-photos`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | anonymous | List ordered by `SortOrder` → `{ id, fullUrl, thumbUrl, width, height, title, caption, tileSize }` |
| POST | `/` | admin | Multipart `file` (+ optional title/caption) → validate → ImageSharp → upload 2 WebPs → insert (SortOrder = max+1). 15 MB request cap |
| PATCH | `/{id}` | admin | Update title / caption / tileSize |
| PUT | `/order` | admin | Body `{ ids: Guid[] }` → rewrite SortOrder |
| DELETE | `/{id}` | admin | Delete storage objects + row |

**Service** `PreweddingPhotoService` + `IImageProcessor` (`ImageSharpProcessor`)
so conversion is unit-testable without storage. Storage upload/delete reuses
the same Supabase REST pattern as `PhotoService` (content type `image/webp`).

---

## Web — `web/`

- `app/admin/prewedding/page.tsx` + `actions.ts` (shadcn only):
  - Upload card: multi-file picker / drag-drop (`.jpg,.jpeg,.png`), per-file
    progress list, uploads sequentially.
  - Sortable grid of thumbnails (drag to reorder → `PUT /order`).
  - Per-photo edit dialog: title, caption, tile size `select`; delete with
    confirm dialog.
- `app/admin/_nav.ts`: add "Pre-wedding" under **Content**.
- `app/actions/prewedding.ts`: public `getPreweddingPhotos()` (tagged fetch).
- `app/page.tsx`: fetch photos, pass to `<PreweddingGallery photos=… />`;
  hide section when empty.
- `components/prewedding-gallery.tsx`: take `{ thumbUrl, fullUrl, width,
  height, title, caption, tileSize }`; remove placeholders; use stored
  aspect ratio in the lightbox.
- `components/nav-menu.tsx`: hide "Pre-wedding" item when there are no photos.
- `next.config`: `serverActions.bodySizeLimit` → `"5mb"`.
- `app/globals.css`: landing sections alternate ivory / ivory-dark via
  `.landing-sections > section:nth-of-type(...)` instead of inline styles, so a
  hidden gallery never leaves two same-colour sections adjacent.

---

## Checklist

### API
- [x] Add `SixLabors.ImageSharp` package
- [x] `PreweddingPhoto` entity + `DbSet` + migration `AddPreweddingPhotos`
- [x] `IImageProcessor` / `ImageSharpProcessor` (validate, auto-orient, strip EXIF, resize, WebP encode)
- [x] `IPreweddingPhotoService` / `PreweddingPhotoService` (+ storage rollback on DB failure, like `PhotoService`)
- [x] `PreweddingPhotosController` + DI registration
- [x] Unit tests: image processor (jpg + png → webp, size caps, rejects non-image), controller validation
- [x] Integration tests: list/order/patch/delete against Testcontainers Postgres (storage mocked)
- [x] `dotnet build && dotnet test`

### Web
- [x] `app/actions/prewedding.ts` (public read) + `app/admin/prewedding/actions.ts`
- [x] Admin page: upload, reorder, edit, delete
- [x] Nav entry in `_nav.ts`
- [x] Wire landing page + gallery component to API data; hide when empty
- [x] Vitest: gallery with API-shaped data, admin upload helper (pre-shrink)
- [x] `npm run lint && npm test && npm run build`

### Deploy (when you say so)
- [ ] Run migration against Supabase (`dotnet ef database update`)
- [ ] Deploy API before web (web depends on the new endpoint)
- [ ] Upload real photos via `/admin/prewedding`, verify landing

---

## Resolved questions

1. Both admins manage the gallery (any authenticated admin).
2. Section is hidden when there are no photos or the API is unreachable.

## Verification notes (2026-10-25)

- `dotnet test`: 19 unit + 9 integration pass; `npm test`: 30 pass; lint + build clean.
- Local E2E (Docker Postgres + throwaway mock of Supabase Storage): uploaded
  JPG, PNG and a 19.7 MB / 6000px JPEG. All stored as WebP; EXIF rotation applied;
  19.7 MB → 483 KB full + 110 KB thumb. Edit, drag-reorder, delete, landing grid,
  lightbox and empty state (section + nav item hidden) all confirmed in a browser.
- Config key: the API reads `Supabase:ServiceRoleKey` (same as photo booth).
