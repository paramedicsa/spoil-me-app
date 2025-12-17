import React, { useEffect, useState, useRef } from 'react';
import { Check, Crown, ShieldCheck, Gift, Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useNavigate, Link } from 'react-router-dom';
import PayFastForm, { PayFastFormHandle } from '../components/PayFastForm';
import PayPalSubscription from '../components/PayPalSubscription';
import SubscriptionTermsModal from '../components/SubscriptionTermsModal';

const Membership: React.FC = () => {
  const { addSystemNotification, user, memberCount, currency } = useStore();
  const navigate = useNavigate();
  
  // PayPal Plan IDs (replace with actual from PayPal dashboard)
  const paypalPlans = {
    'Insider Club': import.meta.env.VITE_PAYPAL_INSIDER_PLAN_ID || process.env.REACT_APP_PAYPAL_INSIDER_PLAN_ID || 'P-INSIDER-PLAN-ID',
    'Gold Member': import.meta.env.VITE_PAYPAL_GOLD_PLAN_ID || process.env.REACT_APP_PAYPAL_GOLD_PLAN_ID || 'P-GOLD-PLAN-ID',
    'Deluxe Vault': import.meta.env.VITE_PAYPAL_DELUXE_PLAN_ID || process.env.REACT_APP_PAYPAL_DELUXE_PLAN_ID || 'P-DELUXE-PLAN-ID',
    'Deluxe Boss': import.meta.env.VITE_PAYPAL_DELUXE_PLAN_ID || process.env.REACT_APP_PAYPAL_DELUXE_PLAN_ID || 'P-DELUXE-PLAN-ID' // Alias for Deluxe Vault
  };

  // Payment State
  const payFastRef = useRef<PayFastFormHandle>(null);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; amount: number } | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [paypalVisible, setPaypalVisible] = useState(false);
  const [paypalPlanId, setPaypalPlanId] = useState('');
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [selectedPlanForSubscription, setSelectedPlanForSubscription] = useState<{ name: string; amount: number; currency: 'ZAR' | 'USD' } | null>(null);

  // New state for modal
  const [selectedPlanModal, setSelectedPlanModal] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  // Dynamic Progress Bar State for USD Tiers
  const [insiderCount, setInsiderCount] = useState(412);
  const [insiderLimit, setInsiderLimit] = useState(500);
  const [goldCount, setGoldCount] = useState(485);
  const [goldLimit, setGoldLimit] = useState(500);
  const [deluxeCount, setDeluxeCount] = useState(498);
  const [deluxeLimit, setDeluxeLimit] = useState(500);

  // Infinite Scale Logic
  const scaleLimit = (currentLimit: number) => {
    if (currentLimit === 500) return 750;
    if (currentLimit === 750) return 1000;
    if (currentLimit === 1000) return 1250;
    return currentLimit + 250;
  };

  // Update limits when approaching full
  useEffect(() => {
    if (insiderCount >= insiderLimit - 5) {
      setInsiderLimit(scaleLimit(insiderLimit));
    }
  }, [insiderCount, insiderLimit]);

  useEffect(() => {
    if (goldCount >= goldLimit - 5) {
      setGoldLimit(scaleLimit(goldLimit));
    }
  }, [goldCount, goldLimit]);

  useEffect(() => {
    if (deluxeCount >= deluxeLimit - 5) {
      setDeluxeLimit(scaleLimit(deluxeLimit));
    }
  }, [deluxeCount, deluxeLimit]);

  // Progress percentage and color logic
  const getProgressData = (count: number, limit: number) => {
    const percentage = (count / limit) * 100;
    let color = 'bg-green-500';
    let status = '🟢 OPEN';
    if (percentage >= 95) {
      color = 'bg-red-500 animate-pulse';
      status = '🔴 CRITICAL';
    } else if (percentage >= 80) {
      color = 'bg-orange-500';
      status = '🟡 HIGH DEMAND';
    }
    return { percentage, color, status };
  };

  const insiderProgress = getProgressData(insiderCount, insiderLimit);
  const goldProgress = getProgressData(goldCount, goldLimit);
  const deluxeProgress = getProgressData(deluxeCount, deluxeLimit);

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthSeed = month + year * 12;
  const startingSpots = 23 + (monthSeed % 3); // 23, 24, or 25
  const dayOfMonth = now.getDate();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const progress = (dayOfMonth - 1) / (totalDays - 1);
  const totalSpots = startingSpots - progress * (startingSpots - 2);
  const spotsLeft = Math.max(2, Math.floor(totalSpots));
  const progressPercentage = ((startingSpots - spotsLeft) / startingSpots) * 100;

  const handleSubscribe = (planName: string, amount: number) => {
      // Always show terms modal first
      setSelectedPlanForSubscription({ name: planName, amount, currency });
      setTermsModalVisible(true);
  };

  const proceedToPayment = (plan: { name: string; amount: number; currency: 'ZAR' | 'USD' }) => {
    if (plan.currency === 'USD') {
      const planId = paypalPlans[plan.name];
      if (planId) {
        setPaypalPlanId(plan.name); // Pass the plan name instead of ID
        setPaypalVisible(true);
      } else {
        alert("PayPal plan not configured for this membership.");
      }
    } else {
      setSelectedPlan({ name: plan.name, amount: plan.amount });
      // Slight delay to allow state update then submit
      setTimeout(() => {
        if (payFastRef.current) {
          payFastRef.current.submit();
        }
      }, 100);
    }
  };

  const handleSubscribeClick = (planName: string, amount: number) => {
    const plan = { id: planName, name: planName, amount, currency };
    setSelectedPlanModal(plan);
    setIsModalOpen(true);
  };

  // --- LOGIC: Member Count & Notifications ---
  // useEffect(() => {
  //   const today = new Date();
  //   const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;

  //   if (spotsLeft <= 5) {
  //       const notifKey = `notif_sent_${currentMonthKey}`;
  //       const hasNotified = localStorage.getItem(notifKey);

  //       if (!hasNotified && user.email) {
  //           addSystemNotification(
  //               `Only ${spotsLeft} Spots Left!`,
  //               `The Spoil Me Package has only ${spotsLeft} spots remaining. Claim yours via WhatsApp or Email delivery now!`,
  //               'system'
  //           );
  //           localStorage.setItem(notifKey, 'true');
  //       }
  //   }
  // }, [addSystemNotification, user.email, spotsLeft]);

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

      {/* PayPal Subscription Modal */}
      {paypalVisible && paypalPlanId && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-zinc-900 p-8 rounded-xl max-w-md w-full mx-4">
                  <h3 className="text-xl font-bold text-white mb-4">Complete Your Subscription</h3>
                  <PayPalSubscription
                      planId={paypalPlanId}
                      userId={user.id}
                      onApprove={async (data) => {
                          console.log('PayPal subscription approved:', data);
                          alert(`🎉 Subscription successful! Welcome to ${selectedPlanForSubscription?.name}!`);
                          // Refresh user data to show new membership status
                          window.location.reload();
                      }}
                      onError={(err) => {
                          console.error('PayPal error:', err);
                          alert('Payment failed. Please try again.');
                          setPaypalVisible(false);
                      }}
                  />
                  <button
                      onClick={() => setPaypalVisible(false)}
                      className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                      Cancel
                  </button>
              </div>
          </div>
      )}

      {/* Terms & Conditions Modal */}
      {termsModalVisible && selectedPlanForSubscription && (
        <SubscriptionTermsModal
          isOpen={termsModalVisible}
          onClose={() => setTermsModalVisible(false)}
          onAgree={() => {
            setTermsAgreed(true);
            setTermsModalVisible(false); // Close the modal after agreeing
            // Proceed with payment after agreeing to terms
            if (selectedPlanForSubscription) {
              proceedToPayment(selectedPlanForSubscription);
            }
          }}
          plan={selectedPlanForSubscription}
          currentUser={user}
          initialView={user ? 'terms' : 'auth'}
        />
      )}

%       {/* New Subscription Terms Modal */}
      {isModalOpen && selectedPlanModal && (
        <SubscriptionTermsModal
          plan={selectedPlanModal}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialView={user ? 'terms' : 'auth'}
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
      <div className={`grid grid-cols-1 md:grid-cols-2 ${currency === 'ZAR' ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-8`}>

        {currency === 'ZAR' ? (
          <>
            {/* ZAR Cards */}
            {/* 1. Spoil Me Package */}
            <Link
                to="/weekly-winners"
                className="block relative bg-zinc-900 border-4 border-cyan-500 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:scale-[1.02]"
                style={{ boxShadow: '0 0 25px 5px rgba(34, 211, 238, 0.4)' }}
            >
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black font-bold px-4 py-1 rounded-full text-sm shadow-lg uppercase tracking-wider">
                  Popular
               </div>
               <h2 className="text-2xl font-bold text-cyan-400 text-center mt-4 mb-2">Spoil Me Package</h2>
               <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-white">R19</span>
                  <span className="text-gray-400">/month</span>
               </div>

               {/* Progress Bar Section */}
               <div className="bg-black/50 p-4 rounded-xl border border-cyan-500/30 mb-6 relative overflow-hidden">
                  <div className="flex justify-between text-xs font-bold text-cyan-400 mb-1">
                     <span>{insiderCount} / {insiderLimit} Spots Taken</span>
                     <span className={`${insiderProgress.percentage >= 95 ? 'text-red-500 animate-pulse' : insiderProgress.percentage >= 80 ? 'text-orange-500' : 'text-green-500'}`}>
                        {insiderLimit - insiderCount} spots left
                     </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
                     <div
                        className={`h-3 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] ${insiderProgress.color}`}
                        style={{ width: `${insiderProgress.percentage}%`, transition: 'width 1s ease-in-out' }}
                     ></div>
                  </div>
                  <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">Join now before the monthly International Draw!</p>
               </div>

               <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-cyan-400 shrink-0" size={16} />
                     <span>Guaranteed: Get <strong className="text-white">R25 Store Credit</strong> every month.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-cyan-400 shrink-0" size={16} />
                     <span>Discount: <strong className="text-white">5% OFF</strong> everything in store.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Trophy className="text-cyan-400 shrink-0" size={16} />
                     <span>Fun: Entry into <strong className="text-white">Weekly Giveaway</strong> (Win R500 Gift Card).</span>
                  </li>
               </ul>

               <div className="mt-auto">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubscribeClick('Spoil Me', 19); }}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg mb-2"
                  >
                     Subscribe Now
                  </button>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                     <ShieldCheck size={12} /> PayFast Secure Subscription
                  </div>
               </div>
            </Link>

            {/* 2. Basic Package */}
            <div
                className="relative bg-zinc-900 border-4 border-purple-800 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:scale-[1.02]"
                style={{ boxShadow: '0 0 25px 5px rgba(107, 33, 168, 0.4)' }}
            >
               <h2 className="text-2xl font-bold text-purple-500 text-center mt-4 mb-2">Basic Package</h2>
               <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-white">R49</span>
                  <span className="text-gray-400">/month</span>
               </div>

               <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-purple-500 shrink-0" size={16} />
                     <span>Guaranteed: Receive a <strong className="text-white">R50 Voucher</strong> every month.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-purple-500 shrink-0" size={16} />
                     <span>Discount: <strong className="text-white">20% OFF</strong> entire store.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Gift className="text-purple-500 shrink-0" size={16} />
                     <span>Birthday: Receive a <strong className="text-white">R100 Birthday Voucher</strong>.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Sparkles className="text-purple-500 shrink-0" size={16} />
                     <span>Bonus: <strong className="text-white">2x Entries</strong> into the Weekly Drop.</span>
                  </li>
               </ul>

               <div className="mt-auto">
                  <button
                    onClick={() => handleSubscribeClick('Basic', 49)}
                    className="w-full py-3 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-xl transition-all shadow-lg mb-2"
                  >
                     Subscribe Now
                  </button>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                     <ShieldCheck size={12} /> PayFast Secure Subscription
                  </div>
               </div>
            </div>

            {/* 3. Premium Package */}
            <div
                className="relative bg-zinc-900 border-4 border-pink-500 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:scale-[1.02]"
                style={{ boxShadow: '0 0 25px 5px rgba(236, 72, 153, 0.4)' }}
            >
               <h2 className="text-2xl font-bold text-pink-500 text-center mt-4 mb-2">Premium Package</h2>
               <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-white">R99</span>
                  <span className="text-gray-400">/month</span>
               </div>

               <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-pink-500 shrink-0" size={16} />
                     <span>Guaranteed: Receive a <strong className="text-white">R100 Voucher</strong> every month.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-pink-500 shrink-0" size={16} />
                     <span>Discount: <strong className="text-white">20% OFF</strong> entire store.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Gift className="text-pink-500 shrink-0" size={16} />
                     <span>Holidays: Free small gift added to orders (Valentine's Day, Mother's Day, Festive).</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Gift className="text-pink-500 shrink-0" size={16} />
                     <span>Birthday: Receive a <strong className="text-white">R150 Birthday Voucher</strong>.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-pink-500 shrink-0" size={16} />
                     <span>Priority: <strong className="text-white">Get promotions via WhatsApp first</strong>.</span>
                  </li>
               </ul>

               <div className="mt-auto">
                  <button
                    onClick={() => handleSubscribeClick('Premium', 99)}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow-lg mb-2"
                  >
                     Subscribe Now
                  </button>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                     <ShieldCheck size={12} /> PayFast Secure Subscription
                  </div>
               </div>
            </div>

            {/* 4. Deluxe "Boss" Package */}
            <div
                className="relative bg-zinc-900 border-4 border-lime-500 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:scale-[1.02]"
                style={{ boxShadow: '0 0 25px 5px rgba(132, 204, 22, 0.4)' }}
            >
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-500 text-black font-bold px-4 py-1 rounded-full text-sm shadow-lg uppercase tracking-wider flex items-center gap-1">
                  <Crown size={14} /> The Ultimate
               </div>
               <h2 className="text-2xl font-bold text-lime-400 text-center mt-4 mb-2">The Deluxe "Boss" Package</h2>
               <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-white">R199</span>
                  <span className="text-gray-400">/month</span>
               </div>

               {/* Progress Bar Section */}
               <div className="bg-black/50 p-4 rounded-xl border border-lime-500/30 mb-6 relative overflow-hidden">
                  <div className="flex justify-between text-xs font-bold text-lime-400 mb-1">
                     <span>{deluxeCount} / {deluxeLimit} Spots Taken</span>
                     <span className={`${deluxeProgress.percentage >= 95 ? 'text-red-500 animate-pulse' : deluxeProgress.percentage >= 80 ? 'text-orange-500' : 'text-green-500'}`}>
                        {deluxeLimit - deluxeCount} spots left
                     </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
                     <div
                        className={`h-3 rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)] ${deluxeProgress.color}`}
                        style={{ width: `${deluxeProgress.percentage}%`, transition: 'width 1s ease-in-out' }}
                     ></div>
                  </div>
                  <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">Warning: We strictly limit Vault access to ensure stock availability. 2 spots remaining.</p>
               </div>

               {/* Secret Vault Section */}
               <div className="bg-lime-900/20 border border-lime-500/30 rounded-xl p-4 mb-6">
                  <h3 className="text-lime-400 font-bold text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
                     <Crown size={16} /> ACCESS TO "THE SECRET VAULT"
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                     Shop clearance, samples, and slight imperfections starting at <strong className="text-white">R10</strong>.
                  </p>
                  <div className="text-xs text-gray-400 space-y-1">
                     <p><strong>The Loyalty Ladder:</strong></p>
                     <p>Month 1: Buy 5 Vault items.</p>
                     <p>Month 2: Buy 7 Vault items.</p>
                     <p>Month 3: Buy 10 Vault items.</p>
                     <p>Month 4+: <strong className="text-lime-400">UNLIMITED ACCESS</strong>.</p>
                     <p className="text-red-400 italic">Subscription reset? Start back at Month 1.</p>
                  </div>
               </div>

               <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-lime-400 shrink-0" size={16} />
                     <span>Guaranteed: <strong className="text-white">R150 Store Credit</strong> every month (Rolls over).</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-lime-400 shrink-0" size={16} />
                     <span>Discount: <strong className="text-white">20% OFF</strong> normal retail items.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Gift className="text-lime-400 shrink-0" size={16} />
                     <span>Birthday: Receive a <strong className="text-white">R300 Voucher</strong>.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-lime-400 shrink-0" size={16} />
                     <span>Priority: <strong className="text-white">Get promotions via WhatsApp first</strong>.</span>
                  </li>
               </ul>

               <p className="text-xs text-yellow-400 mb-4 italic">
                  Secret Vault items may include factory rejects or slight imperfections. Sold as-is.
               </p>

               <div className="mt-auto">
                  <button
                    onClick={() => handleSubscribeClick('Deluxe Vault', 199)}
                    className="w-full py-3 bg-lime-600 hover:bg-lime-500 text-black font-bold rounded-xl transition-all shadow-lg mb-2 hover:shadow-[0_0_20px_rgba(132,204,22,0.4)]"
                  >
                     Subscribe Now
                  </button>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                     <ShieldCheck size={12} /> PayFast Secure Subscription
                  </div>
               </div>
            </div>
          </>
        ) : (
          <>
            {/* USD Cards */}
            {/* 1. The Insider Club */}
            <div
                className="relative bg-zinc-900 border-4 border-cyan-500 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:scale-[1.02]"
                style={{ boxShadow: '0 0 25px 5px rgba(34, 211, 238, 0.4)' }}
            >
               <h2 className="text-2xl font-bold text-cyan-400 text-center mt-4 mb-2">The Insider Club</h2>
               <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-white">$5.00</span>
                  <span className="text-gray-400">/month</span>
               </div>
               <p className="text-[10px] text-cyan-300 text-center mb-6 font-semibold uppercase tracking-wide border border-cyan-500/30 rounded-full py-1 px-2 w-fit mx-auto">
                  {insiderProgress.status} (Batch 3)
               </p>

               {/* Progress Bar Section */}
               <div className="bg-black/50 p-4 rounded-xl border border-cyan-500/30 mb-6 relative overflow-hidden">
                  <div className="flex justify-between text-xs font-bold text-cyan-400 mb-1">
                     <span>{insiderCount} / {insiderLimit} Spots Taken</span>
                     <span className={`${insiderProgress.percentage >= 95 ? 'text-red-500 animate-pulse' : insiderProgress.percentage >= 80 ? 'text-orange-500' : 'text-green-500'}`}>
                        {insiderLimit - insiderCount} spots left
                     </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
                     <div
                        className={`h-3 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] ${insiderProgress.color}`}
                        style={{ width: `${insiderProgress.percentage}%`, transition: 'width 1s ease-in-out' }}
                     ></div>
                  </div>
                  <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">Join now before the monthly International Draw!</p>
               </div>

               <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-cyan-400 shrink-0" size={16} />
                     <span>Guaranteed: Get <strong className="text-white">$5.00 Store Credit</strong> every month.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-cyan-400 shrink-0" size={16} />
                     <span>Discount: <strong className="text-white">5% OFF</strong> everything in store.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Trophy className="text-cyan-400 shrink-0" size={16} />
                     <span>Fun: Entry into <strong className="text-white">Weekly Giveaway</strong> (Win $50 Gift Card).</span>
                  </li>
               </ul>

               <div className="mt-auto">
                  <button
                    onClick={() => handleSubscribeClick('Insider Club', 5)}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg mb-2"
                  >
                     Subscribe Now
                  </button>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                     <ShieldCheck size={12} /> PayPal Secure Subscription
                  </div>
               </div>
            </div>

            {/* 2. The Gold Member */}
            <div
                className="relative bg-zinc-900 border-4 border-purple-800 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:scale-[1.02]"
                style={{ boxShadow: '0 0 25px 5px rgba(107, 33, 168, 0.4)' }}
            >
               <h2 className="text-2xl font-bold text-purple-500 text-center mt-4 mb-2">The Gold Member</h2>
               <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-white">$12.00</span>
                  <span className="text-gray-400">/month</span>
               </div>
               <p className="text-[10px] text-purple-300 text-center mb-6 font-semibold uppercase tracking-wide border border-purple-500/30 rounded-full py-1 px-2 w-fit mx-auto">
                  {goldProgress.status}
               </p>

               {/* Progress Bar Section */}
               <div className="bg-black/50 p-4 rounded-xl border border-purple-500/30 mb-6 relative overflow-hidden">
                  <div className="flex justify-between text-xs font-bold text-purple-400 mb-1">
                     <span>{goldCount} / {goldLimit} Spots Taken</span>
                     <span className={`${goldProgress.percentage >= 95 ? 'text-red-500 animate-pulse' : goldProgress.percentage >= 80 ? 'text-orange-500' : 'text-green-500'}`}>
                        {goldLimit - goldCount} spots left
                     </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
                     <div
                        className={`h-3 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)] ${goldProgress.color}`}
                        style={{ width: `${goldProgress.percentage}%`, transition: 'width 1s ease-in-out' }}
                     ></div>
                  </div>
                  <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">Only 15 spots left at this price.</p>
               </div>

               <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-purple-500 shrink-0" size={16} />
                     <span>Guaranteed: Get <strong className="text-white">$12.00 Store Credit</strong> every month.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-purple-500 shrink-0" size={16} />
                     <span>Discount: <strong className="text-white">20% OFF</strong> everything in store.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Gift className="text-purple-500 shrink-0" size={16} />
                     <span>Birthday: Receive a <strong className="text-white">$20 Voucher</strong>.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-purple-500 shrink-0" size={16} />
                     <span>Priority: <strong className="text-white">Get promotions via WhatsApp first</strong>.</span>
                  </li>
               </ul>

               <div className="mt-auto">
                  <button
                    onClick={() => handleSubscribeClick('Gold Member', 12)}
                    className="w-full py-3 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-xl transition-all shadow-lg mb-2"
                  >
                     Subscribe Now
                  </button>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                     <ShieldCheck size={12} /> PayPal Secure Subscription
                  </div>
               </div>
            </div>

            {/* 3. Deluxe "Vault" Access */}
            <div
                className="relative bg-zinc-900 border-4 border-lime-500 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:scale-[1.02]"
                style={{ boxShadow: '0 0 25px 5px rgba(132, 204, 22, 0.4)' }}
            >
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-500 text-black font-bold px-4 py-1 rounded-full text-sm shadow-lg uppercase tracking-wider flex items-center gap-1">
                  <Crown size={14} /> Top Tier
               </div>
               <h2 className="text-2xl font-bold text-lime-400 text-center mt-4 mb-2">Deluxe "Vault" Access</h2>
               <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-white">$25.00</span>
                  <span className="text-gray-400">/month</span>
               </div>

               {/* Progress Bar Section */}
               <div className="bg-black/50 p-4 rounded-xl border border-lime-500/30 mb-6 relative overflow-hidden">
                  <div className="flex justify-between text-xs font-bold text-lime-400 mb-1">
                     <span>{deluxeCount} / {deluxeLimit} Spots Taken</span>
                     <span className={`${deluxeProgress.percentage >= 95 ? 'text-red-500 animate-pulse' : deluxeProgress.percentage >= 80 ? 'text-orange-500' : 'text-green-500'}`}>
                        {deluxeLimit - deluxeCount} spots left
                     </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
                     <div
                        className={`h-3 rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)] ${deluxeProgress.color}`}
                        style={{ width: `${deluxeProgress.percentage}%`, transition: 'width 1s ease-in-out' }}
                     ></div>
                  </div>
                  <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">Warning: We strictly limit Vault access to ensure stock availability. 2 spots remaining.</p>
               </div>

               {/* Secret Vault Section */}
               <div className="bg-lime-900/20 border border-lime-500/30 rounded-xl p-4 mb-6">
                  <h3 className="text-lime-400 font-bold text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
                     <Crown size={16} /> ACCESS TO "THE SECRET VAULT"
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                     Shop clearance, samples, and slight imperfections starting at <strong className="text-white">R10</strong>.
                  </p>
                  <div className="text-xs text-gray-400 space-y-1">
                     <p><strong>The Loyalty Ladder:</strong></p>
                     <p>Month 1: Buy 5 Vault items.</p>
                     <p>Month 2: Buy 7 Vault items.</p>
                     <p>Month 3: Buy 10 Vault items.</p>
                     <p>Month 4+: <strong className="text-lime-400">UNLIMITED ACCESS</strong>.</p>
                     <p className="text-red-400 italic">Subscription reset? Start back at Month 1.</p>
                  </div>
               </div>

               <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-lime-400 shrink-0" size={16} />
                     <span>Guaranteed: <strong className="text-white">$15.00 Store Credit</strong> every month (Rolls over).</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-lime-400 shrink-0" size={16} />
                     <span>Discount: <strong className="text-white">20% OFF</strong> normal retail items.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Gift className="text-lime-400 shrink-0" size={16} />
                     <span>Birthday: Receive a <strong className="text-white">$40 Voucher</strong>.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                     <Check className="text-lime-400 shrink-0" size={16} />
                     <span>Priority: <strong className="text-white">Get promotions via WhatsApp first</strong>.</span>
                  </li>
               </ul>

               <p className="text-xs text-yellow-400 mb-4 italic">
                  Secret Vault items may include factory rejects or slight imperfections. Sold as-is.
               </p>

               <div className="mt-auto">
                  <button
                    onClick={() => handleSubscribeClick('Deluxe Vault', 25)}
                    className="w-full py-3 bg-lime-600 hover:bg-lime-500 text-black font-bold rounded-xl transition-all shadow-lg mb-2 hover:shadow-[0_0_20px_rgba(132,204,22,0.4)]"
                  >
                     Subscribe Now
                  </button>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                     <ShieldCheck size={12} /> PayPal Secure Subscription
                  </div>
               </div>
            </div>
          </>
        )}

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
         <br />
         <Link
            to="/vault"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-full shadow-lg transition-all hover:scale-105 mt-4"
         >
             <Crown size={20} /> Explore The Secret Vault
         </Link>
         <div className="mt-8 text-center">
            <Link to="/terms" className="text-gray-400 hover:text-white text-sm underline">
               View Terms & Conditions
            </Link>
         </div>
      </div>

    </div>
  );
};

export default Membership;
