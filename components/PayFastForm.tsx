
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { PAYFAST_CONFIG } from '../services/payFastConfig';

export interface PayFastFormProps {
    amount: number;
    itemName: string;
    email?: string;
    
    // Optional Overrides for URLs
    returnUrl?: string;
    cancelUrl?: string;
    notifyUrl?: string;

    // Pass-through data
    customStr1?: string;
    customStr2?: string;
    customStr3?: string;
    customInt1?: string;

    // Subscription Options (For Memberships)
    isSubscription?: boolean;
    frequency?: number; // 3 = Monthly, 4 = Quarterly, 5 = Biannually, 6 = Annually
    cycles?: number; // 0 = Indefinite
}

export interface PayFastFormHandle {
    submit: () => void;
}

const PayFastForm = forwardRef<PayFastFormHandle, PayFastFormProps>(({
    amount, 
    itemName, 
    email, 
    returnUrl, 
    cancelUrl, 
    notifyUrl, 
    customStr1, 
    customStr2, 
    customStr3, 
    customInt1,
    isSubscription = false,
    frequency = 3, // Default Monthly
    cycles = 0 // Default Indefinite
}, ref) => {
    const formRef = useRef<HTMLFormElement>(null);

    useImperativeHandle(ref, () => ({
        submit: () => {
            if (formRef.current) {
                formRef.current.submit();
            }
        }
    }));

    // Get Configuration
    // This inserts the section you requested to ensure default URLs are used if not provided
    const defaultUrls = PAYFAST_CONFIG.getUrls();
    
    const merchantId = PAYFAST_CONFIG.IS_SANDBOX ? "10000100" : PAYFAST_CONFIG.MERCHANT_ID;
    const merchantKey = PAYFAST_CONFIG.IS_SANDBOX ? "46f0cd694581a" : PAYFAST_CONFIG.MERCHANT_KEY;

    // Calculate billing date for subscriptions (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const billingDate = tomorrow.toISOString().split('T')[0];

    return (
        <form 
            ref={formRef}
            action={PAYFAST_CONFIG.getProcessUrl()}
            method="POST"
            className="hidden"
        >
             {/* Merchant Details */}
             <input type="hidden" name="merchant_id" value={merchantId} />
             <input type="hidden" name="merchant_key" value={merchantKey} />
             
             {/* URLs */}
             <input type="hidden" name="return_url" value={returnUrl || defaultUrls.return_url} />
             <input type="hidden" name="cancel_url" value={cancelUrl || defaultUrls.cancel_url} />
             <input type="hidden" name="notify_url" value={notifyUrl || defaultUrls.notify_url} />
             
             {/* Transaction Details */}
             <input type="hidden" name="amount" value={amount.toFixed(2)} />
             <input type="hidden" name="item_name" value={itemName} />
             <input type="hidden" name="email_address" value={email || ''} />

             {/* Custom Pass-Through Fields */}
             {customStr1 && <input type="hidden" name="custom_str1" value={customStr1} />}
             {customStr2 && <input type="hidden" name="custom_str2" value={customStr2} />}
             {customStr3 && <input type="hidden" name="custom_str3" value={customStr3} />}
             {customInt1 && <input type="hidden" name="custom_int1" value={customInt1} />}

             {/* Subscription Fields */}
             {isSubscription && (
                <>
                    <input type="hidden" name="subscription_type" value="1" />
                    <input type="hidden" name="billing_date" value={billingDate} />
                    <input type="hidden" name="recurring_amount" value={amount.toFixed(2)} />
                    <input type="hidden" name="frequency" value={frequency} />
                    <input type="hidden" name="cycles" value={cycles} />
                </>
             )}
        </form>
    );
});

export default PayFastForm;
