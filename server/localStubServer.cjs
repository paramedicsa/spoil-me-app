require('dotenv').config({ path: '.env.local' });
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3001;
app.get('/health', (req, res) => res.json({ status: 'Local stub server running' }));
app.get('/api/products', async (req, res) => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return res.status(500).json({ success: false, message: 'Missing SUPABASE service key' });
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const limit = Math.min(1000, Number(req.query.limit || 100));
    const { data, error } = await sb.from('products').select('*').eq('status','published').order('created_at',{ascending:false}).limit(limit);
    if (error) return res.status(500).json({ success: false, error });
    const normalized = (data || []).map(row => {
      const out = {};
      Object.entries(row).forEach(([k, v]) => { const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); out[camel] = v; });
      return out;
    });
    res.json({ success: true, products: normalized });
  } catch (e) {
    console.error('localStubServer /api/products error', e);
    res.status(500).json({ success: false, message: String(e) });
  }
});
app.get('/api/webhooks/paypal/health', (req, res) => res.json({ status: 'PayPal webhook listener (stub) is running' }));
app.listen(PORT, () => { console.log('Local stub server running on port', PORT); });
module.exports = app;
