-- Revoke SELECT on affiliate_applications from authenticated and PUBLIC
-- Ensures only owner/admin roles can view rows via RLS policies

BEGIN;

REVOKE SELECT ON public.affiliate_applications FROM authenticated;
REVOKE SELECT ON public.affiliate_applications FROM PUBLIC;

ALTER TABLE IF EXISTS public.affiliate_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'affiliate_applications') THEN
    DROP POLICY IF EXISTS "Users can view own applications" ON public.affiliate_applications;

    CREATE POLICY "Users can view own applications"
      ON public.affiliate_applications FOR SELECT
      USING (user_id = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));
  END IF;
END$$;

COMMIT;
