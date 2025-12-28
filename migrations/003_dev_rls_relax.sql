-- migrations/003_dev_rls_relax.sql
-- DEV ONLY: Relax RLS policies on artist_applications for quick local/dev testing.
-- WARNING: Do NOT apply this in production. This allows unauthenticated inserts/selects.

-- Enable RLS if not enabled
alter table public.artist_applications enable row level security;

-- Allow anyone (including anon) to insert — only for local development
create policy if not exists "Allow insert anyone (dev only)" on public.artist_applications
  for insert
  with check (true);

-- Allow select for anyone
create policy if not exists "Allow select anyone (dev only)" on public.artist_applications
  for select
  using (true);

-- Allow update/free access (optional for dev)
create policy if not exists "Allow update anyone (dev only)" on public.artist_applications
  for update
  using (true)
  with check (true);

-- Remove these policies in production or replace them with proper owner/admin policies.
