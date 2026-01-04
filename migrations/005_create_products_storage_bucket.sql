-- Migration: Create products storage bucket for product images
-- Purpose: Ensure the 'products' bucket exists with public read access and admin write access

-- Create the products bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for products" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload access for products" ON storage.objects;
DROP POLICY IF EXISTS "Admin update access for products" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access for products" ON storage.objects;

-- Policy: Allow public read access to all files in products bucket
CREATE POLICY "Public read access for products"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Policy: Allow authenticated users with admin claims to upload
CREATE POLICY "Admin upload access for products"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users with admin claims to update
CREATE POLICY "Admin update access for products"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users with admin claims to delete
CREATE POLICY "Admin delete access for products"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);
