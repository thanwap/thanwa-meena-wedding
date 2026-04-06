# Wedding Website: From Meena to Thanwa Forever

## Project Overview
Wedding event website for Thanwa & Meena.
- **Domain**: frommeenatothanwaforever.com
- **Wedding Date**: 26 December 2026
- **Infrastructure**: Cloudflare (DNS/CDN/SSL) → Vercel (Next.js hosting)

## Tech Stack
- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Database**: Supabase (RSVP & Guestbook data)
- **Backend API**: .NET 10 (Admin Dashboard) deployed on Railway/Render via Docker
- **CI/CD**: GitHub Actions + Vercel Auto-deploy

## Development Phases
See [PHASES.md](./PHASES.md) for full phase breakdown and task checklists.

## Key Commands
```bash
# Local dev
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## Environment Variables
```
# .env.local (never commit)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DOTNET_API_URL=
DOTNET_API_SECRET=
```

## Architecture Notes
- QR Code points to root domain (no path) for clean URLs
- Cloudflare proxy handles SSL termination and CDN caching
- Vercel handles Next.js SSR/SSG; CNAME record in Cloudflare DNS points to Vercel
- .NET 10 Admin API is separate from Next.js frontend
