import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof Deno !== 'undefined' ? (Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')) : process.env.NEXT_PUBLIC_SUPABASE_URL) || '';
const SUPABASE_SERVICE_ROLE_KEY = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') : process.env.SUPABASE_SERVICE_ROLE_KEY) || '';

let supabase: any;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
} else {
  console.warn('reviewAffiliateApplication: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  supabase = {
    from: (_: string) => ({ select: (_: string) => ({ eq: (_k: string, _v: any) => ({ data: null, error: null }), update: (_d: any) => ({ data: null, error: null }), insert: (_d: any) => ({ data: null, error: null }) }) }),
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

export async function reviewAffiliateApplicationHandler(req: Request, deps: { supabase?: any } = {}) {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return new Response(JSON.stringify({ success: false, message: 'Missing Authorization' }), { status: 403 });

    const payload = await req.json();
    const { applicationId, decision, reason } = payload || {};
    if (!applicationId || !decision) return new Response(JSON.stringify({ success: false, message: 'Missing parameters' }), { status: 400 });

    const decoded = decodeJwtPayload(bearer);
    const userId = decoded?.sub || decoded?.user_id || decoded?.sub;
    const userEmail = decoded?.email;
    if (!userId && !userEmail) return new Response(JSON.stringify({ success: false, message: 'Invalid token' }), { status: 403 });

    const sb = deps.supabase || supabase;
    // Check admin
    const { data: u, error: uErr } = await sb.from('users').select('id,email,is_admin').or(userId ? `id.eq.${userId}` : `email.eq.${userEmail}`).limit(1).maybeSingle();
    if (uErr) throw uErr;
    const isAdmin = (u && (u as any).is_admin) || (u && (u as any).isAdmin) || (u && (u as any).email === 'spoilmevintagediy@gmail.com');
    if (!isAdmin) return new Response(JSON.stringify({ success: false, message: 'Restricted to admins' }), { status: 403 });

    // Fetch application
    const { data: appRow, error: appErr } = await sb.from('affiliate_applications').select('*').eq('id', applicationId).maybeSingle();
    if (appErr) throw appErr;
    if (!appRow) return new Response(JSON.stringify({ success: false, message: 'Application not found' }), { status: 404 });

    const applicantId = appRow.user_id;

    if (decision === 'approve') {
      const code = `VIP${Math.floor(1000 + Math.random() * 9000)}`;
      await sb.from('affiliate_applications').update({ status: 'approved', admin_note: 'Approved by admin' }).eq('id', applicationId);
      await sb.from('users').update({ is_affiliate: true, affiliate_code: code }).eq('id', applicantId);
      await sb.from('notifications').insert([{ user_id: applicantId, title: "You're In! 🚀", message: 'Welcome to the team. Access your dashboard now.', type: 'system', read: false }]);
    } else if (decision === 'reject') {
      await sb.from('affiliate_applications').update({ status: 'rejected', admin_note: reason || 'Rejected by admin' }).eq('id', applicationId);
      await sb.from('notifications').insert([{ user_id: applicantId, title: 'Application Update', message: `Your application was not approved. Reason: ${reason || 'Not specified'}`, type: 'system', read: false }]);
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Invalid decision' }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error('reviewAffiliateApplication error:', err);
    return new Response(JSON.stringify({ success: false, message: err?.message || String(err) }), { status: 500 });
  }
}

// Deno serve binding if applicable
(async () => {
  try {
    if (typeof Deno !== 'undefined') {
      const { serve } = await import('https://deno.land/std@0.170.0/http/server.ts');
      serve((req: Request) => reviewAffiliateApplicationHandler(req));
    }
  } catch (err) {
    console.warn('Deno serve not initialized for reviewAffiliateApplication:', err?.message || err);
  }
})();
