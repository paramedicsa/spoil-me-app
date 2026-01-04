import supabase from '../src/supabaseClient';
export { isSupabaseConfigured } from '../src/supabaseClient';

// Basic helpers used across the app to ease migration from Firestore
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string, metadata?: Record<string, any>) {
  // Create the auth user first
  const res = await supabase.auth.signUp({ email, password });
  if (res.error) throw res.error;
  // If metadata provided and a user id exists, ensure a users row exists
    try {
      const userId = (res?.data as any)?.user?.id || (res as any)?.user?.id;
    if (userId && metadata) {
      // Convert metadata keys to snake_case and filter to safe keys
      const toSnake = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(toSnake);
        const out: any = {};
        for (const k of Object.keys(obj)) {
          const snake = k.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
          if (/^[a-z0-9_]+$/.test(snake)) out[snake] = toSnake(obj[k]);
        }
        return out;
      };
      const payload = { id: userId, email, ...(toSnake(metadata) || {}) };
      // Upsert a users row so profile data exists immediately
      await supabase.from('users').upsert([payload]);
    }
  } catch (err) {
    // Non-fatal: log but don't block signup flow
    console.warn('Failed to write signup metadata to users table:', err);
  }
  return res;
}

export async function queryDocuments<T = any>(table: string, opts: { select?: string, filters?: Record<string, any>, orderBy?: { column: string, ascending?: boolean }, limit?: number, offset?: number } = {}): Promise<T[] | null> {
  try {
    let q: any = supabase.from(table).select(opts.select || '*');
    if (opts.filters) {
      for (const k of Object.keys(opts.filters)) q = q.eq(k, opts.filters[k]);
    }
    if (opts.orderBy) q = q.order(opts.orderBy.column, { ascending: !!opts.orderBy.ascending });
    if (typeof opts.limit === 'number') q = q.limit(opts.limit);
    if (typeof opts.offset === 'number') q = q.range(opts.offset, (opts.offset || 0) + (opts.limit || 0) - 1);
    const res = await q;
    if (res.error) throw res.error;
    return res.data as T[];
  } catch (err) {
    console.warn('queryDocuments failed:', err);
    return null;
  }
}

export async function getDocument<T = any>(table: string, id: string): Promise<T | null> {
  try {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as T | null;
  } catch (err) {
    console.warn('getDocument failed:', err);
    return null;
  }
}

export async function createDocument(table: string, doc: any) {
  const { data, error } = await supabase.from(table).insert([doc]);
  if (error) throw error;
  return data;
}

export async function updateDocument(table: string, id: string, doc: any) {
  const { data, error } = await supabase.from(table).update(doc).eq('id', id);
  if (error) throw error;
  return data;
}

export async function deleteDocument(table: string, id: string) {
  const { data, error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return data;
}

export function subscribeToTable(table: string, callback: (payload: any) => void) {
  try {
    const channel = supabase
      .channel(`${table}_realtime`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => callback(payload))
      .subscribe();
    // return an unsubscribe function for backwards compatibility
    return () => {
      try { channel.unsubscribe(); } catch (err) { console.warn('unsubscribe failed:', err); }
    };
  } catch (err) {
    console.warn('subscribeToTable failed:', err);
    return () => {};
  }
}

export async function uploadFile(bucket: string, path: string, file: File | Blob) {
  console.log(`📤 uploadFile called:`, { bucket, path, fileSize: file.size, fileType: file.type });
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) {
      console.error(`❌ Storage upload error:`, error);
      throw error;
    }
    console.log(`✅ File uploaded successfully:`, data);
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
    console.log(`🔗 Public URL generated:`, publicUrlData?.publicUrl);
    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('❌ uploadFile failed:', err);
    throw err;
  }
}

// Generic helper to call server-side functions (migrate away from Firebase httpsCallable)
export async function callServerFunction(name: string, payload: any) {
  try {
    let accessToken: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      accessToken = (data as any)?.session?.access_token || null;
    } catch (_) {
      accessToken = null;
    }

    const res = await fetch(`/api/functions/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify(payload || {})
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Function ${name} failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('callServerFunction failed:', name, err);
    throw err;
  }
}

export { supabase };
export default supabase;
