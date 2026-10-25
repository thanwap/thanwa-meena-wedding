# Desktop typography + Thai font pairing

**Problem:** On desktop the landing page reads small — content columns are
capped at `max-w-sm` (384px), font sizes are fixed px with no `md:` step, and
labels/nav sit at 9–11px. Thai text set in Cormorant/Josefin (no Thai glyphs)
falls back to the OS font (Thonburi / Tahoma). Sarabun is the Thai government
document font — reads "official letter", not "wedding invitation".

**Decision:** Taviraj (looped Thai serif, high contrast, has italics) for all
Thai. Stack it behind the Latin fonts so mixed EN/TH lines pick per glyph.

## Checklist

- [x] Load Taviraj in `web/app/layout.tsx`, drop Sarabun
- [x] Define stacks in `globals.css`:
  - `--font-thai`    → Taviraj (body)
  - `--font-display` → Cormorant Garamond, then Taviraj
  - `--font-label`   → Josefin Sans, then Taviraj
- [x] Replace `--font-sarabun` / `--font-cormorant` / `--font-josefin` usages on
      public pages with the new stacks (admin untouched — it uses Geist)
- [x] Widen landing columns on `md:` (`max-w-sm` → `md:max-w-xl`, story → `md:max-w-2xl`)
- [x] Desktop size step for Thai body / sub copy
- [x] Raise tiny text floors: nav, labels, hero RSVP link, schedule sub-labels
- [x] RSVP/guestbook inputs ≥ 16px (also stops iOS focus zoom)
- [x] Screenshot check at 390px and 1440px
- [x] `npm run lint && npm test && npm run build`

## Follow-ups from review

- [x] Lining figures site-wide — Cormorant defaults to old-style (1 → "I", 2o26)
- [x] Hero: drop floral accent + "Save the Date" label
- [x] Hero RSVP link → real pill button, blush gradient matching guestbook submit
- [x] Gallery section heading → "Our Gallery" (nav label too)

**Note:** the dev server repeatedly failed to pick up `globals.css` edits
(component edits hot-reloaded fine). Restart `npm run dev` with a clean `.next`
after changing it. Root cause not found.
