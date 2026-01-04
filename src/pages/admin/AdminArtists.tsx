import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Card, CardBody } from "@nextui-org/react";
import { queryDocuments, updateDocument, createDocument, subscribeToTable } from '../../../utils/supabaseClient';
import supabase from '../../supabaseClient';

type AppRow = any;

const AdminArtistsPage: React.FC = () => {
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [viewingImage, setViewingImage] = useState<{ id: string; url: string } | null>(null);
  // Load applications with robust fallbacks
  const loadApplications = async () => {
    try {
      // Fetch pending artist applications from Supabase using standard columns
      const { data, error } = await supabase
        .from('artist_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        setApplications([]);
        setSupabaseError(null);
        return;
      }

      setApplications(data || []);
      setSupabaseError(null);
    } catch (err: any) {
      console.error('Failed to load artist applications', err);
      setSupabaseError(err?.message || String(err));
      // fallback to localStorage apps for admins when Supabase is unavailable
      const raw = localStorage.getItem('spv_artist_applications');
      const apps = raw ? JSON.parse(raw) : [];
      setApplications(apps || []);
    }
  };

  useEffect(() => { loadApplications(); }, []);
  useEffect(() => {
    // Subscribe to changes on artist_applications so admin view updates in real-time
    let unsub: (() => void) | null = null;
    try {
      unsub = subscribeToTable('artist_applications', async () => {
        await loadApplications();
      });
    } catch (err) {
      console.warn('Failed to subscribe to artist_applications realtime events:', err);
    }
    return () => { try { if (unsub) unsub(); } catch (_) {} };
  }, []);

  // Dummy data for products needing pricing - replace with real data
  // Prefer modern `images` array when available; fallback to legacy `imageUrl` or placeholder
  const productsToPrice = [
    { id: 101, artist: 'Jane Doe', requestedCost: 150, images: ['https://via.placeholder.com/150'] },
    { id: 102, artist: 'John Smith', requestedCost: 200, images: ['https://via.placeholder.com/150'] },
  ];

    // Dummy data for QC
    const qcItems = [
        { id: 1, orderId: 'ORD-123', artist: 'Jane Doe', status: 'Pending Inspection' },
        { id: 2, orderId: 'ORD-124', artist: 'John Smith', status: 'Pending Inspection' },
    ];

  return (
    <div className="p-8">
      {viewingImage && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg overflow-hidden max-w-3xl w-full">
            <div className="p-2 flex justify-end">
              <button onClick={() => setViewingImage(null)} className="px-3 py-1 bg-zinc-800 text-white rounded">Close</button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center">
              <img src={viewingImage.url} alt="ID Document" className="max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}
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
                        <p className="font-bold">{app.shop_name || `Applicant ${app.user_id?.slice(0, 8) || '—'}`}</p>
                        <p className="text-sm text-zinc-500">User ID: <strong>{app.user_id || '—'}</strong></p>
                        <p className="text-sm text-zinc-500">Status: {app.status || 'pending'}</p>
                        <p className="text-sm text-zinc-500 mt-1">Submitted: {(() => {
                          const dateVal = app.created_at || app.submitted_at || app.submittedAt || app.submitted || app.createdAt;
                          try { return dateVal ? new Date(dateVal).toLocaleString() : '—'; } catch (_) { return '—'; }
                        })()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-zinc-500">Images: {(app.product_images || app.productImages || []).length}</div>
                      </div>
                    </div>

                    <div className="mt-3 md:mt-0 flex gap-3 items-center">
                      <button onClick={async () => {
                        // Load signed URL for ID document and display
                        try {
                          if (!app.id_document_url) {
                            alert('No ID document uploaded for this application.');
                            return;
                          }
                          // If already cached, use it
                          if (signedUrls[app.id]) {
                            setViewingImage({ id: app.id, url: signedUrls[app.id] });
                            return;
                          }
                          const { data: signedData, error: signedErr } = await supabase.storage.from('artist-applications').createSignedUrl(app.id_document_url, 3600);
                          if (signedErr || !signedData?.signedUrl) {
                            throw signedErr || new Error('Failed to create signed URL');
                          }
                          setSignedUrls(prev => ({ ...prev, [app.id]: signedData.signedUrl }));
                          setViewingImage({ id: app.id, url: signedData.signedUrl });
                        } catch (err) {
                          console.error('Failed to fetch signed URL for ID document', err);
                          alert('Failed to load ID document. See console for details.');
                        }
                      }} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">View ID</button>

                      <button onClick={async () => {
                        // Approve: update application status to 'approved'
                        try {
                          await supabase.from('artist_applications').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', app.id);
                          // update user's application status and notify
                          if (app.user_id) {
                            await supabase.from('users').update({ artistApplicationStatus: 'approved' }).eq('id', app.user_id);
                            await supabase.from('notifications').insert([{ user_id: app.user_id, type: 'system', title: 'Artist Application Approved!', message: 'Congratulations! Your artist application has been approved. You can now access your artist dashboard and start listing products.', created_at: new Date().toISOString(), read: false }]);
                          }
                          // refresh list
                          await loadApplications();
                          alert('Application approved successfully!');
                        } catch (err) {
                          console.error('Error approving application', err);
                          alert('Failed to approve application. See console for details.');
                        }
                      }} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500">Approve</button>

                      <button onClick={async () => {
                        const reason = prompt('Optional note for rejection (will be sent to the artist):') || '';
                        try {
                          await supabase.from('artist_applications').update({ status: 'rejected', rejected_at: new Date().toISOString() }).eq('id', app.id);
                          if (app.user_id) {
                            await supabase.from('users').update({ artistApplicationStatus: 'rejected' }).eq('id', app.user_id);
                            await supabase.from('notifications').insert([{ user_id: app.user_id, type: 'system', title: 'Artist Application Update', message: `We regret to inform you that your application has been declined. ${reason}`, created_at: new Date().toISOString(), read: false }]);
                          }
                          await loadApplications();
                          alert('Application rejected.');
                        } catch (err) {
                          console.error('Error rejecting application', err);
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
                {productsToPrice.map((product: any) => (
                  <div key={product.id} className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
                    <img src={(product.images && product.images[0]) || product.imageUrl || 'https://via.placeholder.com/150'} alt="Product" className="w-full h-48 object-cover rounded-md mb-4" />
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

