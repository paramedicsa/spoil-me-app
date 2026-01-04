-- Create order_items table for storing line items with variants/metadata
BEGIN;

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  variants JSONB DEFAULT '{}'::jsonb, -- stores selectedSize, selectedMaterial, selectedChainStyle, etc.
  variant_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Enable RLS and set policies to allow owners and admins to access
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- If upgrading an existing DB that lacks variant_details, add it safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'variant_details') THEN
    ALTER TABLE order_items ADD COLUMN variant_details JSONB DEFAULT '{}'::jsonb;
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all order items') THEN
    CREATE POLICY "Admins can view all order items" ON order_items FOR ALL USING ((SELECT is_admin FROM users WHERE id = auth.uid()));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their order items') THEN
    CREATE POLICY "Users can view their order items" ON order_items FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
  END IF;
END$$;

COMMIT;
