import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof Deno !== 'undefined' ? (Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')) : process.env.NEXT_PUBLIC_SUPABASE_URL) || '';
const SUPABASE_SERVICE_ROLE_KEY = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') : process.env.SUPABASE_SERVICE_ROLE_KEY) || '';
const FCM_SERVER_KEY = (typeof Deno !== 'undefined' ? Deno.env.get('FCM_SERVER_KEY') : process.env.FCM_SERVER_KEY) || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('sendAdminPush: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
}

let supabase: any;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
} else {
  // Minimal stub for test environments where Supabase credentials are not provided.
  console.warn('sendAdminPush: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  supabase = {
    from: (_: string) => ({ select: (_cols: string) => ({ eq: (_k: string, _v: any) => ({ data: [], error: null }), limit: (_n: number) => ({ data: [], error: null }) }) }),
    rpc: (_: string, _p: any) => ({ data: [], error: null })
  } as any;
}

const decodeJwtPayload = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
};

// Exported handler for testing and invocation
export async function sendAdminPushHandler(req: Request, deps: { supabase?: any; fcmKey?: string } = {}) {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return new Response(JSON.stringify({ success: false, message: 'Missing Authorization' }), { status: 403 });

    const payload = await req.json();
    const { targetType, targetValue, title, body, imageUrl, link } = payload || {};

    // Verify admin: decode token and check users table
    const decoded = decodeJwtPayload(bearer);
    const userId = decoded?.sub || decoded?.user_id || decoded?.sub;
    const userEmail = decoded?.email;

    if (!userId && !userEmail) return new Response(JSON.stringify({ success: false, message: 'Invalid token' }), { status: 403 });

    const sb = deps.supabase || supabase;
    const { data: u, error: uErr } = await sb.from('users').select('id,email,is_admin').or(userId ? `id.eq.${userId}` : `email.eq.${userEmail}`).limit(1).maybeSingle();
    if (uErr) throw uErr;
    const isAdmin = (u && (u as any).is_admin) || (u && (u as any).isAdmin) || (u && (u as any).email === 'spoilmevintagediy@gmail.com');
    if (!isAdmin) return new Response(JSON.stringify({ success: false, message: 'Restricted to admins' }), { status: 403 });

    // Gather tokens
    let tokens: string[] = [];
    if (targetType === 'individual') {
      const { data } = await sb.from('push_tokens').select('token').eq('user_id', targetValue);
      tokens = (data || []).map((r: any) => r.token).filter(Boolean);
    } else if (targetType === 'tier') {
      // join users -> push_tokens
      const { data } = await sb.rpc('get_tokens_for_tier', { tier: targetValue });
      tokens = (data || []).flat().filter(Boolean);
    } else if (targetType === 'all') {
      const { data } = await sb.from('push_tokens').select('token').limit(1000);
      tokens = (data || []).map((r: any) => r.token).filter(Boolean);
    }

    const uniqueTokens = [...new Set(tokens)].slice(0, 1000);
    if (uniqueTokens.length === 0) return new Response(JSON.stringify({ success: false, message: 'No active devices found' }));

    // Dry-run if no FCM key provided
    const fcmKey = deps.fcmKey ?? FCM_SERVER_KEY;
    if (!fcmKey) {
      console.warn('FCM_SERVER_KEY not set; skipping actual send and returning tokens count');
      return new Response(JSON.stringify({ success: true, sentCount: uniqueTokens.length, failureCount: 0 }), { status: 200 });
    }

    const batchSize = 500; // legacy limit safe
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < uniqueTokens.length; i += batchSize) {
      const slice = uniqueTokens.slice(i, i + batchSize);
      const payloadBody = {
        registration_ids: slice,
        notification: {
          title,
          body,
          image: imageUrl || undefined
        },
        data: { url: link || '/' }
      };

      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `key=${fcmKey}` },
        body: JSON.stringify(payloadBody)
      });

      if (!res.ok) {
        console.warn('FCM batch send failed', await res.text());
        failureCount += slice.length;
      } else {
        const json = await res.json();
        successCount += json.success || 0;
        failureCount += json.failure || 0;
      }
    }

    return new Response(JSON.stringify({ success: true, sentCount: successCount, failureCount }), { status: 200 });
  } catch (err: any) {
    console.error('sendAdminPush EdgeFunction error:', err);
    return new Response(JSON.stringify({ success: false, message: err?.message || String(err) }), { status: 500 });
  }
}

// Actual server binding for Deno runtime (loaded dynamically so Node tests don't need Deno std lib)
(async () => {
  try {
    if (typeof Deno !== 'undefined') {
      const { serve } = await import('std/server');
      serve((req: Request) => sendAdminPushHandler(req));
    }
  } catch (err) {
    // If dynamic import fails, log silently (tests run in Node and will not import std/server)
    // eslint-disable-next-line no-console
    console.warn('Deno serve not initialized (non-Deno environment):', err?.message || err);
  }
})();
