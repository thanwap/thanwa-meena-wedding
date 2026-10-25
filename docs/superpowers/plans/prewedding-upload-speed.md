# Pre-wedding Upload — Speed-up

Admin uploads at `/admin/prewedding` are slow. Path per photo:
browser → Vercel server action → Railway (.NET, ImageSharp WebP ×2) → Supabase Storage → DB,
one photo at a time.

---

## Bottlenecks & fixes

| # | Bottleneck | Fix |
|---|---|---|
| 1 | WebP encoders use `WebpEncodingMethod.Level6` (slowest) on a small Railway CPU | `Level4` (ImageSharp default) — same `Quality`, slightly bigger files |
| 1b | Thumb is resized from the full-res original; full + thumb encoded sequentially | Resize thumb from the 2400px full; encode both in parallel |
| 2 | Server decodes originals at full resolution (≤4 MB files are passed through untouched, e.g. 6000px) | `DecoderOptions.TargetSize` (JPEG decodes at reduced scale); browser always shrinks to the final 2400px edge before upload |
| 3 | Uploads run strictly one at a time | Up to 3 concurrent uploads (body limit is per request) |

---

## Checklist

- [x] `ImageSharpProcessor`: Level4, TargetSize decode, thumb from full, parallel encode
- [x] `prewedding-upload.ts`: shrink anything over 2400px (not just > 4 MB) to 2400px JPEG
- [x] `image-compress.ts`: `imageSmoothingQuality = "high"` (browser now does the final downscale)
- [x] `prewedding-manager.tsx`: 3 concurrent upload workers
- [x] Tests updated (vitest + xUnit)
- [x] `npm run lint && npm test && npm run build`
- [x] `dotnet build && dotnet test`
