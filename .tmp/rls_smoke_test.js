import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

(async () => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !serviceKey || !anonKey) {
      console.error('Missing env vars.');
      process.exit(1);
    }

    const sAdmin = createClient(url, serviceKey);
    const sAnon = createClient(url, anonKey);

    // Find a tmp test auth user
    let list = await sAdmin.auth.admin.listUsers();
    let matches = (list.data.users || []).filter(u => u.email && u.email.startsWith('tmp+rlstest_'));
    let user;
    if (matches.length === 0) {
      console.log('No tmp test user found — creating one now');
      // Create a tmp user if none exists
      const createResult = await sAdmin.auth.admin.createUser({
        email: `tmp+rlstest_${crypto.randomBytes(6).toString('hex')}@example.com`,
        password: 'Test1234!',
        email_confirm: true
      });
      // supabase-js admin.createUser returns { data, error } and the created user is at createResult.data.user
      if (createResult.error || !createResult.data || !createResult.data.user) {
        console.error('Failed to create tmp auth user:', createResult.error || createResult);
        process.exit(1);
      }
      user = createResult.data.user;
      console.log('Created tmp user', user.id, user.email);

      // Upsert a minimal profile in public.users; if this fails because columns are missing, show the migration path
      const upsertProfile = await sAdmin.from('users').upsert([{ id: user.id, email: user.email, is_admin: false, is_artist: false, is_affiliate: false, is_member: false }]).select().single();
      if (upsertProfile.error) {
        console.error('Failed to create profile row:', upsertProfile.error);
        console.error('If the error mentions missing columns, apply the migration file: supabase/migrations/20251220_add_missing_users_columns.sql');
        // cleanup auth user
        await sAdmin.auth.admin.deleteUser(user.id).catch(() => {});
        process.exit(1);
      }
    } else {
      user = matches[0];
      console.log('Using existing tmp user', user.id, user.email);
    }

    const pkgId = crypto.randomUUID();
      // Ensure a profile exists in public.users (auth user does not automatically create profile row)
      console.log('Upserting public.users profile for test user');
      const upsertProfile = await sAdmin.from('users').upsert([{ id: user.id, email: user.email, role: 'admin' }]).select().single();
      console.log('upsertProfile error', upsertProfile.error);
      if (upsertProfile.error) { console.error('Failed to create profile row'); process.exit(1); }
    // Insert with required fields using allowed package_type and price/duration
    const insert = await sAdmin.from('ad_packages').insert([{ id: pkgId, user_id: user.id, package_type: 'instagram_post', duration_days: 7, price: 199 }]).select().single();
    console.log('insert error', insert.error);
    console.log('insert data', insert.data);
    if (insert.error) process.exit(1);

    // Sign in as user using a temporary client so `sAnon` remains unauthenticated
    console.log('Signing in as user');
    const sAuth = createClient(url, anonKey);
    const sign = await sAuth.auth.signInWithPassword({ email: user.email, password: 'Test1234!' });
    if (sign.error) { console.error('sign in error', sign.error); process.exit(1); }
    const access = sign.data.session.access_token;
    const refresh = sign.data.session.refresh_token;

    const sUser = createClient(url, anonKey);
    await sUser.auth.setSession({ access_token: access, refresh_token: refresh });

    const userSelect = await sUser.from('ad_packages').select('*').eq('user_id', user.id);
    console.log('userSelect err', userSelect.error, 'data', userSelect.data);

    const up = await sUser.from('ad_packages').update({ price: 299 }).eq('id', pkgId).select().single();
    console.log('update err', up.error, 'data', up.data);

    const anonSelect = await sAnon.from('ad_packages').select('*').eq('id', pkgId);
    console.log('anonSelect', anonSelect.error, anonSelect.data);

      // --- PRODUCTS RLS TESTS ---
      console.log('--- PRODUCTS RLS TESTS ---');
      const prodId = crypto.randomUUID();
      // Insert product as admin (service role) with artist_id = test user
      const prodInsert = await sAdmin.from('products').insert([{ id: prodId, name: 'RLS Test Product', price: 9.99, artist_id: user.id, status: 'draft' }]).select().single();
      console.log('prodInsert err', prodInsert.error, 'data', prodInsert.data);
      if (prodInsert.error) {
        console.error('Failed to insert product, aborting product tests');
      } else {
        // As the signed-in test user, they should be able to SELECT their draft product (artist_id = auth.uid())
        const userProdSelect = await sUser.from('products').select('*').eq('id', prodId);
        console.log('userProdSelect err', userProdSelect.error, 'data', userProdSelect.data);

        // Test update as owner
        const prodUp = await sUser.from('products').update({ price: 19.99 }).eq('id', prodId).select().single();
        console.log('prod update err', prodUp.error, 'data', prodUp.data);

        // Anon should NOT see a draft product
        const anonProdBefore = await sAnon.from('products').select('*').eq('id', prodId);
        console.log('anonProdBefore', anonProdBefore.error, anonProdBefore.data);

        // Publish the product as admin, then anon should see it
        const adminPub = await sAdmin.from('products').update({ status: 'published' }).eq('id', prodId);
        console.log('admin publish err', adminPub.error);

        const anonProdAfter = await sAnon.from('products').select('*').eq('id', prodId);
        console.log('anonProdAfter', anonProdAfter.error, anonProdAfter.data);

        // Cleanup product
        const delProd = await sAdmin.from('products').delete().eq('id', prodId);
        console.log('delProd err', delProd.error);
      }

      // --- ORDERS RLS TESTS ---
      console.log('--- ORDERS RLS TESTS ---');
      const orderId = crypto.randomUUID();
      // Insert order as signed-in user (should be allowed)
      const orderInsert = await sUser.from('orders').insert([{ id: orderId, order_number: `ORD-${Date.now()}`, user_id: user.id, customer_name: 'Test', customer_email: user.email, items: [], subtotal: 10, total_amount: 10, shipping_address: {} }]).select().single();
      console.log('orderInsert err', orderInsert.error, 'data', orderInsert.data);
      if (orderInsert.error) {
        console.error('Failed to insert order as user');
      } else {
        // User should be able to select own order
        const userOrderSelect = await sUser.from('orders').select('*').eq('id', orderId);
        console.log('userOrderSelect err', userOrderSelect.error, 'data', userOrderSelect.data);

        // User should NOT be able to update orders (Admins update only)
        const userOrderUpdate = await sUser.from('orders').update({ status: 'shipped' }).eq('id', orderId).select().single();
        console.log('userOrderUpdate err', userOrderUpdate.error, 'data', userOrderUpdate.data);

        // Admin should be able to update
        const adminOrderUpdate = await sAdmin.from('orders').update({ status: 'shipped' }).eq('id', orderId).select().single();
        console.log('adminOrderUpdate err', adminOrderUpdate.error, 'data', adminOrderUpdate.data);

        // Anon should NOT see the order
        const anonOrder = await sAnon.from('orders').select('*').eq('id', orderId);
        console.log('anonOrder', anonOrder.error, anonOrder.data);

        // Cleanup order
        const delOrder = await sAdmin.from('orders').delete().eq('id', orderId);
        console.log('delOrder err', delOrder.error);
      }

      // --- AFFILIATE APPLICATIONS RLS TESTS ---
      console.log('--- AFFILIATE APPLICATIONS RLS TESTS ---');
      const appId = crypto.randomUUID();
      // User submits an affiliate application
      const appInsert = await sUser.from('affiliate_applications').insert([{ id: appId, user_id: user.id, name: 'Tmp', surname: 'Tester' }]).select().single();
      console.log('appInsert err', appInsert.error, 'data', appInsert.data);
      if (appInsert.error) {
        console.error('Failed to insert affiliate application');
      } else {
        // User can select their application
        const userAppSelect = await sUser.from('affiliate_applications').select('*').eq('user_id', user.id);
        console.log('userAppSelect err', userAppSelect.error, 'data', userAppSelect.data);

        // Anon should NOT see it
        const anonApp = await sAnon.from('affiliate_applications').select('*').eq('id', appId);
        console.log('anonApp', anonApp.error, anonApp.data);
        if (!anonApp.error && Array.isArray(anonApp.data) && anonApp.data.length > 0) {
          console.error('ERROR: affiliate_application is visible to anon — RLS policy misconfigured');
          // mark test as failed (will exit non-zero after cleanup)
          global.__rls_test_failed = true;
        }

        // Admin can delete it
        const delApp = await sAdmin.from('affiliate_applications').delete().eq('id', appId);
        console.log('delApp err', delApp.error);
      }

      // --- ARTIST APPLICATIONS RLS TESTS ---
      console.log('--- ARTIST APPLICATIONS RLS TESTS ---');
      const artistAppId = crypto.randomUUID();
      // User submits an artist application (requires contact_number and email)
      const artistInsert = await sUser.from('artist_applications').insert([{ id: artistAppId, user_id: user.id, name: 'Artist', surname: 'Tester', contact_number: '1234567890', email: user.email }]).select().single();
      console.log('artistInsert err', artistInsert.error, 'data', artistInsert.data);
      if (artistInsert.error) {
        console.error('Failed to insert artist application');
      } else {
        const userArtistSelect = await sUser.from('artist_applications').select('*').eq('user_id', user.id);
        console.log('userArtistSelect err', userArtistSelect.error, 'data', userArtistSelect.data);

        const anonArtist = await sAnon.from('artist_applications').select('*').eq('id', artistAppId);
        console.log('anonArtist', anonArtist.error, anonArtist.data);

        const delArtist = await sAdmin.from('artist_applications').delete().eq('id', artistAppId);
        console.log('delArtist err', delArtist.error);
      }

      // --- TRANSACTIONS RLS TESTS ---
      console.log('--- TRANSACTIONS RLS TESTS ---');
      const txId = crypto.randomUUID();
      // Insert transaction as admin for the user
      const txInsert = await sAdmin.from('transactions').insert([{ id: txId, user_id: user.id, type: 'affiliate_payout', amount: 100.00, status: 'pending' }]).select().single();
      console.log('txInsert err', txInsert.error, 'data', txInsert.data);
      if (txInsert.error) {
        console.error('Failed to insert transaction');
      } else {
        // User should be able to view own transactions
        const userTxSelect = await sUser.from('transactions').select('*').eq('user_id', user.id);
        console.log('userTxSelect err', userTxSelect.error, 'data', userTxSelect.data);

        // User should NOT be able to update transaction
        const userTxUpdate = await sUser.from('transactions').update({ status: 'completed' }).eq('id', txId).select().single();
        console.log('userTxUpdate err', userTxUpdate.error, 'data', userTxUpdate.data);

        // Admin can update
        const adminTxUpdate = await sAdmin.from('transactions').update({ status: 'completed' }).eq('id', txId).select().single();
        console.log('adminTxUpdate err', adminTxUpdate.error, 'data', adminTxUpdate.data);

        const delTx = await sAdmin.from('transactions').delete().eq('id', txId);
        console.log('delTx err', delTx.error);
      }

      // --- COMMISSION RECORDS RLS TESTS ---
      console.log('--- COMMISSION RECORDS RLS TESTS ---');
      const orderForCommission = crypto.randomUUID();
      // Create an order for commission reference
      const orderForCommissionInsert = await sAdmin.from('orders').insert([{ id: orderForCommission, order_number: `ORD-${Date.now()}`, user_id: user.id, customer_name: 'Comm', customer_email: user.email, items: [], subtotal: 1, total_amount: 1, shipping_address: {} }]).select().single();
      console.log('orderForCommissionInsert err', orderForCommissionInsert.error, 'data', orderForCommissionInsert.data);
      if (orderForCommissionInsert.error) {
        console.error('Failed to create order for commission tests');
      } else {
        const commissionId = crypto.randomUUID();
        const commissionInsert = await sAdmin.from('commission_records').insert([{ id: commissionId, affiliate_id: user.id, order_id: orderForCommission, sale_amount: 100.00, commission_rate: 10.00, commission_amount: 10.00 }]).select().single();
        console.log('commissionInsert err', commissionInsert.error, 'data', commissionInsert.data);
        if (commissionInsert.error) {
          console.error('Failed to insert commission record');
        } else {
          // Affiliate (user) should be able to view own commission
          const userComSelect = await sUser.from('commission_records').select('*').eq('affiliate_id', user.id);
          console.log('userComSelect err', userComSelect.error, 'data', userComSelect.data);

          // Anon should NOT see it
          const anonCom = await sAnon.from('commission_records').select('*').eq('id', commissionId);
          console.log('anonCom', anonCom.error, anonCom.data);

          const delCommission = await sAdmin.from('commission_records').delete().eq('id', commissionId);
          console.log('delCommission err', delCommission.error);
        }
        // Cleanup order
        const delOrderForCommission = await sAdmin.from('orders').delete().eq('id', orderForCommission);
        console.log('delOrderForCommission err', delOrderForCommission.error);
      }

    // Cleanup
    const delPkg = await sAdmin.from('ad_packages').delete().eq('id', pkgId);
    console.log('delPkg error', delPkg.error);

    // Remove profile created for test
    const delProfile = await sAdmin.from('users').delete().eq('id', user.id);
    console.log('delProfile error', delProfile.error);

    // Remove auth user
    const delAuth = await sAdmin.auth.admin.deleteUser(user.id);
    console.log('delAuth error', delAuth.error);

    console.log('Smoke test complete');
    process.exit(0);
  } catch (err) {
    console.error('Uncaught error', err);
    process.exit(1);
  }
})();
