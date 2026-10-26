-- 2.11.0 — guestbook postcard redesign
-- Adds guestbook_entries."PostcardId" (nullable int) and records the EF migration
-- 20261026162542_AddGuestbookPostcardId.
--
-- Run on Supabase (SQL editor or psql) BEFORE the 2.11.0 API is live: the new API
-- selects this column, so without it guestbook reads fail. Safe to run early — the
-- current API ignores the column — and idempotent, so running it twice is harmless.
-- Generated with: dotnet ef migrations script 20261025050829_AddPreweddingPhotos AddGuestbookPostcardId --idempotent

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261026162542_AddGuestbookPostcardId') THEN
    ALTER TABLE guestbook_entries ADD "PostcardId" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261026162542_AddGuestbookPostcardId') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261026162542_AddGuestbookPostcardId', '10.0.5');
    END IF;
END $EF$;
COMMIT;

