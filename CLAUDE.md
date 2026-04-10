# Wedding Website — `frommeenatothanwaforever.com`

Wedding event site for **Thanwa & Meena** · **26 December 2026** · Pattaya.
Monorepo with a Next.js frontend (`web/`) and a .NET 10 admin API (`api/`).

---

## Repo layout

```
.
├── web/                         # Next.js 16 (App Router) — public site + admin
│   ├── app/
│   │   ├── page.tsx             # Landing page (Garden Whimsical Pastel theme)
│   │   ├── admin/
│   │   │   ├── layout.tsx       # Admin chrome (hides when unauthenticated)
│   │   │   ├── login/           # Username/password login
│   │   │   ├── change-password/ # Self-service password change
│   │   │   └── configs/         # Config CRUD (calls .NET API)
│   │   └── api/auth/[...nextauth]/route.ts
│   ├── auth.ts                  # NextAuth v5 + Credentials provider
│   ├── proxy.ts                 # Next.js 16 proxy (replaces middleware.ts)
│   ├── components/              # Shared UI
│   └── __tests__/               # Vitest unit tests
│
├── api/WeddingApi/              # .NET 10 admin API (deployed to Render)
│   ├── Program.cs               # Bootstrap + one-off `seed-admins` CLI
│   ├── Controllers/             # AuthController, ConfigController
│   ├── Services/                # AuthService (bcrypt + HS256 JWT), ConfigService
│   ├── Entities/                # AdminUser, Config
│   ├── Data/                    # AppDbContext, EF migrations, DesignTimeFactory
│   └── appsettings.json
│
├── api/WeddingApi.UnitTests/    # xUnit
├── api/WeddingApi.IntegrationTests/  # xUnit + Testcontainers Postgres
└── docs/superpowers/plans/      # Planning docs per major task
```

---

## Infrastructure

| Layer           | Service                                  |
|-----------------|------------------------------------------|
| DNS / CDN / SSL | Cloudflare                               |
| Frontend host   | Vercel (Next.js SSR/ISR)                 |
| API host        | Render (Docker, .NET 10)                 |
| Database        | Supabase (Postgres)                      |
| CI/CD           | GitHub Actions on version tags `v*.*.*`  |

QR code points to the root domain (no path). CNAME in Cloudflare DNS points to Vercel.

---

## Common commands

### `web/` (run from `/web`)

```bash
npm run dev          # local dev server (Turbopack)
npm run lint         # ESLint
npm test             # Vitest (⚠️ NOT tsc — vitest run)
npm run typecheck    # tsc --noEmit
npm run build        # next build
```

### `api/` (run from `/api` or `/api/WeddingApi`)

```bash
dotnet build
dotnet test                                # unit + integration (Testcontainers)
dotnet run                                 # local API
dotnet run -- seed-admins                  # create thanwa/meena with random passwords
dotnet run -- reset-admins                 # regenerate passwords for existing users
dotnet ef migrations add <Name>            # EF Core migration
dotnet ef database update                  # apply to DB pointed at by DESIGN_TIME_DB
```

---

## Pre-commit checklist

**`web/` changes** — run from `web/`, in this order:

```bash
npm run lint && npm test && npm run build
```

**`api/` changes** — run from `api/`:

```bash
dotnet build && dotnet test
```

Only tag after the relevant checklist passes locally. CI runs the same commands on
tag push; failure blocks the deploy.

---

## Environment variables

### Local dev — `web/.env.local`

```
AUTH_SECRET=                        # any 32+ char random string
DOTNET_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Local dev — `api/WeddingApi/appsettings.Development.json` (or user-secrets)

```jsonc
{
  "ConnectionStrings": { "DefaultConnection": "<supabase connection string>" },
  "Jwt": {
    "Key": "<random 48+ bytes base64>",
    "Issuer": "wedding-api",
    "Audience": "wedding-web"
  }
}
```

### Vercel (production) — set in dashboard

```
AUTH_SECRET
AUTH_URL=https://frommeenatothanwaforever.com
DOTNET_API_URL=https://<render-host>
```

### Render (production) — set on the .NET service

```
ConnectionStrings__DefaultConnection   # Supabase pooler URL
Jwt__Key
Jwt__Issuer=wedding-api
Jwt__Audience=wedding-web
```

---

## Auth system (post-v1.1.0)

Credentials-based — **no Google OAuth**. Two admin users: `thanwa`, `meena`.

**Flow:**

```
/admin/login
  → NextAuth Credentials.authorize()
    → POST ${DOTNET_API_URL}/api/auth/login {username, password}
      → .NET AuthService verifies bcrypt, issues HS256 JWT
    → JWT stored in session.idToken
  → /admin/configs (and other admin routes) forward session.idToken as Bearer
```

**Password change:** `/admin/change-password` → server action →
`POST /api/auth/change-password` (requires bearer). Current password verified
server-side before update.

**Protection:** `web/proxy.ts` redirects unauthenticated `/admin/*` (except
`/admin/login`) to `/admin/login?callbackUrl=…`.

---

## EF Core migrations against Supabase

The design-time factory (`api/WeddingApi/Data/AppDbContextFactory.cs`) reads
`DESIGN_TIME_DB` so migrations do not need a live connection in source control.

```bash
cd api/WeddingApi
export DESIGN_TIME_DB="Host=<supabase-host>;Port=5432;Database=postgres;Username=postgres.<ref>;Password=<pw>;SSL Mode=Require;Trust Server Certificate=true"
dotnet ef database update
```

To run the seeder against Supabase locally:

```bash
export ConnectionStrings__DefaultConnection="$DESIGN_TIME_DB"
export Jwt__Key=<any value — only needed for app bootstrap>
export Jwt__Issuer=wedding-api
export Jwt__Audience=wedding-web
dotnet run -- reset-admins 2>/dev/null   # 2>/dev/null hides EF debug logs
```

Seeder prints a clearly-bannered credentials table at the end.

---

## Deploy flow

1. Merge/push to `main`.
2. Run the pre-commit checklist for the affected subproject.
3. Tag: `git tag X.Y.Z && git push --tags`. **No `v` prefix** (e.g. `1.2.2`, not `v1.2.2`).
4. GitHub Actions (`deploy-web.yml`, `deploy-api.yml`) runs on tag push:
   - **web**: lint → test → `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`
   - **api**: build → test → Docker build → push to Render
5. Verify production.

---

## Admin UI conventions

**Always use shadcn/ui for admin pages** (`web/app/admin/**`).

- Project is already initialised — see `web/components.json` and
  `web/components/ui/`.
- Installed components: `badge`, `button`, `card`, `dialog`, `dropdown-menu`,
  `input`, `label`, `select`, `sonner`, `table`.
- Install more as needed: `cd web && npx shadcn@latest add <component>`.
- Do not hand-roll admin form controls, tables, or dialogs with raw HTML +
  Tailwind — use the shadcn primitives so the admin surface stays visually
  consistent.
- Public landing page (`web/app/page.tsx`) is intentionally custom-styled
  (Garden Whimsical Pastel) — **this rule does not apply there**.

---

## Gotchas / do not do

- **`npm test` is Vitest, not tsc.** Typecheck is a separate script
  (`npm run typecheck`). Older CLAUDE.md instructions were wrong about this.
- **Do not add `ignoreDeprecations` to `web/tsconfig.json`** — it silences an IDE
  squiggle but crashes `next build`. The deprecation warning on `baseUrl` is cosmetic.
- **`web/proxy.ts` matcher must exclude `/admin/login`** — otherwise the login
  page redirects to itself in a loop.
- **`next-auth` v5 beta** — session/jwt callbacks; import path is
  `@auth/core/jwt` for JWT module augmentation.
- **Next.js calls it `proxy.ts` now**, not `middleware.ts`. Keep it at
  `web/proxy.ts`.
- **Password changes happen over the .NET API**, not Supabase directly from
  Next.js. Next.js must never hold Supabase credentials on the server side.
- **Integration tests** set JWT env vars in `CustomWebApplicationFactory.InitializeAsync`
  via `Environment.SetEnvironmentVariable` because `WebApplicationBuilder`
  reads config before `ConfigureAppConfiguration` callbacks run.
- **Seed output** is buried in EF debug logs — run with `2>/dev/null` or
  scroll to the banner printed after `SaveChanges`.

---

## Planning docs

Bigger tasks get a plan in `docs/superpowers/plans/<slug>.md` with a checklist.
Update the checklist as you go; leave it on disk after completion as a record.

Latest: [`admin-credentials-auth.md`](./docs/superpowers/plans/admin-credentials-auth.md)

---

## Phase tracker

High-level project phases + task checklists live in [`PHASES.md`](./PHASES.md).
