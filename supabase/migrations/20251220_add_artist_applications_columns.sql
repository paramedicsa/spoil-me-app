-- Add missing columns to artist_applications (idempotent)

BEGIN;

ALTER TABLE IF EXISTS public.artist_applications
  ADD COLUMN IF NOT EXISTS contact_number TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMIT;
