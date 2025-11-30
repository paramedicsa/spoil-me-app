
import { GoogleGenAI } from "@google/genai";
import { Review } from "../types";

const apiKey = process.env.API_KEY;

// Helper to ensure we don't crash if key is missing, though metadata.json handles this mostly.
const getAI = () => {
  if (!apiKey) {
    console.warn("API Key is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateProductDescription = async (productName: string, category: string, keywords: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "AI Generation unavailable (Missing API Key).";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a compelling, SEO-friendly product description for an e-commerce product.
      
      Product Name: ${productName}
      Category: ${category}
      Keywords/Features: ${keywords}
      
      Tone: Professional, persuasive, and enthusiastic. 
      Keep it under 150 words.`,
    });
    
    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating description. Please try again.";
  }
};

export const suggestMarketingCopy = async (specialTitle: string, discount: number): Promise<string> => {
  const ai = getAI();
  if (!ai) return "AI Generation unavailable.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a catchy, short headline and a subheader for a website banner promoting a sale.
      
      Sale Title: ${specialTitle}
      Discount: ${discount}% Off
      
      Format:
      Headline: [Text]
      Subheader: [Text]`,
    });
    
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};

export interface AIProductMetadata {
  name: string;
  description: string;
  whenAndHowToWear: string;
  tags: string[];
  seoKeywords: string[];
  colors: string[];
}

export const generateProductMetadataFromImage = async (base64Image: string, categoryContext: string): Promise<AIProductMetadata | null> => {
  const ai = getAI();
  if (!ai) return null;

  // Strip data URL prefix if present to get raw base64
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      // FIX: Using a model with vision capabilities for image analysis.
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          },
          {
            text: `You are a fashion merchandising expert for a specialized jewelry store. Analyze this image of a ${categoryContext || 'jewelry product'}.
            
            Generate the following JSON object:
            {
              "name": "A short, catchy, premium product name",
              "description": "A short, powerful, attractive description (max 3 sentences) that sells the product emotionally.",
              "whenAndHowToWear": "Short, powerful advice on when and how to wear this item (max 2 sentences).",
              "tags": ["Array", "of", "5", "jewelry-specific", "tags"],
              "seoKeywords": ["Array", "of", "5", "strong", "SEO", "keywords"],
              "colors": ["List", "of", "dominant", "product", "colors"]
            }
            
            CRITICAL INSTRUCTIONS:
            1. **Tags**: STRICTLY JEWELRY ONLY. Allowed: Materials (Gold, Resin, Silver, Gemstone), Types (Ring, Stud, Choker, Pendant), Styles (Art Deco, Vintage, Boho, Minimalist), Techniques (Filigree, Wire Wrap). 
               FORBIDDEN: "Fashion", "Style", "Woman", "Girl", "Cute", "Gift", "Love", "Trend", "Beautiful", "Accessory".
            2. **Colors**: STRICTLY PRODUCT ONLY. Ignore background, skin, or prop colors. If the ring is silver and the stone is red, output ["Silver", "Red"]. Do not output "White" if the background is white.
            
            Return ONLY raw JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as AIProductMetadata;
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    return null;
  }
};

export const generateSouthAfricanReviews = async (productName: string, count: number): Promise<Review[]> => {
  const ai = getAI();
  if (!ai) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} unique South African product reviews for a jewelry item named "${productName}".
      
      CRITICAL INSTRUCTIONS:
      1. **Persona**: Use ONLY Female names.
      2. **Diversity**: Mix names from Zulu, Xhosa, Afrikaans, English, and Coloured backgrounds.
      3. **Locations**: Use specific South African towns (e.g., Paarl, Benoni, Mthatha, Umlazi, George, Soweto, Ballito, Bloemfontein), NOT just "Cape Town" or "JHB".
      4. **Language Mixing**: 
         - Some reviews must mix English with Afrikaans (e.g., "Baie nice", "Lekker", "Te oulik").
         - Some reviews must mix English with Xhosa/Zulu slang (e.g., "Yho", "Shame", "Stunning shem", "Haikona").
         - Keep it natural.
      5. **Realism**: Include occasional spelling mistakes (e.g., "realy", "awsome") and casual grammar.
      6. **Rating**: Randomly between 3.5 and 5.0 stars.
      7. **Content**: Short, punchy comments about quality, delivery, or how it looks.
      8. **Dates**: Random dates strictly between January 1st, 2025 and today (Format: YYYY-MM-DD). Do NOT generate 2024 dates.

      Output strictly as a JSON Array of objects with keys: userName, location, content, rating, date.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const rawReviews = JSON.parse(text);
    
    // Add IDs manually
    return rawReviews.map((r: any) => ({
        ...r,
        id: `rev_ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));

  } catch (error) {
    console.error("Gemini Review Generation Error:", error);
    return [];
  }
};

export const generateUniquePendantReviews = async (count: number): Promise<Review[]> => {
  const ai = getAI();
  if (!ai) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} unique South African reviews specifically for "One of a Kind" handmade wire-wrapped pendants.
      
      CRITICAL INSTRUCTIONS:
      1. **Context**: These are unique, single items. The reviews should NOT mention specific colors or stones (like "love the blue stone") because every piece is different.
      2. **Focus**: Focus on the "surprise" element, the uniqueness, the wire-wrapping craftsmanship, the packaging, and the fact that nobody else has this exact piece.
      3. **Persona**: Female names, South African diversity (Zulu, Xhosa, Afrikaans, English).
      4. **Locations**: Specific SA towns.
      5. **Language**: Mix in SA slang (Lekker, Mooi, Pragtig, Yho, Stunning).
      6. **Rating**: 4.0 to 5.0 stars.
      7. **Dates**: Random dates between Jan 2025 and now.
      
      Output strictly as a JSON Array of objects with keys: userName, location, content, rating, date.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const rawReviews = JSON.parse(text);
    
    return rawReviews.map((r: any) => ({
        ...r,
        id: `rev_unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));

  } catch (error) {
    console.error("Gemini Unique Review Generation Error:", error);
    return [];
  }
};

export const generateSocialPost = async (productName: string, platform: string, price: number): Promise<string> => {
  const ai = getAI();
  if (!ai) return "Check out this amazing product at Spoil Me Vintage! #vintage #jewelry";

  try {
    let prompt = `Write a single social media post for a jewelry product named "${productName}". Price: R${price}.`;
    
    if (platform === 'Instagram' || platform === 'TikTok') {
        prompt += ` Style: High energy, visually descriptive, lots of emojis, include 10 relevant hashtags. Focus on "Unique", "Handmade", "South Africa". Keep it under 200 characters + hashtags.`;
    } else if (platform === 'Facebook') {
        prompt += ` Style: Friendly, community-focused, engaging question at the end. Mention "Spoil Me Vintage". Include link placeholder [Link].`;
    } else if (platform === 'Twitter' || platform === 'X') {
        prompt += ` Style: Short, punchy, urgent. Max 280 characters. Include 3 hashtags.`;
    } else {
        prompt += ` Style: Professional yet inviting.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return response.text || "";
  } catch (error) {
    console.error("Gemini Social Post Error:", error);
    return `New arrival: ${productName} for only R${price}! Get it before it's gone. #SpoilMeVintage`;
  }
};