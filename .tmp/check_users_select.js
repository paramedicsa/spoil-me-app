const { createClient } = require('@supabase/supabase-js');

(async () => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      console.error('Missing env vars.');
      process.exit(1);
    }

    const sAdmin = createClient(url, serviceKey);

    const list = await sAdmin.auth.admin.listUsers();
    const users = (list.data.users || []);
    if (users.length === 0) {
      console.log('No users in auth table');
      process.exit(0);
    }

    const user = users[0];
    console.log('Testing for user', user.id, user.email);

    const { data, error } = await sAdmin.from('public.users')
      .select('is_admin, is_affiliate, is_artist, is_member, affiliate_code')
      .eq('id', user.id)
      .single();

    console.log('select error:', error);
    console.log('select data:', data);
      console.log('--- test single column selects ---');
      const r1 = await sAdmin.from('users').select('email').eq('id', user.id).single();
      console.log('email select err:', r1.error, 'data:', r1.data);
      const r2 = await sAdmin.from('users').select('is_admin').eq('id', user.id).single();
      console.log('is_admin select err:', r2.error, 'data:', r2.data);

    console.log('--- now try select * ---');
    const { data: allData, error: allErr } = await sAdmin.from('public.users').select('*').eq('id', user.id).single();
    console.log('select * error:', allErr);
    console.log('select * data keys:', allData ? Object.keys(allData) : null);

      console.log('--- inspect information_schema.columns for users table ---');
      const { data: cols, error: colsErr } = await sAdmin.from('information_schema.columns').select('column_name').eq('table_name', 'users');
      console.log('columns error:', colsErr);
      console.log('columns:', cols && cols.map(c => c.column_name).slice(0,200));

    process.exit(0);
  } catch (err) {
    console.error('Uncaught error', err);
    process.exit(1);
  }
})();
