-- Replace usages of SELECT is_admin FROM users WHERE id = auth.uid()
-- with JWT role checks to avoid recursive policy evaluation

DO $$ BEGIN
  -- Products: replace policies that referenced users.is_admin
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    DROP POLICY IF EXISTS "Anyone can view published products" ON public.products;
    CREATE POLICY "Anyone can view published products"
      ON public.products FOR SELECT
      USING (
        status = 'published'
        OR (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role')
        OR artist_id = auth.uid()
      );

    DROP POLICY IF EXISTS "Admins and artists can insert products" ON public.products;
    CREATE POLICY "Admins and artists can insert products"
      ON public.products FOR INSERT
      WITH CHECK (
        (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role')
        OR (auth.jwt() ->> 'role') = 'artist'
      );

    DROP POLICY IF EXISTS "Admins and product owners can update products" ON public.products;
    CREATE POLICY "Admins and product owners can update products"
      ON public.products FOR UPDATE
      USING (
        (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role')
        OR artist_id = auth.uid()
      );

    DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
    CREATE POLICY "Admins can delete products"
      ON public.products FOR DELETE
      USING ((auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));
  END IF;

  -- Orders
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
    CREATE POLICY "Users can create orders"
      ON public.orders FOR INSERT
      WITH CHECK (user_id = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));

    DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
    CREATE POLICY "Admins can update orders"
      ON public.orders FOR UPDATE
      USING ((auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));
  END IF;

  -- Affiliate / Artist / Transactions / Commission policies: swap is_admin reference
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'affiliate_applications') THEN
    DROP POLICY IF EXISTS "Users can view own applications" ON public.affiliate_applications;
    CREATE POLICY "Users can view own applications"
      ON public.affiliate_applications FOR SELECT
      USING (user_id = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artist_applications') THEN
    DROP POLICY IF EXISTS "Users can view own artist applications" ON public.artist_applications;
    CREATE POLICY "Users can view own artist applications"
      ON public.artist_applications FOR SELECT
      USING (user_id = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
    CREATE POLICY "Users can view own transactions"
      ON public.transactions FOR SELECT
      USING (user_id = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commission_records') THEN
    DROP POLICY IF EXISTS "Affiliates view own commissions" ON public.commission_records;
    CREATE POLICY "Affiliates view own commissions"
      ON public.commission_records FOR SELECT
      USING (affiliate_id = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));
  END IF;

END $$;
