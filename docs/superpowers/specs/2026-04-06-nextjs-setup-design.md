# Design Spec: Next.js Setup + Save the Date Page

**Date:** 2026-04-06
**Phase:** 1
**Scope:** Scaffold the Next.js web project and build the Save the Date / Coming Soon page.

---

## Overview

Set up the Next.js (App Router) project inside a `web/` subfolder and build a fullscreen "Save the Date" page that doubles as a coming soon placeholder while the rest of the site is developed.

---

## Visual Design

- **Style:** Clean & Minimal — white space, fine typography, subtle overlay
- **Layout:** Fullscreen photo background with dark gradient overlay, all content anchored to the bottom-center
- **Photo:** Placeholder image for now (`public/placeholder.jpg`), swappable with real pre-wedding photo later
- **Typography:** Serif font (Playfair Display) for names; sans-serif for labels and metadata

---

## Page Content

| Element | Value |
|---|---|
| Eyebrow label | `SAVE THE DATE` |
| Names | `Thanwa & Meena` |
| Date | `26 · 12 · 2026` |
| Venue | `The Cop Seminar and Resort, Pattaya` |
| Maps link | `📍 View on Google Maps` → https://maps.app.goo.gl/WysXSoYYKXm98CcD8 |
| Tagline | `Join us as we celebrate our love` |
| Coming Soon badge | `WEBSITE COMING SOON` (pill badge, frosted glass style) |

---

## Architecture

### Repo Structure

```
/                         # Repo root
  web/                    # Next.js project (npm root)
    app/
      layout.tsx          # Root layout: font, metadata, viewport
      page.tsx            # Save the Date page (Server Component)
      globals.css         # Tailwind base + custom CSS vars
    public/
      placeholder.jpg     # Swap with real photo later
    package.json
    next.config.ts
    tailwind.config.ts
    tsconfig.json
  api/                    # .NET 10 API — Phase 4 (not yet created)
  CLAUDE.md
  PHASES.md
  docs/
    superpowers/specs/    # Design specs
```

### Tech Stack

- **Next.js 15** App Router
- **Tailwind CSS v4**
- **TypeScript**
- `next/image` — optimized photo with `fill` layout, `priority` loading
- `next/font/google` — Playfair Display (serif, names) + Geist Sans (labels)

### Rendering Strategy

`app/page.tsx` is a **Server Component** (no `'use client'`). The page is fully static — no interactivity, no client-side JS needed. Vercel will serve it as a static pre-rendered HTML page.

### Key Implementation Details

- Photo uses `<Image fill priority>` inside a `position: relative` full-viewport container
- Dark gradient overlay via an absolutely-positioned `<div>` (Tailwind: `bg-gradient-to-t from-black/70 via-black/20 to-black/10`)
- Google Maps link is a plain `<a href="..." target="_blank" rel="noopener noreferrer">` — no button styling
- Coming Soon badge: pill with `bg-white/10 border border-white/20 backdrop-blur-sm`
- Responsive: single-column layout works on mobile and desktop; font sizes scale with `text-sm/base/lg` breakpoints

### Deployment

- In Vercel dashboard: set **Root Directory** to `web/` when importing the repo
- Custom domain `frommeenatothanwaforever.com` connected via CNAME in Cloudflare DNS pointing to `cname.vercel-dns.com`

---

## Out of Scope (Phase 1)

- RSVP form
- Guestbook
- Photo gallery
- Admin dashboard
- Supabase integration
- CI/CD GitHub Actions workflow

---

## Success Criteria

- `npm run dev` inside `web/` shows the Save the Date page at localhost
- `npm run build` succeeds with no errors
- Page passes Lighthouse accessibility score ≥ 90
- Deployed to Vercel, accessible at `frommeenatothanwaforever.com`
