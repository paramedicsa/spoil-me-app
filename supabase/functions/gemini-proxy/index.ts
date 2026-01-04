// If running in Deno, ensure your editor supports Deno imports and enable Deno extension.
// If running in Node.js, use a Node.js HTTP server instead:
import { createServer } from 'http';

// Declare Deno global to silence TypeScript language server in editors (runtime is Deno in Supabase).
declare const Deno: any;

// Replace all usage of 'serve' with Node.js equivalent below.

// A lightweight Gemini proxy for server-side AI calls. Keep the GEMINI_API_KEY as a Supabase Secret.

const GEMINI_KEY =
  (typeof globalThis !== 'undefined' && typeof (globalThis as any).Deno !== 'undefined' && typeof (globalThis as any).Deno.env !== 'undefined' && typeof (globalThis as any).Deno.env.get === 'function')
    ? (globalThis as any).Deno.env.get('GEMINI_API_KEY')
    : (typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : '');

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

const handler = async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+/g, '/').replace(/\/$/, '');
    const json = await req.json().catch(() => ({} as any));

    // Routes: /generate-description, /analyze-image, /generate-reviews
    // Support calling via URL path or via explicit `action` in the request body so
    // supabase.functions.invoke can call this function without path suffixes.
    const action = json?.action || (path.endsWith('/generate-description') ? 'generate-description' : path.endsWith('/analyze-image') ? 'analyze-image' : path.endsWith('/generate-reviews') ? 'generate-reviews' : undefined);

    if (action === 'generate-description') {
      const { productName, category, keywords } = json || {};
      if (!productName) return new Response(JSON.stringify({ error: 'productName required' }), { status: 400 });
      try {
        const prompt = `Write a compelling, SEO-friendly product description for an e-commerce product.\n\nProduct Name: ${productName}\nCategory: ${category}\nKeywords/Features: ${keywords}\n\nTone: Professional, persuasive, and enthusiastic. Keep it under 150 words.`;
        const g = await forwardToGoogle('gemini-2.5-flash', { prompt: { text: prompt } });
        return new Response(JSON.stringify(g || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        console.warn('Gemini proxy generate-description failed:', err.message || err);
        return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 502 });
      }
    }

    if (path.endsWith('/analyze-image')) {
      const { base64Image, categoryContext } = json || {};
      if (!base64Image) return new Response(JSON.stringify({ error: 'base64Image required' }), { status: 400 });
      try {
        // We forward the body through. The client expects the GeminI-like response or a JSON content result.
        const body = { contents: [ { inlineData: { mimeType: 'image/jpeg', data: base64Image.replace(/^data:image\/\w+;base64,/, '') } }, { text: `Analyze this image of a ${categoryContext || 'jewelry product'} and return a JSON metadata object.

        The JSON object must have keys: name, description, whenAndHowToWear, tags (array), seoKeywords (array), colors (array).

        Return ONLY the JSON object and nothing else.` } ], config: { responseMimeType: 'application/json' } };
        const g = await forwardToGoogle('gemini-3-pro-preview', body);

        // The Google Generative API may return the JSON as a text blob inside nested fields. Try to extract the JSON text robustly.
        const extractText = (resp: any): string | null => {
          if (!resp) return null;
          if (typeof resp === 'string') return resp;
          if (typeof resp.text === 'string') return resp.text;
          // candidates.content[0].text is a common shape
          try {
            if (resp.candidates && resp.candidates[0] && resp.candidates[0].content) {
              const c = resp.candidates[0].content.find((it: any) => typeof it.text === 'string');
              if (c && c.text) return c.text;
            }
          } catch (_) {}
          try {
            if (resp.outputs && resp.outputs[0] && resp.outputs[0].content) {
              const c = resp.outputs[0].content.find((it: any) => typeof it.text === 'string');
              if (c && c.text) return c.text;
            }
          } catch (_) {}
          return null;
        };

        const text = extractText(g);
        if (text) {
          // Try direct parse first; otherwise try to find the JSON substring
          try {
            const parsed = JSON.parse(text);
            return new Response(JSON.stringify(parsed || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
          } catch (e) {
            // Attempt to extract a JSON object from the text
            const m = text.match(/(\{[\s\S]*\})/);
            if (m && m[1]) {
              try {
                const parsed = JSON.parse(m[1]);
                return new Response(JSON.stringify(parsed || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
              } catch (pe) {
                console.warn('gemini-proxy: failed to parse JSON substring from image analysis text:', (pe && typeof pe === 'object' && 'message' in pe) ? (pe as any).message : pe);
              }
            }
          }
        }

        // Fallback: return raw response if we couldn't parse a JSON object
        return new Response(JSON.stringify(g || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        console.warn('Gemini proxy analyze-image failed:', err.message || err);
        return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 502 });
      }
    }

    if (path.endsWith('/generate-reviews')) {
      const { productName, count = 5, type = 'south_african' } = json || {};
      if (!productName && type !== 'unique_pendant') return new Response(JSON.stringify({ error: 'productName required' }), { status: 400 });
      try {
        let contents = '';
        if (type === 'south_african') {
          contents = `Generate ${count} unique South African product reviews for a jewelry item named "${productName}". Output strictly as JSON array of objects with keys: userName, location, content, rating, date.`;
        } else if (type === 'unique_pendant') {
          contents = `Generate ${count} unique South African reviews specifically for one-of-a-kind handmade wire-wrapped pendants. Output strictly as JSON array.`;
        }
        const g = await forwardToGoogle('gemini-2.5-flash', { prompt: { text: contents }, config: { responseMimeType: 'application/json' } });
        return new Response(JSON.stringify(g || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        console.warn('Gemini proxy generate-reviews failed:', err.message || err);
        return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 502 });
      }
    }

    if (path.endsWith('/generate-social')) {
      const { productName, platform, price } = json || {};
      try {
        let prompt = `Write a single social media post for a jewelry product named "${productName}". Price: R${price}.`;
        if (platform === 'Instagram' || platform === 'TikTok') {
          prompt += ` Style: High energy, visually descriptive, lots of emojis, include 10 relevant hashtags. Focus on \"Unique\", \"Handmade\", \"South Africa\". Keep it under 200 characters + hashtags.`;
        } else if (platform === 'Facebook') {
          prompt += ` Style: Friendly, community-focused, engaging question at the end. Mention \"Spoil Me Vintage\". Include link placeholder [Link].`;
        } else if (platform === 'Twitter' || platform === 'X') {
          prompt += ` Style: Short, punchy, urgent. Max 280 characters. Include 3 hashtags.`;
        } else {
          prompt += ` Style: Professional yet inviting.`;
        }

        const g = await forwardToGoogle('gemini-2.5-flash', { prompt: { text: prompt } });
        return new Response(JSON.stringify(g || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        console.warn('Gemini proxy generate-social failed:', err.message || err);
        return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 502 });
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown path' }), { status: 404 });
  } catch (err: any) {
    console.error('gemini-proxy top-level error:', err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500 });
  }
};

// Start the server: prefer Deno runtime (Supabase functions), fallback to Node.js HTTP server for local testing.
(async () => {
  // Use typeof to check for Deno existence to avoid TS errors in Node
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).Deno !== 'undefined') {
    try {
      // Dynamic import to avoid build-time TypeScript errors in the project editor
        // @ts-ignore: dynamic Deno std import
        const mod = await import('https://deno.land/std@0.170.0/http/server.ts');
      const serve = (mod as any).serve;
      serve(handler);
      return;
    } catch (err) {
      console.warn('Failed to use Deno serve, falling back to Node server:', err);
    }
  }

  // Node.js fallback for local testing
  const server = createServer(async (req, res) => {
    try {
      const chunks: Uint8Array[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', async () => {
        const raw = Buffer.concat(chunks as any).toString() || '{}';
        let parsed = {};
        try { parsed = raw ? JSON.parse(raw) : {}; } catch (_) { parsed = {}; }
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        const fakeReq = new Request(url.toString(), { method: req.method, headers: req.headers as any, body: JSON.stringify(parsed) });
        const resp = await handler(fakeReq);
        const text = await resp.text();
        res.writeHead(resp.status, Object.fromEntries(resp.headers.entries()));
        res.end(text);
      });
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
  const port = Number(process.env.PORT) || 8787;
  server.listen(port, () => console.log(`Gemini proxy (Node fallback) listening on ${port}`));
})();
