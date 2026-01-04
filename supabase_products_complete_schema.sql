-- Complete Products Table Schema for Supabase
-- This creates the full table structure matching your AdminProducts.tsx

-- Drop and recreate (WARNING: This will delete all product data!)
-- Only use this if you want to start fresh
-- DROP TABLE IF EXISTS products CASCADE;

-- Create products table with ALL columns needed by your app
CREATE TABLE IF NOT EXISTS products (
  -- Core Identity
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL, -- SKU (e.g., SPV-304266)
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  when_and_how_to_wear TEXT,
  
  -- Pricing & Sourcing
  price NUMERIC NOT NULL DEFAULT 0,
  price_usd NUMERIC DEFAULT 0,
  compare_at_price NUMERIC DEFAULT 0,
  compare_at_price_usd NUMERIC DEFAULT 0,
  member_price NUMERIC DEFAULT 0,
  member_price_usd NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  back_office_link TEXT,
  made_by TEXT DEFAULT 'Spoil Me Vintage',
  
  -- Categorization
  category TEXT NOT NULL,
  type TEXT NOT NULL, -- Ring, Stud, Dangle, Pendant, Necklace, Bracelet, Watch, etc.
  status TEXT DEFAULT 'draft', -- published or draft
  
  -- Media
  images JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  
  -- Inventory & Variants
  stock INTEGER DEFAULT 0,
  is_sold_out BOOLEAN DEFAULT false,
  sold_count INTEGER DEFAULT 0,
  ring_stock JSONB DEFAULT '{}'::jsonb, -- {"5": 10, "6": 2}
  earring_materials JSONB DEFAULT '[]'::jsonb,
  show_earring_options BOOLEAN DEFAULT false,
  pendant_chain_lengths JSONB DEFAULT '{}'::jsonb,
  pendant_wire_wrapped BOOLEAN DEFAULT false,
  chain_styles JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  material TEXT,
  
  -- Marketing
  tags JSONB DEFAULT '[]'::jsonb,
  seo_keywords JSONB DEFAULT '[]'::jsonb,
  is_new_arrival BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  is_featured_ring BOOLEAN DEFAULT false,
  is_featured_bracelet BOOLEAN DEFAULT false,
  is_featured_watch BOOLEAN DEFAULT false,
  is_unique_pendant BOOLEAN DEFAULT false,
  is_featured_stud BOOLEAN DEFAULT false,
  is_featured_dangle BOOLEAN DEFAULT false,
  is_featured_jewelry_box BOOLEAN DEFAULT false,
  is_featured_perfume_holder BOOLEAN DEFAULT false,
  is_jewelry_set BOOLEAN DEFAULT false,
  reviews JSONB DEFAULT '[]'::jsonb,
  
  -- Promotions & Gifts
  gift_product_id TEXT,
  gift_value NUMERIC DEFAULT 0,
  promo_price NUMERIC DEFAULT 0,
  promo_starts_at TIMESTAMPTZ,
  promo_expires_at TIMESTAMPTZ,
  promo_basic_member_price NUMERIC DEFAULT 0,
  promo_premium_member_price NUMERIC DEFAULT 0,
  promo_deluxe_member_price NUMERIC DEFAULT 0,
  
  -- Packaging (stored as JSONB array)
  packaging JSONB DEFAULT '[]'::jsonb,
  
  -- Ad Platform
  ads JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_made_by ON products(made_by);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_sold_out ON products(is_sold_out);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to document the schema
COMMENT ON TABLE products IS 'Main products table for Spoil Me Vintage e-commerce';
COMMENT ON COLUMN products.id IS 'Unique product identifier (UUID or generated ID)';
COMMENT ON COLUMN products.code IS 'SKU code (e.g., SPV-304266)';
COMMENT ON COLUMN products.made_by IS 'Creator/maker name (e.g., Spoil Me Vintage, Cherr''s Beaded Arts)';
COMMENT ON COLUMN products.back_office_link IS 'Link to supplier/source (e.g., Temu)';
COMMENT ON COLUMN products.when_and_how_to_wear IS 'Styling suggestions';
COMMENT ON COLUMN products.is_sold_out IS 'Admin override flag to mark as sold out regardless of stock';
COMMENT ON COLUMN products.ring_stock IS 'JSON object mapping ring sizes to quantities';
COMMENT ON COLUMN products.packaging IS 'Array of packaging items with costs';
COMMENT ON COLUMN products.reviews IS 'Array of customer reviews';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Grant permissions (adjust role name as needed)
-- GRANT ALL ON products TO authenticated;
-- GRANT SELECT ON products TO anon;

-- Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
