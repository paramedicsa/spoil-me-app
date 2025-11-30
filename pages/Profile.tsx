
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Award, DollarSign, Copy, ShoppingBag, LogOut, MessageSquare, Star, X, Gift, Send, Sparkles, PenTool, ArrowRight, Smartphone, CheckCircle, HelpCircle, ShoppingCart, Share2, MessageCircle, Bell } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useNavigate, Link } from 'react-router-dom';
import { Notification } from '../types';

const Profile: React.FC = () => {
  const { user, products, logout, submitReview } = useStore();
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showLoyaltyHelp, setShowLoyaltyHelp] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');

  const wishlistProducts = products.filter(p => user.wishlist.includes(p.id));
  
  // Filter notifications
  const pendingReviews = user.notifications.filter(n => n.type === 'review_request' && !n.isRead);
  const giftNotifications = user.notifications.filter(n => n.type === 'gift_ready'); // Gifts I sent
  const receivedGifts = user.notifications.filter(n => n.type === 'gift_received'); // Gifts I received
  const systemNotifications = user.notifications.filter(n => (n.type === 'system' || n.type === 'affiliate_msg') && !n.isRead);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSubmitReview = async () => {
     if (!selectedNotification || !selectedNotification.productId) return;
     
     await submitReview(selectedNotification.productId, reviewRating, reviewContent, selectedNotification.id);
     
     // Reset
     setReviewContent('');
     setReviewRating(5);
     setSelectedNotification(null);
     alert("Review submitted! You earned 100 Loyalty Points.");
  };

  const handleSendGiftWhatsApp = (notif: Notification) => {
      if (!notif.voucherData) return;
      const { code, amount, meta } = notif.voucherData;
      
      const appLink = `${window.location.origin}/#/?voucher=${code}`;
      const text = `Hey ${meta.recipientName}! 🎁\n\n${meta.senderName} sent you a Spoil Me Vintage Gift Voucher worth R${amount}!\n\n"${meta.message}"\n\nRedeem it here:\n${appLink}`;
      const phone = meta.whatsappNumber ? meta.whatsappNumber.replace(/[^0-9]/g, '') : '';
      
      const url = phone 
        ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
      
      window.open(url, '_blank');
  };

  const handleRedeemGift = (code: string) => {
      // Redirect to home with voucher param which App.tsx listens for and applies
      window.location.href = `/#/?voucher=${code}`;
  };

  if (!user.email) {
     navigate('/login');
     return null;
  }

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
                              Get <span className="text-green-400">1 Point for every R10</span> spent on products.
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
                              100 Points = <span className="text-white font-bold">R1.00 Discount</span>.
                           </p>
                           <p className="text-xs text-gray-400 mt-1">
                              Minimum redemption is 1000 Points (R10).
                           </p>
                        </div>
                    </div>

                    <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded-lg mt-2">
                        <h4 className="font-bold text-purple-300 flex items-center gap-2 text-xs uppercase tracking-wide">
                           <Award size={14} /> Membership Rule
                        </h4>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                           Non-members can redeem up to <strong>R100 (10,000 pts)</strong> per order. 
                           To redeem more than R100 at once, you must be a <Link to="/membership" className="text-purple-400 underline">Basic Member</Link> or higher.
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

      {/* Review Modal */}
      {selectedNotification && (
         <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedNotification(null)} />
            <div className="bg-zinc-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
               <button onClick={() => setSelectedNotification(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                  <X size={20} />
               </button>
               
               <h3 className="text-xl font-bold text-white mb-1">Write a Review</h3>
               <p className="text-xs text-gray-400 mb-4">For: <span className="text-cyan-400 font-semibold">{selectedNotification.productName}</span></p>
               
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                     <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                           <button key={star} onClick={() => setReviewRating(star)} className="text-yellow-400 hover:scale-110 transition-transform">
                              <Star size={28} fill={star <= reviewRating ? "currentColor" : "none"} />
                           </button>
                        ))}
                     </div>
                  </div>
                  
                  <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Your Review</label>
                     <textarea 
                        rows={4}
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="What did you think of the product?"
                        value={reviewContent}
                        onChange={e => setReviewContent(e.target.value)}
                     ></textarea>
                  </div>

                  <button 
                    onClick={handleSubmitReview}
                    disabled={!reviewContent.trim()}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                     Submit & Earn 100 Points
                  </button>
               </div>
            </div>
         </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-[22px] font-bold text-cyan-400 border border-gray-700 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-white">{user.name}</h1>
            <p className="text-gray-400 text-sm">{user.email}</p>
            {user.isAdmin && <span className="text-xs text-pink-500 font-bold bg-pink-900/20 px-2 py-1 rounded mt-1 inline-block">ADMIN ACCESS</span>}
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-gray-300 rounded-lg border border-gray-700 transition-colors text-sm"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* --- NOTIFICATIONS SECTION --- */}
      
      {/* 0. SYSTEM & AFFILIATE UPDATES (NEW) */}
      {systemNotifications.length > 0 && (
          <div className="bg-zinc-900/50 border border-gray-800 rounded-2xl p-6 animate-in slide-in-from-bottom-4 mb-8">
             <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Bell size={20} className="text-yellow-400" /> Updates ({systemNotifications.length})
             </h2>
             <div className="space-y-4">
                {systemNotifications.map(notif => (
                   <div key={notif.id} className="bg-black p-4 rounded-xl border border-gray-800 shadow-sm">
                       <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div>
                             <h4 className="text-white font-bold text-sm">{notif.title}</h4>
                             <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                             <p className="text-[10px] text-gray-600 mt-2">{new Date(notif.date).toLocaleDateString()}</p>
                          </div>
                          {notif.type === 'affiliate_msg' && (
                              <Link 
                                  to="/affiliate-program" 
                                  className="shrink-0 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
                              >
                                  Open Dashboard <ArrowRight size={12} />
                              </Link>
                          )}
                       </div>
                   </div>
                ))}
             </div>
          </div>
      )}

      {/* 1. GIFTS RECEIVED */}
      {receivedGifts.length > 0 && (
          <div className="bg-gradient-to-r from-zinc-900 to-black border border-cyan-500/30 rounded-2xl p-6 animate-in slide-in-from-bottom-4 mb-8">
             <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Gift size={20} className="text-cyan-400" /> My Gift Collection ({receivedGifts.length})
             </h2>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {receivedGifts.map(notif => (
                   <div key={notif.id} className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800 space-y-4 shadow-lg">
                       <div className="flex justify-between items-start">
                          <div>
                             <h4 className="text-white font-bold">Gift from {notif.voucherData?.meta.senderName}</h4>
                             <p className="text-xs text-gray-500">Received: {new Date(notif.date).toLocaleDateString()}</p>
                          </div>
                          <div className="px-2 py-1 bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold rounded uppercase">
                             Ready to Use
                          </div>
                       </div>

                       {/* HERO CARD PREVIEW MINI */}
                       <div 
                            className="relative aspect-[1.586/1] rounded-lg overflow-hidden text-white border border-gray-700 bg-black"
                       >
                            <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black"></div>
                            <div className="relative h-full p-4 flex flex-col justify-between z-10">
                                <div className="flex justify-between items-start">
                                    <span className="font-cherry text-sm text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">SV</span>
                                    <span className="text-lg font-bold text-white font-architects">R{notif.voucherData?.amount}</span>
                                </div>
                                <div className="text-center">
                                    <p className="font-architects text-sm text-gray-200 italic line-clamp-2">"{notif.voucherData?.meta.message}"</p>
                                </div>
                                <div className="flex justify-between text-[8px] text-gray-500 uppercase">
                                    <span>To You</span>
                                    <span className="font-mono text-cyan-400 text-[10px]">{notif.voucherData?.code}</span>
                                </div>
                            </div>
                       </div>
                       
                       <button 
                         onClick={() => notif.voucherData && handleRedeemGift(notif.voucherData.code)}
                         className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg group"
                       >
                           <CheckCircle size={16} /> Redeem Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                       </button>
                   </div>
                ))}
             </div>
          </div>
      )}

      {/* 2. Gift Ready Notifications (SENT BY ME) */}
      {giftNotifications.length > 0 && (
          <div className="bg-zinc-900/50 border border-pink-500/30 rounded-2xl p-6 animate-in slide-in-from-bottom-4 mb-8">
             <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Send size={20} className="text-pink-500" /> Ready to Send ({giftNotifications.length})
             </h2>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {giftNotifications.map(notif => (
                   <div key={notif.id} className="bg-black p-4 rounded-xl border border-gray-800 space-y-4">
                       <div className="flex justify-between items-start">
                          <div>
                             <h4 className="text-white font-bold">Gift Voucher for {notif.voucherData?.meta.recipientName}</h4>
                             <p className="text-xs text-gray-500">Created: {new Date(notif.date).toLocaleDateString()}</p>
                          </div>
                          <div className="px-2 py-1 bg-green-900/20 border border-green-500/30 text-green-400 text-[10px] font-bold rounded uppercase">
                             Paid & Active
                          </div>
                       </div>

                       {/* HERO CARD PREVIEW MINI */}
                       <div 
                            className="relative aspect-[1.586/1] rounded-lg overflow-hidden text-white border border-gray-700 bg-zinc-900"
                       >
                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900"></div>
                            <div className="relative h-full p-4 flex flex-col justify-between z-10">
                                <div className="flex justify-between items-start">
                                    <span className="font-cherry text-sm text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">SV</span>
                                    <span className="text-lg font-bold text-white font-architects">R{notif.voucherData?.amount}</span>
                                </div>
                                <div className="text-center">
                                    <p className="font-architects text-sm text-gray-200 italic line-clamp-2">"{notif.voucherData?.meta.message}"</p>
                                </div>
                                <div className="flex justify-between text-[8px] text-gray-500 uppercase">
                                    <span>For: {notif.voucherData?.meta.recipientName}</span>
                                    <span>By: {notif.voucherData?.meta.senderName}</span>
                                </div>
                            </div>
                       </div>
                       
                       <div className="flex items-center gap-2 pt-2">
                           <button 
                             onClick={() => handleSendGiftWhatsApp(notif)}
                             className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
                           >
                               <Send size={16} /> Send on WhatsApp
                           </button>
                       </div>
                       <p className="text-[10px] text-gray-500 text-center">
                          Clicking will open WhatsApp with the voucher image/link pre-filled.
                       </p>
                   </div>
                ))}
             </div>
          </div>
      )}

      {/* 3. Pending Reviews Notifications */}
      {pendingReviews.length > 0 && (
         <div className="bg-zinc-900/50 border border-gray-800 rounded-2xl p-6 animate-in slide-in-from-bottom-4">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
               <MessageSquare size={20} className="text-cyan-400" /> Pending Reviews ({pendingReviews.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {pendingReviews.map(notif => (
                  <div key={notif.id} className="bg-black p-4 rounded-xl border border-gray-800 flex gap-4 items-center">
                     {notif.productImage && (
                        <img src={notif.productImage} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-700" onError={(e) => { console.warn('Image failed to load in Profile notification:', (e.currentTarget as HTMLImageElement).src); (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/64'; }} />
                     )}
                     <div className="flex-1">
                        <h4 className="text-white font-medium text-sm line-clamp-1">{notif.productName}</h4>
                        <p className="text-xs text-gray-400 mt-1">Share your thoughts honestly!</p>
                        <p className="text-xs text-purple-400 font-bold mt-1">+100 Points Reward</p>
                     </div>
                     <button 
                       onClick={() => setSelectedNotification(notif)}
                       className="px-4 py-2 bg-zinc-800 hover:bg-pink-600 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap border border-gray-700 hover:border-pink-500"
                     >
                        Review Now
                     </button>
                  </div>
               ))}
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loyalty Program Card */}
        <div className="bg-gradient-to-br from-purple-900 to-pink-900 border border-purple-700 rounded-2xl p-6 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)] relative overflow-hidden">
          
          {/* Help Button */}
          <button 
            onClick={() => setShowLoyaltyHelp(true)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white z-10"
          >
             <HelpCircle size={18} />
          </button>

          <div className="flex justify-between items-start mb-8">
             <div>
               <h2 className="text-lg font-semibold opacity-90 text-purple-200">Loyalty Balance</h2>
               <p className="text-xs opacity-75 flex items-center gap-1 mt-1"><ShoppingCart size={10}/> 1 pt per R10 spent</p>
               <p className="text-xs opacity-75 flex items-center gap-1"><MessageCircle size={10}/> 100 pts per review</p>
               <p className="text-xs opacity-75 flex items-center gap-1"><Share2 size={10}/> 50 pts per share</p>
             </div>
             <Award size={28} className="text-pink-300 drop-shadow-[0_0_5px_rgba(236,72,153,0.8)] mr-8" />
          </div>
          <div className="text-[22px] font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-200">{user.loyaltyPoints} <span className="text-lg font-normal opacity-80 text-white">Points</span></div>
          <div className="mt-4 text-xs bg-black/30 p-3 rounded-lg border border-white/10">
             {user.loyaltyPoints >= 1000 
               ? `You have R${(Math.floor(user.loyaltyPoints / 1000) * 10).toFixed(2)} off available for your next order!`
               : `${1000 - user.loyaltyPoints} more points needed for a R10 voucher.`
             }
          </div>
        </div>

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
                <span className="text-lg font-bold text-green-400">R{user.affiliateEarnings.toFixed(2)}</span>
             </div>
             
             <Link 
                to="/affiliate-program"
                className="block w-full py-2 border border-cyan-500/50 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-900/30 transition-colors text-sm text-center"
             >
               View Dashboard
             </Link>
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
