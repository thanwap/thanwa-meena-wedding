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
- [ ] Scaffold .NET 10 Web API solution at `api/` (Controllers style)
- [ ] EF Core code-first: `Config` entity, Npgsql provider, Supabase PostgreSQL
- [ ] `configs` table migration (Key, Value, Type, CreatedAt, UpdatedAt, DeletedAt)
- [ ] Full CRUD endpoints: `GET/POST/PUT/DELETE /api/configs`
- [ ] Google ID token authentication (`JwtBearer`)
- [ ] Unit tests (xUnit + Moq) — `ConfigController` with mocked `IConfigService`
- [ ] Integration tests (xUnit + WebApplicationFactory + Testcontainers PostgreSQL)

### Phase 3b: Next.js Admin Page
- [ ] `/admin` route — list & manage configs via .NET API
- [ ] Google OAuth login (NextAuth.js / Auth.js) — gate for `/admin`
- [ ] Config list, create, edit, delete UI

### Phase 3c: CI/CD & Infrastructure
- [ ] `.github/workflows/deploy.yml` — lint/test/build before Vercel deploy
- [ ] `.github/workflows/api.yml` — test/build .NET API before Railway/Render deploy
- [ ] Supabase connection string → GitHub Secrets & Vercel env vars
- [ ] .NET 10 API secrets → GitHub Secrets & Railway/Render

### Phase 4: Full Wedding Features
- [ ] RSVP system (Next.js + Supabase-js)
- [ ] Guestbook / wishwall
- [ ] Photo gallery (optimized for fast load)
