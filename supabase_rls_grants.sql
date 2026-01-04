-- ============================================
-- RLS and Permission Fix for products and artist_applications
-- Run this in Supabase SQL Editor as a privileged user (service_role key or DB owner)
-- ============================================

-- IMPORTANT: Review existing policies before running. This script adds permissive policies for INSERT/UPDATE for 'authenticated' and 'service_role'.

-- PRODUCTS TABLE
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

-- Authenticated users: allow INSERT and UPDATE
CREATE POLICY IF NOT EXISTS "authenticated_can_insert_products"
  ON public.products FOR INSERT TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "authenticated_can_update_products"
  ON public.products FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role: allow INSERT and UPDATE (service_role normally bypasses RLS but add policies for clarity)
CREATE POLICY IF NOT EXISTS "service_role_can_insert_products"
  ON public.products FOR INSERT TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_role_can_update_products"
  ON public.products FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant privileges at the table level
GRANT INSERT, UPDATE ON public.products TO authenticated;
GRANT INSERT, UPDATE ON public.products TO service_role;

-- ARTIST_APPLICATIONS TABLE
ALTER TABLE IF EXISTS public.artist_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "authenticated_can_insert_artist_applications"
  ON public.artist_applications FOR INSERT TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "authenticated_can_update_artist_applications"
  ON public.artist_applications FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_role_can_insert_artist_applications"
  ON public.artist_applications FOR INSERT TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_role_can_update_artist_applications"
  ON public.artist_applications FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

GRANT INSERT, UPDATE ON public.artist_applications TO authenticated;
GRANT INSERT, UPDATE ON public.artist_applications TO service_role;

-- Optional: Verify policies
-- SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename='products' OR tablename='artist_applications';

-- Note: Be sure to tailor these policies to your security model. These are permissive policies for immediate debugging and should be tightened for production.
