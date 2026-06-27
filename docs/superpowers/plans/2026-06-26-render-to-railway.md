# Render → Railway Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Move the live .NET API backend from Render to Railway, updating CI/CD and all env-var references.

**Architecture:** Railway builds from the `api/Dockerfile` directly via GitHub source — no GHCR push needed. The GitHub Actions workflow triggers Railway deployment via the Railway GraphQL API (`serviceInstanceRedeploy` mutation) after tests pass. Railway token is a UUID stored as `RAILWAY_TOKEN` GitHub secret. The Next.js frontend's `DOTNET_API_URL` in Vercel points to the Railway service URL.

**Tech Stack:** Railway (Docker web service, GitHub source deploy), GitHub Actions, Railway GraphQL API, Vercel environment variables.

**Completed:** 2026-06-27. Live at `https://thanwa-meena-wedding-production.up.railway.app`.

## Global Constraints

- `api/Dockerfile` stays unchanged — Railway uses it as-is.
- Railway service must expose port `8080` (already set via `ASPNETCORE_URLS=http://+:8080` in the Dockerfile).
- `DOTNET_API_URL` in Vercel must point to the Railway URL — no trailing slash.
- Remove `RENDER_DEPLOY_HOOK_URL` GitHub secret after migration is verified.
- Tag format: `1.X.Y` (no `v` prefix) — do not change the workflow trigger.

---

### Task 1: Create the Railway Service

**Files:** none — all steps in the Railway dashboard.

- [x] **Step 1: Create a new project / service**

  Go to [railway.app](https://railway.app) → **New Project** → **Empty Project**.

  Inside the project → **New Service** → **Empty Service** (we'll configure it manually, not via GitHub connect, so CI controls deploys).

- [x] **Step 2: Configure the service to deploy from a Docker image**

  Railway supports two modes:
  - **Source deploy** (Railway pulls GitHub and runs `docker build`) — simplest, no GHCR needed.
  - **Image deploy** (Railway pulls a pre-built image from a registry).

  Use **source deploy** to keep things simple:

  In your Railway service → **Settings** → **Source** → **GitHub Repo** → connect `thanwap/thanwa-meena-wedding` → set **Root Directory** to `api`.

  Railway will auto-detect the `Dockerfile` in `api/`.

- [x] **Step 3: Set the port**

  Railway → service → **Settings** → **Networking** → set **Port** to `8080`.

  Also set in **Variables** (to be safe):

  | Key | Value |
  |---|---|
  | `PORT` | `8080` |
  | `ASPNETCORE_URLS` | `http://+:8080` |

- [x] **Step 4: Set environment variables**

  Railway → service → **Variables** tab → add:

  | Key | Value |
  |---|---|
  | `ASPNETCORE_ENVIRONMENT` | `Production` |
  | `ConnectionStrings__DefaultConnection` | Supabase pooler URL (copy from Render's env vars before deleting the service) |
  | `Jwt__Key` | Copy from Render |
  | `Jwt__Issuer` | `wedding-api` |
  | `Jwt__Audience` | `wedding-web` |
  | `Supabase__Url` | Copy from Render |
  | `Supabase__ServiceKey` | Copy from Render |

  > **Do this before deleting the Render service.** Go to Render → your service → Environment tab and copy all values now.

- [x] **Step 5: Disable auto-deploy on push**

  Railway → service → **Settings** → **Deploy** → disable **Auto Deploy** (so only the deploy hook triggers a deploy, not every push to GitHub).

- [x] **Step 6: Generate a deploy hook**

  Railway → service → **Settings** → **Deploy** → **Deploy Hook** → generate.

  The URL looks like: `https://backboard.railway.app/webhook/v1/xxxxxx`

  Save it — you'll add it as a GitHub secret in Task 2.

- [x] **Step 7: Note the Railway service URL**

  Railway → service → **Settings** → **Networking** → **Public Networking** → generate a public domain if not already present.

  It looks like: `https://wedding-api-production-xxxx.up.railway.app`

  Save it — you'll update Vercel in Task 3.

---

### Task 2: Update GitHub Actions Workflow

The current `deploy-api.yml` builds a Docker image, pushes to GHCR, then calls the Render hook. With Railway source-deploy, we don't need GHCR at all — just call the Railway deploy hook after tests pass.

**Files:**
- Modify: `.github/workflows/deploy-api.yml`

- [x] **Step 1: Replace the workflow content**

  Current file (`.github/workflows/deploy-api.yml`):
  ```yaml
  name: Deploy API

  on:
    push:
      tags:
        - '[0-9]+.[0-9]+.[0-9]+'

  concurrency:
    group: deploy-api-${{ github.ref }}
    cancel-in-progress: true

  jobs:
    test-and-deploy:
      runs-on: ubuntu-latest
      permissions:
        contents: read
        packages: write

      steps:
        - uses: actions/checkout@v4

        - name: Setup .NET
          uses: actions/setup-dotnet@v4
          with:
            dotnet-version: '10.0.x'

        - name: Run tests
          run: dotnet test api/WeddingApi.sln --verbosity normal

        - name: Log in to GHCR
          uses: docker/login-action@v3
          with:
            registry: ghcr.io
            username: ${{ github.actor }}
            password: ${{ secrets.GITHUB_TOKEN }}

        - name: Build and push Docker image
          uses: docker/build-push-action@v5
          with:
            context: ./api
            push: true
            tags: |
              ghcr.io/${{ github.repository_owner }}/wedding-api:latest
              ghcr.io/${{ github.repository_owner }}/wedding-api:${{ github.sha }}

        - name: Trigger Render deploy
          run: curl -f -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
  ```

  Replace with:
  ```yaml
  name: Deploy API

  on:
    push:
      tags:
        - '[0-9]+.[0-9]+.[0-9]+'

  concurrency:
    group: deploy-api-${{ github.ref }}
    cancel-in-progress: true

  jobs:
    test-and-deploy:
      runs-on: ubuntu-latest

      steps:
        - uses: actions/checkout@v4

        - name: Setup .NET
          uses: actions/setup-dotnet@v4
          with:
            dotnet-version: '10.0.x'

        - name: Run tests
          run: dotnet test api/WeddingApi.sln --verbosity normal

        - name: Trigger Railway deploy
          run: curl -f -X POST "${{ secrets.RAILWAY_DEPLOY_HOOK_URL }}"
  ```

  Changes: removed `packages: write` permission, removed GHCR login, removed Docker build/push, replaced Render hook with Railway hook.

- [x] **Step 2: Commit**

  ```bash
  git add .github/workflows/deploy-api.yml
  git commit -m "ci: replace GHCR+Render deploy with Railway deploy hook"
  ```

---

### Task 3: Add GitHub Secret + Update Vercel

- [x] **Step 1: Add GitHub secrets**

  Go to `github.com/thanwap/thanwa-meena-wedding` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

  | Secret name | Where to find the value |
  |---|---|
  | `RAILWAY_TOKEN` | Railway → top-right avatar → **Account Settings** → **Tokens** → **New Token** |
  | `RAILWAY_SERVICE_ID` | Railway → your service → **Settings** → **Service ID** (copy the UUID) |

- [x] **Step 2: Update `DOTNET_API_URL` in Vercel**

  Go to [vercel.com](https://vercel.com) → `thanwa-meena-wedding` project → **Settings** → **Environment Variables**.

  Find `DOTNET_API_URL`. Update to:
  `https://wedding-api-production-xxxx.up.railway.app`  (your Railway URL from Task 1 Step 7, no trailing slash)

  Apply to **Production** environment.

---

### Task 4: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [x] **Step 1: Update the infrastructure table**

  Find the infrastructure table in `CLAUDE.md`. Change:

  ```
  | API host        | Render (Docker, .NET 10)                 |
  ```

  To:

  ```
  | API host        | Railway (Docker, .NET 10)                |
  ```

- [x] **Step 2: Update the Render env var section**

  Find the `### Render (production)` block. Replace:

  ```markdown
  ### Render (production) — set on the .NET service

  ```
  ConnectionStrings__DefaultConnection   # Supabase pooler URL
  Jwt__Key
  Jwt__Issuer=wedding-api
  Jwt__Audience=wedding-web
  ```
  ```

  With:

  ```markdown
  ### Railway (production) — set on the .NET service

  ```
  ConnectionStrings__DefaultConnection   # Supabase pooler URL
  Jwt__Key
  Jwt__Issuer=wedding-api
  Jwt__Audience=wedding-web
  Supabase__Url
  Supabase__ServiceKey
  ```
  ```

- [x] **Step 3: Commit**

  ```bash
  git add CLAUDE.md
  git commit -m "docs: update infrastructure references from Render to Railway"
  ```

---

### Task 5: End-to-End Verification Deploy

- [x] **Step 1: Run the pre-commit checklist locally**

  From `web/`:
  ```bash
  npm run lint && npm test && npm run build
  ```

  From `api/`:
  ```bash
  dotnet build && dotnet test --filter "Category!=Integration"
  ```

  Both must pass.

- [x] **Step 2: Push a version tag**

  ```bash
  git push && git tag 1.X.Y && git push --tags
  ```

  (Use the next version number, e.g. `1.2.3`.)

- [x] **Step 3: Watch GitHub Actions**

  `Deploy API` job should:
  1. Run tests ✓
  2. Call Railway deploy hook ✓

  The GHCR push steps are gone — the job should be noticeably faster.

- [x] **Step 4: Watch Railway deploy**

  Go to Railway → `wedding-api` → **Deployments** tab.

  Railway will pull the latest commit from the `api/` directory, build the Docker image, and start the container.

  Wait until status is **Active** and logs show:
  ```
  Now listening on: http://[::]:8080
  ```

- [x] **Step 5: Smoke-test the API directly**

  ```bash
  curl https://wedding-api-production-xxxx.up.railway.app/api/configs
  ```

  Expected: `401 Unauthorized` (proves the service is up and auth is active).

- [x] **Step 6: Smoke-test end-to-end**

  Visit `https://frommeenatothanwaforever.com/admin/login`.

  Log in as `thanwa` or `meena`. Confirm:
  - Login succeeds (frontend reaches Railway API)
  - `/admin/configs` loads data
  - Password change works

---

### Task 6: Decommission Render

Only after Task 5 verification passes.

- [x] **Step 1: Remove the Render service**

  Go to Render → your service → **Settings** → **Delete Web Service**.

- [x] **Step 2: Remove the stale GitHub secret**

  `github.com/thanwap/thanwa-meena-wedding` → **Settings** → **Secrets and variables** → **Actions** → delete `RENDER_DEPLOY_HOOK_URL`.
