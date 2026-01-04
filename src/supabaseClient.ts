import { createClient } from '@supabase/supabase-js'

// 1. Use only Vite-provided environment variables for the public Supabase client.
// Do NOT fall back to process.env here - the frontend should rely solely on
// `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 2. Check if keys exist
const isConfigured = !!supabaseUrl && !!supabaseKey;

// 3. Log status for debugging
if (isConfigured) {
  console.log("✅ Supabase Client initialized successfully");
} else {
  console.error("🚨 Supabase VITE keys missing! Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.");
}

// 4. Create the client
const supabase = createClient(supabaseUrl, supabaseKey);

// 5. EXPORT both the client and the status check
export const isSupabaseConfigured = isConfigured;
export default supabase;
