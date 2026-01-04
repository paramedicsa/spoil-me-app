import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // 1. Handle CORS (Essential for Vercel calls)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST'
      } 
    })
  }

  try {
    const { action, image, category } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) throw new Error("GEMINI_API_KEY is missing in Supabase Secrets");

    if (action === 'analyze-image') {
      // Clean Base64: remove prefix if present and capture MIME type when available
      let base64Data = image.includes(',') ? image.split(',')[1] : image;
      const mimeMatch = image.match(/^data:(image\/[A-Za-z0-9.+-]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      const prompt = `You are a professional jewelry specialist. Analyze this image carefully for visual details (color, texture, and shape).
      Specifically look for PRIMARY COLOR (e.g., Amber, Sunset Orange), TEXTURE (e.g., glossy resin, matte metal), and SHAPE (e.g., square, round, geometric).
      Identify MATERIAL (e.g., Resin, Copper, Glass, Beads) and the PIECE TYPE (e.g., Stud Earring, Dangle, Ring).
      Respond ONLY with a JSON object structured exactly as follows:
      {
        "name": "High-end creative name for this piece",
        "description": "A 3-sentence luxury description focusing on the visible details",
        "whenAndHowToWear": "Short, actionable styling advice",
        "tags": ["tag1","tag2","tag3","tag4","tag5"],
        "seoKeywords": ["kw1","kw2","kw3","kw4","kw5"],
        "colors": ["Primary Color"]
      }
      Ensure colors describe only the product (ignore background or skin). Return ONLY the raw JSON object and nothing else.`;

      // V1BETA - GEMINI 1.5 FLASH (Stable for vision tasks)
      const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Data } }
          ]
        }]
      };

      // Log the exact body sent to Gemini for debugging in Supabase logs
      console.log('Gemini Request Body:', payload);

      const response = await fetch(googleUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google API Error Body:', errorText);
        throw new Error(`Google API Error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const aiText = result.candidates[0].content.parts[0].text;
      
      // Clean the AI text (removes markdown code blocks)
      const cleanJson = aiText.replace(/```json|```/g, "").trim();
      
      return new Response(cleanJson, { 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      });
    }

    return new Response(JSON.stringify({ error: 'Action not supported' }), { status: 400 });

  } catch (err) {
    console.error("Function Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  }
})