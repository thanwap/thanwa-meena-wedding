# Deploy to Vercel + Cloudflare (Phase 1 — Task 8)

## Step 1: Push to GitHub

```bash
git push origin main
```

---

## Step 2: Import Repo to Vercel

1. Go to https://vercel.com/new
2. Import your `thanwa-meena-wedding` GitHub repo
3. Set **Root Directory** → `web`
4. Framework Preset: **Next.js** (auto-detected)
5. Click **Deploy**

Expected: deployment succeeds and Vercel gives you a `.vercel.app` preview URL.

---

## Step 3: Add Custom Domain in Vercel

1. In your Vercel project → **Settings → Domains**
2. Add `frommeenatothanwaforever.com`
3. Vercel will show: *"Add a CNAME record pointing to `cname.vercel-dns.com`"*

---

## Step 4: Add CNAME in Cloudflare DNS

1. Go to **Cloudflare Dashboard** → `frommeenatothanwaforever.com` → **DNS**
2. Add a new record:

| Field  | Value                  |
|--------|------------------------|
| Type   | `CNAME`                |
| Name   | `@`                    |
| Target | `cname.vercel-dns.com` |
| Proxy  | **Orange cloud ON** (Proxied) |

3. Save

---

## Step 5: Verify Domain is Live

Wait ~2 minutes, then run:

```bash
curl -I https://frommeenatothanwaforever.com
```

Expected: `HTTP/2 200` with an `x-vercel-id` header present.

---

## Step 6: Update PHASES.md

Once live, mark the deploy task complete in `PHASES.md`:

```markdown
- [x] Deploy to Vercel, connect custom domain via CNAME in Cloudflare
```

```bash
git add PHASES.md
git commit -m "chore: mark Phase 1 deploy task complete"
git push origin main
```
