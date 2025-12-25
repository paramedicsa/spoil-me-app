import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, ArrowLeft, Gift, Share2, Users, Trophy, DollarSign, ShoppingBag, UserCheck, Archive, Bell, User, Sparkles, Palette } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.isAdmin) {
      // Provide a clear reason for redirect so the Login page can show guidance
      try { localStorage.setItem('spv_admin_denied', 'Your account does not have admin rights. If this is a local dev machine use "Ensure Admin (dev)" on the Login page, or set is_admin=true for your user in the database.'); } catch (_) {}
      navigate('/login');
    }
  }, [user, navigate]);

  // === THE MASTER LIST ===
  const navItems = [
    // 0: Dashboard
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
    // 1: Orders
    { path: '/admin/orders', icon: ShoppingBag, label: 'Orders', permission: 'orders' },
    // 2: Products
    { path: '/admin/products', icon: Package, label: 'Products', permission: 'products' },
    // 3: Categories
    { path: '/admin/categories', icon: Tags, label: 'Categories', permission: 'categories' },
    // 4: Artists (replaced Users)
    { path: '/admin/artists', icon: Palette, label: 'Artists', permission: 'artists' },
    // 5: Gift Cards
    { path: '/admin/gift-cards', icon: Gift, label: 'Gift Cards', permission: 'giftCards' },
    // 6: Social
    { path: '/admin/social', icon: Share2, label: 'Social Studio', permission: 'social' },
    // 7: Affiliates
    { path: '/admin/affiliates', icon: Users, label: 'Affiliates', permission: 'affiliates' },
    // 8: Affiliate Requests
    { path: '/admin/affiliate-requests', icon: UserCheck, label: 'Requests', permission: 'affiliates' },
    // 9: Push Notify
    { path: '/admin/notifications', icon: Bell, label: 'Push Notify', permission: 'notifications' },
    // 10: Winners
    { path: '/admin/winners', icon: Trophy, label: 'Weekly Winners', permission: 'winners' },
    // 11: Expenses
    { path: '/admin/expenses', icon: DollarSign, label: 'Expenses', permission: 'expenses' },
    // 12: Membership
    { path: '/admin/members', icon: UserCheck, label: 'Membership', permission: 'members' },
    // 13: Vault
    { path: '/admin/vault', icon: Archive, label: 'Vault', permission: 'vault' },
    // 14: Custom Pendants
    { path: '/admin/custom-pendant-manager', icon: Sparkles, label: 'Custom Pendants', permission: 'products' },
    { path: '/admin/ad-pricing', icon: DollarSign, label: 'Ad Pricing', permission: 'admin' },
  ];

  // Filter nav items based on user permissions
  const filteredNavItems = navItems.filter(item => {
    // If user is the owner (spoilmevintagediy@gmail.com), show all tabs
    if (user?.email === 'spoilmevintagediy@gmail.com') {
      return true;
    }
    // Otherwise, check admin permissions
    return user?.adminPermissions?.[item.permission] === true;
  });

  if (!user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-black flex text-gray-100">
      <aside className="w-64 bg-zinc-900 border-r border-gray-800 hidden md:flex flex-col fixed h-full">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <span className="text-xl font-bold text-pink-500">Spoil Me Vintage</span>
          <span className="ml-2 text-xs bg-purple-900/50 border border-purple-500/50 text-purple-300 px-2 py-0.5 rounded">ADMIN</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:bg-zinc-800 hover:text-white rounded-lg mb-4 transition-colors">
            <ArrowLeft size={18} /> Back to Store
          </Link>

          {/* GROUP 1: MANAGEMENT (Items 0-4) */}
          <div className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2 mt-2">Management</div>
          {filteredNavItems.slice(0, 5).map((item) => (
             <AdminNavLink key={item.path} item={item} location={location} />
          ))}

          {/* GROUP 2: MARKETING (Items 5-9) */}
          <div className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2 mt-6">Marketing</div>
          {filteredNavItems.slice(5, 10).map((item) => (
             <AdminNavLink key={item.path} item={item} location={location} />
          ))}

          {/* GROUP 3: OPERATIONS (Items 10-13) */}
          <div className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2 mt-6">Operations</div>
          {filteredNavItems.slice(10).map((item) => (
             <AdminNavLink key={item.path} item={item} location={location} />
          ))}
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-8 overflow-y-auto bg-black h-screen">
        <div className="max-w-6xl mx-auto pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-gray-800 flex justify-between px-4 py-3 z-50 overflow-x-auto gap-4">
         {filteredNavItems.map((item) => (
            <Link key={item.path} to={item.path} className={`p-2 rounded-lg ${location.pathname === item.path ? 'text-pink-400 bg-pink-900/20' : 'text-gray-400 hover:text-white'}`}>
                <item.icon size={24} />
            </Link>
         ))}
      </div>
    </div>
  );
};

// Helper component to keep code clean
const AdminNavLink = ({ item, location }: { item: any, location: any }) => {
  const isActive = location.pathname === item.path;
  return (
    <Link to={item.path} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive ? 'bg-pink-900/20 text-pink-400 border border-pink-500/20' : 'text-gray-400 hover:bg-zinc-800 hover:text-white'}`}>
      <item.icon size={18} /> {item.label}
    </Link>
  );
};

export default AdminLayout;