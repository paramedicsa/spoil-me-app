import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Award, DollarSign, Copy, ShoppingBag, LogOut, MessageSquare, Star, X, Gift, Send, Sparkles, PenTool, ArrowRight, Smartphone, CheckCircle, HelpCircle, ShoppingCart, Share2, MessageCircle, Bell, Clock, AlertCircle } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useNavigate, Link } from 'react-router-dom';
import { Notification } from '../types';
import { handleImageError } from '../utils/imageUtils';

const Notifications: React.FC = () => {
  const { user, products, logout, submitReview, currency } = useStore();
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');

  // Filter notifications
  const pendingReviews = (user.notifications || []).filter(n => n.type === 'review_request' && !n.isRead);
  const giftNotifications = (user.notifications || []).filter(n => n.type === 'gift_ready'); // Gifts I sent
  const receivedGifts = (user.notifications || []).filter(n => n.type === 'gift_received'); // Gifts I received
  const systemNotifications = (user.notifications || []).filter(n => (n.type === 'system' || n.type === 'affiliate_msg') && !n.isRead);
  const creditNotifications = (user.notifications || []).filter(n => n.type === 'credit_received' || n.type === 'credit_adjusted');
  const trialNotifications = (user.notifications || []).filter(n => n.type === 'trial_ended');

  const allNotifications = [
    ...pendingReviews,
    ...giftNotifications,
    ...receivedGifts,
    ...systemNotifications,
    ...creditNotifications,
    ...trialNotifications
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review_request': return <Star className="text-yellow-500" size={20} />;
      case 'gift_ready': return <Gift className="text-pink-500" size={20} />;
      case 'gift_received': return <Gift className="text-green-500" size={20} />;
      case 'system': return <Bell className="text-blue-500" size={20} />;
      case 'affiliate_msg': return <MessageCircle className="text-purple-500" size={20} />;
      case 'credit_received': return <DollarSign className="text-green-500" size={20} />;
      case 'credit_adjusted': return <DollarSign className="text-cyan-500" size={20} />;
      case 'trial_ended': return <AlertCircle className="text-red-500" size={20} />;
      default: return <Bell className="text-gray-500" size={20} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'review_request': return 'border-yellow-500/30 bg-yellow-900/20';
      case 'gift_ready': return 'border-pink-500/30 bg-pink-900/20';
      case 'gift_received': return 'border-green-500/30 bg-green-900/20';
      case 'system': return 'border-blue-500/30 bg-blue-900/20';
      case 'affiliate_msg': return 'border-purple-500/30 bg-purple-900/20';
      case 'credit_received': return 'border-green-500/30 bg-green-900/20';
      case 'credit_adjusted': return 'border-cyan-500/30 bg-cyan-900/20';
      case 'trial_ended': return 'border-red-500/30 bg-red-900/20';
      default: return 'border-gray-500/30 bg-gray-900/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-cherry text-white">Welcome, {user.name || user.firstName || 'Valued Customer'}</h1>
        <p className="text-[14px] font-architects text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400 italic mb-8">
          This is where we communicate with you, deliver your gift vouchers, and share all important notifications and updates.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bell size={32} className="text-blue-500" />
            Your Notifications Center
          </h1>
          <p className="text-gray-400 mt-2">Stay updated with your account activity, rewards, and exclusive offers</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{allNotifications.length}</div>
          <div className="text-sm text-gray-400">Total Notifications</div>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Star className="text-yellow-500" size={16} />
            <span className="text-sm text-gray-400">Pending Reviews</span>
          </div>
          <div className="text-xl font-bold text-white">{pendingReviews.length}</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="text-pink-500" size={16} />
            <span className="text-sm text-gray-400">Gifts</span>
          </div>
          <div className="text-xl font-bold text-white">{giftNotifications.length + receivedGifts.length}</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-green-500" size={16} />
            <span className="text-sm text-gray-400">Credits</span>
          </div>
          <div className="text-xl font-bold text-white">{creditNotifications.length}</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="text-blue-500" size={16} />
            <span className="text-sm text-gray-400">System</span>
          </div>
          <div className="text-xl font-bold text-white">{systemNotifications.length}</div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {allNotifications.length === 0 ? (
          <div className="bg-zinc-900/50 border border-gray-800 rounded-xl p-8 text-center">
            <Bell size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No notifications yet</h3>
            <p className="text-gray-400">When you have activity on your account, you'll see it here.</p>
          </div>
        ) : (
          allNotifications.map((notification, index) => (
            <div key={notification.id || index} className={`p-6 rounded-xl border ${getNotificationColor(notification.type)}`}>
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-lg mb-1">{notification.title}</h4>
                      <p className="text-gray-300 text-sm leading-relaxed mb-3">{notification.message}</p>

                      {/* Action Buttons based on type */}
                      {notification.type === 'review_request' && notification.productId && (
                        <button
                          onClick={() => setSelectedNotification(notification)}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                          <PenTool size={16} /> Write Review
                        </button>
                      )}

                      {notification.type === 'gift_ready' && notification.voucherData && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendGiftWhatsApp(notification)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Send size={16} /> Send via WhatsApp
                          </button>
                          <button
                            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/#/?voucher=${notification.voucherData.code}`)}
                            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Copy size={16} /> Copy Link
                          </button>
                        </div>
                      )}

                      {notification.type === 'gift_received' && notification.voucherData && (
                        <button
                          onClick={() => handleRedeemGift(notification.voucherData.code)}
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Gift size={16} /> Redeem Gift
                        </button>
                      )}

                      {notification.type === 'trial_ended' && (
                        <Link
                          to="/membership"
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                          <ArrowRight size={16} /> Renew Membership
                        </Link>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 shrink-0">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(notification.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedNotification && selectedNotification.type === 'review_request' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedNotification(null)} />
          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6 max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedNotification(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-yellow-900/50 rounded-full border border-yellow-500 text-yellow-300">
                <Star size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Write a Review</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl ${star <= reviewRating ? 'text-yellow-500' : 'text-gray-600'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Your Review</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-yellow-500 outline-none h-24"
                  placeholder="Share your thoughts about this product..."
                />
              </div>

              <button
                onClick={handleSubmitReview}
                disabled={!reviewContent.trim()}
                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all shadow-lg"
              >
                Submit Review (+100 Points)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
