import { sendAdminPushHandler } from '../index';
import { Request } from 'node-fetch';

// Simple mock supabase client
const makeSupabaseMock = (tokens: string[] = []) => {
  return {
    from: (table: string) => {
      return {
        select: (cols: string) => {
          // For users table we support .or(...).limit(1).maybeSingle()
          if (table === 'users') {
            return {
              or: (q: string) => ({
                limit: (_n: number) => ({ maybeSingle: () => ({ data: { id: 'admin_id', email: 'spoilmevintagediy@gmail.com', is_admin: true }, error: null }) })
              })
            };
          }
          return {
            eq: (k: string, v: any) => ({ data: [{ id: v, email: 'spoilmevintagediy@gmail.com', is_admin: true }], error: null }),
            limit: (n: number) => ({ data: tokens.map(t => ({ token: t })), error: null })
          };
        }
      };
    },
    rpc: (name: string, params: any) => ({ data: tokens, error: null })
  };
};

const makeBearerFor = (payload: any) => {
  // Create an unsigned JWT-like token for testing: header.payload.
  const b64 = (s: string) => Buffer.from(s).toString('base64').replace(/=/g, '');
  const header = b64(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = b64(JSON.stringify(payload));
  return `${header}.${body}.`;
};

(async () => {
  console.log('Running sendAdminPush dry-run test...');

  const tokens = ['t1', 't2', 't3'];
  const mockSupabase = makeSupabaseMock(tokens);

  const bearer = makeBearerFor({ sub: 'admin_id', email: 'spoilmevintagediy@gmail.com' });

  const req = new Request('http://localhost', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetType: 'all' })
  });

  const res = await sendAdminPushHandler(req as any, { supabase: mockSupabase, fcmKey: undefined });
  console.log('Response status:', res.status);
  const json = await res.json();
  console.log('Response JSON:', json);

  if (res.status !== 200) {
    console.error('Test failed: expected 200');
    process.exit(1);
  }
  if (!json.success || json.sentCount !== tokens.length) {
    console.error('Test failed: unexpected payload', json);
    process.exit(1);
  }

  console.log('sendAdminPush dry-run test PASSED');
  process.exit(0);
})();
