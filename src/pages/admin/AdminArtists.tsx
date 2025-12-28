import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Card, CardBody } from "@nextui-org/react";
import { queryDocuments, updateDocument, createDocument } from '../../../utils/supabaseClient';
import supabase from '../../supabaseClient';

type AppRow = any;

const AdminArtistsPage: React.FC = () => {
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  // Load applications with robust fallbacks
  const loadApplications = async () => {
    try {
      // Prefer demo/demo-local apps if present
      const raw = localStorage.getItem('spv_artist_applications');
      if (raw && raw.length > 0) {
        const apps = JSON.parse(raw);
        setApplications(apps || []);
        return;
      }

      // Try a few common column names for ordering, and fall back to unordered query
      let apps = await queryDocuments('artist_applications', { orderBy: { column: 'submitted_at', ascending: false } });
      if (!apps) apps = await queryDocuments('artist_applications', { orderBy: { column: 'submittedAt', ascending: false } });
      if (!apps) apps = await queryDocuments('artist_applications');

      if (!apps || apps.length === 0) {
        // Nothing from Supabase — fallback to localStorage (demo) and set error flag
        setSupabaseError('Could not load applications from Supabase; showing demo/local applications instead.');
        const raw2 = localStorage.getItem('spv_artist_applications');
        const apps2 = raw2 ? JSON.parse(raw2) : [];
        setApplications(apps2 || []);
        return;
      }

      setApplications(apps || []);
      setSupabaseError(null);
    } catch (err: any) {
      console.error('Failed to load artist applications', err);
      setSupabaseError(err?.message || String(err));
      // fallback to localStorage apps
      const raw = localStorage.getItem('spv_artist_applications');
      const apps = raw ? JSON.parse(raw) : [];
      setApplications(apps || []);
    }
  };

  useEffect(() => { loadApplications(); }, []);

  // Dummy data for products needing pricing - replace with real data
  const productsToPrice = [
    { id: 101, artist: 'Jane Doe', requestedCost: 150, imageUrl: 'https://via.placeholder.com/150' },
    { id: 102, artist: 'John Smith', requestedCost: 200, imageUrl: 'https://via.placeholder.com/150' },
  ];

    // Dummy data for QC
    const qcItems = [
        { id: 1, orderId: 'ORD-123', artist: 'Jane Doe', status: 'Pending Inspection' },
        { id: 2, orderId: 'ORD-124', artist: 'John Smith', status: 'Pending Inspection' },
    ];

  return (
    <div className="p-8">
      {supabaseError && (
        <div className="mb-4 p-3 rounded bg-amber-600 text-black">
          <strong>Supabase notice:</strong> {supabaseError}
        </div>
      )}
      <h1 className="text-3xl font-bold mb-6">Artist Hub</h1>
      <div className="mb-6">
        <button onClick={() => loadApplications()} className="mr-3 inline-block bg-zinc-800 text-zinc-200 px-3 py-1 rounded">Refresh</button>
        <button onClick={() => {
          // Seed demo apps locally if none exist
          const raw = localStorage.getItem('spv_artist_applications');
          if (raw && JSON.parse(raw).length > 0) { alert('Demo apps already present.'); return; }
          const seed = [
            { id: 'demo-1', uid: 'guest', name: 'Demo', surname: 'Artist', plan: 'Creator', contactNumber: '000', email: 'demo@example.com', productImages: [], status: 'pending', submittedAt: new Date().toISOString() },
            { id: 'demo-2', uid: 'guest', name: 'Sample', surname: 'Maker', plan: 'Hobbyist', contactNumber: '000', email: 'sample@example.com', productImages: [], status: 'pending', submittedAt: new Date().toISOString() },
          ];
          localStorage.setItem('spv_artist_applications', JSON.stringify(seed));
          setApplications(seed);
          alert('Seeded demo applications.');
        }} className="inline-block bg-amber-600 text-black px-3 py-1 rounded">Seed demo apps</button>
      </div>
      <Tabs aria-label="Artist Management">
        <Tab key="applications" title="Applications">
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold mb-4">Pending Applications</h2>
              <div className="space-y-4">
                {applications.length === 0 && <div className="text-sm text-zinc-500">No applications found.</div>}
                {applications.map((app: AppRow) => (
                  <div key={app.id} className="flex flex-col md:flex-row md:justify-between items-start md:items-center p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="flex flex-col">
                        <p className="font-bold">{app.name} {app.surname}</p>
                        <p className="text-sm text-zinc-500">Applying for: <strong>{app.plan || '—'}</strong></p>
                        <p className="text-sm text-zinc-500">Contact: {app.contactNumber} • {app.email}</p>
                        <p className="text-sm text-zinc-500 mt-1">Submitted: {(() => {
                          const dateVal = app.submittedAt || app.submitted_at || app.submitted || app.createdAt || app.created_at;
                          try { return dateVal ? new Date(dateVal).toLocaleString() : '—'; } catch (_) { return '—'; }
                        })()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-zinc-500">Images: {app.productImages?.length || 0}</div>
                      </div>
                    </div>

                    <div className="mt-3 md:mt-0 flex gap-3 items-center">
                      <button onClick={async () => {
                        // Approve: try to create artist entry, update application status, notify user.
                        try {
                          await createDocument('artists', {
                            uid: app.uid,
                            shopName: app.artistTradeName || `${app.name} ${app.surname}`,
                            slotLimit: 5,
                            slotsUsed: 0,
                            wallet: { pending: 0, available: 0, currency: 'ZAR' },
                            status: 'active',
                            isFirstTime: true
                          });
                          await updateDocument('artist_applications', app.id, { status: 'approved', approvedAt: new Date().toISOString() });
                          await supabase.from('users').update({ artistApplicationStatus: 'approved' }).eq('id', app.uid);
                          await supabase.from('notifications').insert([{ userId: app.uid, type: 'system', title: 'Artist Application Approved!', message: 'Congratulations! Your artist application has been approved. You can now access your artist dashboard and start listing products.', date: new Date().toISOString(), isRead: false }]);
                          // refresh list
                          const apps = await queryDocuments('artist_applications', { orderBy: { column: 'submittedAt', ascending: false } });
                          setApplications(apps || []);
                          alert('Application approved successfully!');
                        } catch (err) {
                          console.error('Error approving application', err);
                          // fallback: update localStorage if present
                          try {
                            const raw = localStorage.getItem('spv_artist_applications');
                            if (raw) {
                              const arr = JSON.parse(raw).map((a: any) => a.id === app.id ? { ...a, status: 'approved', approvedAt: new Date().toISOString() } : a);
                              localStorage.setItem('spv_artist_applications', JSON.stringify(arr));
                              setApplications(arr);
                              alert('Application approved in local/demo storage (Supabase unavailable).');
                              return;
                            }
                          } catch (e) {
                            console.warn('Local fallback failed', e);
                          }
                          alert('Failed to approve application. See console for details.');
                        }
                      }} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500">Approve</button>

                      <button onClick={async () => {
                        const reason = prompt('Optional note for rejection (will be sent to the artist):') || '';
                        try {
                          await updateDocument('artist_applications', app.id, { status: 'rejected', rejectedAt: new Date().toISOString() });
                          await supabase.from('users').update({ artistApplicationStatus: 'rejected' }).eq('id', app.uid);
                          await supabase.from('notifications').insert([{ userId: app.uid, type: 'system', title: 'Artist Application Update', message: `We regret to inform you that your application has been declined. ${reason}`, date: new Date().toISOString(), isRead: false }]);
                          const apps = await queryDocuments('artist_applications', { orderBy: { column: 'submittedAt', ascending: false } });
                          setApplications(apps || []);
                          alert('Application rejected.');
                        } catch (err) {
                          console.error('Error rejecting application', err);
                          try {
                            const raw = localStorage.getItem('spv_artist_applications');
                            if (raw) {
                              const arr = JSON.parse(raw).map((a: any) => a.id === app.id ? { ...a, status: 'rejected', rejectedAt: new Date().toISOString(), adminNote: reason } : a);
                              localStorage.setItem('spv_artist_applications', JSON.stringify(arr));
                              setApplications(arr);
                              alert('Application rejected in local/demo storage (Supabase unavailable).');
                              return;
                            }
                          } catch (e) {
                            console.warn('Local fallback failed', e);
                          }
                          alert('Failed to reject application. See console for details.');
                        }
                      }} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Tab>
        <Tab key="pricing" title="The Pricing Room">
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold mb-4">Price New Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsToPrice.map((product) => (
                  <div key={product.id} className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
                    <img src={product.imageUrl} alt="Product" className="w-full h-48 object-cover rounded-md mb-4" />
                    <p className="font-bold mb-2">Artist: {product.artist}</p>
                    <p className="mb-4">Requested Cost: <span className="font-semibold">R{product.requestedCost}</span></p>
                    <div className="space-y-2">
                      <input type="number" placeholder="Set Selling Price (e.g., 450)" className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700" />
                      <input type="number" placeholder="Set RRP (e.g., 899)" className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                    <button className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Publish to Shop</button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Tab>
        <Tab key="qc" title="Quality Control Hub">
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold mb-4">Items for Inspection</h2>
               <div className="mb-4">
                  <input type="text" placeholder="Scan or Type Order ID" className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="space-y-4">
                {qcItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <div>
                      <p className="font-bold">Order ID: {item.orderId}</p>
                      <p className="text-sm text-zinc-500">Artist: {item.artist}</p>
                    </div>
                    <div className="flex gap-4">
                      <button className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600">PASS ✅</button>
                      <button className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600">FAIL ❌</button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default AdminArtistsPage;

