import { createClient } from '@supabase/supabase-js';

(async () => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      console.error('Missing env vars.');
      process.exit(1);
    }
    const sAdmin = createClient(url, serviceKey);
    const r = await sAdmin.from('information_schema.columns').select('column_name').eq('table_name','artist_applications');
    console.log('error:', r.error);
    console.log('columns:', r.data && r.data.map(c => c.column_name));
    process.exit(0);
  } catch (err) {
    console.error('Err', err);
    process.exit(1);
  }
})();
