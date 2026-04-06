# Development Phases

### Phase 1: Coming Soon Page (DONE: Domain & Cloudflare)
- [x] Register domain: frommeenatothanwaforever.com
- [x] Cloudflare setup (Nameservers, Orange Cloud Proxy, SSL)
- [x] Next.js project setup (App Router)
- [x] "Save the Date: 26/12/2026" page with pre-wedding photo
- [x] Deploy to Vercel, connect custom domain via CNAME in Cloudflare

### Phase 2: QR Code & Print
- [x] Generate high-res QR Code (SVG/PNG) pointing to root domain
- [x] Test scan in various lighting conditions

### Phase 3: CI/CD & Infrastructure
- [ ] `.github/workflows/deploy.yml` — lint/test/build before Vercel deploy
- [ ] Supabase connection string → GitHub Secrets & Vercel env vars
- [ ] .NET 10 API secret → GitHub Secrets & Railway/Render

### Phase 4: Full Wedding Features
- [ ] RSVP system (Next.js + Supabase-js)
- [ ] Admin Dashboard (.NET 10 API, Docker, Railway/Render)
- [ ] Guestbook / wishwall
- [ ] Photo gallery (optimized for fast load)
