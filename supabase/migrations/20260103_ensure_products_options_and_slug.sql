-- Ensure options is JSONB and slug column exists
BEGIN;

ALTER TABLE public.products
  ALTER COLUMN options TYPE JSONB USING options::jsonb;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug TEXT;

COMMIT;
