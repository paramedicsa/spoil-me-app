-- Replace recursive users policies with JWT-based admin checks
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Drop recursive admin policy
    DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
    -- Create safe admin policy using JWT role claims
    CREATE POLICY "Admins can view all users"
      ON public.users FOR SELECT
      USING ((auth.jwt() ->> 'role') = 'service_role' OR (auth.jwt() ->> 'role') = 'admin' OR (auth.jwt() ->> 'role') = 'super_admin');

    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    CREATE POLICY "Users can view their own profile"
      ON public.users FOR SELECT
      USING (id = auth.uid());

    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    CREATE POLICY "Users can update their own profile"
      ON public.users FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;
