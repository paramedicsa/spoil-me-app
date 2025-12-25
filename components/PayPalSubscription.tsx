import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalSubscriptionProps {
  planId: string;
  userId: string;
  onApprove: (data: any) => void;
  onError: (error: any) => void;
}

const PayPalSubscription: React.FC<PayPalSubscriptionProps> = ({
  planId,
  userId,
  onApprove,
  onError
}) => {
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || process.env.REACT_APP_PAYPAL_CLIENT_ID || '';

  const initialOptions: any = {
    clientId,
    "client-id": clientId,
    currency: "USD",
    intent: "subscription",
    vault: true,
    components: "buttons"
  };

  // Helper function to get the correct PayPal Plan ID
  const getPayPalPlanId = (planName: string) => {
    // Normalize the string to handle casing
    const name = planName.toLowerCase();

    if (name.includes('insider')) {
      return import.meta.env.VITE_PAYPAL_INSIDER_PLAN_ID || process.env.REACT_APP_PAYPAL_INSIDER_PLAN_ID;
    }

    else if (name.includes('gold')) {
      return import.meta.env.VITE_PAYPAL_GOLD_PLAN_ID || process.env.REACT_APP_PAYPAL_GOLD_PLAN_ID;
    }

    else if (name.includes('deluxe')) {
      return import.meta.env.VITE_PAYPAL_DELUXE_PLAN_ID || process.env.REACT_APP_PAYPAL_DELUXE_PLAN_ID;
    }

    console.error("Plan ID not found for:", planName);
    return null;
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtons
        createSubscription={(data, actions) => {
          const planIdToUse = getPayPalPlanId(planId); // Use the helper here

          if (!planIdToUse || planIdToUse.includes('YOUR_') || planIdToUse.includes('P-INSIDER')) {
            alert("Configuration Error: Invalid Plan ID. Please contact support.");
            throw new Error("Invalid Plan ID in .env file");
          }

          return actions.subscription.create({
            'plan_id': planIdToUse
          });
        }}
        onApprove={async (data, actions) => {
          console.log('PayPal subscription approved:', data);
          await Promise.resolve(onApprove(data));
        }}
        onError={(err) => {
          console.error('PayPal subscription error:', err);
          onError(err);
        }}
        style={{
          shape: 'pill',
          color: 'silver',
          layout: 'vertical',
          label: 'subscribe'
        }}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalSubscription;
