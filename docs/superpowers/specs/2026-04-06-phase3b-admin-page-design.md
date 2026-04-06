**# Phase 3b: Next.js Admin Page — Design Spec

**Date:** 2026-04-06
**Status:** Approved

---

## Overview

A protected admin section at `/admin/*` in the existing Next.js app (`web/`). Phase 3b covers only the Config management feature at `/admin/configs`. Google OAuth via Auth.js v5 gates access. All API calls go through Next.js Server Actions (never from the browser directly) which forward the Google ID token to the .NET API.

This is sub-project 2 of Phase 3. The .NET API (Phase 3a) must be running locally for manual testing. CI/CD (Phase 3c) wires both services together in deployment.

---

## Auth Flow

**Library:** Auth.js v5 (`next-auth@beta`) with Google provider.

**Sign-in flow:**
1. User visits any `/admin/*` route
2. `middleware.ts` checks session — if absent, redirects to `/api/auth/signin`
3. User clicks "Sign in with Google" → Google OAuth consent → callback to `/api/auth/callback/google`
4. Auth.js `jwt` callback captures `account.id_token` (Google's JWT) and stores it in the encrypted session cookie
5. User lands at `/admin`

**ID token forwarding:**
- Server Actions call `auth()` to get the session
- `session.idToken` (stored by the JWT callback) is forwarded as `Authorization: Bearer <idToken>` to the .NET API
- The .NET API validates the token against Google's JWKS endpoint

**Required environment variables** (`.env.local` — never committed):
```
AUTH_SECRET=<random 32-char string — generate with: openssl rand -base64 32>
AUTH_GOOGLE_ID=<Google OAuth Client ID>
AUTH_GOOGLE_SECRET=<Google OAuth Client Secret>
DOTNET_API_URL=http://localhost:5000
```

**Google Cloud setup (one-time, manual):**
1. console.cloud.google.com → new project → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://frommeenatothanwaforever.com/api/auth/callback/google` (prod — add in Phase 3c)

---

## File Structure

```
web/
├── auth.ts                                    # Auth.js config — Google provider + JWT callback
├── middleware.ts                              # Protects /admin/* — redirects to sign-in if not authed
└── app/
    ├── api/
    │   └── auth/
    │       └── [...nextauth]/
    │           └── route.ts                   # Auth.js GET + POST route handler
    └── admin/
        ├── layout.tsx                         # Auth guard + header (email + sign-out)
        ├── page.tsx                           # Admin home — "Manage Configs →" link
        └── configs/
            ├── page.tsx                       # Config list page (Server Component)
            ├── actions.ts                     # Server Actions: getConfigs, createConfig, updateConfig, deleteConfig
            └── components/
                ├── ConfigTable.tsx            # Config rows table (Client Component)
                └── ConfigForm.tsx             # Add/Edit form (Client Component)
```

---

## API Contract

**ConfigDto** (matches .NET API response exactly):
```ts
type ConfigDto = {
  id: number
  key: string
  value: string
  type: string
  createdAt: string
  updatedAt: string
}
```

**Server Actions** in `web/app/admin/configs/actions.ts`:

| Action | Method | .NET endpoint | Returns |
|---|---|---|---|
| `getConfigs()` | GET | `/api/configs` | `ConfigDto[]` |
| `createConfig(key, value, type)` | POST | `/api/configs` | `ConfigDto` |
| `updateConfig(id, key, value, type)` | PUT | `/api/configs/{id}` | `ConfigDto` |
| `deleteConfig(id)` | DELETE | `/api/configs/{id}` | `void` |

All actions:
1. Call `auth()` to get session
2. Extract `session.idToken`
3. Call `process.env.DOTNET_API_URL + endpoint` with `Authorization: Bearer <idToken>`
4. Throw if response is not 2xx (UI catches and shows error message)

---

## Pages & Components

### `GET /admin` → `app/admin/page.tsx`
Simple landing page. Shows "Admin Dashboard" heading and a link to "Manage Configs →". Server Component.

### `GET /admin/configs` → `app/admin/configs/page.tsx`
Server Component. Calls `getConfigs()` on page load and passes data to `ConfigTable`. Also renders `ConfigForm` (hidden by default, shown when Add or Edit is clicked).

### `app/admin/layout.tsx`
- Calls `auth()` — if no session, redirects to `/api/auth/signin`
- Renders a simple header: site name on left, user email + "Sign out" button on right
- Wraps `{children}`

### `ConfigTable.tsx` (Client Component)
- Props: `configs: ConfigDto[]`, `onEdit: (config: ConfigDto) => void`, `onDelete: (id: number) => void`
- Renders a plain HTML table: Key | Value | Type | Updated At | Actions
- Edit button calls `onEdit(config)`
- Delete button shows `window.confirm("Delete this config?")` then calls `onDelete(id)`

### `ConfigForm.tsx` (Client Component)
- Props: `initial?: ConfigDto`, `onSave: (key, value, type) => void`, `onCancel: () => void`
- Three text inputs: Key, Value, Type
- Submit calls `onSave`; Cancel calls `onCancel`
- Validates all fields non-empty before submitting (shows inline error if empty)

---

## UI Style

Plain functional admin — white background, black text, Tailwind utility classes only. No wedding fonts (Playfair), no cream/dark-green palette. Clearly distinct from the public site.

---

## Testing

**Unit tests** (Jest + React Testing Library — existing setup in `web/`):

| Test | File |
|---|---|
| `ConfigTable` renders rows correctly | `web/__tests__/admin/ConfigTable.test.tsx` |
| `ConfigTable` calls onEdit/onDelete with correct args | `web/__tests__/admin/ConfigTable.test.tsx` |
| `ConfigForm` renders fields and submit works | `web/__tests__/admin/ConfigForm.test.tsx` |
| `ConfigForm` shows error when fields are empty | `web/__tests__/admin/ConfigForm.test.tsx` |

No integration tests in this phase — Server Actions depend on a live .NET API. Covered in Phase 3c.

**Manual smoke test checklist:**
- [ ] Visit `/admin` without session → redirects to Google sign-in
- [ ] Sign in with Google → lands on `/admin`
- [ ] Navigate to `/admin/configs` → config list loads from .NET API
- [ ] Add a config → appears in table
- [ ] Edit a config → table updates with new values
- [ ] Delete a config → removed from table

---

## Out of Scope (this sub-project)

- CI/CD deployment (Phase 3c)
- RSVP, guestbook, photo gallery (Phase 4)
- Admin pages for anything other than Configs
- Role-based access control (any Google account that signs in gets admin access)
