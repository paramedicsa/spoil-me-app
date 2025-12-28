const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function sendPushHandler(req: Request, deps: { supabase?: any; fcmKey?: string } = {}) {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { title, userId } = body;
    const message = body.body || body.message;

    const SUPABASE_URL = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_URL') : process.env.NEXT_PUBLIC_SUPABASE_URL) || '';
    const SERVICE_ROLE_KEY = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') : process.env.SUPABASE_SERVICE_ROLE_KEY) || '';
    const FCM_SERVER_KEY = (deps.fcmKey ?? (typeof Deno !== 'undefined' ? Deno.env.get('FCM_SERVER_KEY') : process.env.FCM_SERVER_KEY)) || '';

    // 1. Fetch Admin Tokens
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=push_token&is_admin=eq.true`, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      }
    });

    const admins = await res.json();
    const tokens = admins?.map((a: any) => a.push_token).filter(Boolean) || [];

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ ok: true, msg: 'No admin tokens' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 2. Send via FCM
    const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        registration_ids: tokens,
        notification: { title, body: message, sound: 'default' },
        data: { userId }
      }),
    });

    return new Response(await fcmRes.text(), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// Bind to Deno runtime if available (keeps compatibility with direct Deno deploy)
(async () => {
  try {
    if (typeof Deno !== 'undefined') {
      const { serve } = await import('https://deno.land/std@0.170.0/http/server.ts');
      serve((req: Request) => sendPushHandler(req));
    }
  } catch (err) {
    console.warn('Deno serve not initialized (non-Deno environment):', err?.message || err);
  }
})();
