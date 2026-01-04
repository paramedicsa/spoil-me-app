-- Migration: Fix RLS policies for products table
-- Purpose: Allow authenticated users (admins) to read/write products

-- Enable RLS on products table if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated insert to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated update to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete to products" ON products;

-- Policy: Allow anyone to read published products (for public store)
CREATE POLICY "Allow public read access to products"
ON products FOR SELECT
USING (status = 'published' OR auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert products
CREATE POLICY "Allow authenticated insert to products"
ON products FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update products
CREATE POLICY "Allow authenticated update to products"
ON products FOR UPDATE
USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete products
CREATE POLICY "Allow authenticated delete to products"
ON products FOR DELETE
USING (auth.role() = 'authenticated');
