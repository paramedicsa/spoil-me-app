// Load local environment variables early so dev server sees .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });

import express from 'express';
import corsPkg from 'cors';
const corsMiddleware = (corsPkg as any)?.default ?? corsPkg;
import paypalWebhookHandler from './paypalWebhookHandler';
import { createClient } from '@supabase/supabase-js';
import { sendAdminPushHandler } from '../supabase/functions/sendAdminPush/index';
import { sendPushHandler } from '../supabase/functions/send-push/index';
import { reviewAffiliateApplicationHandler } from '../supabase/functions/reviewAffiliateApplication/index';

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: report whether key env vars are present (do not print secrets)
console.info('Env: NEXT_PUBLIC_SUPABASE_URL set?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.info('Env: NEXT_PUBLIC_SUPABASE_ANON_KEY set?', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.info('Env: SUPABASE_SERVICE_ROLE_KEY set?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Lightweight dev supabase mock used when SERVICE_ROLE_KEY is missing so handlers can run in dry-run
function makeDevSupabase() {
  const row = (data: any) => ({ data, error: null });
  const chain = (data: any = []) => {
    const api: any = {};
    api.eq = (_k: string, _v: any) => api;
    api.not = (_k: string, _op: string, _v: any) => api;
    api.or = (_q: string) => api;
    api.in = (_k: string, _v: any) => api;
    api.limit = (_n: number) => api;
    api.maybeSingle = async () => row(null);
    api.then = (fn: any) => fn({ data, error: null });
    return api;
  };
  return {
    from: (_table: string) => ({
      select: (_cols: string) => chain([]),
      delete: () => ({ eq: (_k: string, _v: any) => ({ error: null }) }),
      update: (_d: any) => ({ eq: (_k: string, _v: any) => ({ data: _d, error: null }), in: (_k: string, _v: any) => ({ data: _d, error: null }) })
    }),
    auth: { admin: { deleteUser: async (_id: string) => ({ error: null }) } },
    // convenience: select users
    selectUsers: async () => ({ data: null, error: null }),
  } as any;
}

// Middleware
app.use(typeof corsMiddleware === 'function' ? corsMiddleware() : (req, res, next) => next());
app.use(express.json({ verify: (req, res, buf) => (req as any).rawBody = buf })); // Keep raw body for signature verification

// Routes
app.use('/api/webhooks', paypalWebhookHandler);

// Proxy endpoints to support callServerFunction in dev
app.post('/api/functions/:name', express.json(), async (req, res) => {
  const name = req.params.name;
  try {
    // Attach Authorization header if present
    const authHeader = req.headers['authorization'] || '';
    const url = `http://localhost/api/functions/${name}`; // dummy
    if (name === 'sendAdminPush') {
      const fakeReq = new Request('http://localhost', { method: 'POST', headers: { Authorization: String(authHeader), 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
      const response = await sendAdminPushHandler(fakeReq as any, { supabase: makeDevSupabase(), fcmKey: process.env.FCM_SERVER_KEY });
      const json = await response.json();
      res.status(response.status).json(json);
      return;
    }
    if (name === 'send-push') {
      const fakeReq = new Request('http://localhost', { method: 'POST', headers: { Authorization: String(authHeader), 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
      const response = await sendPushHandler(fakeReq as any, { supabase: makeDevSupabase(), fcmKey: process.env.FCM_SERVER_KEY });
      const json = await response.json();
      res.status(response.status).json(json);
      return;
    }
    if (name === 'reviewAffiliateApplication') {
      const fakeReq = new Request('http://localhost', { method: 'POST', headers: { Authorization: String(authHeader), 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
      const response = await reviewAffiliateApplicationHandler(fakeReq as any, { supabase: makeDevSupabase() });
      const json = await response.json();
      res.status(response.status).json(json);
      return;
    }
    if (name === 'grantTrial') {
      const fakeReq = new Request('http://localhost', { method: 'POST', headers: { Authorization: String(authHeader), 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
      const response = await grantTrialHandler(fakeReq as any, { supabase: makeDevSupabase() });
      const json = await response.json();
      res.status(response.status).json(json);
      return;
    }
    if (name === 'deleteUser') {
      const fakeReq = new Request('http://localhost', { method: 'POST', headers: { Authorization: String(authHeader), 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
      const { deleteUserHandler } = await import('../supabase/functions/deleteUser/index');
      const response = await deleteUserHandler(fakeReq as any, { supabase: makeDevSupabase() });
      const json = await response.json();
      res.status(response.status).json(json);
      return;
    }
    // Unknown function: 404
    res.status(404).json({ error: 'Function not found' });
  } catch (err: any) {
    console.error('Function proxy error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Products endpoint (uses service role key on server side)
app.get('/api/products', async (req, res) => {
  try {
    const limit = Math.min(1000, Number(req.query.limit || 100));
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !sKey) return res.status(500).json({ success: false, message: 'Server misconfigured: missing SUPABASE keys' });
    const sb = createClient(url, sKey, { auth: { persistSession: false } });
    const { data, error } = await sb.from('products').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(limit);
    if (error) return res.status(500).json({ success: false, error });
    // normalize keys to camelCase similar to client expectations
    const normalized = (data || []).map((row: any) => {
      const out: any = {};
      Object.entries(row).forEach(([k, v]) => {
        const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        out[camel] = v;
      });
      return out;
    });
    res.json({ success: true, products: normalized });
  } catch (err: any) {
    console.error('Products endpoint error:', err);
    res.status(500).json({ success: false, message: String(err) });
  }
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`PayPal webhook server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`PayPal webhook endpoint: http://localhost:${PORT}/api/webhooks/paypal`);
});

export default app;
