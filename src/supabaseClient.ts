import { createClient } from '@supabase/supabase-js'

// 1. Try to get keys from Vite (import.meta.env) first, then fallback to others
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 2. Check if keys exist
const isConfigured = !!supabaseUrl && !!supabaseKey;

// 3. Log status for debugging
if (isConfigured) {
  console.log("✅ Supabase Client initialized successfully");
} else {
  console.error("🚨 Supabase Keys missing! Check your .env file.");
}

// 4. Create the client
const supabase = createClient(supabaseUrl, supabaseKey);

// 5. EXPORT both the client and the status check
export const isSupabaseConfigured = isConfigured;
export default supabase;
