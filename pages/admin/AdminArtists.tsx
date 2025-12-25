import React, { useState, useEffect } from 'react';
import { queryDocuments, subscribeToTable, createDocument, updateDocument, deleteDocument } from '@repo/utils/supabaseClient';
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
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [products, setProducts] = useState<ArtistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubApps: (() => void) | null = null;
    let unsubArtists: (() => void) | null = null;
    let unsubProducts: (() => void) | null = null;

    const loadInitial = async () => {
      const apps = await queryDocuments<any>('artist_applications', { orderBy: { column: 'submitted_at', ascending: false } });
      setApplications((apps || []).map((a: any) => ({ id: a.id, ...a, submittedAt: a.submitted_at ? new Date(a.submitted_at) : new Date() })));

      const arts = await queryDocuments<any>('artists');
      setArtists((arts || []) as ArtistProfile[]);
      setLoading(false);

      const prods = await queryDocuments<any>('artist_products');
      setProducts((prods || []).map((p: any) => ({ id: p.id, ...p, createdAt: p.created_at ? new Date(p.created_at) : new Date(), receivedAtHub: p.received_at_hub ? new Date(p.received_at_hub) : null, approvedAt: p.approved_at ? new Date(p.approved_at) : null })));
    };

    loadInitial();

    // Subscribe to table changes and reload on changes (simple approach)
    unsubApps = subscribeToTable('artist_applications', async () => {
      const apps = await queryDocuments<any>('artist_applications', { orderBy: { column: 'submitted_at', ascending: false } });
      setApplications((apps || []).map((a: any) => ({ id: a.id, ...a, submittedAt: a.submitted_at ? new Date(a.submitted_at) : new Date() })));
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

  const handleApproveApplication = async (application: ArtistApplication) => {
    try {
      // Create artist profile
      const artistData: ArtistProfile = {
        uid: application.uid,
        shopName: application.artistTradeName || `${application.name} ${application.surname}`,
        slotLimit: 5, // Start with tester tier
        slotsUsed: 0,
        wallet: {
          pending: 0,
          available: 0,
          currency: 'ZAR'
        },
        status: 'active',
        isFirstTime: true // Mark as first-time artist
      };

      await createDocument('artists', artistData);

      // Update application status
      await updateDocument('artist_applications', application.id, { status: 'approved' });

      // Send notification to user
      await createDocument('notifications', {
        userId: application.uid,
        type: 'system',
        title: 'Artist Application Approved!',
        message: 'Welcome to Spoil Me Vintage Artist Program! As a first-time artist, you can upload 1 product initially. Please ship it to our Worcester Hub for approval.',
        date: new Date().toISOString(),
        isRead: false
      });

      alert('Application approved successfully!');
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application.');
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
      <h1 className="text-3xl font-bold text-white mb-8">Artist Hub</h1>

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
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {app.name} {app.surname}
                      {app.artistTradeName && <span className="text-yellow-400"> ({app.artistTradeName})</span>}
                    </h3>
                    <p className="text-gray-300">{app.email} | {app.contactNumber}</p>
                    <p className="text-sm text-gray-400">Applied: {app.submittedAt.toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveApplication(app)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleRejectApplication(app)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {app.productImages.slice(0, 5).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-20 object-cover rounded border border-zinc-700"
                    />
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
