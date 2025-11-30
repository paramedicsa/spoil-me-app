import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Membership from './pages/Membership';
import EarnRewards from './pages/EarnRewards'; 
import AffiliateProgram from './pages/AffiliateProgram'; // NEW
import GiftCards from './pages/GiftCards';
import Collection from './pages/Collection'; 
import Catalog from './pages/Catalog';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminGiftCards from './pages/admin/AdminGiftCards';
import AdminSocial from './pages/admin/AdminSocial';
import AdminAffiliates from './pages/admin/AdminAffiliates'; // NEW
import InstallPWA from './components/InstallPWA'; // NEW
import WeeklyWinners from './pages/WeeklyWinners'; // NEW
import AdminWinners from './pages/admin/AdminWinners'; // NEW
import AdminExpenses from './pages/admin/AdminExpenses'; // NEW
import AdminOrders from './pages/admin/AdminOrders'; // NEW
import { Download, Smartphone, X, Zap, Ticket } from 'lucide-react';

// App Download Prompt Component
const AppDownloadPrompt: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
     <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
     <div className="relative bg-zinc-900 border-2 border-pink-500 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(236,72,153,0.4)] animate-in zoom-in-95 duration-300 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
        
        <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform rotate-3">
           <Ticket size={32} className="text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Voucher Redeemed!</h2>
        <p className="text-gray-300 text-sm mb-6">
           To ensure your discount applies correctly and for the best shopping experience, please use our App.
        </p>
        
        <button 
          className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors mb-3 shadow-lg"
          onClick={() => alert("Please use the Install button at the bottom of the screen.")}
        >
           <Download size={20} /> Install App
        </button>
        <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-300 underline">
           Continue in Browser
        </button>
     </div>
  </div>
);

// Helper component to handle URL query params
const VoucherHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { applyExternalVoucher } = useStore();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
     // Parse Hash based URL params (e.g. /#/home?voucher=123) or search params
     const searchParams = new URLSearchParams(location.search);
     const voucherCode = searchParams.get('voucher');
     
     if (voucherCode) {
        const success = applyExternalVoucher(voucherCode);
        if (success) {
           setShowPrompt(true);
           // Clear param so it doesn't re-trigger
           navigate('/cart', { replace: true });
        }
     }
  }, [location, applyExternalVoucher, navigate]);

  return showPrompt ? <AppDownloadPrompt onClose={() => setShowPrompt(false)} /> : null;
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <HashRouter>
        <VoucherHandler />
        <InstallPWA />
        <Routes>
          {/* Storefront Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="collections/:categoryName" element={<Collection />} /> 
            <Route path="catalog/:type" element={<Catalog />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="profile" element={<Profile />} />
            <Route path="membership" element={<Membership />} />
            <Route path="earn-rewards" element={<EarnRewards />} />
            <Route path="affiliate-program" element={<AffiliateProgram />} />
            <Route path="gift-cards" element={<GiftCards />} />
            <Route path="weekly-winners" element={<WeeklyWinners />} /> {/* NEW */}
            <Route path="login" element={<Login />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="gift-cards" element={<AdminGiftCards />} />
            <Route path="social" element={<AdminSocial />} />
            <Route path="affiliates" element={<AdminAffiliates />} />
            <Route path="winners" element={<AdminWinners />} />
            <Route path="expenses" element={<AdminExpenses />} /> {/* NEW */}
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
};

export default App;