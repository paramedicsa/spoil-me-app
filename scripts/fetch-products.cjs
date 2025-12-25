require('dotenv').config({ path: '.env.local' });
(async () => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
      process.exit(1);
    }
    const sb = createClient(url, key);
    const { data, error } = await sb.from('products').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(10);
    if (error) {
      console.error('Query error:', error);
      process.exit(1);
    }
    console.log('Fetched products count:', (data || []).length);
    console.log(data?.slice(0,5));
  } catch (e) {
    console.error('Failed to fetch products:', e);
    process.exit(1);
  }
})();
