-- Create transactions table (idempotent) and add RLS policies

BEGIN;

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
    CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT
      USING (user_id = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));

    DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
    CREATE POLICY "Admins can manage transactions" ON public.transactions FOR ALL
      USING ((auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'))
      WITH CHECK ((auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));
  END IF;
END$$;

COMMIT;
