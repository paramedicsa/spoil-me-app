-- ============================================
-- COMPLETE PRODUCTS TABLE MIGRATION
-- ============================================
-- This adds ALL missing columns based on CSV data and Product interface
-- Run this in your Supabase SQL Editor Dashboard
-- ============================================

-- Step 1: Check what columns currently exist (OPTIONAL - uncomment to run first)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' 
-- ORDER BY column_name;

-- Step 2: Refresh schema cache BEFORE changes
NOTIFY pgrst, 'reload schema';

-- ============================================
-- COLUMNS FROM CSV THAT SHOULD ALREADY EXIST:
-- ============================================
-- ✓ id (UUID PRIMARY KEY)
-- ✓ name (TEXT)
-- ✓ description (TEXT)
-- ✓ price (NUMERIC)
-- ✓ price_usd (NUMERIC)
-- ✓ category (TEXT)
-- ✓ images (JSONB array)
-- ✓ stock (INTEGER)
-- ✓ status (TEXT)
-- ✓ sku (TEXT)
-- ✓ tags (JSONB array)
-- ✓ options (JSONB object)
-- ✓ rating (NUMERIC)
-- ✓ total_reviews (INTEGER)
-- ✓ created_at (TIMESTAMPTZ)
-- ✓ updated_at (TIMESTAMPTZ)
-- ✓ artist_id (TEXT or UUID)

-- ============================================
-- MISSING COLUMNS TO ADD:
-- ============================================

-- ============================================
-- 1. MAKER & METADATA
-- ============================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS made_by TEXT DEFAULT 'Spoil Me Vintage';

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS back_office_link TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS when_and_how_to_wear TEXT;

-- ============================================
-- 2. PRICING COLUMNS
-- ============================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS compare_at_price_usd NUMERIC DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS member_price NUMERIC DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS member_price_usd NUMERIC DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0;

-- ============================================
-- 3. INVENTORY & SALES
-- ============================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN DEFAULT FALSE;

-- ============================================
-- 4. SEO & MARKETING
-- ============================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seo_keywords JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 5. FEATURED FLAGS
-- ============================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT FALSE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_ring BOOLEAN DEFAULT FALSE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_bracelet BOOLEAN DEFAULT FALSE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_watch BOOLEAN DEFAULT FALSE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_unique_pendant BOOLEAN DEFAULT FALSE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_stud BOOLEAN DEFAULT FALSE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_dangle BOOLEAN DEFAULT FALSE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_jewelry_box BOOLEAN DEFAULT FALSE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured_perfume_holder BOOLEAN DEFAULT FALSE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_jewelry_set BOOLEAN DEFAULT FALSE;

-- ============================================
-- 6. GIFT FEATURES
-- ============================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS gift_product_id TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS gift_value NUMERIC DEFAULT 0;

-- ============================================
-- 7. PROMOTIONAL PRICING
-- ============================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_price NUMERIC DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_starts_at TIMESTAMPTZ;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_expires_at TIMESTAMPTZ;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_basic_member_price NUMERIC DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_premium_member_price NUMERIC DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_deluxe_member_price NUMERIC DEFAULT 0;

-- ============================================
-- 8. PRODUCT-SPECIFIC OPTIONS (JSONB)
-- ============================================

-- Ring sizing stock: {"5": 2, "6": 3, "7": 5, ...}
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS ring_stock JSONB DEFAULT '{}'::jsonb;

-- Earring materials: [{"name": "Sterling Silver", "modifier": 30}, ...]
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS earring_materials JSONB DEFAULT '[]'::jsonb;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS show_earring_options BOOLEAN DEFAULT FALSE;

-- Pendant chain lengths: {"Choker – 35 cm": true, ...}
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS pendant_chain_lengths JSONB DEFAULT '{}'::jsonb;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS pendant_wire_wrapped BOOLEAN DEFAULT FALSE;

-- Chain styles: ["Metal Chain", "Leather Cord"]
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS chain_styles JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 9. ADDITIONAL METADATA (JSONB)
-- ============================================

-- Packaging: [{"id": "pack_123", "name": "Box", "bulkCost": 120, ...}]
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS packaging JSONB DEFAULT '[]'::jsonb;

-- Reviews: [{"user": "John", "rating": 5, "comment": "Great!", ...}]
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reviews JSONB DEFAULT '[]'::jsonb;

-- Advertisement config: [{"platform": "google", "budget": 100, ...}]
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS ads JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 10. UPDATE NULL VALUES
-- ============================================

UPDATE products 
SET made_by = 'Spoil Me Vintage' 
WHERE made_by IS NULL;

-- ============================================
-- 11. ADD HELPFUL COMMENTS
-- ============================================

COMMENT ON COLUMN products.made_by IS 'Creator/maker of the product (Artist name, Spoil Me Vintage, Outsourced, etc.)';
COMMENT ON COLUMN products.back_office_link IS 'Link to supplier/source page (e.g., Temu product URL)';
COMMENT ON COLUMN products.when_and_how_to_wear IS 'Styling suggestions and wear instructions';
COMMENT ON COLUMN products.sold_count IS 'Total number of units sold';
COMMENT ON COLUMN products.is_sold_out IS 'Admin override flag to mark as sold out';
COMMENT ON COLUMN products.seo_keywords IS 'SEO keywords array for search optimization';
COMMENT ON COLUMN products.ring_stock IS 'Ring size availability map: {size: quantity}';
COMMENT ON COLUMN products.earring_materials IS 'Available earring hook materials with price modifiers';
COMMENT ON COLUMN products.pendant_chain_lengths IS 'Available pendant chain length options';
COMMENT ON COLUMN products.chain_styles IS 'Available chain/cord style options';
COMMENT ON COLUMN products.packaging IS 'Packaging options and costs';
COMMENT ON COLUMN products.reviews IS 'Customer reviews and ratings';
COMMENT ON COLUMN products.ads IS 'Advertisement configuration and tracking';

-- ============================================
-- 12. REFRESH SCHEMA CACHE (CRITICAL!)
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- 13. VERIFY MIGRATION (uncomment to check)
-- ============================================

-- Count all columns:
-- SELECT COUNT(*) as total_columns FROM information_schema.columns WHERE table_name = 'products';

-- List all new columns:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' 
-- AND column_name IN (
--   'made_by', 'back_office_link', 'when_and_how_to_wear',
--   'compare_at_price', 'compare_at_price_usd',
--   'member_price', 'member_price_usd',
--   'cost_price', 'shipping_cost', 'sold_count', 'is_sold_out',
--   'seo_keywords', 'is_new_arrival', 'is_best_seller',
--   'is_featured_ring', 'is_featured_bracelet', 'is_featured_watch',
--   'is_unique_pendant', 'is_featured_stud', 'is_featured_dangle',
--   'is_featured_jewelry_box', 'is_featured_perfume_holder', 'is_jewelry_set',
--   'gift_product_id', 'gift_value',
--   'promo_price', 'promo_starts_at', 'promo_expires_at',
--   'promo_basic_member_price', 'promo_premium_member_price', 'promo_deluxe_member_price',
--   'ring_stock', 'earring_materials', 'show_earring_options',
--   'pendant_chain_lengths', 'pendant_wire_wrapped', 'chain_styles',
--   'packaging', 'reviews', 'ads'
-- )
-- ORDER BY column_name;

-- ============================================
-- MIGRATION COMPLETE! ✓
-- ============================================
-- 
-- NEXT STEPS:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Verify no errors occurred
-- 3. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)
-- 4. Try editing a product in AdminProducts
-- 5. Check browser console - errors should be gone!
--
-- All 40+ missing columns have been added with proper:
-- ✓ snake_case naming (matches sanitizeFirestoreData conversion)
-- ✓ Correct data types (TEXT, NUMERIC, BOOLEAN, JSONB, TIMESTAMPTZ)
-- ✓ Sensible defaults
-- ✓ JSONB for arrays and objects
-- ✓ Schema cache refresh
-- ============================================
