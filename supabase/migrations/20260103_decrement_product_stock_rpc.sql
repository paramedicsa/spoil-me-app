-- RPC to safely decrement product stock (handles ring sizes stored in ring_stock JSONB)
BEGIN;

CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id UUID, p_qty INTEGER, p_size TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_type TEXT;
  v_ring_stock JSONB;
  v_stock INTEGER := 0;
  v_key TEXT;
  v_val INTEGER;
  v_total INTEGER := 0;
BEGIN
  -- Lock the row for update
  SELECT type, ring_stock, stock INTO v_type, v_ring_stock, v_stock FROM products WHERE id = p_product_id FOR UPDATE;
  -- Ensure ring_stock is a JSONB object to avoid null issues
  v_ring_stock := COALESCE(v_ring_stock, '{}'::jsonb);
  IF NOT FOUND THEN
    RAISE NOTICE 'decrement_product_stock: product not found %', p_product_id;
    RETURN;
  END IF;

  IF lower(coalesce(v_type, '')) = 'ring' AND p_size IS NOT NULL THEN
    -- Get current size count
    v_val := COALESCE((v_ring_stock ->> p_size)::INTEGER, 0);
    v_val := GREATEST(0, v_val - p_qty);
    v_ring_stock := v_ring_stock || jsonb_build_object(p_size, v_val);

    -- Recalculate total stock from ring_stock
    v_total := 0;
    FOR v_key IN SELECT jsonb_object_keys(v_ring_stock)
    LOOP
      v_total := v_total + COALESCE((v_ring_stock ->> v_key)::INTEGER, 0);
    END LOOP;

    UPDATE products SET ring_stock = v_ring_stock, stock = v_total WHERE id = p_product_id;
  ELSE
    -- Decrement overall stock
    v_stock := GREATEST(0, v_stock - p_qty);
    UPDATE products SET stock = v_stock WHERE id = p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;
