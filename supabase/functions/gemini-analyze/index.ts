// 1. Deno-native imports for Supabase Edge Functions
// Declare Deno for the TypeScript language server in the editor
declare const Deno: any;

Deno.serve(async (req: Request) => {
  // 2. Handle CORS (So your browser doesn't block the call)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST'
      }
    });
  }

  try {
    const { action, image, category } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) throw new Error("GEMINI_API_KEY not found in secrets.");

    // --- ACTION: ANALYZE IMAGE ---
    if (action === 'analyze-image') {
      // Clean the Base64 string (Remove prefix if it exists)
      const base64Data = image.includes(',') ? image.split(',')[1] : image;
      const mimeType = image.match(/data:([^;]+);/)?.[1] || 'image/jpeg';

      const prompt = `You are a high-end jewelry specialist for 'Spoil Me Vintage'. 
      Analyze this image. Identify the PRIMARY COLOR, SHAPE, and PIECE TYPE. 
      Return ONLY a JSON object:
      {
        "name": "Creative luxury name",
        "description": "3-sentence visual description",
        "whenAndHowToWear": "Specific styling advice",
        "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "seoKeywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
        "colors": ["Primary Color Name"]
      }`;

      // THE CORRECT ENDPOINT AND PAYLOAD FOR GEMINI 1.5 FLASH
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Data } }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`Google API Failure: ${response.status} - ${errorDetail}`);
      }

      const result = await response.json();
      const aiText = result.candidates[0].content.parts[0].text;
      
      // Clean Markdown from AI response
      const cleanJson = aiText.replace(/```json|```/g, "").trim();

      return new Response(cleanJson, {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), { status: 400 });

  } catch (err: any) {
    console.error("FUNCTION ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
// Initialize Supabase client directly (Deno runtime). The editor may not be able to
// resolve the remote module; ignore TS errors for this import in the editor.
// @ts-ignore: Remote Deno import
import { createClient } from 'https://deno.land/x/supabase_js@2.39.7/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
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