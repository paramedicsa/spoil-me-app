-- Migration: Add RLS policies for application tables (uses user_id UUID as owner)
-- Date: 2025-12-20
-- NOTE: Review and run in Supabase SQL editor or via migration tooling.

-- Safety: This migration enables Row Level Security on each table and
-- creates policies that allow:
--  - Admins full access (checks users.is_admin)
--  - Service role has implicit bypass
--  - Users to operate on their own rows where appropriate (user_id = auth.uid())

-- 1) ad_packages
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ad_packages') THEN
        ALTER TABLE public.ad_packages ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Admins can manage all ad_packages" ON public.ad_packages;
        CREATE POLICY "Admins can manage all ad_packages"
          ON public.ad_packages FOR ALL
          USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true)
          WITH CHECK ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);

        DROP POLICY IF EXISTS "Users can create ad packages" ON public.ad_packages;
        CREATE POLICY "Users can create ad packages"
          ON public.ad_packages FOR INSERT
          WITH CHECK (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can view own ad_packages" ON public.ad_packages;
        CREATE POLICY "Users can view own ad_packages"
          ON public.ad_packages FOR SELECT
          USING (user_id = auth.uid());
    END IF;
END $$;

-- 2) affiliates
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'affiliates') THEN
        ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Admins can manage all affiliates" ON public.affiliates;
        CREATE POLICY "Admins can manage all affiliates"
          ON public.affiliates FOR ALL
          USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true)
          WITH CHECK ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);

        DROP POLICY IF EXISTS "Users can view own affiliate data" ON public.affiliates;
        CREATE POLICY "Users can view own affiliate data"
          ON public.affiliates FOR SELECT
          USING (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can create affiliates" ON public.affiliates;
        CREATE POLICY "Users can create affiliates"
          ON public.affiliates FOR INSERT
          WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- 3) artist_applications (project already contains similar policies; keep idempotent)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artist_applications') THEN
        ALTER TABLE public.artist_applications ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Admins can manage artist_applications" ON public.artist_applications;
        CREATE POLICY "Admins can manage artist_applications"
          ON public.artist_applications FOR ALL
          USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true)
          WITH CHECK ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);

        DROP POLICY IF EXISTS "Users can create applications" ON public.artist_applications;
        CREATE POLICY "Users can create applications"
          ON public.artist_applications FOR INSERT
          WITH CHECK (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can view own artist applications" ON public.artist_applications;
        CREATE POLICY "Users can view own artist applications"
          ON public.artist_applications FOR SELECT
          USING (user_id = auth.uid() OR (SELECT is_admin FROM public.users WHERE id = auth.uid()));
    END IF;
END $$;

-- 4) cart
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cart') THEN
        ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart;
        CREATE POLICY "Users can manage own cart"
          ON public.cart FOR ALL
          USING (user_id = auth.uid() OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true)
          WITH CHECK (user_id = auth.uid() OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);
    END IF;
END $$;

-- 5) custom_orders
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_orders') THEN
        ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Admins can manage all custom orders" ON public.custom_orders;
        CREATE POLICY "Admins can manage all custom orders"
          ON public.custom_orders FOR ALL
          USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true)
          WITH CHECK ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);

        DROP POLICY IF EXISTS "Users can create custom orders" ON public.custom_orders;
        CREATE POLICY "Users can create custom orders"
          ON public.custom_orders FOR INSERT
          WITH CHECK (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can view own custom orders" ON public.custom_orders;
        CREATE POLICY "Users can view own custom orders"
          ON public.custom_orders FOR SELECT
          USING (user_id = auth.uid());
    END IF;
END $$;

-- 6) memberships
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memberships') THEN
        ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Admins can manage all memberships" ON public.memberships;
        CREATE POLICY "Admins can manage all memberships"
          ON public.memberships FOR ALL
          USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true)
          WITH CHECK ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);

        DROP POLICY IF EXISTS "Users can view own membership" ON public.memberships;
        CREATE POLICY "Users can view own membership"
          ON public.memberships FOR SELECT
          USING (user_id = auth.uid());
    END IF;
END $$;

-- 7) notifications
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
        CREATE POLICY "Users can view own notifications"
          ON public.notifications FOR SELECT
          USING ("userId" = auth.uid());

        DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
        CREATE POLICY "Users can update own notifications"
          ON public.notifications FOR UPDATE
          USING ("userId" = auth.uid())
          WITH CHECK ("userId" = auth.uid());

        DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
        CREATE POLICY "Admins can create notifications"
          ON public.notifications FOR INSERT
          WITH CHECK ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);
    END IF;
END $$;

-- 8) order_items (assumes order_id links to orders.user_id)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
        ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
        CREATE POLICY "Admins can view all order items"
          ON public.order_items FOR SELECT
          USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);

        DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
        CREATE POLICY "Users can view their order items"
          ON public.order_items FOR SELECT
          USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
    END IF;
END $$;

-- 9) orders
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
        CREATE POLICY "Admins can update orders"
          ON public.orders FOR UPDATE
          USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true)
          WITH CHECK ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);

        DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
        CREATE POLICY "Admins can view all orders"
          ON public.orders FOR SELECT
          USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);

        DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
        CREATE POLICY "Users can create orders"
          ON public.orders FOR INSERT
          WITH CHECK (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
        CREATE POLICY "Users can view their own orders"
          ON public.orders FOR SELECT
          USING (user_id = auth.uid());
    END IF;
END $$;

-- 10) reviews
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
        CREATE POLICY "Admins can manage all reviews"
          ON public.reviews FOR ALL
          USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true)
          WITH CHECK ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);

        DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
        CREATE POLICY "Anyone can view approved reviews"
          ON public.reviews FOR SELECT
          USING (approved = true);

        DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
        CREATE POLICY "Users can create reviews"
          ON public.reviews FOR INSERT
          WITH CHECK (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
        CREATE POLICY "Users can update their own reviews"
          ON public.reviews FOR UPDATE
          USING (user_id = auth.uid())
          WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- 11) users
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
        CREATE POLICY "Admins can view all users"
          ON public.users FOR SELECT
          USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);

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

-- 12) wishlists
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wishlists') THEN
        ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can manage their wishlist" ON public.wishlists;
        CREATE POLICY "Users can manage their wishlist"
          ON public.wishlists FOR ALL
          USING (user_id = auth.uid() OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true)
          WITH CHECK (user_id = auth.uid() OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);
    END IF;
END $$;

-- End of migration
