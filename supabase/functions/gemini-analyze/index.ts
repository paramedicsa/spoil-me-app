// If using Deno, ensure your editor supports Deno types (e.g., install Deno extension for VSCode).
// If using Node.js, replace with an appropriate HTTP server, e.g.:
import { createServer } from "http";

// Example Node.js replacement for serve:
const serve = (handler: (req: Request) => Promise<Response>) => {
  const server = createServer(async (req, res) => {
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers as any,
    });
    const response = await handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    const body = await response.text();
    res.end(body);
  });
  server.listen(8000);
};

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { action, image, category } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (action === 'analyze-image') {
      // CLEAN THE BASE64 STRING
      const base64Data = image.split(',')[1] || image;

        const prompt = `You are an expert jewelry cataloger for "Spoil Me Vintage". 
      ANALYZE THIS IMAGE CAREFULLY. 
      Identify the exact color (e.g. Amber, Sunset Orange, Tangerine), the shape (e.g. Square, Geometric), the material (e.g. Resin, Glass, Acrylic), and the type (e.g. Stud Earring, Dangle).
      
      RETURN ONLY A JSON OBJECT with these keys:
      {
        "name": "A creative, high-end name for this specific piece",
        "description": "A 3-sentence luxury description focusing on the visual details seen in the photo",
          "whenAndHowToWear": "short guidance on when and how to wear",
        "tags": ["5 specific tags"],
        "seoKeywords": ["5 high-ranking keywords"],
        "colors": ["The dominant color name"]
      }`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/png", data: base64Data } }
            ]
          }]
        })
      });

      const result = await response.json();
      // Extract the text content and parse the JSON hidden inside it
      const textResponse = result.candidates[0].content.parts[0].text;
      const cleanJson = textResponse.replace(/```json|```/g, "").trim();
      
      return new Response(cleanJson, { 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });

  } catch (err) {
    const errorMessage = typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  }
})