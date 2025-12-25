import { grantTrialHandler } from '../index';

const makeSupabaseMock = (userExists = true, isAdmin = true) => {
  return {
    from: (table: string) => ({
      select: (cols: string) => ({
        or: (q: string) => ({ limit: (_n: number) => ({ maybeSingle: () => ({ data: isAdmin ? { id: 'admin_id', email: 'spoilmevintagediy@gmail.com', is_admin: true } : { id: 'u1', email: 'user@example.com', is_admin: false }, error: null }) }) })
      }),
      update: (d: any) => ({ eq: (_k: string, _v: any) => ({ data: userExists ? d : null, error: userExists ? null : { message: 'not found' } }) }),
      insert: (d: any) => ({ data: d, error: null })
    }),
  } as any;
};

const makeBearerFor = (payload: any) => {
  const b64 = (s: string) => Buffer.from(s).toString('base64').replace(/=/g, '');
  const header = b64(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = b64(JSON.stringify(payload));
  return `${header}.${body}.`;
};

(async () => {
  console.log('Running grantTrial tests...');

  // Success case
  const mockSb = makeSupabaseMock(true, true);
  const bearer = makeBearerFor({ sub: 'admin_id', email: 'spoilmevintagediy@gmail.com' });
  const req = new Request('http://localhost', { method: 'POST', headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'u1', plan: 'Basic', days: 7 }) });
  const res = await grantTrialHandler(req as any, { supabase: mockSb });
  const json = await res.json();
  console.log('Grant response:', json);
  if (res.status !== 200 || !json.success) { console.error('Grant test failed', json); process.exit(1); }

  // Missing params
  const req2 = new Request('http://localhost', { method: 'POST', headers: { Authorization: `Bearer ${bearer}` }, body: JSON.stringify({ userId: 'u1', plan: 'Basic' }) });
  const res2 = await grantTrialHandler(req2 as any, { supabase: mockSb });
  if (res2.status !== 400) { console.error('Missing params test failed'); process.exit(1); }

  // Non-admin blocked
  const nonAdminBearer = makeBearerFor({ sub: 'user_x', email: 'user@example.com' });
  const res3 = await grantTrialHandler(new Request('http://localhost', { method: 'POST', headers: { Authorization: `Bearer ${nonAdminBearer}` }, body: JSON.stringify({ userId: 'u1', plan: 'Basic', days: 7 }) }) as any, { supabase: makeSupabaseMock(true, false) });
  console.log('Non-admin status:', res3.status);
  if (res3.status !== 403) { console.error('Non-admin test failed'); process.exit(1); }

  console.log('grantTrial tests PASSED');
  process.exit(0);
})();
