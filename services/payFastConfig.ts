
// PAYFAST CONFIGURATION
// ---------------------------------------------------------
// 1. Set IS_SANDBOX to false when you are ready to go LIVE.
// 2. Replace MERCHANT_ID and MERCHANT_KEY with your details from https://www.payfast.co.za/
// ---------------------------------------------------------

export const PAYFAST_CONFIG = {
    IS_SANDBOX: false, // Set to false for production/live payments

    // REPLACE THESE WITH YOUR REAL DETAILS
    MERCHANT_ID: "113371222",      // Your Merchant ID
    MERCHANT_KEY: "cbhnt80ljkt7g", // Your Merchant Key
    
    // Helper to get the correct processing URL
    getProcessUrl: () => {
        return PAYFAST_CONFIG.IS_SANDBOX 
            ? "https://sandbox.payfast.co.za/eng/process"
            : "https://www.payfast.co.za/eng/process";
    },

    // NOTIFY URLS (Used by PayFast to tell your app what happened)
    // Note: The 'Notify URL' usually requires a backend server to verify the ITN signature.
    // For a static frontend, PayFast relies on the Return URL to show success to the user.
    getUrls: () => {
        const baseUrl = window.location.origin;
        return {
            return_url: `${baseUrl}/#/profile`,    // Success Page
            cancel_url: `${baseUrl}/#/cart`,       // Cancel Page
            notify_url: `${baseUrl}/api/notify`    // Instant Transaction Notification (Backend)
        };
    }
};
