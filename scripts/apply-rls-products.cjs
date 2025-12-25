require('dotenv').config({ path: '.env.local' });
(async () => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local');
      process.exit(1);
    }
    const sAdmin = createClient(url, key);
    console.log('Applying RLS policy for public.products (allow public SELECT)...');
    const sql = `BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'anon_select_products') THEN
    ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
    CREATE POLICY anon_select_products ON public.products FOR SELECT USING (true);
  END IF;
END;
$$;
COMMIT;`;
    const r = await sAdmin.postgres.query({ sql });
    if (r.error) {
      console.error('Error applying RLS:', r.error);
      process.exit(1);
    }
    console.log('RLS applied (or already present).');
    process.exit(0);
  } catch (e) {
    console.error('Failed to apply RLS:', e);
    process.exit(1);
  }
})();
