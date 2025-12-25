-- Fix and tighten policies for affiliate_applications
-- Ensures RLS is enabled and SELECT is limited to owner or admin roles

BEGIN;

ALTER TABLE IF EXISTS public.affiliate_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'affiliate_applications') THEN
    DROP POLICY IF EXISTS "Users can view own applications" ON public.affiliate_applications;
    DROP POLICY IF EXISTS "Users can submit applications" ON public.affiliate_applications;

    CREATE POLICY "Users can view own applications"
      ON public.affiliate_applications FOR SELECT
      USING (user_id = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));

    CREATE POLICY "Users can submit applications"
      ON public.affiliate_applications FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END$$;

COMMIT;
