-- ============================================
-- Create artist_applications_logs table for auditing
-- Run this in Supabase SQL Editor as a privileged user (service_role key or DB owner)
-- ============================================

-- Table: artist_applications_logs
CREATE TABLE IF NOT EXISTS public.artist_applications_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.artist_applications(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g., 'create', 'update', 'status_change'
  payload JSONB DEFAULT '{}'::jsonb,
  admin_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_applications_logs_application_id ON public.artist_applications_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_artist_applications_logs_user_id ON public.artist_applications_logs(user_id);

-- Enable Row Level Security
ALTER TABLE IF EXISTS public.artist_applications_logs ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to INSERT their own logs (user_id must match auth.uid())
CREATE POLICY IF NOT EXISTS "authenticated_can_insert_own_logs"
  ON public.artist_applications_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: allow service_role to insert (service_role bypasses RLS but policy for clarity)
CREATE POLICY IF NOT EXISTS "service_role_can_insert_logs"
  ON public.artist_applications_logs FOR INSERT TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant privileges
GRANT INSERT ON public.artist_applications_logs TO authenticated;
GRANT INSERT ON public.artist_applications_logs TO service_role;

-- Optional: verify
-- SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename='artist_applications_logs';

-- Note: This table is intended for audit/debugging and should be restricted as needed for production.
