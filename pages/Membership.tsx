import React, { useEffect, useState, useRef } from 'react';
import { Check, Crown, ShieldCheck, Gift, Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useNavigate, Link } from 'react-router-dom';
import PayFastForm, { PayFastFormHandle } from '../components/PayFastForm';

const Membership: React.FC = () => {
  const { addSystemNotification, user, memberCount } = useStore();
  const navigate = useNavigate();
  
  // Payment State
  const payFastRef = useRef<PayFastFormHandle>(null);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; amount: number } | null>(null);

  const handleSubscribe = (planName: string, amount: number) => {
      if (!user.email) {
          // For simplicity in this demo, redirect to login
          alert("Please create an account or log in to subscribe.");
          navigate('/login');
          return;
      }
      setSelectedPlan({ name: planName, amount });
      
      // Slight delay to allow state update then submit
      setTimeout(() => {
          if (payFastRef.current) {
              payFastRef.current.submit();
          }
      }, 100);
  };
  
  // --- LOGIC: Member Count & Notifications ---
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`; 

    if (currentDay === 15) {
        const notifKey = `notif_sent_${currentMonthKey}_15`;
        const hasNotified = localStorage.getItem(notifKey);
        
        if (!hasNotified && user.email) {
            addSystemNotification(
                "Only 2 Spots Left!",
                "The Spoil Me Package has only two spots remaining. Claim yours via WhatsApp or Email delivery now!",
                'system'
            );
            localStorage.setItem(notifKey, 'true');
        }
    }
  }, [addSystemNotification, user.email]);

  const spotsLeft = 800 - memberCount;
  const progressPercentage = Math.min(100, (memberCount / 800) * 100);

  return (
    <div className="py-8 space-y-12">
      
      {/* Hidden PayFast Form for Subscriptions */}
      {selectedPlan && (
          <PayFastForm 
             ref={payFastRef}
             amount={selectedPlan.amount}
             itemName={`${selectedPlan.name} Membership`}
             email={user.email}
             isSubscription={true}
             frequency={3} // Monthly
             cycles={0} // Indefinite
             customStr1={user.id}
             customStr2="MEMBERSHIP_SIGNUP"
          />
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="font-cherry text-5xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
          Membership Perks
        </h1>
        <p className="font-architects text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
          Join the Spoil Me Vintage family and unlock a world of exclusive benefits, discounts, and special gifts!
        </p>
      </div>

      {/* Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        
        {/* 1. Spoil Me Package (Teal Blue) */}
        <Link 
            to="/weekly-winners"
            className="block relative bg-zinc-900 border-4 border-cyan-500 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:scale-[1.02]"
            style={{ boxShadow: '0 0 25px 5px rgba(34, 211, 238, 0.4)' }}
        >
           <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black font-bold px-4 py-1 rounded-full text-sm shadow-lg uppercase tracking-wider">
              Starter
           </div>
           <h2 className="text-2xl font-bold text-cyan-400 text-center mt-4 mb-2">Spoil Me Package</h2>
           <div className="text-center mb-2">
              <span className="text-4xl font-bold text-white">R19</span>
              <span className="text-gray-400">/month</span>
           </div>
           <p className="text-[10px] text-cyan-300 text-center mb-6 font-semibold uppercase tracking-wide border border-cyan-500/30 rounded-full py-1 px-2 w-fit mx-auto">
              Cancel at anytime
           </p>

           {/* Progress Bar Section */}
           <div className="bg-black/50 p-4 rounded-xl border border-cyan-500/30 mb-6 relative overflow-hidden">
              <div className="flex justify-between text-xs font-bold text-cyan-400 mb-1">
                 <span>{memberCount} / 800 members</span>
                 <span className={`${spotsLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                 </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
                 <div 
                    className={`h-3 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] ${spotsLeft <= 5 ? 'bg-red-500' : 'bg-cyan-500'}`} 
                    style={{ width: `${progressPercentage}%`, transition: 'width 1s ease-in-out' }}
                 ></div>
              </div>
              <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">Progress updates daily</p>
              
              {/* Urgent Overlay if low stock */}
              {spotsLeft <= 5 && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-md animate-pulse">
                      HURRY!
                  </div>
              )}
           </div>

           <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-gray-300">
                 <Trophy className="text-cyan-400 shrink-0 mt-0.5" size={16} />
                 <span><strong className="text-white">300 lucky winners</strong> of this package get a gift each week between R50 - R500 voucher to spend in this store</span>
              </li>
           </ul>

           <div className="mt-auto">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubscribe('Spoil Me', 19); }}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg mb-2"
              >
                 Subscribe Now
              </button>
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                 <ShieldCheck size={12} /> PayFast Secure Subscription
              </div>
           </div>
        </Link>

        {/* 2. Basic (Dark Purple) */}
        <div 
            className="relative bg-zinc-900 border-4 border-purple-800 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:scale-[1.02]"
            style={{ boxShadow: '0 0 25px 5px rgba(107, 33, 168, 0.4)' }}
        >
           <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-800 text-white font-bold px-4 py-1 rounded-full text-sm shadow-lg uppercase tracking-wider">
              Popular
           </div>
           <h2 className="text-2xl font-bold text-purple-500 text-center mt-4 mb-2">Basic</h2>
           <div className="text-center mb-2">
              <span className="text-4xl font-bold text-white">R49</span>
              <span className="text-gray-400">/month</span>
           </div>
           <p className="text-[10px] text-purple-300 text-center mb-6 font-semibold uppercase tracking-wide border border-purple-500/30 rounded-full py-1 px-2 w-fit mx-auto">
              Cancel at anytime
           </p>

           <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Gift className="text-purple-500 shrink-0" size={16} />
                 <span>Receive a <strong className="text-white">R50 Birthday Voucher</strong></span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Check className="text-purple-500 shrink-0" size={16} />
                 <span>Get 20% discount on non-discount products</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Sparkles className="text-purple-500 shrink-0" size={16} />
                 <span>Get a chance to win a giveaway</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Check className="text-purple-500 shrink-0" size={16} />
                 <span>Receive 25% Discount on Public Holidays</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Gift className="text-purple-500 shrink-0" size={16} />
                 <span>Receive a free gift every 6th month</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Trophy className="text-purple-500 shrink-0" size={16} />
                 <span>Receive R200 gift voucher each month to spend in store</span>
              </li>
           </ul>

           <div className="mt-auto">
              <button 
                onClick={() => handleSubscribe('Basic', 49)}
                className="w-full py-3 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-xl transition-all shadow-lg mb-2"
              >
                 Subscribe Now
              </button>
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                 <ShieldCheck size={12} /> PayFast Secure Subscription
              </div>
           </div>
        </div>

        {/* 3. Premium (Neon Pink) */}
        <div 
            className="relative bg-zinc-900 border-4 border-pink-500 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:scale-[1.02]"
            style={{ boxShadow: '0 0 25px 5px rgba(236, 72, 153, 0.4)' }}
        >
           <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pink-500 text-white font-bold px-4 py-1 rounded-full text-sm shadow-lg uppercase tracking-wider">
              Recommended
           </div>
           <h2 className="text-2xl font-bold text-pink-500 text-center mt-4 mb-2">Premium</h2>
           <div className="text-center mb-2">
              <span className="text-4xl font-bold text-white">R99</span>
              <span className="text-gray-400">/month</span>
           </div>
           <p className="text-[10px] text-pink-300 text-center mb-6 font-semibold uppercase tracking-wide border border-pink-500/30 rounded-full py-1 px-2 w-fit mx-auto">
              Cancel at anytime
           </p>

           <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Gift className="text-pink-500 shrink-0" size={16} />
                 <span>Receive <strong className="text-white">R100 Birthday Voucher</strong></span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Check className="text-pink-500 shrink-0" size={16} />
                 <span>Save 20% on all non-discount products</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Trophy className="text-pink-500 shrink-0" size={16} />
                 <span>Get a chance to win a giveaway each month</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-300">
                 <Gift className="text-pink-500 shrink-0 mt-0.5" size={16} />
                 <span>Received a free gift on Valentine's, Mother's, Father's Day & Festive Season</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Check className="text-pink-500 shrink-0" size={16} />
                 <span>Received 25% discount on Public Holidays</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-300">
                 <Gift className="text-pink-500 shrink-0 mt-0.5" size={16} />
                 <span>Received a free gift on your first month and then every 3rd month</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Trophy className="text-pink-500 shrink-0" size={16} />
                 <span>Receive R200 voucher to spend in store!</span>
              </li>
           </ul>

           <div className="mt-auto">
              <button 
                onClick={() => handleSubscribe('Premium', 99)}
                className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow-lg mb-2"
              >
                 Subscribe Now
              </button>
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                 <ShieldCheck size={12} /> PayFast Secure Subscription
              </div>
           </div>
        </div>

        {/* 4. Deluxe (Neon Green) */}
        <div 
            className="relative bg-zinc-900 border-4 border-lime-500 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:scale-[1.02]"
            style={{ boxShadow: '0 0 25px 5px rgba(132, 204, 22, 0.4)' }}
        >
           <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-500 text-black font-bold px-4 py-1 rounded-full text-sm shadow-lg uppercase tracking-wider flex items-center gap-1">
              <Crown size={14} /> The Ultimate
           </div>
           <h2 className="text-2xl font-bold text-lime-400 text-center mt-4 mb-2">Deluxe</h2>
           <div className="text-center mb-2">
              <span className="text-4xl font-bold text-white">R199</span>
              <span className="text-gray-400">/month</span>
           </div>
           <p className="text-[10px] text-lime-300 text-center mb-6 font-semibold uppercase tracking-wide border border-lime-500/30 rounded-full py-1 px-2 w-fit mx-auto">
              Cancel at anytime
           </p>

            {/* Progress Bar Section */}
           <div className="bg-black/50 p-4 rounded-xl border border-lime-500/30 mb-6">
              <div className="flex justify-between text-xs font-bold text-lime-400 mb-1">
                 <span>490 / 500 members</span>
                 <span className="text-red-400 animate-pulse">10 spots left</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
                 <div className="bg-lime-500 h-3 rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]" style={{ width: '98%' }}></div>
              </div>
              <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">Progress updates monthly</p>
           </div>

           <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Gift className="text-lime-400 shrink-0" size={16} />
                 <span>Receive a <strong className="text-white">R200 Birthday Voucher</strong></span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Check className="text-lime-400 shrink-0" size={16} />
                 <span>Save 20% on all non-discount products</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Trophy className="text-lime-400 shrink-0" size={16} />
                 <span>Get a chance to win a giveaway each month</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Sparkles className="text-lime-400 shrink-0" size={16} />
                 <span className="text-white font-bold">Receive 50% - 70% discount on the 16th of each month</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-300">
                 <Gift className="text-lime-400 shrink-0 mt-0.5" size={16} />
                 <span>Received a free gift on Valentine's, Mother's, Father's Day & Festive Season</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Check className="text-lime-400 shrink-0" size={16} />
                 <span>Received 30% discount on Public Holidays</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-300">
                 <Gift className="text-lime-400 shrink-0 mt-0.5" size={16} />
                 <span>Receive a free gift 1st month and then every 2nd month</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                 <Trophy className="text-lime-400 shrink-0" size={16} />
                 <span>A free gift voucher to spend in store!</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-lime-200 bg-lime-900/20 p-2 rounded border border-lime-500/20">
                 <Crown className="text-lime-400 shrink-0 mt-0.5" size={16} />
                 <span>For loyal members, buy products at cheapest price, pay as little as <strong className="text-white text-lg underline">R8 per item</strong></span>
              </li>
           </ul>

           <div className="mt-auto">
              <button 
                onClick={() => handleSubscribe('Deluxe', 199)}
                className="w-full py-3 bg-lime-600 hover:bg-lime-500 text-black font-bold rounded-xl transition-all shadow-lg mb-2 hover:shadow-[0_0_20px_rgba(132,204,22,0.4)]"
              >
                 Subscribe Now
              </button>
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                 <ShieldCheck size={12} /> PayFast Secure Subscription
              </div>
           </div>
        </div>

      </div>

      {/* Link to Free Rewards */}
      <div className="mt-16 border-t border-gray-800 pt-12 text-center">
         <h2 className="font-cherry text-3xl text-white flex items-center justify-center gap-3 mb-4">
            <Gift className="text-yellow-400" size={32} /> Want to Earn Rewards for Free?
         </h2>
         <p className="text-gray-400 max-w-lg mx-auto mb-8">
            You don't have to be a member to start earning. Join our social channels, leave reviews, and shop to earn points.
         </p>
         <Link 
            to="/earn-rewards"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded-full shadow-lg transition-all hover:scale-105"
         >
             Go to Rewards Hub <ArrowRight size={20} />
         </Link>
      </div>

    </div>
  );
};

export default Membership;
