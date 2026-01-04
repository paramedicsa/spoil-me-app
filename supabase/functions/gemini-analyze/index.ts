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
    const action = (json && (json.action as string)) || (path.endsWith('/analyze-image') ? 'analyze-image' : undefined);

    // Route by action (support analyze-image, generate-description, generate-reviews, generate-social)
    if (action === 'analyze-image') {
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
        ]
      };

      const resp = await forwardToGoogle('gemini-3-pro-preview', { ...body, config: { responseMimeType: 'application/json' } });

      const text = extractText(resp);
      if (text) {
        try {
          const parsed = JSON.parse(text);
          return new Response(JSON.stringify(parsed || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
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

      return new Response(JSON.stringify({ raw: resp || {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'generate-description') {
      const { productName, category, keywords, specialTitle, discount } = json || {};
      try {
        let prompt = '';
        if (productName) {
          prompt = `Write a compelling, SEO-friendly product description for an e-commerce product.\n\nProduct Name: ${productName}\nCategory: ${category}\nKeywords/Features: ${keywords}\n\nTone: Professional, persuasive, and enthusiastic. Keep it under 150 words.`;
        } else if (specialTitle) {
          prompt = `Write a catchy, short headline and a subheader for a website banner promoting a sale.\n\nSale Title: ${specialTitle}\nDiscount: ${discount}% Off\n\nFormat:\nHeadline: [Text]\nSubheader: [Text]`;
        } else {
          return new Response(JSON.stringify({ error: 'productName or specialTitle required' }), { status: 400 });
        }

        const g = await forwardToGoogle('gemini-2.5-flash', { prompt: { text: prompt } });
        return new Response(JSON.stringify(g || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        console.warn('gemini-analyze generate-description failed:', err.message || err);
        return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 502 });
      }
    }

    if (action === 'generate-reviews') {
      const { productName, count = 5, type = 'south_african' } = json || {};
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
        console.warn('gemini-analyze generate-reviews failed:', err.message || err);
        return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 502 });
      }
    }

    if (action === 'generate-social') {
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
        console.warn('gemini-analyze generate-social failed:', err.message || err);
        return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 502 });
      }
    }

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
