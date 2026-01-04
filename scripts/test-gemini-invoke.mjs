import { createClient } from '@supabase/supabase-js';

(async function(){
  try {
    const url = 'https://xqcnqtrzamgzsrgbmxuk.supabase.co';
    const anonKey = 'sb_publishable_KwSUm9DTjeHvxqOSfECRFQ_4dkpCxAW';
    const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
    const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn0B9p8QjqwAAAAASUVORK5CYII=';
    console.log('Invoking gemini-analyze via Supabase client...');
    const res = await supabase.functions.invoke('gemini-analyze', { body: { image, category: 'Ring' } });
    console.log('Result:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Invoke failed:', err);
  }
})();