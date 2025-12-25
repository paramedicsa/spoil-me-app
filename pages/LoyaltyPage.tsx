import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { getDocument, updateDocument, createDocument } from '../utils/supabaseClient';
import { Check, Lock, Star, Share2, ShoppingBag, MessageSquare, CreditCard, Users, Facebook, Twitter, Smartphone, MessageCircle, Gift, Zap, Crown, Award } from 'lucide-react';

interface UserData {
  loyaltyPoints: number;
  membershipTier: string;
  currency: string;
  hasSavedCard?: boolean;
  socialFollows?: {
    tiktok?: boolean;
    facebook?: boolean;
    twitter?: boolean;
    whatsapp?: boolean;
  };
}

const LoyaltyPage: React.FC = () => {
  const { user, products } = useStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoints, setSelectedPoints] = useState(0);
  const [generatedCoupon, setGeneratedCoupon] = useState<string | null>(null);

  // Constants
  const POINT_VALUE_ZAR = 0.10; // R0.10 per point
  const POINT_VALUE_USD = 0.01; // $0.01 per point
  const MAX_DISCOUNT_ZAR = 400; // R400 max per order
  const MAX_POINTS_REDEEMABLE = MAX_DISCOUNT_ZAR / POINT_VALUE_ZAR; // 4000 points

  // Allowed tiers for redemption
  const allowedTiers = ['basic', 'premium', 'deluxe'];

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const data = await getDocument<UserData>('users', user.uid);
      if (data) {
        setUserData(data);
      } else {
        // Create default user data
        const defaultData: UserData = {
          loyaltyPoints: 0,
          membershipTier: 'none',
          currency: 'ZAR',
          hasSavedCard: false,
          socialFollows: {
            tiktok: false,
            facebook: false,
            twitter: false,
            whatsapp: false
          }
        };
        setUserData(defaultData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialFollow = async (platform: string) => {
    if (!user || !userData) return;

    // Open social media link
    const links = {
      tiktok: 'https://tiktok.com/@spoilmevintage',
      facebook: 'https://facebook.com/spoilmevintage',
      twitter: 'https://twitter.com/spoilmevintage',
      whatsapp: 'https://wa.me/1234567890'
    };

    window.open(links[platform as keyof typeof links], '_blank');

    // Update backend
    try {
      const updatedFollows = {
        ...userData.socialFollows,
        [platform]: true
      };

      await updateDocument('users', user.uid, {
        socialFollows: updatedFollows,
        loyaltyPoints: userData.loyaltyPoints + 100,
      });

      setUserData({
        ...userData,
        socialFollows: updatedFollows,
        loyaltyPoints: userData.loyaltyPoints + 100
      });
    } catch (error) {
      console.error('Error updating social follow:', error);
    }
  };

  const handleGenerateCoupon = async () => {
    if (!user || !userData || selectedPoints === 0) return;

    try {
      // Deduct points
      const newPoints = userData.loyaltyPoints - selectedPoints;
      await updateDocument('users', user.uid, {
        loyaltyPoints: newPoints,
      });

      // Generate unique coupon code
      const couponCode = `LOYALTY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const discountValue = selectedPoints * POINT_VALUE_ZAR;

      // Create coupon in database
      await createDocument('coupons', {
        code: couponCode,
        type: 'fixed',
        value: discountValue,
        currency: 'ZAR',
        user_id: user.uid,
        used: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        created_at: new Date().toISOString(),
      });

      setUserData({
        ...userData,
        loyaltyPoints: newPoints
      });

      setGeneratedCoupon(couponCode);
      setSelectedPoints(0);
    } catch (error) {
      console.error('Error generating coupon:', error);
    }
  };

  const getPointValue = () => {
    return userData?.currency === 'ZAR' ? POINT_VALUE_ZAR : POINT_VALUE_USD;
  };

  const getMaxRedeemable = () => {
    if (!userData) return 0;
    const pointValue = getPointValue();
    const maxPoints = userData.currency === 'ZAR' ? MAX_POINTS_REDEEMABLE : userData.loyaltyPoints;
    return Math.min(userData.loyaltyPoints, maxPoints);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold text-xl">Loading your rewards...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gold mb-4">Loyalty Program</h1>
          <p className="text-gray-400 mb-8">Please log in to view your rewards and earn points.</p>
          <button className="bg-gold text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors">
            Login to Access
          </button>
        </div>
      </div>
    );
  }

  const pointValue = getPointValue();
  const maxRedeemable = getMaxRedeemable();
  const isLocked = !allowedTiers.includes(userData?.membershipTier || 'none');

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Hero Header */}
        <div className="text-center bg-gradient-to-r from-zinc-900 to-zinc-800 border border-gold/30 rounded-2xl p-8">
          <div className="flex items-center justify-center mb-4">
            <Crown className="text-gold mr-2" size={32} />
            <h1 className="text-4xl font-bold text-gold">Loyalty Rewards</h1>
          </div>
          <div className="text-6xl font-bold text-gold mb-2">
            {userData?.loyaltyPoints?.toLocaleString() || 0}
          </div>
          <p className="text-xl text-gray-300">
            Points Worth {userData?.currency === 'ZAR' ? 'R' : '$'}
            {((userData?.loyaltyPoints || 0) * pointValue).toFixed(2)}
          </p>
          <div className="mt-4 text-sm text-gray-400">
            Membership: <span className="text-gold font-bold capitalize">{userData?.membershipTier || 'None'}</span>
          </div>
        </div>

        {/* Quick Earn Tasks */}
        <div className="bg-zinc-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-gold mb-6 flex items-center">
            <Zap className="mr-2" size={24} />
            Quick Earn Tasks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Create Account */}
            <div className="bg-black border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white">Create Account</h3>
                <Check className="text-green-500" size={20} />
              </div>
              <p className="text-sm text-gray-400 mb-2">Welcome bonus for joining</p>
              <div className="text-gold font-bold">+100 Points</div>
            </div>

            {/* Add Payment Method */}
            <div className={`border rounded-lg p-4 ${userData?.hasSavedCard ? 'bg-black border-green-500/30' : 'bg-zinc-800 border-gray-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white">Add Payment Method</h3>
                {userData?.hasSavedCard ? (
                  <Check className="text-green-500" size={20} />
                ) : (
                  <CreditCard className="text-gray-500" size={20} />
                )}
              </div>
              <p className="text-sm text-gray-400 mb-2">Save a card for easy checkout</p>
              <div className="text-gold font-bold">+100 Points</div>
              {!userData?.hasSavedCard && (
                <button className="mt-2 text-xs bg-gold text-black px-3 py-1 rounded font-bold hover:bg-yellow-500 transition-colors">
                  Add Card
                </button>
              )}
            </div>

            {/* Social Media Follows */}
            {[
              { key: 'tiktok', name: 'TikTok', icon: Smartphone },
              { key: 'facebook', name: 'Facebook', icon: Facebook },
              { key: 'twitter', name: 'Twitter', icon: Twitter },
              { key: 'whatsapp', name: 'WhatsApp', icon: MessageCircle }
            ].map(({ key, name, icon: Icon }) => (
              <div key={key} className={`border rounded-lg p-4 ${userData?.socialFollows?.[key as keyof typeof userData.socialFollows] ? 'bg-black border-green-500/30' : 'bg-zinc-800 border-gray-700'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white flex items-center">
                    <Icon size={16} className="mr-2" />
                    Follow {name}
                  </h3>
                  {userData?.socialFollows?.[key as keyof typeof userData.socialFollows] ? (
                    <Check className="text-green-500" size={20} />
                  ) : (
                    <Users className="text-gray-500" size={20} />
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-2">Follow us for exclusive content</p>
                <div className="text-gold font-bold">+100 Points</div>
                {!userData?.socialFollows?.[key as keyof typeof userData.socialFollows] && (
                  <button
                    onClick={() => handleSocialFollow(key)}
                    className="mt-2 text-xs bg-gold text-black px-3 py-1 rounded font-bold hover:bg-yellow-500 transition-colors"
                  >
                    Follow Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Repeatable Earn Methods */}
        <div className="bg-zinc-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-gold mb-6 flex items-center">
            <Award className="mr-2" size={24} />
            Repeatable Earn Methods
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Share & Earn */}
            <div className="bg-zinc-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Share2 className="text-blue-500 mr-2" size={20} />
                <h3 className="font-bold text-white">Share & Earn</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Share any product page to Facebook/WhatsApp. Earn 2 points for every unique item you share.
              </p>
              <button
                onClick={() => window.location.href = '/#/catalog'}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold transition-colors"
              >
                Start Sharing Products
              </button>
            </div>

            {/* Shop & Earn */}
            <div className="bg-zinc-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <ShoppingBag className="text-green-500 mr-2" size={20} />
                <h3 className="font-bold text-white">Shop & Earn</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Earn 1 point for every {userData?.currency === 'ZAR' ? 'R10' : '$3'} spent on our platform.
              </p>
              <button
                onClick={() => window.location.href = '/#/catalog'}
                className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold transition-colors"
              >
                Start Shopping
              </button>
            </div>

            {/* Review & Earn */}
            <div className="bg-zinc-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <MessageSquare className="text-purple-500 mr-2" size={20} />
                <h3 className="font-bold text-white">Review & Earn</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Earn 100 points for verified photo reviews of your purchases.
              </p>
              <button
                onClick={() => window.location.href = '/#/profile'}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded font-bold transition-colors"
              >
                Write Reviews
              </button>
            </div>
          </div>
        </div>

        {/* Redemption Section */}
        <div className="bg-zinc-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-gold mb-6 flex items-center">
            <Gift className="mr-2" size={24} />
            Redeem Your Points
          </h2>

          {isLocked ? (
            <div className="bg-zinc-800 border border-red-900/50 p-6 rounded-lg text-center opacity-75">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-white font-bold text-xl mb-2">Unlock Your Rewards</h3>
              <p className="text-gray-400 text-sm mb-4">
                You have earned <strong className="text-gold">{userData?.loyaltyPoints?.toLocaleString() || 0} points</strong>,
                but redemption is exclusive to <strong className="text-gold">Basic</strong> and <strong className="text-gold">Premium</strong> members.
              </p>
              <button
                onClick={() => window.location.href = '/#/membership'}
                className="bg-gold text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
              >
                UPGRADE TO REDEEM
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {generatedCoupon && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
                  <h3 className="text-green-400 font-bold mb-2">Coupon Generated!</h3>
                  <div className="text-2xl font-mono text-gold bg-black p-3 rounded border border-gold/30 mb-2">
                    {generatedCoupon}
                  </div>
                  <p className="text-sm text-gray-400">
                    Use this code at checkout for R{((userData?.loyaltyPoints || 0) * pointValue).toFixed(2)} off
                  </p>
                </div>
              )}

              <div className="bg-zinc-800 border border-gold/30 rounded-lg p-6">
                <h3 className="text-gold font-bold mb-2">Convert Points to Discount</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Maximum discount per order: R{MAX_DISCOUNT_ZAR} ({MAX_POINTS_REDEEMABLE.toLocaleString()} Points).
                  This prevents free shipping abuse.
                </p>

                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    Select Points to Redeem: {selectedPoints.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={maxRedeemable}
                    value={selectedPoints}
                    onChange={(e) => setSelectedPoints(Number(e.target.value))}
                    className="w-full accent-gold"
                  />
                </div>

                <div className="flex justify-between items-center text-white mb-4">
                  <span>{selectedPoints.toLocaleString()} Points</span>
                  <span className="text-gold font-bold text-lg">
                    - R{(selectedPoints * pointValue).toFixed(2)} OFF
                  </span>
                </div>

                <button
                  onClick={handleGenerateCoupon}
                  disabled={selectedPoints === 0}
                  className="w-full bg-gold text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CONVERT TO COUPON CODE
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LoyaltyPage;
