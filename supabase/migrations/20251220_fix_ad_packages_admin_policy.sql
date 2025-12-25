-- Fix ad_packages admin policy to avoid recursive users lookup
-- Use JWT role claim for admin/service_role check instead of querying public.users

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ad_packages') THEN
    DROP POLICY IF EXISTS "Admins can manage all ad_packages" ON public.ad_packages;

    CREATE POLICY "Admins can manage all ad_packages"
      ON public.ad_packages FOR ALL
      USING (
        (auth.jwt() ->> 'role' = 'service_role')
        OR (auth.jwt() ->> 'role' = 'admin')
        OR (auth.jwt() ->> 'role' = 'super_admin')
      )
      WITH CHECK (
        (auth.jwt() ->> 'role' = 'service_role')
        OR (auth.jwt() ->> 'role' = 'admin')
        OR (auth.jwt() ->> 'role' = 'super_admin')
      );
  END IF;
END $$;
