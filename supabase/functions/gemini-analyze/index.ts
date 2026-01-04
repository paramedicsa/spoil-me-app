import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';

// Supabase Edge Function to analyze an image with Gemini and return structured product metadata
const GEMINI_KEY = (typeof Deno !== 'undefined') ? Deno.env.get('GEMINI_API_KEY') || '' : '';

const forwardToGoogle = async (model: string, body: any) => {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not configured');
  const url = `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generate?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Google API Error: ${res.status} ${JSON.stringify(json)}`);
  return json;
};

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const json = await req.json().catch(() => ({} as any));
    const { image, category } = json || {};
    if (!image) return new Response(JSON.stringify({ error: 'image required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const base64Data = (image || '').replace(/^data:image\/\w+;base64,/, '');

    const body = {
      contents: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: `You are a fashion merchandising expert for a specialized jewelry store. Analyze this image of a ${category || 'jewelry product'}.

Generate the following JSON object:
{
  "name": "A short, catchy, premium product name",
  "description": "A short, powerful, attractive description (max 3 sentences) that sells the product emotionally.",
  "whenAndHowToWear": "Short, powerful advice on when and how to wear this item (max 2 sentences).",
  "tags": ["Array", "of", "5", "jewelry-specific", "tags"],
  "seoKeywords": ["Array", "of", "5", "strong", "SEO", "keywords"],
  "colors": ["List", "of", "dominant", "product", "colors"]
}

CRITICAL:
1. Tags must be jewelry-specific and avoid generic/person descriptors or marketing words.
2. Colors must describe product-only colors (ignore background/skin).

Return ONLY the raw JSON object and nothing else.` }
      ],
      config: { responseMimeType: 'application/json' }
    };

    const resp = await forwardToGoogle('gemini-3-pro-preview', body);

    // Helper to extract text that may contain JSON
    const extractText = (r: any): string | null => {
      if (!r) return null;
      if (typeof r === 'string') return r;
      if (typeof r.text === 'string') return r.text;
      try {
        if (r.candidates && r.candidates[0] && r.candidates[0].content) {
          const c = r.candidates[0].content.find((it: any) => typeof it.text === 'string');
          if (c && c.text) return c.text;
        }
      } catch (_) {}
      try {
        if (r.outputs && r.outputs[0] && r.outputs[0].content) {
          const c = r.outputs[0].content.find((it: any) => typeof it.text === 'string');
          if (c && c.text) return c.text;
        }
      } catch (_) {}
      return null;
    };

    const text = extractText(resp);
    if (text) {
      // try parse directly
      try {
        const parsed = JSON.parse(text);
        return new Response(JSON.stringify(parsed || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        // extract JSON substring
        const m = text.match(/(\{[\s\S]*\})/);
        if (m && m[1]) {
          try {
            const parsed = JSON.parse(m[1]);
            return new Response(JSON.stringify(parsed || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
          } catch (pe) {
            console.warn('gemini-analyze: failed to parse JSON substring:', (pe && (pe as any).message) || pe);
          }
        }
      }
    }

    // If we got here, return raw response for debugging
    return new Response(JSON.stringify({ raw: resp || {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('gemini-analyze error:', err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
});
