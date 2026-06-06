# Photo Booth Feature — Implementation Plan

Wedding day photo booth: guests take up to 10 photos with selectable vintage
film filters, browse a public masonry gallery with infinite scroll.

---

## Design Decisions (from grilling session)

| Decision                | Answer                                                                 |
|-------------------------|------------------------------------------------------------------------|
| Guest identity          | Device UUID (localStorage) + display name, asked after first photo     |
| Storage                 | Supabase Storage bucket                                                |
| Filter application      | Client-side via Canvas, before upload. Only filtered version stored    |
| Filter options          | 3-4 presets: No Filter, Warm Vintage, Cool Film, B&W Classic          |
| Capture method          | Camera-first live viewfinder (getUserMedia + real-time filter), plus file upload option |
| Compression             | Client-side, ~1-2MB, max 2048px longest edge, JPEG quality ~82%       |
| Upload limit            | 10 photos per device UUID (soft — cache clear resets it, accepted)    |
| Gallery page            | Public at `/gallery`                                                   |
| Camera UI               | Full-screen overlay on `/gallery`                                      |
| Gallery layout          | Masonry grid, clean — tap for lightbox with name + timestamp           |
| Thumbnails              | ~400px generated client-side, stored in separate folder                |
| Lazy loading            | Infinite scroll, 20-30 photos per batch                                |
| Gallery tabs            | "All Photos" (newest first) + "My Photos" (by device UUID)            |
| Delete own photos       | Yes, matched by device UUID                                            |
| Admin moderation        | `/admin/photos` — browse all, delete any                               |
| Cache clear / UUID loss | Accepted — fresh limit, old photos stay, admin is safety net           |

---

## Architecture

```
Guest opens /gallery
  -> Browses masonry grid (thumbnails, infinite scroll)
  -> Taps "Take a Photo" -> full-screen camera viewfinder
  -> Live filter preview (tap to switch presets)
  -> Snap -> preview with filter applied
  -> First time? "What's your name?" prompt
  -> Canvas encodes at 2048px/82% JPEG + 400px thumbnail
  -> POST /api/photos/upload to .NET API
  -> .NET API uploads to Supabase Storage, saves to Postgres
  -> Photo appears in gallery
```

---

## Supabase Setup

### Storage buckets

- `photos/full/` — filtered photos, max 2048px, ~1-2MB each
- `photos/thumb/` — thumbnails, ~400px, ~30-50KB each

Bucket policy: public read. .NET API handles all uploads/deletes using service
role key via Supabase Storage REST API.

### Database table: `photos`

Managed via EF Core migration `AddPhotos` (not raw SQL).

---

## Implementation Tasks

### Task 1: Supabase Storage + DB setup

- [x] Create `photos` storage bucket in Supabase (public read)
- [x] Create `photos` table via EF Core migration (`AddPhotos`)
- [x] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` already in env

### Task 2: Device identity module

- [x] `web/lib/device-id.ts` — generate UUID v4 on first visit, persist in localStorage
- [x] `getDeviceId()` — returns existing or creates new
- [x] `getDisplayName()` / `setDisplayName(name)` — localStorage getter/setter
- [x] `getPhotoCount()` / `incrementPhotoCount()` — track against 10-photo limit

### Task 3: Image processing utilities

- [x] `web/lib/image-filters.ts` — Canvas-based filter engine
  - Filter presets: `none`, `warm-vintage`, `cool-film`, `bw-classic`
  - CSS filter on video for real-time preview; pixel manipulation + vignette + grain at capture
- [x] `web/lib/image-compress.ts` — resize to max 2048px/400px, encode JPEG
- [x] Unit tests for compression output size (`web/__tests__/image-compress.test.ts`)

### Task 4: Camera viewfinder component

- [x] `web/components/photo-booth/camera-viewfinder.tsx`
  - `getUserMedia({ video: { facingMode: 'environment' } })` with front camera toggle
  - Real-time filter preview: CSS filter on `<video>` element
  - Filter selector strip at bottom (tap to switch)
  - Shutter button
  - "Upload from gallery" button (file input fallback)
  - Photo count indicator (e.g., "3/10")
  - Close button to return to gallery
- [x] Handle permissions denied gracefully (fall back to file upload)
- [x] Handle devices with no camera (desktop — show file upload only)

### Task 5: Photo preview + name prompt

- [x] `web/components/photo-booth/photo-preview.tsx`
  - Show the captured photo with applied filter
  - "Retake" and "Save" buttons
  - If first upload (no display name in localStorage): show name input before save
- [x] On save:
  - Compress full image (2048px) + thumbnail (400px)
  - POST multipart form to .NET API `/api/photos/upload`
  - Increment local photo count

### Task 6: Gallery page — `/gallery`

- [x] `web/app/gallery/page.tsx` — server component shell
- [x] `web/components/photo-booth/photo-gallery.tsx` — client component
  - Tabs: "All Photos" / "My Photos"
  - Masonry grid layout using CSS columns
  - Lazy-load thumbnails with native `loading="lazy"`
  - Infinite scroll via IntersectionObserver (cursor-based pagination)
  - "Take a Photo" button -> opens camera overlay
  - Empty state for "My Photos" when no uploads yet

### Task 7: Lightbox component

- [x] `web/components/photo-booth/photo-lightbox.tsx`
  - Tap thumbnail -> full-screen lightbox with full-res image
  - Show: display name, filter used, timestamp
  - If photo belongs to current device: show "Delete" button
  - Arrow navigation between photos
  - Close on backdrop tap or X button

### Task 8: Photo server actions

- [x] `web/app/actions/photos.ts` — calls .NET API at `DOTNET_API_URL`
  - `getPhotos(cursor?, limit?, deviceId?)` — GET `/api/photos`
  - `uploadPhoto(formData)` — POST `/api/photos/upload`
  - `deletePhotoByOwner(photoId, deviceId)` — DELETE `/api/photos/{id}`

### Task 9: Admin photos page

- [x] `web/app/admin/photos/page.tsx` — shadcn/ui grid with infinite scroll
- [x] `web/app/admin/photos/actions.ts` — calls .NET API via `adminFetch`
  - `adminGetPhotos(cursor?, limit?)` — GET `/api/photos/admin`
  - `adminDeletePhotos(ids[])` — DELETE `/api/photos/admin/bulk`

### Task 10: .NET API — photo endpoints

- [x] `api/WeddingApi/Entities/Photo.cs` — EF entity
- [x] `api/WeddingApi/Data/AppDbContext.cs` — DbSet<Photo>, table config, indexes
- [x] `api/WeddingApi/Data/Migrations/20260606142128_AddPhotos.cs` — EF migration
- [x] `api/WeddingApi/Dtos/PhotoDtos.cs` — PhotoDto, PhotoPagedResult, etc.
- [x] `api/WeddingApi/Services/IPhotoService.cs` + `PhotoService.cs`
  - EF Core queries for all read/write
  - Supabase Storage REST API for upload/delete (service role key)
  - `MaxPhotosPerDevice = 10` enforced server-side
- [x] `api/WeddingApi/Controllers/PhotosController.cs`
  - `GET /api/photos` (AllowAnonymous, photos-get rate limit)
  - `POST /api/photos/upload` (AllowAnonymous, photos-upload rate limit, 20MB)
  - `DELETE /api/photos/{id}` (AllowAnonymous, deviceId ownership check)
  - `GET /api/photos/admin` (Authorize)
  - `DELETE /api/photos/admin/bulk` (Authorize)
- [x] `Program.cs` — service registration + rate limiters
- [x] `appsettings.json` — `Supabase:ServiceRoleKey` placeholder

### Task 11: Integration + polish

- [x] Add `/gallery` link to nav menu on landing page (`web/components/nav-menu.tsx`)
- [x] Style gallery page to match Garden Whimsical Pastel theme
- [x] Mobile-first responsive design
- [x] `Permissions-Policy: camera=*` header in `next.config.mjs`
- [x] Remove `@supabase/supabase-js` from web (not needed — all via .NET API)
- [ ] Test on iOS Safari + Android Chrome (getUserMedia quirks)
- [ ] Test with slow network (venue WiFi simulation)
- [ ] Run full pre-commit checklist: `npm run lint && npm test && npm run build`

---

## File tree (new files)

```
web/
  app/
    gallery/
      page.tsx                    # Gallery page (server component shell)
    admin/
      photos/
        page.tsx                  # Admin photo moderation
        actions.ts                # Admin server actions -> .NET API
    actions/
      photos.ts                  # Public server actions -> .NET API
  components/
    photo-booth/
      camera-viewfinder.tsx      # Live camera with filter preview
      photo-preview.tsx          # Post-capture preview + name prompt
      photo-gallery.tsx          # Masonry grid + infinite scroll
      photo-lightbox.tsx         # Full-screen photo viewer
  lib/
    device-id.ts                 # Device UUID + display name management
    image-filters.ts             # Canvas filter presets
    image-compress.ts            # Resize + JPEG compression

api/WeddingApi/
  Entities/Photo.cs
  Data/Migrations/20260606142128_AddPhotos.cs
  Dtos/PhotoDtos.cs
  Services/IPhotoService.cs
  Services/PhotoService.cs
  Controllers/PhotosController.cs
```

---

## Dependencies (new)

- None for web — Canvas API, getUserMedia, IntersectionObserver are browser-native
- .NET: uses existing HttpClient + EF Core + BCrypt deps

---

## Open questions (deferred)

- Exact filter color values — tune during implementation
- Whether to add a fun "photo count" or stats section to the gallery
- QR code at the venue pointing to `/gallery`
