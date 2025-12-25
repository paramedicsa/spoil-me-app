-- Idempotent migration to create affiliate_applications table and policies

BEGIN;

-- Create table if missing
CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  reason TEXT,
  socials TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add policies (idempotent)
ALTER TABLE IF EXISTS public.affiliate_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'affiliate_applications') THEN
    DROP POLICY IF EXISTS "Users can view own applications" ON public.affiliate_applications;
    CREATE POLICY "Users can view own applications"
      ON public.affiliate_applications FOR SELECT
      USING (user_id = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin','super_admin','service_role'));

    DROP POLICY IF EXISTS "Users can submit applications" ON public.affiliate_applications;
    CREATE POLICY "Users can submit applications"
      ON public.affiliate_applications FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END$$;

COMMIT;
