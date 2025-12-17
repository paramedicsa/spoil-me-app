import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Award, DollarSign, Copy, ShoppingBag, LogOut, HelpCircle, ShoppingCart, Share2, MessageCircle, X, User } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useNavigate, Link } from 'react-router-dom';
import { handleImageError } from '../utils/imageUtils';

const Profile: React.FC = () => {
  const { user, products, logout, currency, closeAccount } = useStore();
  const navigate = useNavigate();
  const [showLoyaltyHelp, setShowLoyaltyHelp] = useState(false);
  const [showCloseAccountModal, setShowCloseAccountModal] = useState(false);
  const [closeAccountReason, setCloseAccountReason] = useState('');

  const wishlistProducts = products.filter(p => (user.wishlist || []).includes(p.id));

  if (!user.email) {
     navigate('/login');
     return null;
  }

  const pointsPerSpend = currency === 'ZAR' ? 'R10' : '$3';
  const discountRate = currency === 'ZAR' ? 'R1.00' : '$0.50';
  const minRedemption = currency === 'ZAR' ? 'R10' : '$5';
  const maxNonMember = currency === 'ZAR' ? 'R100 (10,000 pts)' : '$50 (10,000 pts)';
  const maxNonMemberShort = currency === 'ZAR' ? 'R100' : '$50';

  const handleCloseAccount = async () => {
    try {
      await closeAccount(closeAccountReason);
      setShowCloseAccountModal(false);
      alert('Sorry to see you go. Your account will be deleted within 24 hours.');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error closing account:', error);
      alert('Failed to close account. Please try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      
      {/* Loyalty Help Modal */}
      {showLoyaltyHelp && (
         <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
             <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowLoyaltyHelp(false)} />
             <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-6 max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-in zoom-in-95 duration-200">
                 <button onClick={() => setShowLoyaltyHelp(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <X size={20} />
                 </button>
                 
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-900/50 rounded-full border border-purple-500 text-purple-300">
                       <Award size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">How Rewards Work</h3>
                 </div>

                 <div className="space-y-4 text-sm text-gray-300">
                    <div className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-green-400 font-bold">1</div>
                        <div>
                           <h4 className="font-bold text-white">Earn Points</h4>
                           <p className="text-xs text-gray-400 mt-1">
                              Get <span className="text-green-400">1 Point for every {pointsPerSpend}</span> spent on products.
                           </p>
                           <p className="text-xs text-gray-400 mt-1">
                              Get <span className="text-green-400">100 Points</span> for every verified review.
                           </p>
                           <p className="text-xs text-gray-400 mt-1">
                              Get <span className="text-green-400">50 Points</span> for sharing products on social media.
                           </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-pink-500 font-bold">2</div>
                        <div>
                           <h4 className="font-bold text-white">Redeem for Discounts</h4>
                           <p className="text-xs text-gray-400 mt-1">
                              100 Points = <span className="text-white font-bold">{discountRate} Discount</span>.
                           </p>
                           <p className="text-xs text-gray-400 mt-1">
                              Minimum redemption is 1000 Points ({minRedemption}).
                           </p>
                        </div>
                    </div>

                    <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded-lg mt-2">
                        <h4 className="font-bold text-purple-300 flex items-center gap-2 text-xs uppercase tracking-wide">
                           <Award size={14} /> Membership Rule
                        </h4>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                           Non-members can redeem up to <strong>{maxNonMember}</strong> per order.
                           To redeem more than {maxNonMemberShort} at once, you must be a <Link to="/membership" className="text-purple-400 underline">Basic Member</Link> or higher.
                        </p>
                    </div>
                 </div>

                 <button 
                   onClick={() => setShowLoyaltyHelp(false)}
                   className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl mt-6 transition-colors"
                 >
                    Got it!
                 </button>
             </div>
         </div>
      )}

      {/* Close Account Modal */}
      {showCloseAccountModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
             <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowCloseAccountModal(false)} />
             <div className="bg-zinc-900 border border-red-500 rounded-2xl p-6 max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in zoom-in-95 duration-200">
                 <button onClick={() => setShowCloseAccountModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <X size={20} />
                 </button>

                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-900/50 rounded-full border border-red-500 text-red-300">
                       <LogOut size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Close Account</h3>
                 </div>

                 <div className="space-y-4 text-sm text-gray-300">
                    <p className="text-red-400 font-semibold">Are you sure you want to close your account?</p>
                    <p className="text-gray-400">This action cannot be undone. Your account and all associated data will be permanently deleted within 24 hours.</p>

                    <div>
                       <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Please tell us why you're leaving (optional)</label>
                       <textarea
                          className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white text-sm focus:border-red-500 outline-none resize-none"
                          rows={3}
                          placeholder="Help us improve our service..."
                          value={closeAccountReason}
                          onChange={(e) => setCloseAccountReason(e.target.value)}
                       />
                    </div>
                 </div>

                 <div className="flex gap-3 mt-6">
                    <button
                       onClick={() => setShowCloseAccountModal(false)}
                       className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
                    >
                       Cancel
                    </button>
                    <button
                       onClick={handleCloseAccount}
                       className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
                    >
                       Close Account
                    </button>
                 </div>
             </div>
         </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div className="flex-1"></div>
        <div className="text-center flex-1">
          <h1 className="text-[28px] font-cherry text-white">Welcome, {user.name || user.firstName || 'User'}</h1>
          <p className="text-[14px] font-architects text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400 italic">
            Your personal vault of timeless treasures—because ordinary is not your style.
          </p>
        </div>
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-gray-700 rounded-full transition-colors text-gray-400 hover:text-red-400"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Loyalty Program Card - Moved to top */}
      <div className="bg-gradient-to-br from-purple-900 to-pink-900 border border-purple-700 rounded-2xl p-6 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)] relative overflow-hidden mb-8">

        {/* Help Button */}
        <button
          onClick={() => setShowLoyaltyHelp(true)}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white z-10"
        >
           <HelpCircle size={18} />
        </button>

        <div className="flex justify-between items-start mb-8">
           <div>
             <h2 className="text-lg font-semibold text-white">Loyalty Balance</h2>
             <p className="text-xs text-white flex items-center gap-1 mt-1"><ShoppingCart size={10}/> 1 pt per {pointsPerSpend} spent</p>
             <p className="text-xs text-white flex items-center gap-1"><MessageCircle size={10}/> 100 pts per review</p>
             <p className="text-xs text-white flex items-center gap-1"><Share2 size={10}/> 50 pts per share</p>
           </div>
           <Award size={28} className="text-pink-300 drop-shadow-[0_0_5px_rgba(236,72,153,0.8)] mr-8" />
        </div>
        <div className="text-[22px] font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-200">{user.loyaltyPoints || 0} <span className="text-lg font-normal opacity-80 text-white">Points</span></div>
        <div className="mt-4 text-xs bg-black/30 p-3 rounded-lg border border-white/10">
           {(user.loyaltyPoints || 0) >= 1000
             ? `You have ${currency === 'ZAR' ? 'R' : '$'}${(Math.floor((user.loyaltyPoints || 0) / 1000) * (currency === 'ZAR' ? 10 : 5)).toFixed(2)} off available for your next order!`
             : `${1000 - (user.loyaltyPoints || 0)} more points needed for a ${currency === 'ZAR' ? 'R10' : '$5'} voucher.`
           }
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Partnership Program Card (Renamed from Affiliate) */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-6">
             <div>
               <h2 className="text-lg font-semibold text-white">Partnership Program</h2>
               <p className="text-xs text-gray-500">Earn 20% commission on referrals</p>
             </div>
             <DollarSign size={28} className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.6)]" />
          </div>
          
          <div className="space-y-4">
             <div className="bg-black p-3 rounded-lg flex justify-between items-center border border-gray-700">
                <div>
                  <span className="text-xs text-gray-500 block uppercase">Your Referral Code</span>
                  <span className="font-mono font-bold text-base text-cyan-400 tracking-wider">{user.affiliateCode || 'N/A'}</span>
                </div>
                <button className="p-2 text-gray-500 hover:text-cyan-400 transition-colors"><Copy size={18} /></button>
             </div>
             
             <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total Earnings</span>
                <span className="text-lg font-bold text-green-400">R{(user.affiliateEarnings || 0).toFixed(2)}</span>
             </div>
             
             <Link 
                to="/affiliate-program"
                className="block w-full py-2 border border-cyan-500/50 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-900/30 transition-colors text-sm text-center"
             >
               View Dashboard
             </Link>
          </div>
        </div>

        {/* Account Management Card */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-6">
             <div>
               <h2 className="text-lg font-semibold text-white">Account Management</h2>
               <p className="text-xs text-gray-500">Manage your account settings</p>
             </div>
             <User size={28} className="text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.6)]" />
          </div>

          <div className="space-y-4">
             <div className="bg-black p-3 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-500 block uppercase">Account Status</span>
                    <span className="font-medium text-green-400">Active</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Member Since</span>
                    <span className="text-sm text-white">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
             </div>

             <button
                onClick={() => setShowCloseAccountModal(true)}
                className="w-full py-3 border border-red-500/50 text-red-400 rounded-lg font-semibold hover:bg-red-900/30 transition-colors text-sm"
             >
               Close Account
             </button>
          </div>
        </div>
      </div>

      {/* Wishlist */}
      <div className="pt-8 border-t border-gray-800">
         <h2 className="text-[20px] font-bold text-white mb-6 flex items-center gap-2">
           <ShoppingBag size={20} className="text-pink-500" /> Wishlist ({wishlistProducts.length})
         </h2>
         {wishlistProducts.length > 0 ? (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {wishlistProducts.map(p => <ProductCard key={p.id} product={p} />)}
           </div>
         ) : (
           <p className="text-gray-500 text-sm">Your wishlist is empty.</p>
         )}
      </div>

    </div>
  );
};

export default Profile;
