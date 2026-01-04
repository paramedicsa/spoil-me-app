-- Migration: Add missing columns to products table
-- Purpose: Fix schema cache errors by adding all required columns

-- Add back_office_link if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS back_office_link TEXT;

-- Ensure id is TEXT type (not UUID) to support SPV- prefixed IDs
-- Note: If your table currently has UUID, you'll need to convert data first
-- For now, we'll just ensure the column is TEXT

-- Add any other potentially missing columns from the schema
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ads JSONB DEFAULT '{}'::jsonb;

-- Update the updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes if missing
CREATE INDEX IF NOT EXISTS idx_products_back_office_link ON products(back_office_link);
CREATE INDEX IF NOT EXISTS idx_products_image_url ON products(image_url);
