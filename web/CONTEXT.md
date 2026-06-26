# Glossary — `web/`

Canonical terms for the wedding website frontend. Keep this a glossary only —
no implementation details.

## Admin surfaces

- **Seating Chart** — the drag-and-drop visual arrangement of guests onto tables
  (`/admin/seating`). A canvas you manipulate spatially.
- **Seating Tables** — the tabular management view for creating/editing tables
  and their capacities (`/admin/seating/manage`). A list you edit.
  - Previously both were labelled ambiguously ("Seating" / "Seating List").
    The Chart/Tables distinction is canonical going forward.

## Roles

- **Super Admin** (`super_admin`) — full access: all mutations, plus the Users
  admin surface.
- **Viewer** (`viewer`) — read-only. Sees data but no mutation controls, and the
  Users surface is hidden from navigation (not advertised, though reachable by URL).
