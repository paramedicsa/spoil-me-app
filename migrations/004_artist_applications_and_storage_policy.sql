-- Migration: 004_artist_applications_and_storage_policy.sql
-- Purpose: Add uid column to artist_applications (alias for user_id), harden storage policies for
--          artist-applications bucket and ensure users table has is_admin boolean column.
-- Run this in the Supabase SQL editor for your project (or via psql with service_role key).

-- 1) Add uid column (alias of user_id) with default to auth.uid() so client uploads can use row-level policies
ALTER TABLE public.artist_applications
  ADD COLUMN IF NOT EXISTS uid uuid DEFAULT auth.uid();

-- If uid exists but has wrong type, uncomment and run the following manually:
-- ALTER TABLE public.artist_applications ALTER COLUMN uid TYPE uuid USING uid::uuid;

-- 2) Storage policies: use LIKE auth.uid()||'/%' for path ownership checks
DROP POLICY IF EXISTS "storage_objects_insert_artist_apps_owner" ON storage.objects;
CREATE POLICY "storage_objects_insert_artist_apps_owner"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'artist-applications' AND 
    (name LIKE (auth.uid()::text || '/%'))
  );

DROP POLICY IF EXISTS "storage_objects_select_owner" ON storage.objects;
CREATE POLICY "storage_objects_select_owner"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'artist-applications' AND 
    (name LIKE (auth.uid()::text || '/%') OR auth.role() = 'service_role')
  );

-- 3) Ensure users table has is_admin boolean default false so admin checks won't throw if column missing
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Notes:
-- - After running, you should verify RLS policies on artist_applications to allow inserts by the application
--   role and updates by admins/service_role as needed.
-- - The storage policies above assume objects are stored under <user_id>/... paths in 'artist-applications' bucket.
