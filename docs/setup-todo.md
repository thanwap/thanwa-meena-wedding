# Guestbook Setup TODO

## 1. Supabase Storage — Create bucket

- [X] Go to your Supabase project → **Storage** → New bucket
- [X] Name: `guestbook-photos`
- [X] Toggle **Public bucket** ON → Create

---

## 2. Supabase — Get service role key

- [X] Go to Supabase → **Settings** → **API**
- [X] Copy the **service_role** key (not the anon key)
- [X] This is your `SUPABASE_SERVICE_KEY`

---

## 3. Add env vars to api/WeddingApi/appsettings.Development.json (local)

- [X] Open `api/WeddingApi/appsettings.Development.json` and add:
  ```jsonc
  {
    "ConnectionStrings": { "DefaultConnection": "..." },
    "Jwt": { "Key": "...", "Issuer": "wedding-api", "Audience": "wedding-web" },
    "Supabase": {
      "Url": "https://<your-ref>.supabase.co",
      "ServiceKey": "<service_role key from step 2>"
    }
  }
  ```
  Or use user secrets:
  ```bash
  cd api/WeddingApi
  dotnet user-secrets set "Supabase:Url" "https://<your-ref>.supabase.co"
  dotnet user-secrets set "Supabase:ServiceKey" "<service_role key>"
  ```

---

## 4. Add env vars to Render (.NET API — production)

- [X] Go to Render → your .NET service → Environment
- [X] Add `Supabase__Url` = `https://<your-ref>.supabase.co`
- [X] Add `Supabase__ServiceKey` = `<service_role key>`
- [ ] Redeploy the service

---

## 5. Vercel dashboard — no changes needed

> Supabase URL/key for storage are on Render only. Vercel already has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for other features — those stay as-is.

---

## 6. Apply DB migration to Supabase

- [ ] Set `DESIGN_TIME_DB` to your Supabase connection string:
  ```bash
  export DESIGN_TIME_DB="Host=<host>;Port=5432;Database=postgres;Username=postgres.<ref>;Password=<pw>;SSL Mode=Require;Trust Server Certificate=true"
  ```
- [X] Run migration:
  ```bash
  cd api/WeddingApi
  dotnet ef database update
  ```
- [ ] Verify `guestbook_entries` table exists in Supabase → Table Editor

---

## 7. Verify end-to-end

- [X] Local dev: submit a guestbook entry with a photo
- [X] Check Supabase Storage → `guestbook-photos` bucket for the uploaded file
- [X] `GET /api/guestbook` returns the entry with image URL
- [X] Landing page shows the guestbook section with form + wall
- [X] Admin `/admin/guestbook` lists entries and delete works
- [X] Rate limit: 4th submission in 1 minute returns 429
