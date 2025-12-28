import React, { useState, useEffect } from 'react';
import { queryDocuments, subscribeToTable, createDocument, updateDocument, deleteDocument, supabase } from '../../utils/supabaseClient';
import { CheckCircle, XCircle, Eye, Package, DollarSign, Users, TrendingUp, Truck, Warehouse, AlertTriangle, Trash } from 'lucide-react';

interface ArtistApplication {
  id: string;
  uid: string;
  name: string;
  surname: string;
  artistTradeName?: string;
  contactNumber: string;
  email: string;
  productImages: string[];
  // legacy / snake_case compatibility
  product_images?: string[];
  id_document_url?: string;
  country?: string;
  website?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
}

interface ArtistProfile {
  uid: string;
  shopName: string;
  slotLimit: number;
  slotsUsed: number;
  wallet: {
    pending: number;
    available: number;
    currency: 'ZAR' | 'USD';
  };
  status: 'active' | 'suspended';
  isFirstTime?: boolean;
}

interface ArtistProduct {
  id: string;
  artistId: string;
  productId: string;
  name: string;
  images: string[];
  description: string;
  price: number;
  stockLevel: number;
  status: 'pending_approval' | 'approved' | 'rejected' | 'live';
  shippingTracking?: string;
  receivedAtHub?: Date;
  approvedAt?: Date;
  additionalStockFee?: number;
  createdAt: Date;
}

const AdminArtists: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'stock' | 'pricing' | 'quality'>('applications');
  const [applications, setApplications] = useState<ArtistApplication[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [products, setProducts] = useState<ArtistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const loadInitial = async () => {
    try {
      setLoading(true);
      const apps = await queryDocuments<any>('artist_applications', { orderBy: { column: 'created_at', ascending: false } });
        if (!apps) {
        setSupabaseError('Could not load artist applications from Supabase (table missing or schema mismatch). Falling back to local demo applications.');
        const raw = localStorage.getItem('spv_artist_applications');
        const demo = raw ? JSON.parse(raw) : [];
        setApplications(demo.map((a: any) => ({ id: a.id, ...a, submittedAt: a.submittedAt ? new Date(a.submittedAt) : new Date(a.submitted_at || a.submitted || a.createdAt || a.created_at) })));
        } else {
          // normalize created_at/submitted_at
          const norm = apps.map((a: any) => {
            const status = (a.status as any) === 'approved' || (a.status as any) === 'rejected' ? a.status as 'approved' | 'rejected' : 'pending';
            const submittedAt = a.created_at ? new Date(a.created_at) : (a.submitted_at ? new Date(a.submitted_at) : new Date());
            return {
              id: a.id,
              uid: a.uid,
              name: a.name || a.first_name || '',
              surname: a.surname || a.last_name || '',
              artistTradeName: a.artistTradeName || a.shop_name || a.artist_trade_name || null,
              contactNumber: a.contactNumber || a.contact_number || '',
              email: a.email || '',
              productImages: a.productImages || a.product_images || [],
              product_images: a.product_images || undefined,
              id_document_url: a.id_document_url || null,
              country: a.country || null,
              website: a.website || null,
              status,
              submittedAt,
            } as ArtistApplication;
          });
          setApplications(norm);
        setSupabaseError(null);
      }

      const arts = await queryDocuments<any>('artists');
      if (!arts) setSupabaseError(prev => prev ? prev : 'Could not load `artists` table from Supabase.');
      else setArtists((arts || []) as ArtistProfile[]);

      const prods = await queryDocuments<any>('artist_products');
      if (!prods) setSupabaseError(prev => prev ? prev : 'Could not load `artist_products` table from Supabase.');
      else setProducts((prods || []).map((p: any) => ({ id: p.id, ...p, createdAt: p.created_at ? new Date(p.created_at) : new Date(), receivedAtHub: p.received_at_hub ? new Date(p.received_at_hub) : null, approvedAt: p.approved_at ? new Date(p.approved_at) : null })));
    } catch (err: any) {
      console.error('loadInitial failed', err);
      setSupabaseError(err?.message || String(err));
      const raw = localStorage.getItem('spv_artist_applications');
      const demo = raw ? JSON.parse(raw) : [];
      const normDemo = demo.map((a: any) => ({
        id: a.id,
        uid: a.uid || null,
        name: a.name || a.first_name || '',
        surname: a.surname || a.last_name || '',
        artistTradeName: a.artistTradeName || a.shop_name || null,
        contactNumber: a.contactNumber || a.contact_number || '',
        email: a.email || '',
        productImages: a.productImages || a.product_images || [],
        product_images: a.product_images || undefined,
        id_document_url: a.id_document_url || null,
        country: a.country || null,
        website: a.website || null,
        status: (a.status === 'approved' || a.status === 'rejected') ? a.status : 'pending',
        submittedAt: a.submittedAt ? new Date(a.submittedAt) : new Date(a.submitted_at || a.submitted || a.createdAt || a.created_at)
      } as ArtistApplication));
      setApplications(normDemo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubApps: (() => void) | null = null;
    let unsubArtists: (() => void) | null = null;
    let unsubProducts: (() => void) | null = null;

    loadInitial();

    // Subscribe to table changes and reload on changes (simple approach)
    unsubApps = subscribeToTable('artist_applications', async () => {
      const apps = await queryDocuments<any>('artist_applications', { orderBy: { column: 'created_at', ascending: false } });
      const norm = (apps || []).map((a: any) => {
        const status = (a.status === 'approved' || a.status === 'rejected') ? a.status : 'pending';
        const submittedAt = a.created_at ? new Date(a.created_at) : (a.submitted_at ? new Date(a.submitted_at) : new Date());
        return {
          id: a.id,
          uid: a.uid,
          name: a.name || '',
          surname: a.surname || '',
          artistTradeName: a.artistTradeName || a.shop_name || null,
          contactNumber: a.contactNumber || '',
          email: a.email || '',
          productImages: a.productImages || a.product_images || [],
          product_images: a.product_images || undefined,
          id_document_url: a.id_document_url || null,
          country: a.country || null,
          website: a.website || null,
          status,
          submittedAt,
        } as ArtistApplication;
      });
      setApplications(norm);
    });

    unsubArtists = subscribeToTable('artists', async () => {
      const arts = await queryDocuments<any>('artists');
      setArtists((arts || []) as ArtistProfile[]);
    });

    unsubProducts = subscribeToTable('artist_products', async () => {
      const prods = await queryDocuments<any>('artist_products');
      setProducts((prods || []).map((p: any) => ({ id: p.id, ...p, createdAt: p.created_at ? new Date(p.created_at) : new Date(), receivedAtHub: p.received_at_hub ? new Date(p.received_at_hub) : null, approvedAt: p.approved_at ? new Date(p.approved_at) : null })));
    });

    return () => {
      if (unsubApps) unsubApps();
      if (unsubArtists) unsubArtists();
      if (unsubProducts) unsubProducts();
    };
  }, []);

  // Fetch signed URLs for private bucket previews (600s expiry)
  useEffect(() => {
    let mounted = true;
    const fetchSigned = async () => {
      try {
        const map: Record<string, string> = {};
        const appsWithPath = applications.filter(a => a.id_document_url);
        await Promise.all(appsWithPath.map(async (app) => {
          try {
            const path = app.id_document_url;
            const { data, error } = await supabase.storage.from('artist-applications').createSignedUrl(path, 600);
            if (!error && data?.signedUrl) map[app.id] = data.signedUrl;
          } catch (e) {
            console.warn('Signed URL fetch failed for', app.id, e);
          }
        }));
        if (mounted) setSignedUrls(map);
      } catch (err) {
        console.warn('Failed to fetch signed URLs', err);
      }
    };
    if (applications.length > 0) fetchSigned();
    return () => { mounted = false; };
  }, [applications]);

  const handleApproveApplication = async (application: ArtistApplication) => {
    // Approve: create artist row, update application status, notify admins
    // Make the operations tolerant: try Supabase first, fallback to local demo data
    try {
      // create artist record (best-effort)
      const artistPayload: any = {
        name: application.name || null,
        surname: application.surname || null,
        shop_name: application.artistTradeName || null,
        user_id: application.uid || null,
        country: application.country || null,
        website: application.website || null,
      };

      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .insert([artistPayload])
        .select('*')
        .single();

      if (artistError) console.warn('Artist insert warning', artistError.message || artistError);

      // update application status
      const { error: updateError } = await supabase
        .from('artist_applications')
        .update({ status: 'approved' })
        .eq('id', application.id);

      if (updateError) console.warn('Application status update warning', updateError.message || updateError);

      // send notification (Edge Function path)
      try {
        await fetch('/.netlify/functions/send-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Artist Approved', body: `${application.name || ''} ${application.surname || ''} was approved.` }),
        });
      } catch (notifyErr) {
        console.warn('Notification send failed', notifyErr);
      }

      // remove from local state
      setApplications(prev => prev.filter(a => a.id !== application.id));

      // If we created an artist locally and we have an id, show a small success toast (console for now)
      console.log('Application approved', artistData || null);
    } catch (err) {
      console.error('Approve failed, falling back to local update', err);
      // Fallback to localStorage demo update
      const updated: ArtistApplication[] = applications.map(a => a.id === application.id ? { ...a, status: 'approved' } : a);
      setApplications(updated);
      localStorage.setItem('demo_artist_applications', JSON.stringify(updated));
    }
  };

  const handleRejectApplication = async (application: ArtistApplication) => {
    try {
      await updateDocument('artist_applications', application.id, { status: 'rejected' });

      // Send notification to user
      await createDocument('notifications', {
        userId: application.uid,
        type: 'system',
        title: 'Artist Application Update',
        message: 'We regret to inform you that your artist application has been declined.',
        date: new Date().toISOString(),
        isRead: false
      });

      alert('Application rejected.');
    } catch (error) {
      console.error('Error rejecting application:', error);
      try {
        const raw = localStorage.getItem('spv_artist_applications');
        if (raw) {
          const arr = JSON.parse(raw).map((a: any) => a.id === application.id ? { ...a, status: 'rejected', rejectedAt: new Date().toISOString() } : a);
          localStorage.setItem('spv_artist_applications', JSON.stringify(arr));
          setApplications(arr.map((a: any) => ({ ...a, submittedAt: a.submittedAt ? new Date(a.submittedAt) : new Date(a.submitted_at || a.submitted || a.createdAt || a.created_at) })));
          alert('Application rejected in local/demo storage (Supabase unavailable).');
          return;
        }
      } catch (e) {
        console.warn('Local fallback failed', e);
      }
      alert('Failed to reject application.');
    }
  };

  const handleApproveProduct = async (product: ArtistProduct) => {
    try {
      // Update product status to approved
      await updateDocument('artist_products', product.id, { status: 'approved', approved_at: new Date().toISOString() });

      // Optionally, send notification to artist about product approval
      const artist = artists.find(a => a.uid === product.artistId);
      if (artist) {
        await createDocument('notifications', {
          userId: artist.uid,
          type: 'system',
          title: 'Product Approved',
          message: `Your product "${product.name}" has been approved and is now live.`,
          date: new Date().toISOString(),
          isRead: false
        });
      }

      alert('Product approved successfully!');
    } catch (error) {
      console.error('Error approving product:', error);
      alert('Failed to approve product.');
    }
  };

  const handleRejectProduct = async (product: ArtistProduct) => {
    try {
      // Update product status to rejected
      await updateDocument('artist_products', product.id, { status: 'rejected' });

      // Optionally, send notification to artist about product rejection
      const artist = artists.find(a => a.uid === product.artistId);
      if (artist) {
        await createDocument('notifications', {
          userId: artist.uid,
          type: 'system',
          title: 'Product Rejected',
          message: `Your product "${product.name}" has been rejected. Please check the quality standards and re-submit.`,
          date: new Date().toISOString(),
          isRead: false
        });
      }

      alert('Product rejected.');
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('Failed to reject product.');
    }
  };

  const handleStockReceive = async (product: ArtistProduct) => {
    try {
      // Update product stock level and status
      await updateDocument('artist_products', product.id, { stock_level: (product.stockLevel || 0) + 1, status: 'live', received_at_hub: new Date().toISOString() });

      alert('Stock received and product updated.');
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDocument('artist_products', productId);
        alert('Product deleted successfully.');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product.');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-white">Loading artist data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Artist Hub</h1>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-zinc-900 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'applications'
              ? 'bg-yellow-400 text-black'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Applications ({applications.filter(a => a.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'pricing'
              ? 'bg-yellow-400 text-black'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Pricing Room
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'quality'
              ? 'bg-yellow-400 text-black'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Quality Control
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'stock'
              ? 'bg-yellow-400 text-black'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Stock Management
        </button>
      </div>

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-yellow-400">Pending Applications</h2>
          <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded-lg">
            <p className="text-yellow-400 text-sm font-medium flex items-center gap-2">
              <AlertTriangle size={16} />
              Reviews take up to 72 hours. Artists will be notified via email and in-app notification once their application is processed.
            </p>
          </div>
                {applications.filter(app => app.status === 'pending').length === 0 ? (
                  <div className="text-gray-400">No pending applications.</div>
                ) : (
                  applications.filter(app => app.status === 'pending').map((app) => (
                    <div key={app.id} className="bg-zinc-900 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4 gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">
                            {app.artistTradeName || `${app.name || ''} ${app.surname || ''}`}
                          </h3>
                          <p className="text-gray-300">{app.email} {app.contactNumber ? `| ${app.contactNumber}` : ''}</p>
                          <p className="text-sm text-gray-400">Applied: {app.submittedAt ? app.submittedAt.toLocaleString() : '—'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!confirm('Approve this application? This will create an artist record.')) return;
                              try {
                                await handleApproveApplication(app);
                              } catch (e) {
                                console.error('Approve action failed', e);
                                alert('Failed to approve application.');
                              }
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle size={16} /> Approve
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Reject this application?')) return;
                              try {
                                await handleRejectApplication(app);
                              } catch (e) {
                                console.error('Reject action failed', e);
                                alert('Failed to reject application.');
                              }
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors flex items-center gap-2"
                          >
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        {/* ID document preview (signed URL) */}
                        {app.id_document_url ? (
                          <div className="col-span-1">
                            {signedUrls[app.id] ? (
                              <img src={signedUrls[app.id]} alt="ID document" className="w-full h-40 object-contain rounded border border-zinc-700" />
                            ) : (
                              <div className="w-full h-40 flex items-center justify-center bg-zinc-800 rounded border border-zinc-700 text-sm text-zinc-400">No preview available</div>
                            )}
                          </div>
                        ) : null}

                        {/* Product images or other uploaded previews (if present) */}
                        {Array.isArray(app.product_images || app.productImages) && (app.product_images || app.productImages).slice(0, 4).map((image: string, index: number) => (
                          <img key={index} src={image} alt={`Product ${index + 1}`} className="w-full h-40 object-cover rounded border border-zinc-700" />
                        ))}
                      </div>
                    </div>
                  ))
                )}

          <h2 className="text-xl font-bold text-yellow-400 mt-8">All Applications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-zinc-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">{app.name} {app.surname}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    app.status === 'approved' ? 'bg-green-600' :
                    app.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{app.email}</p>
                <p className="text-xs text-gray-500">{app.submittedAt.toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Room Tab */}
      {activeTab === 'pricing' && (
        <div>
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Pricing Room</h2>
          <div className="text-gray-400">
            Product pricing interface will be implemented here.
            Artists upload products, admin sets selling prices and RRP.
          </div>
        </div>
      )}

      {/* Quality Control Tab */}
      {activeTab === 'quality' && (
        <div>
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Quality Control Hub</h2>
          <div className="text-gray-400">
            Quality inspection interface will be implemented here.
            Scan order IDs, pass/fail inspections.
          </div>
        </div>
      )}

      {/* Stock Management Tab */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-yellow-400">Artist Stock Management</h2>
          {products.length === 0 ? (
            <div className="text-gray-400">No products found. Encourage artists to upload products.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-zinc-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white">{product.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      product.status === 'approved' ? 'bg-green-600' :
                      product.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Artist: {artists.find(a => a.uid === product.artistId)?.shopName}</p>
                  <p className="text-xs text-gray-500">Stock Level: {product.stockLevel}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleApproveProduct(product)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex-1"
                    >
                      Approve Product
                    </button>
                    <button
                      onClick={() => handleRejectProduct(product)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex-1"
                    >
                      Reject Product
                    </button>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-white text-sm font-semibold mb-2">Product Images</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {product.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Product Image ${index + 1}`}
                          className="w-full h-20 object-cover rounded border border-zinc-700"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleStockReceive(product)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1"
                    >
                      <Truck className="w-5 h-5 mr-2" /> Receive Stock
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 transition-colors flex-1"
                    >
                      <Trash className="w-5 h-5 mr-2" /> Delete Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminArtists;
