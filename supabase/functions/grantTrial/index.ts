import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof Deno !== 'undefined' ? (Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')) : process.env.NEXT_PUBLIC_SUPABASE_URL) || '';
const SUPABASE_SERVICE_ROLE_KEY = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') : process.env.SUPABASE_SERVICE_ROLE_KEY) || '';

let supabase: any;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
} else {
  console.warn('grantTrial: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  supabase = {
    from: (_: string) => ({ select: (_: string) => ({ eq: (_k: string, _v: any) => ({ maybeSingle: () => ({ data: null, error: null }) }), update: (_d: any) => ({ data: null, error: null }) }), insert: (_d: any) => ({ data: null, error: null }) }),
    rpc: (_: string, _p: any) => ({ data: null, error: null })
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

export async function grantTrialHandler(req: Request, deps: { supabase?: any } = {}) {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return new Response(JSON.stringify({ success: false, message: 'Missing Authorization' }), { status: 403 });

    const payload = await req.json();
    const { userId, plan, days } = payload || {};
    if (!userId || !plan || !days) return new Response(JSON.stringify({ success: false, message: 'Missing required fields' }), { status: 400 });

    const decoded = decodeJwtPayload(bearer);
    const userIdToken = decoded?.sub || decoded?.user_id || decoded?.sub;
    const userEmail = decoded?.email;
    if (!userIdToken && !userEmail) return new Response(JSON.stringify({ success: false, message: 'Invalid token' }), { status: 403 });

    const sb = deps.supabase || supabase;
    const { data: u, error: uErr } = await sb.from('users').select('id,email,is_admin').or(userIdToken ? `id.eq.${userIdToken}` : `email.eq.${userEmail}`).limit(1).maybeSingle();
    if (uErr) throw uErr;
    const isAdmin = (u && (u as any).is_admin) || (u && (u as any).isAdmin) || (u && (u as any).email === 'spoilmevintagediy@gmail.com');
    if (!isAdmin) return new Response(JSON.stringify({ success: false, message: 'Restricted to admins' }), { status: 403 });

    // Compute expiry
    const expiryDate = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000).toISOString();
    const currency = plan.includes('USD') || plan.includes('$') ? 'USD' : 'ZAR';

    // Update user and insert notification (best-effort)
    const { error: updErr } = await sb.from('users').update({ membership_tier: plan, membership_status: 'trial', trial_expires_at: expiryDate, credit_currency: currency, updated_at: new Date().toISOString() }).eq('id', userId);
    if (updErr) throw updErr;

    const { error: notifErr } = await sb.from('notifications').insert([{ user_id: userId, title: 'VIP Trial Activated! 🎁', message: `You have been gifted a ${days}-day trial for the ${plan} membership. Enjoy!`, read: false, created_at: new Date().toISOString(), type: 'system' }]);
    if (notifErr) console.warn('Failed to insert notification for grantTrial:', notifErr);

    return new Response(JSON.stringify({ success: true, message: `Trial granted to ${userId}` }), { status: 200 });
  } catch (err: any) {
    console.error('grantTrial error:', err);
    return new Response(JSON.stringify({ success: false, message: err?.message || String(err) }), { status: 500 });
  }
}

(async () => {
  try {
    if (typeof Deno !== 'undefined') {
      const { serve } = await import('std/server');
      serve((req: Request) => grantTrialHandler(req));
    }
  } catch (err) {
    console.warn('Deno serve not initialized for grantTrial:', err?.message || err);
  }
})();
