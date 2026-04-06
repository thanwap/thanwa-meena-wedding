# Phase 3c: CI/CD & Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two GitHub Actions pipelines that build and deploy the Next.js app to Vercel and the .NET API to Render on every push to `main`.

**Architecture:** Next.js uses Vercel's prebuilt flow (build in CI, upload output). .NET API builds a Docker image in CI, pushes to GHCR, then triggers Render to pull and run it. Both pipelines only fire on push to `main` — no PR builds.

**Tech Stack:** GitHub Actions, Vercel CLI, Docker, GitHub Container Registry (GHCR), Render Deploy Hook

---

## File Structure

| File | Purpose |
|---|---|
| `api/Dockerfile` | Multi-stage Docker build for the .NET API |
| `api/.dockerignore` | Excludes bin/obj/test projects from build context |
| `.github/workflows/deploy-api.yml` | Test → build image → push GHCR → trigger Render |
| `.github/workflows/deploy-web.yml` | Lint → test → vercel build → vercel deploy |

---

### Task 1: Dockerfile

**Files:**
- Create: `api/Dockerfile`
- Create: `api/.dockerignore`

- [ ] **Step 1: Create `.dockerignore`**

```
# api/.dockerignore
**/bin/
**/obj/
**/.vs/
WeddingApi.UnitTests/
WeddingApi.IntegrationTests/
```

- [ ] **Step 2: Create `api/Dockerfile`**

```dockerfile
# api/Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY WeddingApi.sln .
COPY WeddingApi/WeddingApi.csproj WeddingApi/
RUN dotnet restore WeddingApi/WeddingApi.csproj

COPY WeddingApi/ WeddingApi/
RUN dotnet publish WeddingApi/WeddingApi.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "WeddingApi.dll"]
```

- [ ] **Step 3: Verify the Docker build locally**

```bash
cd /path/to/repo/api
docker build -t wedding-api-test .
```

Expected: build completes with no errors, final image uses `aspnet:10.0`.

- [ ] **Step 4: Verify the container starts**

```bash
docker run --rm -p 8080:8080 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -e ConnectionStrings__DefaultConnection="Host=localhost;Database=test;Username=postgres;Password=test" \
  -e Authentication__Google__ClientId="test" \
  wedding-api-test
```

Expected: container starts and logs `Now listening on: http://[::]:8080`. It will not connect to the DB — that's fine; we're only verifying startup.

Stop with `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
git add api/Dockerfile api/.dockerignore
git commit -m "feat: add Dockerfile for .NET API"
```

---

### Task 2: API Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy-api.yml`

- [ ] **Step 1: Create the workflows directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create `.github/workflows/deploy-api.yml`**

```yaml
name: Deploy API

on:
  push:
    branches: [main]

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
          tags: ghcr.io/${{ github.repository_owner }}/wedding-api:latest

      - name: Trigger Render deploy
        run: curl -f -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-api.yml
git commit -m "feat: add API deploy workflow"
```

---

### Task 3: Web Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy-web.yml`

- [ ] **Step 1: Get Vercel project IDs**

Run this locally in `web/`:

```bash
cd web
npx vercel link
```

Follow the prompts — select your Vercel account and the existing `thanwa-meena-wedding` project. This creates `web/.vercel/project.json`.

```bash
cat web/.vercel/project.json
```

Expected output (note your actual values):
```json
{
  "orgId": "team_XXXXX",
  "projectId": "prj_XXXXX"
}
```

Save both values — you'll add them as GitHub Secrets in Task 4.

- [ ] **Step 2: Create `.github/workflows/deploy-web.yml`**

```yaml
name: Deploy Web

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: web

      - name: Lint
        run: npm run lint
        working-directory: web

      - name: Test
        run: npm test -- --ci
        working-directory: web

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: web
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Build
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: web
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Deploy
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: web
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-web.yml
git commit -m "feat: add web deploy workflow"
```

---

### Task 4: Manual Setup — Secrets & Services

This task has no code. Complete all steps before pushing to `main`.

**Files:** none — all steps are in external dashboards.

#### 4a: Disable Vercel auto-deploy

- [ ] Go to [vercel.com](https://vercel.com) → your project → **Settings** → **Git**
- [ ] Under **Ignored Build Step**, enter: `exit 1`
- [ ] Save. Vercel will now ignore all GitHub pushes — only the GitHub Actions workflow deploys.

#### 4b: Create Render web service

- [ ] Go to [render.com](https://render.com) → **New** → **Web Service**
- [ ] Choose **Deploy an existing image**
- [ ] Image URL: `ghcr.io/thanwap/wedding-api:latest`
- [ ] Instance type: **Free**
- [ ] Set these environment variables in Render:

| Key | Value |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | `Host=db.XXXXX.supabase.co;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true` |
| `Authentication__Google__ClientId` | `287672262177-tfmv615ptpaqab9udmgdj8ipu1bs5i1o.apps.googleusercontent.com` |

- [ ] Under **Settings** → **Deploy Hook**, click **Generate Deploy Hook** and copy the URL.
- [ ] Disable auto-deploy on Render: **Settings** → **Auto-Deploy** → **No**

#### 4c: Make GHCR package public

This must be done after the first successful push (the package won't exist yet).

After the first `deploy-api` workflow run succeeds:
- [ ] Go to github.com → your profile → **Packages** → `wedding-api`
- [ ] **Package Settings** → **Change visibility** → **Public**

#### 4d: Add GitHub Secrets

Go to github.com → `thanwap/thanwa-meena-wedding` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Add these secrets:

| Secret name | Value |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → Create token |
| `VERCEL_ORG_ID` | `orgId` value from `web/.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` value from `web/.vercel/project.json` |
| `RENDER_DEPLOY_HOOK_URL` | Deploy Hook URL from Render (step 4b) |

#### 4e: Update `DOTNET_API_URL` in Vercel

- [ ] Go to Vercel → your project → **Settings** → **Environment Variables**
- [ ] Add `DOTNET_API_URL` = your Render service URL (e.g. `https://wedding-api-xxxx.onrender.com`)

This is the production URL the Next.js Server Actions will call.

#### 4f: Push to main and verify

- [ ] Push to `main`:

```bash
git push origin main
```

- [ ] Go to GitHub → **Actions** tab. Both `Deploy API` and `Deploy Web` workflows should trigger.
- [ ] Verify `Deploy API` passes all tests and pushes the image.
- [ ] After `Deploy API` succeeds, make the GHCR package public (step 4c).
- [ ] Verify `Deploy Web` passes lint/tests and deploys to Vercel.
- [ ] Visit `https://frommeenatothanwaforever.com/admin` and confirm end-to-end still works.
