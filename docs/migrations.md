# EF Core Migrations — Supabase

## Run migration (apply to database)

```bash
export DESIGN_TIME_DB="Host=db.XXXXX.supabase.co;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require"

cd /Users/asol3/thanwap/claude/thanwa-meena-wedding/api

dotnet ef database update \
  --project WeddingApi/WeddingApi.csproj \
  --startup-project WeddingApi/WeddingApi.csproj
```

## Add a new migration (after changing an entity)

```bash
dotnet ef migrations add <MigrationName> \
  --project WeddingApi/WeddingApi.csproj \
  --startup-project WeddingApi/WeddingApi.csproj \
  --output-dir Data/Migrations
```

Then run `database update` above to apply it.

## Notes

- `DESIGN_TIME_DB` must be in **Npgsql format** — not the `postgresql://` URI from Supabase
- Supabase URI: `postgresql://postgres:PASSWORD@db.XXXXX.supabase.co:5432/postgres`
- Npgsql format: `Host=db.XXXXX.supabase.co;Database=postgres;Username=postgres;Password=PASSWORD;SSL Mode=Require`
- The `configs` table was created by `InitialCreate` migration on 2026-04-06
