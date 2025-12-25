-- Idempotent migration to add missing role/affiliate columns to public.users
-- Adds only the minimal required columns to satisfy app expectations

BEGIN;

ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_artist BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_affiliate BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_member BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS affiliate_code TEXT;

-- Ensure affiliate_code can be indexed for lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='users' AND indexname='idx_users_affiliate_code'
  ) THEN
    CREATE INDEX idx_users_affiliate_code ON public.users(affiliate_code);
  END IF;
END$$;

COMMIT;
