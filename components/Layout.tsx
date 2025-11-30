import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User as UserIcon, Heart, LayoutDashboard, LogIn, Crown, Bell, Award, Gift, Truck, Sparkles, Tag, Users, CheckCircle, TrendingUp, Smartphone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import SocialProofPopup from './SocialProofPopup';
import ShippingProgressBar from './ShippingProgressBar';
import InstallAppPrompt from './InstallAppPrompt';

const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cart, user, isStickyProgressBarVisible, setIsStickyProgressBarVisible, getCartTotal } = useStore();
  const location = useLocation();

  // Scroll to top whenever the route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = getCartTotal();
  const wishlistCount = user.wishlist ? user.wishlist.length : 0;
  const unreadNotifications = user.notifications ? user.notifications.filter(n => !n.isRead).length : 0;

  return (
    <div className="min-h-screen flex flex-col bg-black text-gray-100">
      {/* GLOBAL MARQUEE BANNER */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="w-full bg-zinc-900 border-b border-white/5 overflow-hidden py-2 relative z-[60]">
          <div className="flex animate-marquee whitespace-nowrap">
              {/* Content Set 1 */}
              <div className="flex items-center gap-8 px-4">
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-wider">
                     <Users size={14} className="text-cyan-400" /> Trusted by 10,000+ Shoppers
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-wider">
                     <Sparkles size={14} className="text-yellow-400" /> Sold over 50,000 unique vintage pieces
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-wider">
                     <Truck size={14} className="text-green-400" /> Free Shipping over R500
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-pink-300 uppercase tracking-wider">
                     <Gift size={14} className="text-pink-500" /> Membership Perk: Free Gifts on Valentine's, Mother's & Father's Day
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-purple-300 uppercase tracking-wider">
                     <Tag size={14} className="text-purple-500" /> Membership Perk: Pay as little as R8 per item
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-cyan-300 uppercase tracking-wider">
                     <Award size={14} className="text-cyan-500" /> Membership Perk: R50 - R200 Birthday Voucher
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-wider">
                     <CheckCircle size={14} className="text-green-500" /> And lots more!
                  </span>
              </div>

              {/* Content Set 2 (Duplicate for seamless loop) */}
              <div className="flex items-center gap-8 px-4">
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-wider">
                     <Users size={14} className="text-cyan-400" /> Trusted by 10,000+ Shoppers
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-wider">
                     <Sparkles size={14} className="text-yellow-400" /> Sold over 50,000 unique vintage pieces
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-wider">
                     <Truck size={14} className="text-green-400" /> Free Shipping over R500
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-pink-300 uppercase tracking-wider">
                     <Gift size={14} className="text-pink-500" /> Membership Perk: Free Gifts on Valentine's, Mother's & Father's Day
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-purple-300 uppercase tracking-wider">
                     <Tag size={14} className="text-purple-500" /> Membership Perk: Pay as little as R8 per item
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-cyan-300 uppercase tracking-wider">
                     <Award size={14} className="text-cyan-500" /> Membership Perk: R50 - R200 Birthday Voucher
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-wider">
                     <CheckCircle size={14} className="text-green-500" /> And lots more!
                  </span>
              </div>
          </div>
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex flex-col lg:flex-row items-center justify-center lg:justify-between h-auto lg:h-20 py-4 lg:py-0 gap-3">
            
            {/* Mobile Menu Toggle - Positioned Absolutely */}
            <button 
              className="absolute top-1/2 -translate-y-1/2 left-4 lg:hidden p-2 rounded-md text-gray-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 group flex flex-col items-center leading-none">
              <span className="font-cherry text-[24px] font-bold text-pink-500 group-hover:text-pink-400 transition-colors drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]">
                Spoil Me
              </span>
              <span className="font-cherry text-[24px] font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] ml-7 -mt-1">
                Vintage
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 space-x-8">
              <Link to="/" className={`text-sm font-medium hover:text-cyan-400 transition-colors ${location.pathname === '/' ? 'text-cyan-400' : 'text-gray-300'}`}>Home</Link>
              <Link to="/#catalog" className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors">Catalog</Link>
              <Link to="/membership" className={`text-sm font-medium flex items-center gap-1 hover:text-purple-400 transition-colors ${location.pathname === '/membership' ? 'text-purple-400 font-bold' : 'text-gray-300'}`}>
                <Crown size={14} /> Membership
              </Link>
              <Link to="/#specials" className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors">Specials</Link>
            </nav>

            {/* Icons (Sequence: Search -> Rewards -> Bell -> Wishlist -> User -> Cart) */}
            <div className="flex items-center space-x-1 sm:space-x-3 w-full lg:w-auto justify-center lg:justify-end">
              <button className="p-2 text-gray-400 hover:text-cyan-400 transition-colors">
                <Search size={20} />
              </button>
              {user.email ? (
                <Link to="/earn-rewards" className="group flex items-center justify-center p-2 relative" title="Your Loyalty Rewards">
                  <div className="flex items-center gap-1.5 hover:bg-purple-900/50 px-2 py-1 rounded-full transition-colors border border-transparent hover:border-purple-500/30">
                    <Award size={20} className="text-purple-400 group-hover:text-pink-400" />
                    <span className="hidden md:inline-block text-xs font-bold text-purple-200 group-hover:text-white">
                      {user.loyaltyPoints}
                    </span>
                  </div>
                </Link>
              ) : (
                 <Link to="/earn-rewards" className="p-2 text-gray-400 hover:text-purple-400 transition-colors relative" title="Earn Rewards">
                    <Award size={20} />
                 </Link>
              )}
              {user.email && (
                <Link to="/profile" className="p-2 text-gray-400 hover:text-yellow-400 transition-colors relative group">
                  <Bell size={20} />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold leading-none text-black transform translate-x-1/4 -translate-y-1/4 bg-yellow-400 rounded-full shadow-[0_0_5px_rgba(250,204,21,0.8)]">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>
              )}
              <Link to="/profile" className="p-2 text-gray-400 hover:text-pink-500 transition-colors relative group">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-pink-600 rounded-full shadow-[0_0_5px_rgba(236,72,153,0.8)]">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              {user.email ? (
                <Link to="/profile" className="p-2 text-gray-400 hover:text-cyan-400 transition-colors relative">
                  <UserIcon size={20} />
                </Link>
              ) : (
                <Link to="/login" className="p-2 text-gray-400 hover:text-cyan-400 transition-colors relative flex items-center gap-1">
                  <LogIn size={20} />
                </Link>
              )}
              <Link to="/cart" className="p-2 text-gray-400 hover:text-pink-500 transition-colors relative group">
                <ShoppingCart size={20} />
                {cartItemCount > 0 && (
                  <span className="absolute top-1 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold leading-none text-black transform translate-x-1/4 -translate-y-1/4 bg-green-400 rounded-full shadow-[0_0_5px_rgba(74,222,128,0.8)]">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-zinc-900 border-b border-gray-800 shadow-lg animate-in slide-in-from-top-5 duration-200 z-40">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-zinc-800 hover:text-cyan-400">Home</Link>
              <Link to="/membership" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-purple-400 hover:bg-zinc-800 hover:text-purple-300 flex items-center gap-2">
                  <Crown size={16} /> Membership Perks
              </Link>
              <Link to="/earn-rewards" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-zinc-800 hover:text-cyan-400 flex items-center gap-2">
                  <Award size={16} className="text-purple-400" /> 
                  {user.email ? 'My Rewards' : 'Earn Rewards'}
                  {user.email && <span className="bg-purple-900/50 text-purple-200 text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto">{user.loyaltyPoints} Pts</span>}
              </Link>
              <Link to="/affiliate-program" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-zinc-800 hover:text-green-400 flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-500" /> Partnership Program
              </Link>
              {user.email ? (
                 <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-zinc-800 hover:text-cyan-400 flex items-center justify-between">
                    My Profile
                    {unreadNotifications > 0 && <span className="bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full font-bold">{unreadNotifications} New</span>}
                 </Link>
              ) : (
                 <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-zinc-800 hover:text-cyan-400">Login / Register</Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <SocialProofPopup />
      
      {isStickyProgressBarVisible && cartTotal > 0 && (
        <ShippingProgressBar 
            subtotal={cartTotal}
            isSticky={true}
            onClose={() => setIsStickyProgressBarVisible(false)}
        />
      )}

      {/* Install app prompt for mobile users */}
      <InstallAppPrompt />

      <footer className="bg-zinc-950 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8">
               <div>
                 <h3 className="text-sm font-semibold text-cyan-400 tracking-wider uppercase mb-4">About</h3>
                 <ul className="space-y-3 text-sm text-gray-400">
                   <li className="hover:text-white cursor-pointer">Our Story</li>
                   <li className="hover:text-white cursor-pointer">Careers</li>
                   <li className="hover:text-white cursor-pointer">Press</li>
                 </ul>
               </div>
               <div>
                 <h3 className="text-sm font-semibold text-cyan-400 tracking-wider uppercase mb-4">Support</h3>
                 <ul className="space-y-3 text-sm text-gray-400">
                   <li className="hover:text-white cursor-pointer">Contact Us</li>
                   <li className="hover:text-white cursor-pointer">Shipping</li>
                   <li className="hover:text-white cursor-pointer">Returns</li>
                   <li 
                       className="hover:text-green-400 cursor-pointer flex items-center gap-2 text-gray-300 font-medium"
                     >
                       <a href="https://spoilme-edee0.web.app/Spoil-Me-Vintage-0.1.apk" download style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none'}}>
                        <Smartphone size={14} /> Download App
                       </a>
                     </li>
                 </ul>
               </div>
            </div>

            {user.isAdmin && (
               <div className="mt-12 pt-8 border-t border-gray-900 flex justify-center">
                   <Link 
                     to="/admin" 
                     className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 uppercase tracking-widest font-bold transition-colors bg-red-900/10 px-4 py-2 rounded border border-red-900/30"
                   >
                      <LayoutDashboard size={14} /> Admin Dashboard
                   </Link>
               </div>
            )}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
