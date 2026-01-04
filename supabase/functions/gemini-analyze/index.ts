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
    console.log('📥 Received request:', { action, category, imageLength: image?.length || 0 });
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment');
      throw new Error("GEMINI_API_KEY not found in secrets.");
    }

    // --- ACTION: ANALYZE IMAGE ---
    if (action === 'analyze-image') {
      console.log('🔍 Processing analyze-image action');
      
      // Clean the Base64 string (Remove prefix if it exists)
      const base64Data = image.includes(',') ? image.split(',')[1] : image;
      const mimeType = image.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
      console.log('📸 Image details:', { mimeType, base64Length: base64Data.length });

      const prompt = `You are a high-end jewelry specialist for 'Spoil Me Vintage'. 
      Analyze this ${category || 'jewelry'} image. 
      
      CRITICAL: Describe EXACTLY what you see in the image:
      - If it's earrings, say "earrings" or "studs" or "dangles"
      - If it's a ring, say "ring"
      - If it's a pendant/necklace, say "pendant" or "necklace"
      - If the primary color is orange, say "Orange"
      - If it's silver metal, say "Silver"
      - If it's a stud style, include "Stud" in tags
      - If it's a dangle style, include "Dangle" in tags
      
      Return ONLY a JSON object:
      {
        "name": "Creative luxury name that reflects what's in the image",
        "description": "3-sentence visual description of what you actually see",
        "whenAndHowToWear": "Specific styling advice based on the piece type",
        "tags": ["Piece Type (Ring/Stud/Dangle/Pendant)", "Primary Color", "Material", "Style", "tag5"],
        "seoKeywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
        "colors": ["Primary Color Name from the product itself"]
      }`;

      // THE CORRECT ENDPOINT AND PAYLOAD FOR GEMINI 1.5 FLASH
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

      console.log('🚀 Calling Gemini API...');
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

      console.log('📡 Gemini API response status:', response.status);
      
      if (!response.ok) {
        const errorDetail = await response.text();
        console.error('❌ Gemini API error:', errorDetail);
        throw new Error(`Google API Failure: ${response.status} - ${errorDetail}`);
      }

      const result = await response.json();
      console.log('✅ Gemini API success, parsing response...');
      const aiText = result.candidates[0].content.parts[0].text;
      console.log('📝 AI generated text:', aiText.substring(0, 200));
      
      // Clean Markdown from AI response
      const cleanJson = aiText.replace(/```json|```/g, "").trim();
      console.log('✨ Returning cleaned JSON, length:', cleanJson.length);

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