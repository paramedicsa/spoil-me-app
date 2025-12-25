(async ()=>{
  try{
    const b64 = (s) => Buffer.from(s).toString('base64').replace(/=/g,'');
    const token = b64(JSON.stringify({alg:'none',typ:'JWT'}))+'.'+b64(JSON.stringify({sub:'admin_id',email:'spoilmevintagediy@gmail.com'}))+'.';
    const h = await fetch('http://localhost:3001/health');
    console.log('Health', h.status, await h.json());
    const r = await fetch('http://localhost:3001/api/functions/sendAdminPush', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+token }, body: JSON.stringify({ title: 'Smoke', body: 'Test', targetType: 'all' }) });
    console.log('sendAdminPush status', r.status, await r.json());
  }catch(e){ console.error('smoke test error', e); process.exit(1); }
})();
