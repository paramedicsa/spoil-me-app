How to apply migrations

This project stores SQL migration files in `migrations/` for manual application in Supabase.

To apply the migration:

1. Supabase SQL editor (quick):
   - Open your Supabase project dashboard.
   - Go to "SQL" → "New query" and paste the contents of `migrations/001_create_artist_tables.sql`, then run it.

2. Supabase CLI (recommended for CI):
   - Install the Supabase CLI and login: `npm i -g supabase` and `supabase login`.
   - Run: `supabase db query migrations/001_create_artist_tables.sql`.

3. Storage bucket:
   - Create a storage bucket named `artist-applications` via the Supabase UI (Storage → Create bucket).
   - Decide whether the bucket should be public (easier) or private (more secure). If private, use signed URLs when serving images.

Optional: automated bucket creation

   - `supabase storage create-bucket artist-applications --public` (set `--public` if you want public access)
   - Set env vars: `$env:SUPABASE_URL = 'https://your-project.supabase.co'` and `$env:SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'`
   - Run: `powershell -ExecutionPolicy Bypass -File scripts/create-supabase-bucket.ps1 -BucketName 'artist-applications' -Public`
   - `SUPABASE_URL='https://...' SUPABASE_SERVICE_ROLE_KEY='...' node scripts/create-supabase-bucket.js artist-applications --public`

Security note: both helper scripts require the Supabase **service_role** key which must be stored securely (CI secret, env var). Do NOT commit secrets to repo.

Notes:
 - Run migration 004 to add `uid` alias, fix storage policies for `artist-applications`, and ensure `users.is_admin` exists. Use the SQL editor or psql with the service_role key.
