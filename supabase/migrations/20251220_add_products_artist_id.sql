-- Idempotent migration to add artist_id to products table
-- Adds artist_id FK column and index if missing

BEGIN;

ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES users(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='products' AND indexname='idx_products_artist_id'
  ) THEN
    CREATE INDEX idx_products_artist_id ON public.products(artist_id);
  END IF;
END$$;

COMMIT;
