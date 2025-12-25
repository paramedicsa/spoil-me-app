import { createClient } from '@supabase/supabase-js';

// Supabase Edge Functions run on Deno; declaring keeps TS (Node) tooling happy in this repo.
declare const Deno: any;

const SUPABASE_URL = (typeof Deno !== 'undefined'
  ? (Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL'))
  : process.env.NEXT_PUBLIC_SUPABASE_URL) || '';
const SUPABASE_SERVICE_ROLE_KEY = (typeof Deno !== 'undefined'
  ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  : process.env.SUPABASE_SERVICE_ROLE_KEY) || '';

// NOTE: Uses the FCM legacy HTTP API for broad compatibility.
// Set this in Supabase Edge Function secrets.
const FCM_SERVER_KEY = (typeof Deno !== 'undefined' ? Deno.env.get('FCM_SERVER_KEY') : process.env.FCM_SERVER_KEY) || '';

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
};

const rawServiceAccount = (typeof Deno !== 'undefined'
  ? (Deno.env.get('FCM_SERVICE_ACCOUNT_JSON') || Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON') || Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS_JSON') || Deno.env.get('FCM_SERVICE_ACCOUNT_BASE64'))
  : (process.env.FCM_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.FCM_SERVICE_ACCOUNT_BASE64)) || '';

const FCM_PROJECT_ID = (typeof Deno !== 'undefined' ? Deno.env.get('FCM_PROJECT_ID') : process.env.FCM_PROJECT_ID) || '';

const parseServiceAccount = (): ServiceAccount | null => {
  if (!rawServiceAccount) return null;
  try {
    // Support base64 encoded JSON
    const maybeJson = rawServiceAccount.trim().startsWith('{')
      ? rawServiceAccount
      : new TextDecoder().decode(Uint8Array.from(atob(rawServiceAccount.trim()), (c) => c.charCodeAt(0)));
    const sa = JSON.parse(maybeJson);
    if (!sa?.client_email || !sa?.private_key) return null;
    return sa as ServiceAccount;
  } catch (_) {
    return null;
  }
};

const base64Url = (input: ArrayBuffer | Uint8Array | string) => {
  let bytes: Uint8Array;
  if (typeof input === 'string') bytes = new TextEncoder().encode(input);
  else bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const pemToPkcs8 = (pem: string): Uint8Array => {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const raw = atob(body);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

let cachedOAuth: { accessToken: string; expMs: number } | null = null;

const getFcmAccessToken = async (sa: ServiceAccount): Promise<string> => {
  const now = Date.now();
  if (cachedOAuth && cachedOAuth.expMs - 60_000 > now) return cachedOAuth.accessToken;

  const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
  const iat = Math.floor(now / 1000);
  const exp = iat + 60 * 60;
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: tokenUri,
    iat,
    exp,
  };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;

  const keyData = pemToPkcs8(sa.private_key);
  const keyBuf = keyData.buffer.slice(keyData.byteOffset, keyData.byteOffset + keyData.byteLength) as ArrayBuffer;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyBuf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));
  const assertion = `${signingInput}.${base64Url(new Uint8Array(signature))}`;

  const form = new URLSearchParams();
  form.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  form.set('assertion', assertion);

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OAuth token exchange failed (${res.status}): ${t}`);
  }

  const j = await res.json();
  const accessToken = j?.access_token;
  const expiresIn = Number(j?.expires_in || 3600);
  if (!accessToken) throw new Error('OAuth token exchange returned no access_token');
  cachedOAuth = { accessToken, expMs: now + expiresIn * 1000 };
  return accessToken;
};

const runPool = async <T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const workers = new Array(Math.max(1, concurrency)).fill(0).map(async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) break;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('send-push: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : (null as any);

type TargetGroup =
  | 'all'
  | 'affiliates'
  | 'artists'
  | 'non_members'
  | 'south_africa'
  | 'international'
  | 'individual';

const decodeJwtPayload = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (_) {
    return null;
  }
};

const json = (body: any, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' }
});

export async function sendPushHandler(req: Request, deps: { supabase?: any; fcmKey?: string } = {}) {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return json({ success: false, message: 'Missing Authorization' }, 403);

    const payload = await req.json();
    const { title, body, targetGroup, targetId, image, imageUrl, url, link } = payload || {};

    if (!title || !body || !targetGroup) return json({ success: false, message: 'Missing required fields (title, body, targetGroup)' }, 400);

    const decoded = decodeJwtPayload(bearer);
    const callerId = decoded?.sub || decoded?.user_id;
    const callerEmail = decoded?.email;

    if (!callerId && !callerEmail) return json({ success: false, message: 'Invalid token' }, 403);

    const sb = deps.supabase || supabase;
    if (!sb) return json({ success: false, message: 'Server misconfigured: Supabase client not available' }, 500);

    // Caller authorization:
    // - individual: allow if callerId === targetId
    // - otherwise: admin only
    let isAdmin = false;
    try {
      const { data: u, error: uErr } = await sb
        .from('users')
        .select('id,email,is_admin,isAdmin')
        .or(callerId ? `id.eq.${callerId}` : `email.eq.${callerEmail}`)
        .limit(1)
        .maybeSingle();
      if (uErr) throw uErr;
      isAdmin = Boolean((u as any)?.is_admin || (u as any)?.isAdmin || (u as any)?.email === 'spoilmevintagediy@gmail.com');
    } catch (e) {
      // If the users row is missing, do not treat as admin.
      isAdmin = false;
    }

    const group = String(targetGroup) as TargetGroup;
    if (group === 'individual') {
      if (!targetId) return json({ success: false, message: 'targetId required for individual' }, 400);
      if (!isAdmin && callerId !== targetId) return json({ success: false, message: 'Forbidden' }, 403);
    } else {
      if (!isAdmin) return json({ success: false, message: 'Restricted to admins' }, 403);
    }

    // Gather tokens
    let query: any = sb.from('users').select('id,fcm_token,currency,location,country,is_affiliate,isAffiliate,is_artist,isArtist,is_member,isMember,affiliate_stats,affiliateStats,artist_application,artistApplication');
    query = query.not('fcm_token', 'is', null);

    if (group === 'all') {
      // no-op filter
    } else if (group === 'individual') {
      query = query.eq('id', targetId);
    } else if (group === 'affiliates') {
      query = query.or('is_affiliate.eq.true,isAffiliate.eq.true,affiliate_stats->>status.eq.approved,affiliateStats->>status.eq.approved');
    } else if (group === 'artists') {
      query = query.or('is_artist.eq.true,isArtist.eq.true,artist_application->>status.eq.approved,artistApplication->>status.eq.approved');
    } else if (group === 'non_members') {
      query = query.or('is_member.eq.false,isMember.eq.false');
    } else if (group === 'south_africa') {
      query = query.or('currency.eq.ZAR,location.ilike.%south africa%,country.ilike.%south africa%,location.eq.south_africa,country.eq.south_africa');
    } else if (group === 'international') {
      query = query.or('currency.eq.USD,location.ilike.%international%,country.ilike.%international%,location.eq.international,country.eq.international');
    }

    const { data, error } = await query.limit(5000);
    if (error) throw error;

    const tokenToUserId = new Map<string, string>();
    const tokens: string[] = (data || []).map((r: any) => {
      const t = r?.fcm_token;
      if (t && r?.id && !tokenToUserId.has(t)) tokenToUserId.set(t, r.id);
      return t;
    }).filter(Boolean);
    const uniqueTokens: string[] = [...new Set(tokens)].slice(0, 1000);

    if (uniqueTokens.length === 0) return json({ success: false, message: 'No active devices found' }, 200);

    const deepLink = (typeof url === 'string' && url) || (typeof link === 'string' && link) || '/';
    const imageFinal = (typeof image === 'string' && image) || (typeof imageUrl === 'string' && imageUrl) || undefined;

    // Prefer FCM HTTP v1 if a service account is configured.
    const sa = parseServiceAccount();
    const projectId = FCM_PROJECT_ID || sa?.project_id;
    if (sa && projectId) {
      const accessToken = await getFcmAccessToken(sa);
      const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

      const unregisteredUserIds: string[] = [];

      const results = await runPool(uniqueTokens, 25, async (tkn) => {
        const message: any = {
          message: {
            token: tkn,
            notification: {
              title,
              body,
              ...(imageFinal ? { image: imageFinal } : {})
            },
            data: {
              url: deepLink,
              targetGroup: group,
            },
            webpush: {
              fcm_options: { link: deepLink }
            }
          }
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(message),
        });

        if (res.ok) return { ok: true };

        let errText = '';
        let errJson: any = null;
        try {
          errJson = await res.json();
        } catch (_) {
          errText = await res.text().catch(() => '');
        }

        const details = errJson?.error?.details;
        const unregistered =
          Array.isArray(details) && details.some((d: any) => d?.errorCode === 'UNREGISTERED');
        if (unregistered) {
          const uid = tokenToUserId.get(tkn);
          if (uid) unregisteredUserIds.push(uid);
        }

        const msg = errJson?.error?.message || errText || `FCM v1 send failed (${res.status})`;
        return { ok: false, message: msg };
      });

      const sentCount = results.filter((r: any) => r?.ok).length;
      const failureCount = results.length - sentCount;

      // Best-effort cleanup for unregistered tokens
      if (unregisteredUserIds.length > 0) {
        try {
          const unique = [...new Set(unregisteredUserIds)];
          await sb.from('users').update({ fcm_token: null }).in('id', unique);
        } catch (e) {
          console.warn('send-push: failed to clear unregistered tokens:', e);
        }
      }

      return json({ success: true, sentCount, failureCount, mode: 'fcm_v1' });
    }

    // Fallback: legacy server key multicast
    const fcmKey = deps.fcmKey ?? FCM_SERVER_KEY;
    if (!fcmKey) {
      console.warn('send-push: No FCM v1 credentials and FCM_SERVER_KEY not set; dry-run');
      return json({ success: true, sentCount: uniqueTokens.length, failureCount: 0, dryRun: true });
    }

    const batchSize = 500;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < uniqueTokens.length; i += batchSize) {
      const slice = uniqueTokens.slice(i, i + batchSize);
      const payloadBody = {
        registration_ids: slice,
        notification: {
          title,
          body,
          image: imageFinal,
        },
        data: {
          url: deepLink,
          targetGroup: group,
        }
      };

      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `key=${fcmKey}` },
        body: JSON.stringify(payloadBody)
      });

      if (!res.ok) {
        console.warn('FCM legacy batch send failed', await res.text());
        failureCount += slice.length;
      } else {
        const rj = await res.json();
        successCount += rj.success || 0;
        failureCount += rj.failure || 0;
      }
    }

    return json({ success: true, sentCount: successCount, failureCount, mode: 'legacy' });
  } catch (err: any) {
    console.error('send-push EdgeFunction error:', err);
    return json({ success: false, message: err?.message || String(err) }, 500);
  }
}

(async () => {
  try {
    if (typeof Deno !== 'undefined') {
      const { serve } = await import('std/server' as any);
      serve((req: Request) => sendPushHandler(req));
    }
  } catch (err: any) {
    console.warn('Deno serve not initialized (non-Deno environment):', err?.message || err);
  }
})();
