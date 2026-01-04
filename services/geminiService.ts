import { supabase } from '../utils/supabaseClient';

/**
 * GEMINI PROXY SERVICE
 * Calls Supabase Edge Functions to hide API keys and prevent build errors.
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

export const generateProductMetadataFromImage = (base64Image: string, category: string) => 
  invokeGemini('analyze-image', { image: base64Image, category });

export const generateSouthAfricanReviews = async (productName: string, count: number = 5) => {
  const data = await invokeGemini('generate-reviews', { productName, count });
  return data?.reviews || [];
};

export const generateProductDescription = async (productName: string, category: string, keywords: string) => {
  const data = await invokeGemini('generate-description', { productName, category, keywords });
  return data?.description || "";
};

export const generateUniquePendantReviews = (count: number) => 
  generateSouthAfricanReviews("Unique Handcrafted Pendant", count);

export const generateSocialPost = async (productName: string, platform: string, price: number) => {
  const data = await invokeGemini('generate-social', { productName, platform, price });
  return data?.text || `Check out ${productName} for R${price}! #SpoilMeVintage`;
};