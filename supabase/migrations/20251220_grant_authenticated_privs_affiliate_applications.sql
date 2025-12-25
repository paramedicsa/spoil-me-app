-- Grant authenticated role INSERT/SELECT on affiliate_applications but keep anon/public restricted

BEGIN;

-- Ensure anon/public cannot SELECT
REVOKE SELECT ON public.affiliate_applications FROM anon;
REVOKE SELECT ON public.affiliate_applications FROM PUBLIC;

-- Grant authenticated needed rights to allow users to INSERT and SELECT (RLS will restrict rows)
GRANT INSERT ON public.affiliate_applications TO authenticated;
GRANT SELECT ON public.affiliate_applications TO authenticated;
GRANT UPDATE ON public.affiliate_applications TO authenticated;
GRANT DELETE ON public.affiliate_applications TO authenticated;

-- Recreate safe policies as a guard
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
