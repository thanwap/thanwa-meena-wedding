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

### Phase 3a: .NET 10 API (Config Service)
- [x] Scaffold .NET 10 Web API solution at `api/` (Controllers style)
- [x] EF Core code-first: `Config` entity, Npgsql provider, Supabase PostgreSQL
- [x] `configs` table migration (Key, Value, Type, CreatedAt, UpdatedAt, DeletedAt)
- [x] Full CRUD endpoints: `GET/POST/PUT/DELETE /api/configs`
- [x] Google ID token authentication (`JwtBearer`)
- [x] Unit tests (xUnit + Moq) — `ConfigController` with mocked `IConfigService`
- [x] Integration tests (xUnit + WebApplicationFactory + Testcontainers PostgreSQL)

### Phase 3b: Next.js Admin Page
- [x] `/admin` route — list & manage configs via .NET API
- [x] Google OAuth login (NextAuth.js / Auth.js) — gate for `/admin`
- [x] Config list, create, edit, delete UI

### Phase 3c: CI/CD & Infrastructure
- [x] `.github/workflows/deploy-web.yml` — lint/test/build before Vercel deploy
- [x] `.github/workflows/deploy-api.yml` — test/build .NET API before Render deploy
- [x] Supabase connection string → GitHub Secrets & Vercel env vars
- [x] .NET 10 API secrets → GitHub Secrets & Render

### Phase 4: Full Wedding Features
- [ ] RSVP system (Next.js + Supabase-js)
- [ ] Guestbook / wishwall
- [ ] Photo gallery (optimized for fast load)
