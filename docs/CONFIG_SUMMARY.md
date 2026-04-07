# Configuration Summary

> Reference of all keys and config used across services for the Thanwa & Meena wedding website.

---

## Vercel

| Item | Value |
|------|-------|
| Project Name | `thanwa-meena-wedding` |
| Project ID | (see `.vercel/project.json`) |
| Org ID | (see `.vercel/project.json`) |
| Custom Domain | `frommeenatothanwaforever.com` |

### Vercel Environment Variables (set via Vercel dashboard)

| Key | Description |
|-----|-------------|
| `AUTH_SECRET` | Auth.js secret |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret |
| `DOTNET_API_URL` | .NET API base URL (Render service URL) |
| `DOTNET_API_SECRET` | .NET API shared secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

---

## Google OAuth (Google Cloud Console)

| Item | Value |
|------|-------|
| Client ID | (stored in `AUTH_GOOGLE_ID`) |
| Client Secret | (stored in `AUTH_GOOGLE_SECRET`) |
| Authorized redirect URI | `https://frommeenatothanwaforever.com/api/auth/callback/google` |
| OAuth consent screen | Configure allowed emails for admin access |

---

## Render (.NET 10 API)

| Item | Value |
|------|-------|
| Service type | Docker (pulls from GHCR) |
| Image | `ghcr.io/<owner>/wedding-api:latest` |
| Deploy trigger | Webhook URL stored as `RENDER_DEPLOY_HOOK_URL` in GitHub Secrets |

### Render Environment Variables (set in Render dashboard)

| Key | Description |
|-----|-------------|
| `ConnectionStrings__DefaultConnection` | Supabase PostgreSQL connection string |
| `Authentication__Google__ClientId` | Google OAuth Client ID |

---

## Supabase

| Item | Description |
|------|-------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Anon Key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Service Role Key | `SUPABASE_SERVICE_ROLE_KEY` |
| Connection String | Used by .NET API via `ConnectionStrings__DefaultConnection` |
| Tables | `configs` (Key, Value, Type, CreatedAt, UpdatedAt, DeletedAt) |

---

## Cloudflare

| Item | Value |
|------|-------|
| Domain | `frommeenatothanwaforever.com` |
| DNS Record | `CNAME @ → cname.vercel-dns.com` (Orange Cloud / Proxied) |
| SSL Mode | Full (Strict) |
| Nameservers | Cloudflare nameservers (set at registrar) |

---

## GitHub Secrets

| Secret | Used By | Description |
|--------|---------|-------------|
| `VERCEL_TOKEN` | `deploy-web.yml` | Vercel personal access token |
| `VERCEL_ORG_ID` | `deploy-web.yml` | Vercel org ID |
| `VERCEL_PROJECT_ID` | `deploy-web.yml` | Vercel project ID |
| `RENDER_DEPLOY_HOOK_URL` | `deploy-api.yml` | Render webhook URL to trigger redeploy |
| `GITHUB_TOKEN` | `deploy-api.yml` | Auto-provided — pushes Docker image to GHCR |

---

## CI/CD Triggers

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `deploy-web.yml` | Push to `main` — changes in `web/**` | Lint → Test → Vercel build → Vercel deploy (prod) |
| `deploy-api.yml` | Push to `main` — changes in `api/**` | .NET test → Docker build → Push to GHCR → Render webhook |
