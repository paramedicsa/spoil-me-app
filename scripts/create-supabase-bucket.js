#!/usr/bin/env node
// Node helper to create a Supabase storage bucket using the service_role key (safe for CI only with secret set)
// Usage: SUPABASE_URL='https://...supabase.co' SUPABASE_SERVICE_ROLE_KEY='xxx' node scripts/create-supabase-bucket.js artist-applications --public

const fetch = globalThis.fetch || require('node-fetch');
const [,, bucketName = 'artist-applications', ...rest] = process.argv;
const isPublic = rest.includes('--public');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. Aborting.');
  process.exit(1);
}

(async () => {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/buckets`;
  const body = { name: bucketName, public: !!isPublic };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY
      },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Failed to create bucket:', data);
      process.exit(1);
    }
    console.log('Bucket created:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error creating bucket:', err);
    process.exit(1);
  }
})();
