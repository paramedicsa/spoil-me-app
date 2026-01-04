-- ============================================
-- CRITICAL MISSING FIELDS MIGRATION
-- ============================================
-- These fields are in the Product interface and AdminProducts.tsx
-- but were NOT included in the main migration.
-- 
-- RUN THIS AFTER: supabase_complete_migration.sql
-- ============================================

-- ============================================
-- PRODUCT IDENTIFICATION & CATEGORIZATION
-- ============================================

-- URL-friendly product slug (e.g., "vintage-amethyst-ring")
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Product SKU code (e.g., "SPV-001", "SPV-002")
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS code TEXT;

-- Product type enum
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS type TEXT;

-- Check constraint for valid types
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_type_check;

ALTER TABLE products 
ADD CONSTRAINT products_type_check 
CHECK (type IN ('Ring', 'Stud', 'Dangle', 'Pendant', 'Necklace', 'Bracelet', 'Watch', 'Jewelry Box', 'Perfume Holder', 'Other'));

-- ============================================
-- MATERIAL & APPEARANCE
-- ============================================

-- Available color options (array of color names)
-- Example: ["Silver", "Gold", "Rose Gold"]
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb;

-- Material description (can be comma-separated or single value)
-- Example: "Sterling Silver, Cubic Zirconia" or "Leather, Metal"
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS material TEXT;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index on slug for URL lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Index on code for SKU searches
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);

-- Index on type for category filtering
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);

-- Unique constraint on slug (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;

-- Unique constraint on code (prevent duplicate SKUs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code_unique ON products(code) WHERE code IS NOT NULL;

-- ============================================
-- COLUMN COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN products.slug IS 'URL-friendly product identifier (e.g., "vintage-amethyst-ring")';
COMMENT ON COLUMN products.code IS 'Product SKU code (e.g., "SPV-001")';
COMMENT ON COLUMN products.type IS 'Product type: Ring, Stud, Dangle, Pendant, Necklace, Bracelet, Watch, Jewelry Box, Perfume Holder, Other';
COMMENT ON COLUMN products.colors IS 'Available color options array (e.g., ["Silver", "Gold"])';
COMMENT ON COLUMN products.material IS 'Product material description (e.g., "Sterling Silver, Cubic Zirconia")';

-- ============================================
-- REFRESH SCHEMA CACHE (CRITICAL!)
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICATION QUERY (uncomment to check)
-- ============================================

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' 
-- AND column_name IN ('slug', 'code', 'type', 'colors', 'material')
-- ORDER BY column_name;

-- ============================================
-- MIGRATION COMPLETE! ✓
-- ============================================
-- 
-- These 5 critical fields are now added:
-- ✓ slug (TEXT, unique, indexed)
-- ✓ code (TEXT, unique, indexed)  
-- ✓ type (TEXT, constrained to valid values, indexed)
-- ✓ colors (JSONB array)
-- ✓ material (TEXT)
--
-- NEXT: Refresh your browser and test product save!
-- ============================================
