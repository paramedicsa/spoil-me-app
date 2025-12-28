import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { UserPlus, RefreshCw, TestTube, AlertTriangle, Palette } from 'lucide-react';
import { createDocument, deleteDocument, getDocument, isSupabaseConfigured } from '../../utils/supabaseClient';

const AdminDashboard: React.FC = () => {
  const { isDemoMode, resetStore, seedTestUsers, user } = useStore();
  const [testWriteLoading, setTestWriteLoading] = useState(false);

  if (!user || !user.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">You do not have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const adminTabs = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/orders', label: 'Orders' },
    { path: '/admin/products', label: 'Products' },
    { path: '/admin/categories', label: 'Categories' },
    { path: '/admin/artists', label: 'Artists' },
    { path: '/admin/members', label: 'Membership' },
  ];

  const handleTestWrite = async () => {
    if (!isSupabaseConfigured) { alert('Supabase is not configured in this environment.'); return; }
    setTestWriteLoading(true);
    const id = `admin-test-${Date.now()}`;
    try {
      const doc: any = { id, name: 'Admin Test Write', slug: `admin-test-write-${Date.now()}`, price: 0, priceUSD: 0, category: 'System', type: 'Other', status: 'draft', images: [], createdAt: new Date().toISOString(), tags: [] };
      await createDocument('products', doc);
      const remote = await getDocument('products', id);
      if (remote) {
        alert('Supabase write succeeded (test record created and verified). It will be removed now.');
      } else {
        alert('Test write completed but verification read-back failed. Check DB permissions.');
      }
    } catch (err: any) {
      console.error('Admin test write failed:', err);
      alert('Supabase test write failed: ' + (err?.message || err));
    } finally {
      try { await deleteDocument('products', id); } catch (_) {}
      setTestWriteLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <div className="flex gap-2">
          {!isDemoMode && (
            <button onClick={seedTestUsers} className="flex items-center gap-2 text-xs bg-purple-900/30 text-purple-400 border border-purple-500/30 px-3 py-2 rounded hover:bg-purple-900/50 transition-colors">
              <UserPlus size={14} /> Seed Test Users
            </button>
          )}
          {isDemoMode && (
            <button onClick={resetStore} className="flex items-center gap-2 text-xs bg-red-900/30 text-red-400 border border-red-500/30 px-3 py-2 rounded hover:bg-red-900/50 transition-colors">
              <RefreshCw size={14} /> Reset Demo Data
            </button>
          )}
          <button
            onClick={handleTestWrite}
            disabled={testWriteLoading}
            className="flex items-center gap-2 text-xs bg-yellow-900/20 text-yellow-300 border border-yellow-500/30 px-3 py-2 rounded hover:bg-yellow-900/30 transition-colors"
          >
            <TestTube size={14} /> {testWriteLoading ? 'Testing...' : 'Test write to Supabase'}
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {adminTabs.map(tab => (
            <Link key={tab.path} to={tab.path} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors">
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-gray-700 p-6 rounded-xl shadow-lg">
        <div className="mt-2">
          <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded-lg mb-4">
            <p className="text-yellow-400 text-sm font-medium flex items-center gap-2">
              <AlertTriangle size={16} />
              Reviews take up to 72 hours. Artists will be notified via email and in-app notification once their application is processed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/artists" className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"><Palette size={16} /> Review Applications</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
