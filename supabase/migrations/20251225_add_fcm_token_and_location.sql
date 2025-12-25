-- Add FCM token + geo columns to public.users (idempotent)

BEGIN;

ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS fcm_token TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;

-- Helpful index for push targeting
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='users' AND indexname='idx_users_fcm_token'
  ) THEN
    CREATE INDEX idx_users_fcm_token ON public.users(fcm_token);
  END IF;
END$$;

-- Ensure RLS is enabled and users can update their own profile (incl. fcm_token)
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    DROP POLICY IF EXISTS "Users can update their own fcm token" ON public.users;
    CREATE POLICY "Users can update their own fcm token"
      ON public.users FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

COMMIT;
