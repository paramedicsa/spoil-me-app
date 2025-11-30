import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, ArrowLeft, Gift, Share2, Users, Trophy, DollarSign, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useStore();

  useEffect(() => {
    if (!user.isAdmin) {
      navigate('/login');
    }
  }, [user, navigate]);

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/categories', icon: Tags, label: 'Categories' },
    { path: '/admin/gift-cards', icon: Gift, label: 'Gift Cards' },
    { path: '/admin/social', icon: Share2, label: 'Social Studio' },
    { path: '/admin/affiliates', icon: Users, label: 'Affiliates' },
    { path: '/admin/winners', icon: Trophy, label: 'Weekly Winners' },
    { path: '/admin/expenses', icon: DollarSign, label: 'Expenses' },
  ];

  if (!user.isAdmin) return null;

  return (
    <div className="min-h-screen bg-black flex text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-gray-800 hidden md:flex flex-col fixed h-full">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <span className="text-xl font-bold text-pink-500 drop-shadow-[0_0_3px_rgba(236,72,153,0.6)]">Spoil Me Vintage</span>
          <span className="ml-2 text-xs bg-purple-900/50 border border-purple-500/50 text-purple-300 px-2 py-0.5 rounded">ADMIN</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:bg-zinc-800 hover:text-white rounded-lg mb-4 transition-colors">
            <ArrowLeft size={18} /> Back to Store
          </Link>
          <div className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2 mt-6">Management</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive ? 'bg-pink-900/20 text-pink-400 border border-pink-500/20' : 'text-gray-400 hover:bg-zinc-800 hover:text-white'}`}
              >
                <item.icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto bg-black">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
      
      {/* Mobile Overlay (simplified) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-gray-800 flex justify-around py-3 z-50 overflow-x-auto">
         <Link to="/admin" className="p-2 text-gray-400 hover:text-white"><LayoutDashboard size={24} /></Link>
         <Link to="/admin/orders" className="p-2 text-gray-400 hover:text-white"><ShoppingBag size={24} /></Link>
         <Link to="/admin/products" className="p-2 text-gray-400 hover:text-white"><Package size={24} /></Link>
         <Link to="/admin/social" className="p-2 text-gray-400 hover:text-white"><Share2 size={24} /></Link>
         <Link to="/admin/gift-cards" className="p-2 text-gray-400 hover:text-white"><Gift size={24} /></Link>
         <Link to="/admin/affiliates" className="p-2 text-gray-400 hover:text-white"><Users size={24} /></Link>
         <Link to="/admin/expenses" className="p-2 text-gray-400 hover:text-white"><DollarSign size={24} /></Link>
      </div>
    </div>
  );
};

export default AdminLayout;