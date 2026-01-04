import { Review } from "../types";
import { supabase } from "./supabaseClient";

// Proxy URL for server-side Gemini calls (Edge Function). Configure VITE_GEMINI_PROXY_URL in your environment.
const GEMINI_PROXY_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_GEMINI_PROXY_URL) ? (import.meta as any).env.VITE_GEMINI_PROXY_URL : '/api/gemini-proxy';

const callProxy = async (path: string, body: any) => {
  try {
    const res = await fetch(`${GEMINI_PROXY_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Gemini proxy error: ${res.status} ${txt}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Gemini proxy call failed:', err);
    throw err;
  }
};

// --- Local fallback generators to keep the admin UX working when AI is unavailable ---
const adjectives = ["Timeless", "Elegant", "Vintage", "Handmade", "Artisan", "Luxe", "Delicate", "Statement", "Classic", "Boho"];
const materials = ["Gold", "Silver", "Sterling Silver", "Resin", "Bronze", "Copper", "Glass", "Crystal", "Gemstone"];
const styles = ["Art Deco", "Vintage", "Boho", "Minimalist", "Retro", "Contemporary", "Minimal"];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const localGenerateProductName = (categoryContext: string, seed?: string) => {
  const adj = pick(adjectives);
  const style = pick(styles);
  const base = categoryContext ? categoryContext.replace(/[^a-zA-Z0-9 ]/g, '') : 'Piece';
  // Use a short seed if provided to make slightly different names
  return `${adj} ${style} ${base}`.trim();
};

const localExtractTags = (categoryContext: string) => {
  const cat = (categoryContext || '').toLowerCase();
  const tags: string[] = [];
  if (cat.includes('ring')) tags.push('Ring');
  if (cat.includes('neck') || cat.includes('pendant') || cat.includes('choker')) tags.push('Pendant');
  if (cat.includes('ear')) tags.push('Stud');
  if (cat.includes('bracelet')) tags.push('Bracelet');
  if (tags.length === 0) tags.push(pick(['Pendant', 'Ring', 'Stud', 'Dangle']));
  // Ensure material-like tags
  tags.push(pick(materials));
  // Limit and unique
  return Array.from(new Set(tags)).slice(0, 5);
};

const localGenerateDescription = (name: string, category: string, keywords?: string) => {
  const k = keywords ? `Features: ${keywords}. ` : '';
  return `${name} is a ${category.toLowerCase()} crafted with care. ${k}Perfect for elevating everyday looks or adding a special touch for events. Hand-finished details and quality materials make it a timeless addition to any collection.`;
};

const localGenerateSeoKeywords = (name: string, tags: string[]) => {
  const baseKeywords = name.split(' ').slice(0,4).map(s => s.replace(/[^a-zA-Z0-9]/g,'').toLowerCase()).filter(Boolean);
  return Array.from(new Set([...baseKeywords, ...tags.map(t => t.toLowerCase())])).slice(0,6);
};

// --- End local fallbacks ---

export const generateProductDescription = async (productName, category, keywords) => {
  try {
    const json = await callProxy('/generate-description', { productName, category, keywords });
    return json?.text || localGenerateDescription(productName || localGenerateProductName(category || ''), category || 'Jewelry', keywords);
  } catch (err) {
    return localGenerateDescription(productName || localGenerateProductName(category || ''), category || 'Jewelry', keywords);
  }
};

export const suggestMarketingCopy = async (specialTitle, discount) => {
  try {
    const json = await callProxy('/generate-description', { specialTitle, discount });
    return json?.text || "AI Generation unavailable.";
  } catch (err) {
    console.warn('Marketing copy proxy failed:', err);
    return "AI Generation unavailable.";
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

export const generateProductMetadataFromImage = async (base64Image, categoryContext) => {
  try {
    // Use Supabase Edge Function instead of calling Google directly
    try {
      const { data, error } = await supabase.functions.invoke('gemini-analyze', {
        body: { image: base64Image, category: categoryContext }
      });
      if (error) throw error;
      return data || null;
    } catch (invokeErr) {
      console.warn('supabase.functions.invoke(gemini-analyze) failed:', invokeErr);
      throw invokeErr;
    }
  } catch (err) {
    try {
      const name = localGenerateProductName(categoryContext);
      const tags = localExtractTags(categoryContext);
      const description = localGenerateDescription(name, categoryContext || 'Jewelry', 'Handmade, Unique');
      const seoKeywords = localGenerateSeoKeywords(name, tags);
      const colors: string[] = [];
      return {
        name,
        description,
        whenAndHowToWear: 'Perfect for both everyday wear and special occasions. Layer with other pieces for a curated look.',
        tags,
        seoKeywords,
        colors
      };
    } catch (fallbackError) {
      console.error('Local fallback for product metadata failed:', fallbackError);
      return null;
    }
};

export const generateSouthAfricanReviews = async (productName, count) => {
  try {
    const json = await callProxy('/generate-reviews', { productName, count, type: 'south_african' });
    const rawReviews = json || [];
    return rawReviews.map((r: any) => ({ ...r, id: `rev_ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }));
  } catch (err) {
    console.warn('Review proxy failed:', err);
    return [];
  }
};

export const generateUniquePendantReviews = async (count) => {
  try {
    const json = await callProxy('/generate-reviews', { count, type: 'unique_pendant' });
    const rawReviews = json || [];
    return rawReviews.map((r: any) => ({ ...r, id: `rev_unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }));
  } catch (err) {
    console.warn('Unique reviews proxy failed:', err);
    return [];
  }
};

export const generateSocialPost = async (productName, platform, price) => {
  try {
    const json = await callProxy('/generate-social', { productName, platform, price });
    return json?.text || `Check out this amazing product: ${productName} for R${price}! #SpoilMeVintage #vintage #jewelry`;
  } catch (err) {
    console.warn('Social post proxy failed:', err);
    return `Check out this amazing product: ${productName} for R${price}! #SpoilMeVintage #vintage #jewelry`;
  }
};

// Note: functions are exported via `export const` declarations above.