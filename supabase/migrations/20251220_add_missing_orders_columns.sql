-- Idempotent migration to add missing columns to orders
-- Adds customer_name, customer_email, items, subtotal, total if missing

BEGIN;

ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS items JSONB,
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS total DECIMAL(10,2);

-- Ensure useful indexes exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='orders' AND indexname='idx_orders_customer_email'
  ) THEN
    CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);
  END IF;
END$$;

COMMIT;
