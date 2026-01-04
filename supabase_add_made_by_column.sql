-- ============================================
-- COMPLETE PRODUCTS TABLE MIGRATION
-- ============================================
-- This migration adds ALL missing columns needed by the application
-- Based on the Product interface in types.ts and actual data requirements
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Check current schema (uncomment to run)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' ORDER BY column_name;

-- Step 2: Refresh the schema cache BEFORE making changes
NOTIFY pgrst, 'reload schema';

-- ============================================
-- CORE COLUMNS (from CSV - these should exist)
-- ============================================
-- id, name, description, price, price_usd, category, images (JSONB)
-- stock, status, sku, tags (JSONB), options (JSONB)
-- rating, total_reviews, created_at, updated_at, artist_id

-- Add made_by column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS made_by TEXT DEFAULT 'Spoil Me Vintage';

-- Add back_office_link column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS back_office_link TEXT;

-- Add when_and_how_to_wear column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS when_and_how_to_wear TEXT;

-- Add compare_at_price column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC DEFAULT 0;

-- Add compare_at_price_usd column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS compare_at_price_usd NUMERIC DEFAULT 0;

-- Add member_price column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS member_price NUMERIC DEFAULT 0;

-- Add member_price_usd column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS member_price_usd NUMERIC DEFAULT 0;

-- Add cost_price column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;

-- Add shipping_cost column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0;

-- Add sold_count column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

-- Add is_sold_out column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN DEFAULT false;

-- Add seo_keywords column (JSONB for array)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seo_keywords JSONB DEFAULT '[]'::jsonb;

-- Add is_new_arrival column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false;

-- Add is_best_seller column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;

-- Add is_featured_ring column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_ring BOOLEAN DEFAULT false;

-- Add is_featured_bracelet column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_bracelet BOOLEAN DEFAULT false;

-- Add is_featured_watch column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_watch BOOLEAN DEFAULT false;

-- Add is_unique_pendant column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_unique_pendant BOOLEAN DEFAULT false;

-- Add is_featured_stud column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_stud BOOLEAN DEFAULT false;

-- Add is_featured_dangle column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_dangle BOOLEAN DEFAULT false;

-- Add is_featured_jewelry_box column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_jewelry_box BOOLEAN DEFAULT false;

-- Add is_featured_perfume_holder column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_perfume_holder BOOLEAN DEFAULT false;

-- Add is_jewelry_set column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_jewelry_set BOOLEAN DEFAULT false;

-- Add gift_product_id column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS gift_product_id TEXT;

-- Add gift_value column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS gift_value NUMERIC DEFAULT 0;

-- Add promo_price column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_price NUMERIC DEFAULT 0;

-- Add promo_starts_at column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_starts_at TIMESTAMPTZ;

-- Add promo_expires_at column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_expires_at TIMESTAMPTZ;

-- Add promo_basic_member_price column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_basic_member_price NUMERIC DEFAULT 0;

-- Add promo_premium_member_price column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_premium_member_price NUMERIC DEFAULT 0;

-- Add promo_deluxe_member_price column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_deluxe_member_price NUMERIC DEFAULT 0;

-- Add ring_stock column (JSONB for object)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS ring_stock JSONB DEFAULT '{}'::jsonb;

-- Add earring_materials column (JSONB for array)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS earring_materials JSONB DEFAULT '[]'::jsonb;

-- Add show_earring_options column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS show_earring_options BOOLEAN DEFAULT false;

-- Add pendant_chain_lengths column (JSONB for object)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS pendant_chain_lengths JSONB DEFAULT '{}'::jsonb;

-- Add pendant_wire_wrapped column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS pendant_wire_wrapped BOOLEAN DEFAULT false;

-- Add chain_styles column (JSONB for array)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS chain_styles JSONB DEFAULT '[]'::jsonb;

-- Update any existing NULL values for made_by
UPDATE products 
SET made_by = 'Spoil Me Vintage' 
WHERE made_by IS NULL;

-- Add comments to the columns
COMMENT ON COLUMN products.made_by IS 'The maker/creator of the product (e.g., Spoil Me Vintage, Artist Name, etc.)';
COMMENT ON COLUMN products.back_office_link IS 'Link to supplier/source (e.g., Temu)';
COMMENT ON COLUMN products.when_and_how_to_wear IS 'Styling suggestions for the product';
COMMENT ON COLUMN products.sold_count IS 'Number of units sold';
COMMENT ON COLUMN products.is_sold_out IS 'Admin flag to mark product as sold out regardless of stock';

-- IMPORTANT: Refresh the PostgREST schema cache after adding columns
NOTIFY pgrst, 'reload schema';

-- Verify columns were added (uncomment to run)
-- SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'products' AND column_name IN ('made_by', 'back_office_link') ORDER BY column_name;
