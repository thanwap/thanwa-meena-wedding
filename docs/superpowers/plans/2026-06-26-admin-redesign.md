# Admin UI Redesign — consistency, usability, professional polish

**Status:** ✅ Complete — implemented on branch `admin-redesign` (Sonnet subagents, subagent-driven-development). Lint clean · 16/16 tests · build passes. Awaiting merge/PR decision.
**Scope:** `web/app/admin/**`, `web/components/**`, icon-lib consolidation
**Goal:** Make every admin page visually consistent, easier to use, and more
professional via a responsive sidebar shell, a real dashboard, standardized page
headers, and cleanup of the two off-pattern pages (login/change-password raw
inputs, Photos inline styles).

---

## Decisions (from grilling session)

1. **Layout** → left **sidebar** (replaces the flat 7-item top nav).
2. **Responsiveness** → fixed sidebar on desktop, hamburger + slide-out drawer on
   mobile, via shadcn's official `sidebar` component.
3. **Nav structure** → grouped sections + a user menu at the sidebar bottom:
   - **Guests**: RSVPs, Seating Chart, Seating Tables
   - **Content**: Guestbook, Photos
   - **Admin**: Users
   - User menu (name/initials → dropdown): Change password, Sign out
   - Relabel `Seating` → **Seating Chart**, `Seating List` → **Seating Tables**.
4. **Role-aware nav** → hide **Users** from the sidebar for viewers (page still
   reachable by URL).
5. **Dashboard home** (`/admin`) → overview stat cards (Total RSVPs, Confirmed
   Guests, Guestbook entries, Photos) + quick-link cards to each section.
6. **Depth** → everything, including refactoring the Photos grid from inline
   styles to Tailwind/shadcn.
7. **Icons** → standardize on **`@remixicon/react`** (matches existing ui/
   primitives); swap sidebar's default lucide imports to Remix; convert
   `theme-toggle`; drop `lucide-react` dependency.

**Theme note:** `globals.css` already defined all `--sidebar-*` tokens (light +
dark) — no theme CSS work was required. `sidebar.tsx` was installed in Task 1.

---

## Subtasks

### 1. Foundation — install primitives & shared components — `f350796`
- [x] `cd web && npx shadcn@latest add sidebar` (pulled in sheet, tooltip,
      separator, use-mobile hook; the registry was already remixicon-based so no
      lucide appeared).
- [x] Swap any `lucide-react` imports inside the generated `sidebar.tsx` — none
      present; trigger already used `RiSideBarLine`.
- [x] Create `web/components/admin/page-header.tsx` — shared
      `<PageHeader title subtitle>{actions}</PageHeader>`.
- [x] Nav config: `web/app/admin/_nav.ts` — `NAV_GROUPS` with `NavItem`/`NavGroup`
      types `{ href, label, icon, superAdminOnly? }`.

### 2. Sidebar shell — `web/app/admin/layout.tsx` — `f78ecef`
- [x] Replaced `<header>` flat nav with `SidebarProvider` + `Sidebar` (`collapsible="icon"`) + `SidebarInset`.
- [x] Grouped nav from `_nav.ts`; active item via `usePathname` (exact match so
      Seating Chart vs Tables don't both light up). Split into client
      `admin-shell.tsx`; `layout.tsx` stays a server component passing session +
      the `signOut` server action as props.
- [x] Filter `superAdminOnly` items when role ≠ `super_admin`.
- [x] Sidebar footer user menu: initials avatar + name + role badge → dropdown
      with **Change password** link + **Sign out** form action.
- [x] `ThemeToggle` in the inset top bar (with `SidebarTrigger`).
- [x] Inset top bar: `SidebarTrigger` (hamburger on mobile).
- [x] Preserved the unauthenticated passthrough.
- [x] `<Toaster />` kept.

### 3. Dashboard home — `web/app/admin/page.tsx` — `c8d9675`
- [x] Async server component; `getStats` + guestbook + photo counts fetched in
      parallel, each with a `.catch` fallback to 0.
- [x] 4 stat cards (Total RSVPs, Confirmed Guests, Guestbook Entries, Photos),
      matching the RSVPs `StatsBar` style.
- [x] Quick-link cards (icon + label + one-line description), `superAdminOnly`
      filtered.
- [x] `<PageHeader title="Dashboard" subtitle="…">`.

### 4. Standardize page headers — `f306140` (Photos folded into Task 6)
- [x] RSVPs (`rsvps-table.tsx`): `<PageHeader>` with Add Guest / Export CSV.
- [x] Guestbook (`guestbook/page.tsx`): `<PageHeader>` with count subtitle.
- [x] Users (`users-client.tsx`): `<PageHeader>` with Add User dialog.
- [x] Photos header → handled in Task 6 (single file rewrite, avoids two
      implementers touching `photos/page.tsx`).

### 5. Login & change-password — shadcn-ify — `d2ad33d`
- [x] `login/page.tsx`: `<Card>` + `<Input>`/`<Label>`; server action + error
      query-param logic untouched.
- [x] `change-password/page.tsx`: same; `status=ok|failed|mismatch|invalid` flow
      and the .NET API call preserved.

### 6. Photos grid — inline styles → Tailwind/shadcn — `5074d72`
- [x] Rebuilt grid/tiles/selection ring/info overlay/hover-delete with Tailwind;
      dropped all `style={{}}` blocks and the injected `<style>` tag (`group-hover`
      replaces it). Added `<PageHeader>`.
- [x] Behavior preserved: IntersectionObserver infinite scroll, `selected` Set,
      single + bulk delete, confirm dialog, Thai toasts.
- [x] Kept `<img loading="lazy">` + its eslint-disable (next/image out of scope).

### 7. Icon consolidation — `c3fe26b`
- [x] `components/theme-toggle.tsx` → `RiSunLine`/`RiMoonLine`.
- [x] Grep-confirmed zero `lucide-react` imports in source.
- [x] Removed `lucide-react` from `package.json` + updated lockfile.

### 8. Verify (pre-commit checklist, from `web/`)
- [x] `npm run lint` — clean
- [x] `npm test` — 16/16 pass
- [x] `npm run build` — passes (all admin routes dynamic)
- [x] Manual smoke (user): login → dashboard → all sections → seating → photos.

### 9. Post-test fix — `13c76ee`
- [x] Sign-out menu item triggered a Base UI console warning ("expected a
      non-`<button>` because `nativeButton` is false"). The item intentionally
      renders a real `<button type="submit">` to post the sign-out form, so added
      `nativeButton` to `DropdownMenuItem` — warning resolved, behavior unchanged.

---

## Out of scope
- Public landing page (Garden Whimsical Pastel) — untouched.
- .NET API — untouched.
- New data/queries beyond simple counts for the dashboard.
- Seating drag-and-drop internals (only its nav label + page header change).

## Risks
- **Photos refactor** is the riskiest (working infinite-scroll + selection
  tangled in inline styles) — do it last, verify behavior by hand.
- shadcn `sidebar` install may pull deps that need the Remix import swap; check
  the generated file immediately after install.
