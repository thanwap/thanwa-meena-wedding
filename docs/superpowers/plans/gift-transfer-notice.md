# Gift transfer notice (แจ้งการโอน)

Guests who send a gift through the PromptPay QR can tell the couple who it is
from. Bank apps hide most of the account holder's name, and the account holder
is often not the giver anyway (one parent paying for a family, a spouse paying
for a friend), so the couple can't tell from the bank app alone.

Terms (Gift transfer, Transfer notice, Giver, Account holder, Verified, Slip)
are defined in [`CONTEXT.md`](../../../CONTEXT.md).

## Decisions (from the grilling session, 2026-10-27)

- **Transfer notice fields:** Giver (required, free text, can name several
  people) · transfer time (required) · amount (optional) · slip (optional).
- **Transfer time is the match key.** The bank app shows time and amount in
  full even when it hides the name. The field defaults to "now", because most
  guests fill it in right after transferring; they can change it. Bangkok time,
  minute precision, cannot be in the future. Admins treat it as approximate.
- **Giver is free text**, not linked to RSVP or seating guests. Givers are not
  always guests, and one Giver can be several guests.
- **Placement:** a secondary button under the PromptPay QR, next to "บันทึก QR",
  that opens a small form. It is not part of the guestbook or the RSVP form.
  Existing wording on the landing page stays as it is.
- **Guests:** submit only. They can't view or edit a notice afterwards; a
  wrong one is sent again and the admin deletes the bad one.
- **Slips are private:** a new private Supabase bucket `slips`, separate from
  the public `photos` bucket. Only admins can see a slip, through a short-lived
  signed URL (about 5 minutes, all of a page's slips signed in one request).
- **Upload speed** (decided at implementation):
  - The slip uploads the moment the guest picks it, while they still type.
    Submit waits for it if it's still uploading.
  - The browser re-encodes every slip to a JPEG of at most 1600px (~150–300 KB),
    which also strips EXIF/GPS. The API only checks the header
    (JPEG, ≤ 4000px) and stores the bytes as they are: no server decode or re-encode.
  - The upload goes through the route handler `/api/gift-slips`, not a server
    action, so the notice's server action doesn't queue behind it.
  - A slip whose notice was never sent stays in the bucket. "ลบสลิปทั้งหมด"
    lists the bucket, so it removes those too.
- **Slip deletion is manual.** The admin page has "ลบสลิปทั้งหมด", which removes
  slip images only and keeps the notices. Nothing is deleted automatically.
- **Admin page `/admin/gifts`** (shadcn): a table sorted by transfer time with
  the columns Giver · time · amount · slip (view) · Verified checkbox. The
  amount is editable: one field, admin overwrites. Admins can delete a notice.
  A header shows "verified X of Y" and the total of verified amounts, plus a
  CSV export.
- **Out of scope:** automatic bank matching, OCR of slips, paid slip-verification APIs.

## Checklist

### API (`api/WeddingApi`)
- [x] `GiftNotice` entity: Id, Giver, TransferredAt (UTC), Amount (decimal?), SlipPath?, Verified, CreatedAt + EF migration
- [x] `ISlipStorage` for the private `slips` bucket: upload, delete, signed URL
- [x] `GiftNoticeService`: upload slip (header check, stored as is), create (validate), list, update (amount, verified), delete (row + slip), delete all slips
- [x] `GiftNoticesController`
  - [x] `POST /api/gift-notices/slips` — anonymous, `gift-slip-upload`, 5 MB; returns a slipId
  - [x] `POST /api/gift-notices` — anonymous, `gift-notice-post`, JSON with the optional slipId
  - [x] Admin: `GET` list (with signed slip URLs), `PATCH {id}`, `DELETE {id}`, `DELETE slips`, `GET export.csv` (UTF-8 BOM so Excel shows Thai)
- [x] Add the `gift-notice-post` and `gift-slip-upload` limits to `GuestRateLimits`
- [x] Unit tests (validation, future time rejected, slip deletion keeps the row) + integration tests (slip → notice → admin list, delete all slips incl. orphans, CSV BOM, gateway secret)

### Web (`web/`)
- [x] Server action → `apiFetch(..., { guest: true })` + `/api/gift-slips` route handler for the slip
- [x] "แจ้งการโอน" `btn-secondary` under the QR, plus a form dialog in the landing style (not shadcn): Giver, date/time (defaults to now), amount, slip picker with preview; inline errors; thank-you state
- [x] `/admin/gifts` page (shadcn table, checkbox, inline amount edit, slip dialog, delete, delete all slips with confirm, CSV download) + nav entry in `app/admin/_nav.ts`
- [x] Vitest for the form and `lib/gift-notice` (time, amount, validation, slip shrink)

### Ops
- [ ] Create the private `slips` bucket in Supabase (manual)
- [ ] Run the migration against Supabase
- [x] Pre-commit checklists (web + api) — then wait for the go-ahead to tag
