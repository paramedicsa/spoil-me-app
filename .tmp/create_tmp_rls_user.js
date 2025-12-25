const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

(async () => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      console.error('Missing env vars NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    const sAdmin = createClient(url, serviceKey);

    const email = `tmp+rlstest_${crypto.randomBytes(6).toString('hex')}@example.com`;
    const password = 'Test1234!';

    console.log('Creating tmp auth user', email);
    const create = await sAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    // supabase-js may return { data, error } and the created user is at create.data.user
    if (create.error || !create.data || !create.data.user) {
      console.error('Failed to create auth user:', create.error || create);
      process.exit(1);
    }

    const user = create.data.user;
    console.log('Created auth user id', user.id);

    // Upsert a minimal profile row into public.users
    console.log('Upserting public.users profile for tmp user');
    const up = await sAdmin.from('users').upsert([
      {
        id: user.id,
        email: user.email,
        is_admin: false,
        is_artist: false,
        is_affiliate: false,
        is_member: false,
        affiliate_code: null
      }
    ]).select().single();

    if (up.error) {
      console.error('Failed to upsert profile:', up.error.message || up.error);
      console.error('If this error mentions missing columns, apply the migration file: supabase/migrations/20251220_add_missing_users_columns.sql');
      // Cleanup auth user we created
      await sAdmin.auth.admin.deleteUser(user.id).catch(() => {});
      process.exit(1);
    }

    console.log('Profile upserted');
    console.log('TMP_USER_EMAIL=' + email);
    console.log('TMP_USER_PASSWORD=' + password);
    console.log('TMP_USER_ID=' + user.id);
    process.exit(0);
  } catch (err) {
    console.error('Uncaught error', err);
    process.exit(1);
  }
})();
