# Plan: Replace Google OAuth with Credentials-Based Admin Login

**Date:** 2026-04-08
**Goal:** Remove Google OAuth (hard to debug) and use a simple username/password system with two admin users (`thanwa`, `meena`) that can change their own password from the admin page.

---

## Architecture

- **.NET API** issues its own JWTs (HS256) instead of validating Google JWTs.
- **Next.js** uses NextAuth `Credentials` provider that POSTs to `.NET /api/auth/login`, stores the returned JWT in the session.
- **Supabase** holds a new `admin_users` table — accessed only by the .NET API (Next.js never talks to Supabase directly).
- **bcrypt** for password hashing (`BCrypt.Net-Next` on the .NET side).

Login flow:
```
User → /admin/login → NextAuth Credentials.authorize()
     → POST DOTNET_API_URL/api/auth/login {username, password}
     → .NET verifies bcrypt → returns {token}
     → token stored in session.idToken
     → existing /admin/configs actions keep using session.idToken (unchanged)
```

---

## Checklist

### .NET API (`api/WeddingApi/`)
- [x] Add NuGet packages: `BCrypt.Net-Next`, `System.IdentityModel.Tokens.Jwt`
- [x] New entity `AdminUser` (Username PK, PasswordHash, UpdatedAt)
- [x] Register `DbSet<AdminUser>` in `AppDbContext` with `admin_users` table mapping
- [x] EF migration: `AddAdminUsers`
- [x] New `IAuthService` / `AuthService` — `LoginAsync`, `ChangePasswordAsync`
- [x] New `AuthController` — `POST /api/auth/login` (anonymous), `POST /api/auth/change-password` (authorized)
- [x] `Program.cs`: replace Google JWT bearer with self-issued HS256 validation (`Jwt:Issuer`, `Jwt:Audience`, `Jwt:Key`)
- [x] Seed path: insert `thanwa` + `meena` with random 16-char passwords, print them once
- [x] Run migration against Supabase
- [x] Run seed → capture initial passwords

### Next.js (`web/`)
- [x] `auth.ts`: replace Google provider with `Credentials` provider; call `${DOTNET_API_URL}/api/auth/login`; keep `session.idToken` field name so `configs/actions.ts` keeps working
- [x] New `app/admin/login/page.tsx` — minimal username/password form
- [x] `proxy.ts`: redirect unauthenticated to `/admin/login`
- [x] New `app/admin/change-password/page.tsx` + server action → `.NET /api/auth/change-password`
- [x] Add "Change password" link in admin layout next to "Sign out"
- [x] Verify logout button still works (keep existing `signOut` form)

### Env vars
- [x] Remove: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `Authentication__Google__ClientId`
- [x] Add (.NET): `Jwt__Key` (random 64-char), `Jwt__Issuer=wedding-api`, `Jwt__Audience=wedding-web`
- [x] Update `.env.local` examples in `CLAUDE.md`
- [x] Document: variables to set in Vercel (Next.js) and Render (.NET)

### Verification
- [x] `cd web && npm run lint`
- [x] `cd web && npm test`
- [x] `cd web && npm run build`
- [x] `cd api && dotnet build`
- [x] `cd api && dotnet test`
- [x] Manual smoke: login with `thanwa` creds → load `/admin/configs` → change password → re-login

### Deploy hand-off (user actions — STILL TO DO)
- [ ] Run `dotnet run -- seed-admins` against Supabase locally to create initial passwords (or run on Render once deployed)
- [ ] Set new env vars on Render (.NET API): `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience`
- [ ] Remove old env var on Render: `Authentication__Google__ClientId`
- [ ] Redeploy .NET API on Render
- [ ] Remove old env vars on Vercel: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- [ ] Redeploy Next.js on Vercel
- [ ] Confirm production login works
- [ ] Change initial passwords from `/admin/change-password`

---

## Notes & Risks
- The `idToken` field name is intentionally reused to avoid touching `app/admin/configs/actions.ts`.
- Migration + seed must be run against Supabase; user's memory has EF Core command reference.
- Local dev will work end-to-end as soon as the .NET service is running locally with the new env vars.
- Production cutover requires both Render and Vercel redeploys with updated env vars.
