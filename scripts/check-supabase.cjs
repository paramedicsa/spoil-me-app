require('dotenv').config({ path: '.env.local' });
(async () => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log('Using SUPABASE URL present?', !!url, 'ANON key present?', !!key);
    if (!url || !key) return console.error('Missing url or key');
    const sb = createClient(url, key);
    const { data, error } = await sb.from('products').select('id,name').limit(5);
    console.log('Query error?', !!error);
    if (error) console.error('Error details:', error);
    console.log('Sample rows:', data ? data.slice(0,5) : []);
  } catch (e) {
    console.error('Supabase check failed', e);
    process.exit(1);
  }
})();
