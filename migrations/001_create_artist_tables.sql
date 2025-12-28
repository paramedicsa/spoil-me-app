-- migrations/001_create_artist_tables.sql
-- Minimal schema required for artist applications, artists, and notifications
-- Run in Supabase SQL editor or via the Supabase CLI (e.g., `supabase db query migrations/001_create_artist_tables.sql`).

-- extension for gen_random_uuid
create extension if not exists "pgcrypto";

-- artist_applications table
create table if not exists public.artist_applications (
  id uuid primary key default gen_random_uuid(),
  uid uuid references auth.users(id) on delete set null,
  name text,
  surname text,
  artist_trade_name text,
  contact_number text,
  email text,
  product_images jsonb, -- array of image URLs or objects
  plan text,
  terms_agreed boolean default false,
  status text default 'pending',
  submitted_at timestamptz default now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  admin_note text
);

create index if not exists idx_artist_applications_uid on public.artist_applications(uid);
create index if not exists idx_artist_applications_status on public.artist_applications(status);
create index if not exists idx_artist_applications_submitted_at on public.artist_applications(submitted_at desc);

-- artists table (created on approval)
create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  uid uuid references auth.users(id) on delete cascade,
  shop_name text,
  slot_limit int default 5,
  slots_used int default 0,
  wallet jsonb,
  status text default 'active',
  is_first_time boolean default true,
  created_at timestamptz default now()
);

-- notifications table (if you don't already have one)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text,
  title text,
  message text,
  date timestamptz default now(),
  is_read boolean default false
);

-- Row-Level Security (RLS) examples
-- Adjust predicates to match your users table (e.g., is_admin column or a role claim)

alter table public.artist_applications enable row level security;

-- Allow authenticated users to INSERT their own application
create policy "Allow authenticated insert" on public.artist_applications
  for insert with check (auth.uid() = uid);

-- Allow owners to select their own rows and admins to select all rows
create policy "Allow select owner or admin" on public.artist_applications
  for select using (
    auth.uid() = uid
    or exists(select 1 from public.users u where u.id = auth.uid() and (u.is_admin = true or u.role = 'admin'))
  );

-- Allow admins to update (e.g., approve/reject)
create policy "Allow update admin" on public.artist_applications
  for update using (exists(select 1 from public.users u where u.id = auth.uid() and (u.is_admin = true or u.role = 'admin')));

-- NOTE: Supabase storage buckets are not created via SQL. Create a bucket named
-- `artist-applications` using the Supabase UI or the Storage API/CLI.
-- Make the bucket public or private depending on your preference. If private
-- remember to use signed URLs for public access.

-- End of migration
