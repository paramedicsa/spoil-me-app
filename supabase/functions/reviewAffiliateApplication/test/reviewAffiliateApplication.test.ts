import { reviewAffiliateApplicationHandler } from '../index';

const makeSupabaseMock = (appRow: any | null = null, isAdmin = true) => {
  const ops: any[] = [];
  return {
    from: (table: string) => {
      return {
        select: (cols: string) => ({
          // Support users .or(...).limit(1).maybeSingle()
          or: (q: string) => ({ limit: (_n: number) => ({ maybeSingle: () => ({ data: { id: isAdmin ? 'admin_id' : 'user_x', email: isAdmin ? 'spoilmevintagediy@gmail.com' : 'user@example.com', is_admin: isAdmin }, error: null }) }) }),
          eq: (k: string, v: any) => ({ maybeSingle: () => ({ data: appRow, error: null }) }),
        }),
        update: (d: any) => ({ eq: (_k: string, _v: any) => ({ data: d, error: null }) }),
        insert: (d: any) => ({ data: d, error: null })
      };
    },
    rpc: (_: string, _p: any) => ({ data: null, error: null }),
    _ops: ops
  } as any;
};

const makeBearerFor = (payload: any) => {
  const b64 = (s: string) => Buffer.from(s).toString('base64').replace(/=/g, '');
  const header = b64(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = b64(JSON.stringify(payload));
  return `${header}.${body}.`;
};

(async () => {
  console.log('Running reviewAffiliateApplication tests...');

  // Test: approve flow
  const mockApp = { id: 'app1', user_id: 'u1' };
  const mockSb = makeSupabaseMock(mockApp);
  const bearer = makeBearerFor({ sub: 'admin_id', email: 'spoilmevintagediy@gmail.com' });
  const req = new Request('http://localhost', { method: 'POST', headers: { Authorization: `Bearer ${bearer}` }, body: JSON.stringify({ applicationId: 'app1', decision: 'approve' }) });
  const res = await reviewAffiliateApplicationHandler(req as any, { supabase: mockSb });
  const json = await res.json();
  console.log('Approve response:', json);
  if (res.status !== 200 || !json.success) { console.error('Approve test failed', json); process.exit(1); }

  // Test: reject flow
  const mockSb2 = makeSupabaseMock(mockApp);
  const req2 = new Request('http://localhost', { method: 'POST', headers: { Authorization: `Bearer ${bearer}` }, body: JSON.stringify({ applicationId: 'app1', decision: 'reject', reason: 'Not a fit' }) });
  const res2 = await reviewAffiliateApplicationHandler(req2 as any, { supabase: mockSb2 });
  const json2 = await res2.json();
  console.log('Reject response:', json2);
  if (res2.status !== 200 || !json2.success) { console.error('Reject test failed', json2); process.exit(1); }

  // Test: non-admin blocked
  const nonAdminBearer = makeBearerFor({ sub: 'user_x', email: 'user@example.com' });
  const req3 = new Request('http://localhost', { method: 'POST', headers: { Authorization: `Bearer ${nonAdminBearer}` }, body: JSON.stringify({ applicationId: 'app1', decision: 'approve' }) });
  const res3 = await reviewAffiliateApplicationHandler(req3 as any, { supabase: makeSupabaseMock(mockApp, false) });
  console.log('Non-admin response status:', res3.status);
  if (res3.status !== 403) { console.error('Non-admin test failed'); process.exit(1); }

  console.log('reviewAffiliateApplication tests PASSED');
  process.exit(0);
})();
