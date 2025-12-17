import React from 'react';

interface PayFastProps {
  plan: {
    name: string;
    price: number;
    amount?: number; // Handle potential naming mismatch
  };
  user: {
    email: string;
    firstName: string;
    lastName: string;
    uid: string;
  };
}

const PayFastButton: React.FC<PayFastProps> = ({ plan, user }) => {
  // SAFETY CHECK: Ensure we have a valid price
  // Sometimes data comes in as 'price', sometimes as 'amount'. We check both.
  const rawPrice = plan.price || plan.amount || 0;

  // If price is 0 or missing, render an error instead of crashing
  if (!rawPrice) {
    console.error("PayFast Error: Missing Plan Price", plan);
    return <div className="text-red-500 text-sm">Error: Plan price unavailable.</div>;
  }

  const finalAmount = rawPrice.toFixed(2);
  const planName = plan.name || "Membership";

  // Environment Variables
  const merchantId = import.meta.env.VITE_PAYFAST_MERCHANT_ID || "10000100";
  const merchantKey = import.meta.env.VITE_PAYFAST_MERCHANT_KEY || "46f0cd694581a";
  const processUrl = import.meta.env.VITE_PAYFAST_URL || "https://sandbox.payfast.co.za/eng/process";

  const notifyUrl = 'https://spoilme-edee0.web.app/api/webhooks/payfast';
  const returnUrl = window.location.origin + '/membership/success';
  const cancelUrl = window.location.origin + '/membership/cancel';

  return (
    <form action={processUrl} method="post">
      <input type="hidden" name="merchant_id" value={merchantId} />
      <input type="hidden" name="merchant_key" value={merchantKey} />
      <input type="hidden" name="return_url" value={returnUrl} />
      <input type="hidden" name="cancel_url" value={cancelUrl} />
      <input type="hidden" name="notify_url" value={notifyUrl} />

      <input type="hidden" name="name_first" value={user.firstName} />
      <input type="hidden" name="name_last" value={user.lastName} />
      <input type="hidden" name="email_address" value={user.email} />
      <input type="hidden" name="m_payment_id" value={`${user.uid}_${Date.now()}`} />

      {/* Use the safely calculated amount */}
      <input type="hidden" name="amount" value={finalAmount} />
      <input type="hidden" name="item_name" value={planName} />
      <input type="hidden" name="custom_str1" value={user.uid} />

      {/* Subscription Settings */}
      <input type="hidden" name="subscription_type" value="1" />
      <input type="hidden" name="billing_date" value={new Date().toISOString().split('T')[0]} />
      <input type="hidden" name="recurring_amount" value={finalAmount} />
      <input type="hidden" name="frequency" value="3" />
      <input type="hidden" name="cycles" value="0" />

      <button
        type="submit"
        className="w-full bg-[#ff0000] hover:bg-[#d90000] text-white font-bold py-3 rounded-full shadow-lg transform hover:scale-105 transition-all"
      >
        PAY R{finalAmount} WITH PAYFAST
      </button>

      <div className="text-center text-xs text-gray-500 mt-2">
        <span className="opacity-75">Secure Checkout via PayFast</span>
      </div>
    </form>
  );
};

export default PayFastButton;
