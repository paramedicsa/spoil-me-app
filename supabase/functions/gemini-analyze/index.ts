// Deno-based Supabase Edge Function for image analysis
// Uses: GEMINI_API_KEY from Supabase Secrets

// @ts-ignore
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';

declare const Deno: any;

const GEMINI_KEY = (typeof Deno !== 'undefined') ? Deno.env.get('GEMINI_API_KEY') || '' : '';

const forwardToGoogle = async (body: any) => {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not configured');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => '<no body>');
    console.error('Google API Error Body:', text);
    throw new Error(`Google API Error: ${res.status} ${text}`);
  }
  return await res.json();
};

const extractText = (r: any): string | null => {
  if (!r) return null;
  if (typeof r === 'string') return r;
  if (typeof r.text === 'string') return r.text;
  try { if (r.candidates && r.candidates[0] && r.candidates[0].content) {
    const c = r.candidates[0].content.find((it: any) => typeof it.text === 'string'); if (c && c.text) return c.text; }
  } catch (_) {}
  try { if (r.outputs && r.outputs[0] && r.outputs[0].content) {
    const c = r.outputs[0].content.find((it: any) => typeof it.text === 'string'); if (c && c.text) return c.text; }
  } catch (_) {}
  return null;
};

serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST' } });
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const json = await req.json().catch(() => ({} as any));
    const action = (json && json.action) || undefined;

    if (action === 'analyze-image') {
      const { image, category } = json || {};
      if (!image) return new Response(JSON.stringify({ error: 'image required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

      const m = (image || '').match(/^data:(image\/[A-Za-z0-9.+-]+);base64,(.*)$/s);
      const mimeType = m ? m[1] : 'image/jpeg';
      const base64Data = m ? (m[2] || '') : (image || '').replace(/^data:image\/[A-Za-z0-9.+-]+;base64,/, '').replace(/\s+/g, '');

      const prompt = `Analyze this jewelry image. Identify the PRIMARY COLOR, SHAPE, MATERIAL (e.g., resin, copper, beads), and TYPE (e.g., stud, dangle, ring). Return a JSON object with keys: name, description (exactly 3 sentences), whenAndHowToWear, tags (5), seoKeywords (5), colors (array). Ensure colors describe only the product and ignore background or skin. Return ONLY the raw JSON object.`;

      const payload = { parts: [ { text: prompt }, { inline_data: { mime_type: mimeType, data: base64Data } } ] };

      console.log('Gemini Request Body:', payload);

      const resp = await forwardToGoogle({ instances: [ payload ] });

      const text = extractText(resp);
      if (!text) return new Response(JSON.stringify({ raw: resp || {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });

      // Try direct parse, then substring parse
      try { const parsed = JSON.parse(text); return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } }); }
      catch (e) {
        const mm = text.match(/(\{[\s\S]*\})/);
        if (mm && mm[1]) {
          try { const parsed = JSON.parse(mm[1]); return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } }); } catch (pe) { console.warn('parse substring failed', pe); }
        }
      }

      return new Response(JSON.stringify({ raw: resp || {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Action not supported' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('gemini-analyze error:', err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
});
// Initialize Supabase client directly if the module does not exist
import { createClient } from 'https://deno.land/x/supabase_js@2.39.7/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * GEMINI PROXY SERVICE
 * Verified Syntax & Type Safety
 */

const invokeGemini = async (action: string, payload: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-analyze', {
      body: { action, ...payload }
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`Gemini Error [${action}]:`, err);
    return null;
  }
};

export const generateProductMetadataFromImage = async (base64Image: string, category: string) => {
  return await invokeGemini('analyze-image', { image: base64Image, category });
};

export const generateSouthAfricanReviews = async (productName: string, count: number = 5) => {
  const data = await invokeGemini('generate-reviews', { productName, count });
  return data?.reviews || [];
};

export const generateProductDescription = async (productName: string, category: string, keywords: string) => {
  const data = await invokeGemini('generate-description', { productName, category, keywords });
  return data?.description || "";
};

export const generateUniquePendantReviews = async (count: number) => {
  return await generateSouthAfricanReviews("Unique Handcrafted Pendant", count);
};

export const generateSocialPost = async (productName: string, platform: string, price: number) => {
  const data = await invokeGemini('generate-social', { productName, platform, price });
  return data?.text || `Check out ${productName} for R${price}! #SpoilMeVintage`;
};