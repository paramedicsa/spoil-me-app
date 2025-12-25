console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0,20) + '...' : null);
console.log('SUPABASE_SERVICE_ROLE_KEY=', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0,20) + '...' : null);
console.log('keys equal?', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY);
