-- Create commission_records table (idempotent) and add RLS policy

BEGIN;

CREATE TABLE IF NOT EXISTS public.commission_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  sale_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.commission_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commission_records') THEN
    DROP POLICY IF EXISTS "Affiliates view own commissions" ON public.commission_records;
    CREATE POLICY "Affiliates view own commissions" ON public.commission_records FOR SELECT
      USING (affiliate_id = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));
  END IF;
END$$;

COMMIT;
