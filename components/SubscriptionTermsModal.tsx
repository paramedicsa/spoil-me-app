import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../context/StoreContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { getDocument, updateDocument } from '../utils/supabaseClient';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface Props {
  plan: any;
  isOpen: boolean;
  onClose: () => void;
  initialView: 'terms' | 'auth';
}

const PAYPAL_PLAN_IDS = {
  insider: 'P-27V6575111695415KNE2N6OI',
  gold: 'P-4KK8219436336790HNE2N7HQ',
  deluxe: 'P-5D389612KP666993XNE2N7UY'
};

const getPayPalPlanId = (planName: string) => {
  const name = planName.toLowerCase();
  if (name.includes('insider')) {
    return PAYPAL_PLAN_IDS.insider;
  } else if (name.includes('gold')) {
    return PAYPAL_PLAN_IDS.gold;
  } else if (name.includes('deluxe')) {
    return PAYPAL_PLAN_IDS.deluxe;
  }
  console.error('Plan ID not found for:', planName);
  return null;
};

const persistAcceptance = async (uid: string | null, planId: string) => {
  // Try Firestore first (if initialized)
  try {
    if (uid) {
      // Use Supabase upsert/update on users table; merge acceptedPlans
      const existing = await getDocument<any>('users', uid);
      const merged = { ...(existing || {}), acceptedPlans: { ...((existing && existing.acceptedPlans) || {}), [planId]: true } };
      await updateDocument('users', uid, merged);
      return;
    }
  } catch (e) {
    console.warn('Supabase accept save failed, falling back to localStorage', e);
  }

  const storageKey = `accepted_terms_${uid || 'guest'}_${planId}`;
  localStorage.setItem(storageKey, '1');
};

const checkAccepted = async (uid: string | null, planId: string) => {
  // First check localStorage
  const storageKey = `accepted_terms_${uid || 'guest'}_${planId}`;
  if (localStorage.getItem(storageKey)) return true;

  // Try Supabase read (best-effort)
  try {
    if (uid) {
      const row = await getDocument<any>('users', uid);
      if (row && row.acceptedPlans && row.acceptedPlans[planId]) return true;
    }
  } catch (e) {
    // ignore read errors
  }
  return false;
};

const SubscriptionTermsModal: React.FC<Props> = ({ plan, isOpen, onClose, initialView }) => {
  const { currentUser } = useStore();
  const [view, setView] = useState<'auth' | 'welcome' | 'terms' | 'payment'>(initialView === 'auth' ? 'auth' : 'terms');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [acceptedAlready, setAcceptedAlready] = useState(false);

  // Function to get plan color
  const getPlanColor = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('insider')) return 'text-cyan-400';
    if (name.includes('gold')) return 'text-purple-400';
    if (name.includes('deluxe')) return 'text-lime-400';
    if (name.includes('spoiler') || name.includes('spoil me')) return 'text-cyan-400';
    if (name.includes('basic')) return 'text-purple-400';
    if (name.includes('premium')) return 'text-pink-400';
    return 'text-gold';
  };

  const planColor = getPlanColor(plan.name);

  useEffect(() => {
    setView(initialView === 'auth' ? 'auth' : 'terms');
  }, [initialView]);

  // If auth state changes (user logs in), switch to payment/terms automatically
  useEffect(() => {
    if (currentUser) {
      // After login/registration, show payment directly
      setView('payment');
    } else {
      // if user logged out while modal open, show auth
      setView('auth');
    }
  }, [currentUser]);

  // Emergency debugging: Force switch if user logs in during auth view
  useEffect(() => {
    if (currentUser && view === 'auth') {
      console.log("User detected during auth - Auto-switching to Payment");
      setView('payment');
    }
  }, [currentUser, view]);

  const handleAuthSuccess = () => {
    console.log("Auth Success Triggered - Switching to Payment");
    setView('payment');
  };

  const handleAgreeProceed = useCallback(async () => {
    // Persist acceptance (Firestore or localStorage)
    await persistAcceptance((currentUser as any)?.id || (currentUser as any)?.uid || null, plan.id);
    setAcceptedAlready(true);
    // Directly move to payment view
    setView('payment');
  }, [currentUser, plan.id]);

  const handlePayPalApprove = async (data: any, actions: any) => {
    // Payment approved - persist acceptance and close modal
    await persistAcceptance(currentUser?.uid || null, plan.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="bg-zinc-900 border border-gold p-6 rounded-lg max-w-md w-full relative shadow-[0_0_20px_rgba(236,72,153,0.3)]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>

        {/* AUTH VIEW */}
        {!currentUser && view === 'auth' && (
          <div>
            <h2 className="font-cherry text-3xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] mb-4 text-center">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-400 text-sm text-center mb-4">
              You must be logged in to subscribe to the <strong className={planColor}>{plan.name}</strong>.
            </p>

            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={() => setAuthMode('login')}
                className={`px-4 py-2 rounded-md font-bold transition-colors ${
                  authMode === 'login'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`px-4 py-2 rounded-md font-bold transition-colors ${
                  authMode === 'register'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Create Account
              </button>
            </div>

            {authMode === 'login' ? (
              <LoginForm onSuccess={handleAuthSuccess} />
            ) : (
              <RegisterForm onSuccess={handleAuthSuccess} />
            )}
          </div>
        )}

        {/* WELCOME VIEW */}
        {view === 'welcome' && (
          <div>
            <h2 className="text-2xl text-gold mb-4 text-center">Welcome to the Club!</h2>
            <p className="text-gray-400 text-sm text-center mb-4">
              Thank you for choosing to subscribe to the <strong className={planColor}>{plan.name}</strong> plan.
            </p>
            <div className="bg-black/50 p-4 rounded-xl border border-gray-700 mb-6">
              <div className="text-center mb-2">
                <span className="text-3xl font-bold text-white">{plan.currency === 'USD' ? '$' : 'R'}{plan.amount}</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-xs text-gray-400 text-center">Cancel anytime</p>
            </div>

            <div className="mb-4">
              {/* PayPal Buttons */}
              <PayPalScriptProvider options={{
                clientId: "Ac_QfTprTRIS3Abo2dMzGbDpCiw_rs9Zv5-Rhn5dgebhUj4E0hd7hG2LBaFB9iSL6k4cIt5uqmWeNC27",
                currency: "USD",
                intent: "subscription",
                vault: true,
                components: "buttons"
              }}>
                <PayPalButtons
                  style={{ shape: 'pill', color: 'gold', layout: 'vertical' }}
                  fundingSource="paypal"
                  createSubscription={(data, actions) => {
                    const planId = getPayPalPlanId(plan.name);
                    if (!planId) {
                      alert('Configuration Error: Invalid Plan ID. Please contact support.');
                      throw new Error('Invalid Plan ID configuration');
                    }
                    return actions.subscription.create({ plan_id: planId });
                  }}
                  onApprove={handlePayPalApprove}
                  onCancel={() => { /* optional handling */ }}
                  onError={(err) => { console.error('PayPal error', err); }}
                />
              </PayPalScriptProvider>
            </div>

            <div className="text-xs text-gray-400 text-center">By completing payment you accept the Terms and Conditions.</div>
          </div>
        )}

        {/* TERMS VIEW */}
        {view === 'terms' && (
          <div>
            <h2 className="text-xl text-gold mb-2 text-center">Confirm Subscription</h2>
            {currentUser && <div className="text-center mb-4 text-green-400 text-sm">Logged in as: {currentUser.email}</div>}
            <div className="bg-black p-4 rounded border border-gray-800 h-48 overflow-y-auto mb-4 text-sm text-gray-300">
              <p>1. Membership fees are billed monthly...</p>
              <p>2. You may cancel anytime...</p>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleAgreeProceed} className="bg-gold text-black font-bold py-3 rounded hover:brightness-110">
                I AGREE - PROCEED TO PAYMENT
              </button>
            </div>
          </div>
        )}

        {/* PAYMENT VIEW (logged in or accepted) */}
        {view === 'payment' && (
          <div className="text-center">
            {/* Welcome Header with same theme as auth */}
            <h2 className="font-cherry text-3xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] mb-4 text-center">
              ✨ Welcome to Spoil Me Vintage
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              "You deserve to be celebrated every single day."
            </p>

            {/* Motivational Text */}
            <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 mb-6 shadow-[0_0_20px_rgba(236,72,153,0.4)]">
              <p className="text-gray-300 italic text-sm mb-2">
                You are taking a beautiful step towards self-love.
                By joining the <strong className={planColor}>{plan.name}</strong>, you aren't just buying jewelry;
                you are investing in your own happiness and confidence.
              </p>
              <div className="text-gold text-xs uppercase tracking-wider font-bold mt-2">
                — The Spoil Me Team
              </div>
            </div>

            {/* Subscription Summary */}
            <div className="mb-6 text-sm text-gray-400">
              <p>You are subscribing to the <strong className={planColor}>{plan.name}</strong>.</p>
              <p>Price: <strong>{plan.currency === 'USD' ? '$' : 'R'}{plan.amount} / month</strong></p>
              <p className="text-xs mt-1">(Cancel at anytime. No hidden fees.)</p>
            </div>

            {/* PayPal Button */}
            <div className="w-full relative z-10">
              <PayPalScriptProvider options={{
                clientId: "Ac_QfTprTRIS3Abo2dMzGbDpCiw_rs9Zv5-Rhn5dgebhUj4E0hd7hG2LBaFB9iSL6k4cIt5uqmWeNC27",
                currency: "USD",
                intent: "subscription",
                vault: true,
                components: "buttons"
              }}>
                <PayPalButtons
                  style={{ shape: 'pill', color: 'gold', layout: 'vertical', label: 'subscribe' }}
                  fundingSource="paypal"
                  createSubscription={(data, actions) => {
                    const planId = getPayPalPlanId(plan.name);
                    if (!planId) {
                      alert('Configuration Error: Invalid Plan ID. Please contact support.');
                      throw new Error('Invalid Plan ID configuration');
                    }
                    return actions.subscription.create({ plan_id: planId });
                  }}
                  onApprove={handlePayPalApprove}
                />
              </PayPalScriptProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionTermsModal;
