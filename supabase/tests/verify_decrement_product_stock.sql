-- verify_decrement_product_stock.sql
-- Small one-liners to run in Supabase SQL editor to verify decrement_product_stock RPC
-- Replace placeholders like <PRODUCT_ID_RING>, <PRODUCT_ID_GENERIC>, <ORDER_ID> with real IDs from your DB.

-- 1) Inspect a ring product (before)
SELECT id, type, stock, ring_stock FROM products WHERE id = '<PRODUCT_ID_RING>' LIMIT 1;

-- 2) Decrement a ring size (e.g., size 'M') by 1
SELECT decrement_product_stock('<PRODUCT_ID_RING>'::uuid, 1, 'M');

-- 3) Verify ring product (after)
SELECT id, type, stock, ring_stock FROM products WHERE id = '<PRODUCT_ID_RING>' LIMIT 1;

-- 4) Inspect a generic product (bracelet/pendant) (before)
SELECT id, type, stock FROM products WHERE id = '<PRODUCT_ID_GENERIC>' LIMIT 1;

-- 5) Decrement overall stock by 2 (no size)
SELECT decrement_product_stock('<PRODUCT_ID_GENERIC>'::uuid, 2, NULL);

-- 6) Verify generic product (after)
SELECT id, type, stock FROM products WHERE id = '<PRODUCT_ID_GENERIC>' LIMIT 1;

-- 7) Decrement stock for all items on an order (one-liner)
-- This will call the RPC for each row in order_items for the given order
SELECT decrement_product_stock(product_id, quantity, (variant_details->>'selectedSize')) FROM order_items WHERE order_id = '<ORDER_ID>';

-- 8) Optional transactional flow (update order status, decrement stock)
BEGIN;
UPDATE orders SET status = 'processing', payment_status = 'paid' WHERE id = '<ORDER_ID>';
SELECT decrement_product_stock(product_id, quantity, (variant_details->>'selectedSize')) FROM order_items WHERE order_id = '<ORDER_ID>';
COMMIT;

-- 9) Optional safety test: set ring_stock to NULL and confirm coalesce
-- (Run only in a test/dev environment)
-- UPDATE products SET ring_stock = NULL WHERE id = '<PRODUCT_ID_RING>';
-- SELECT decrement_product_stock('<PRODUCT_ID_RING>'::uuid, 1, 'M');
-- SELECT id, stock, ring_stock FROM products WHERE id = '<PRODUCT_ID_RING>' LIMIT 1;
