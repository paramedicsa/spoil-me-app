import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof Deno !== 'undefined' ? (Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')) : process.env.NEXT_PUBLIC_SUPABASE_URL) || '';
const SUPABASE_SERVICE_ROLE_KEY = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') : process.env.SUPABASE_SERVICE_ROLE_KEY) || '';

let supabase: any;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
} else {
  console.warn('deleteUser: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  supabase = {
    from: (_: string) => ({ delete: () => ({ error: null }), update: () => ({ error: null }), eq: () => ({ error: null }) }),
    auth: { admin: { deleteUser: async (_id: string) => ({ error: null }) } }
  } as any;
}

const decodeJwtPayload = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
};

export async function deleteUserHandler(req: Request, deps: { supabase?: any } = {}) {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return new Response(JSON.stringify({ success: false, message: 'Missing Authorization' }), { status: 403 });

    const payload = await req.json();
    const { userId, should_soft_delete } = payload || {};
    if (!userId) return new Response(JSON.stringify({ success: false, message: 'User ID is required' }), { status: 400 });

    const decoded = decodeJwtPayload(bearer);
    const userIdToken = decoded?.sub || decoded?.user_id || decoded?.sub;
    const userEmail = decoded?.email;
    if (!userIdToken && !userEmail) return new Response(JSON.stringify({ success: false, message: 'Invalid token' }), { status: 403 });

    const sb = deps.supabase || supabase;
    const { data: u, error: uErr } = await sb.from('users').select('id,email,is_admin').or(userIdToken ? `id.eq.${userIdToken}` : `email.eq.${userEmail}`).limit(1).maybeSingle();
    if (uErr) throw uErr;
    const isAdmin = (u && (u as any).is_admin) || (u && (u as any).isAdmin) || (u && (u as any).email === 'spoilmevintagediy@gmail.com');
    if (!isAdmin) return new Response(JSON.stringify({ success: false, message: 'Restricted to admins' }), { status: 403 });

    // Soft delete: mark is_active false and set deleted_at
    if (should_soft_delete) {
      const { error: updErr } = await sb.from('users').update({ is_active: false, deleted_at: new Date().toISOString() }).eq('id', userId);
      if (updErr) throw updErr;
      return new Response(JSON.stringify({ success: true, message: `User ${userId} soft-deleted.` }), { status: 200 });
    }

    // Hard delete: remove related rows then delete auth user via admin API
    const relatedTables = ['orders', 'notifications', 'share_logs', 'social_logs', 'push_tokens', 'affiliate_applications', 'artist_applications'];
    for (const t of relatedTables) {
      try {
        await sb.from(t).delete().eq('user_id', userId);
      } catch (err) {
        console.warn('Failed to delete related rows for', t, err);
      }
    }

    // Delete user row
    const { error: delErr } = await sb.from('users').delete().eq('id', userId);
    if (delErr) throw delErr;

    // Delete auth user using supabase admin API
    try {
      if (sb.auth && sb.auth.admin && typeof sb.auth.admin.deleteUser === 'function') {
        const res = await sb.auth.admin.deleteUser(userId);
        if (res?.error) throw res.error;
      } else {
        console.warn('Supabase admin deleteUser not available in this environment');
      }
    } catch (err) {
      console.warn('Failed to delete Supabase auth user:', err);
    }

    return new Response(JSON.stringify({ success: true, message: `User ${userId} permanently deleted.` }), { status: 200 });
  } catch (err: any) {
    console.error('deleteUser error:', err);
    if (err?.message && err.message.includes('not found')) return new Response(JSON.stringify({ success: false, message: 'User not found' }), { status: 404 });
    return new Response(JSON.stringify({ success: false, message: err?.message || String(err) }), { status: 500 });
  }
}

(async () => {
  try {
    if (typeof Deno !== 'undefined') {
      const { serve } = await import('https://deno.land/std@0.170.0/http/server.ts');
      serve((req: Request) => deleteUserHandler(req));
    }
  } catch (err) {
    console.warn('Deno serve not initialized for deleteUser:', err?.message || err);
  }
})();
