import { deleteUserHandler } from '../index';

const makeSupabaseMock = (isAdmin = true, userExists = true) => {
  return {
    from: (table: string) => ({
        select: (cols: string) => ({
          or: (q: string) => ({ limit: (_n: number) => ({ maybeSingle: () => ({ data: isAdmin ? { id: 'admin_id', email: 'spoilmevintagediy@gmail.com', is_admin: true } : { id: 'u1', email: 'user@example.com', is_admin: false }, error: null }) }) }),
          maybeSingle: () => ({ data: isAdmin ? { id: 'admin_id', email: 'spoilmevintagediy@gmail.com', is_admin: true } : { id: 'u1', email: 'user@example.com', is_admin: false }, error: null })
        }),
      delete: () => ({ eq: (_k: string, _v: any) => ({ error: null }) }),
      update: (d: any) => ({ eq: (_k: string, _v: any) => ({ data: d, error: null }) }),
      eq: (_k: string, _v: any) => ({ data: null, error: null }),
    }),
    auth: { admin: { deleteUser: async (id: string) => ({ error: null }) } },
    // users select mock
    selectUsers: (isAdminLocal: boolean) => ({ maybeSingle: () => ({ data: isAdmin ? { id: 'admin_id', email: 'spoilmevintagediy@gmail.com', is_admin: true } : { id: 'u1', email: 'user@example.com', is_admin: false }, error: null }) })
  } as any;
};

const makeBear = (payload: any) => {
  const b64 = (s: string) => Buffer.from(s).toString('base64').replace(/=/g, '');
  const header = b64(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = b64(JSON.stringify(payload));
  return `${header}.${body}.`;
};

(async () => {
  console.log('Running deleteUser tests...');

  const adminBearer = makeBear({ sub: 'admin_id', email: 'spoilmevintagediy@gmail.com' });
  const nonAdminBearer = makeBear({ sub: 'u2', email: 'user@example.com' });

  // Hard delete success
  const req = new Request('http://localhost', { method: 'POST', headers: { Authorization: `Bearer ${adminBearer}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'u_delete', should_soft_delete: false }) });
  const res = await deleteUserHandler(req as any, { supabase: makeSupabaseMock(true, true) });
  const j = await res.json();
  console.log('Hard delete response:', j);
  if (res.status !== 200 || !j.success) { console.error('Hard delete failed', j); process.exit(1); }

  // Soft delete
  const req2 = new Request('http://localhost', { method: 'POST', headers: { Authorization: `Bearer ${adminBearer}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'u_delete', should_soft_delete: true }) });
  const res2 = await deleteUserHandler(req2 as any, { supabase: makeSupabaseMock(true, true) });
  const j2 = await res2.json();
  console.log('Soft delete response:', j2);
  if (res2.status !== 200 || !j2.success) { console.error('Soft delete failed', j2); process.exit(1); }

  // Non-admin blocked
  const req3 = new Request('http://localhost', { method: 'POST', headers: { Authorization: `Bearer ${nonAdminBearer}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'u_delete', should_soft_delete: false }) });
  const res3 = await deleteUserHandler(req3 as any, { supabase: makeSupabaseMock(false, true) });
  console.log('Non-admin status:', res3.status);
  if (res3.status !== 403) { console.error('Non-admin test failed'); process.exit(1); }

  console.log('deleteUser tests PASSED');
  process.exit(0);
})();