# Phase 3c: CI/CD & Infrastructure — Design Spec

**Date:** 2026-04-06
**Status:** Approved

---

## Overview

Two independent GitHub Actions pipelines triggered on push to `main` only. Both build artifacts in CI before deploying — Next.js uses Vercel's prebuilt flow, .NET API uses Docker image pushed to GHCR then pulled by Render.

---

## Pipelines

### `deploy-web.yml` — Next.js → Vercel

**Trigger:** push to `main`

**Steps:**
1. Checkout
2. `npm ci`
3. `npm run lint`
4. `npm test`
5. `vercel pull --yes --environment=production` — pulls Vercel env vars into `.vercel/`
6. `vercel build --prod` — builds Next.js locally in CI
7. `vercel deploy --prebuilt --prod` — uploads prebuilt output; Vercel serves it

**GitHub Secrets required:**
| Secret | How to get |
|---|---|
| `VERCEL_TOKEN` | Vercel dashboard → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `cat web/.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | same file |

**One-time manual step:** Disable Vercel auto-deploy in Vercel dashboard → Project Settings → Git → Ignored Build Step → set to `exit 1`.

---

### `deploy-api.yml` — .NET API → GHCR → Render

**Trigger:** push to `main`

**Steps:**
1. Checkout
2. Setup .NET 10
3. `dotnet test` — runs unit tests + integration tests (Testcontainers uses Docker, available on `ubuntu-latest`)
4. Log in to GHCR using `GITHUB_TOKEN` (automatic, no extra secret)
5. Build Docker image: `ghcr.io/<owner>/thanwa-meena-wedding/wedding-api:latest`
6. Push image to GHCR
7. `curl -X POST $RENDER_DEPLOY_HOOK_URL` — triggers Render to pull new image and redeploy

**GitHub Secrets required:**
| Secret | How to get |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render dashboard → Service → Settings → Deploy Hook |

**GHCR package visibility:** Set to **public** after first push (GitHub → Packages → wedding-api → Package Settings → Change visibility). This allows Render to pull without authentication.

---

## Dockerfile — `api/Dockerfile`

Multi-stage build:

```
Stage 1 (build): mcr.microsoft.com/dotnet/sdk:10.0
  - Copy and restore
  - dotnet publish -c Release -o /app/publish

Stage 2 (runtime): mcr.microsoft.com/dotnet/aspnet:10.0
  - Copy published output
  - EXPOSE 8080
  - ENV ASPNETCORE_URLS=http://+:8080
  - ENTRYPOINT ["dotnet", "WeddingApi.dll"]
```

Port is `8080` to match Render's default. Local dev continues using `dotnet run` (port 5073 from launchSettings).

---

## Render Service Setup (one-time manual)

1. Render dashboard → New Web Service → **Deploy an existing image**
2. Image URL: `ghcr.io/<owner>/thanwa-meena-wedding/wedding-api:latest`
3. Instance type: **Free**
4. Set environment variables:

| Key | Value |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | Supabase Npgsql connection string |
| `Authentication__Google__ClientId` | Google OAuth Client ID |

5. Copy the Deploy Hook URL → add to GitHub Secrets as `RENDER_DEPLOY_HOOK_URL`
6. Disable auto-deploy on Render (so only GitHub Actions triggers deploys)

---

## File Structure

```
.github/
└── workflows/
    ├── deploy-web.yml
    └── deploy-api.yml
api/
└── Dockerfile
```

---

## Out of Scope

- Preview deployments (PR-based)
- Staging environment
- Docker image tagging by commit SHA (uses `latest` only)
- Render health check customisation
