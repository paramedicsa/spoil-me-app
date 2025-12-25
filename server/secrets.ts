/**
 * server/secrets.ts
 *
 * Central place to read server-only environment variables.
 * - This file MUST NOT be imported from client-side code. It will throw at runtime
 *   if accidentally imported in a browser environment to make mistakes visible.
 * - It supports both Node (process.env) and Deno (Deno.env.get) so it works in
 *   Edge Functions and server runtimes.
 * - Do NOT add secret values to this file. Set them in your deployment platform
 *   (Vercel, Supabase Secrets, etc.).
 */

// Guard: fail fast if imported into browser bundles
if (typeof window !== 'undefined') {
  throw new Error('server/secrets.ts must not be imported from client-side code');
}

const getEnv = (key: string): string | undefined => {
  try {
    if (typeof Deno !== 'undefined' && typeof Deno.env?.get === 'function') {
      return Deno.env.get(key) as string | undefined;
    }
  } catch (_) {
    // ignore Deno permission errors
  }

  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

export const requireEnv = (key: string): string => {
  const v = getEnv(key);
  if (!v) throw new Error(`Missing required server env: ${key}`);
  return v;
};

export const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY') || '';
export const PAYPAL_WEBHOOK_SECRET = getEnv('PAYPAL_WEBHOOK_SECRET') || '';
export const FCM_SERVICE_ACCOUNT_JSON = getEnv('FCM_SERVICE_ACCOUNT_JSON') || getEnv('GOOGLE_SERVICE_ACCOUNT_JSON') || '';
export const FCM_PROJECT_ID = getEnv('FCM_PROJECT_ID') || '';

/**
 * Helper: parse service account JSON if available
 */
export const parseServiceAccount = (): Record<string, any> | null => {
  if (!FCM_SERVICE_ACCOUNT_JSON) return null;
  try {
    const raw = FCM_SERVICE_ACCOUNT_JSON.trim();
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (err) {
    console.warn('parseServiceAccount failed:', err);
    return null;
  }
};

export default {
  requireEnv,
  SUPABASE_SERVICE_ROLE_KEY,
  PAYPAL_WEBHOOK_SECRET,
  FCM_SERVICE_ACCOUNT_JSON,
  FCM_PROJECT_ID,
  parseServiceAccount,
};
