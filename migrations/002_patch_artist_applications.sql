-- migrations/002_patch_artist_applications.sql
-- Make an existing artist_applications table compatible with the frontend
-- Adds uid/user_id dual columns, product_images column and submitted_at timestamp

alter table public.artist_applications
  add column if not exists uid uuid;

-- backfill uid from user_id if present
update public.artist_applications set uid = user_id where uid is null and user_id is not null;

alter table public.artist_applications
  add constraint if not exists artist_applications_uid_fkey foreign key (uid) references auth.users(id) on delete set null;

alter table public.artist_applications
  add column if not exists product_images jsonb default '[]'::jsonb;

-- if you have portfolio_images, copy them
update public.artist_applications set product_images = portfolio_images where (product_images is null or product_images = '[]') and portfolio_images is not null;

alter table public.artist_applications
  add column if not exists plan text;

alter table public.artist_applications
  add column if not exists terms_agreed boolean default false;

alter table public.artist_applications
  add column if not exists submitted_at timestamptz default now();

update public.artist_applications set submitted_at = created_at where submitted_at is null and created_at is not null;

create index if not exists idx_artist_applications_uid on public.artist_applications(uid);
create index if not exists idx_artist_applications_status on public.artist_applications(status);
create index if not exists idx_artist_applications_submitted_at on public.artist_applications(submitted_at desc);

-- If you want to support both 'name'/'surname' and 'artist_name' columns, consider keeping both.
-- End of migration
