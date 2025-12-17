<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1wumG5a2I3wOmQTfKSWpRzV5XykoYxwmF

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Build & Deploy

This project supports web deployment (Vite + Firebase Hosting) and Android (Capacitor + Gradle).

Prerequisites
- Node.js (16+ recommended)
- npm
- Firebase CLI (for web deploy): `npm install -g firebase-tools` and authenticated (`firebase login`)
- Android SDK / Android Studio (for Android builds)
- Java JDK (for Gradle)
- Capacitor CLI: `npm i -g @capacitor/cli`

Web (Firebase Hosting)
1. Install dependencies: `npm install`
2. Build the web app: `npm run build:web`
3. Preview locally (optional): `npm run preview:web`
4. Deploy to Firebase Hosting:
   - Make sure `firebase.json` and `.firebaserc` are configured and you're logged in: `firebase login`
   - Deploy: `npm run web:deploy`

Android (Capacitor)
1. Install dependencies: `npm install`
2. Build the web assets and sync to Android: `npm run android:build`
   - This will run `vite build`, `npx cap sync android`, then run Gradle assemble.
3. For a release APK: `npm run android:build:release` (will run Gradle `assembleRelease`)
4. To install debug build on a connected device: `npm run android:install:debug`
5. To open Android Studio for manual work: `npm run android:open`

Notes
- The Android scripts use the Windows Gradle wrapper (`gradlew.bat`). On macOS/Linux use `./gradlew` instead; open Android Studio if you need more control.
- If you use Firebase Hosting with a custom site, ensure your `firebase.json` points to the `dist`/`build` directory produced by Vite (by default `dist`).

## PayPal Integration Setup

This app includes PayPal integration for subscription payments. Follow these steps to set it up:

### 1. PayPal Developer Account Setup

1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Create a Business account or log in to your existing one
3. Go to "My Apps & Credentials"
4. Create a new app for "Express Checkout"
5. Note down your Client ID

### 2. Create Subscription Plans

In your PayPal Developer Dashboard:

1. Go to "Products" → Create Product
2. Create a product for "Spoil Me Vintage Membership"
3. Go to "Plans" → Create Plan for each membership tier:
   - **Insider Club**: $5.00/month
   - **Gold Member**: $12.00/month  
   - **Deluxe Vault**: $25.00/month

4. Note down the Plan IDs for each plan

### 3. Environment Configuration

1. Copy `.env.example` to `.env.local`
2. Fill in your PayPal credentials:

```env
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id_here
REACT_APP_PAYPAL_INSIDER_PLAN_ID=your_insider_plan_id_here
REACT_APP_PAYPAL_GOLD_PLAN_ID=your_gold_plan_id_here
REACT_APP_PAYPAL_DELUXE_PLAN_ID=your_deluxe_plan_id_here
```

### 4. Capacitor Configuration

The `capacitor.config.ts` is already configured to allow PayPal domains for the WebView.

### 5. PayPal Webhook Setup

Configure webhooks in your PayPal Developer Dashboard:

1. Go to "My Apps & Credentials" → Select your app
2. Go to "Webhooks" → Add Webhook
3. **Webhook URL**: `https://yourdomain.com/api/webhooks/paypal`
4. **Event Types** to listen for:
   - `PAYMENT.SALE.COMPLETED`
   - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `PAYMENT.PAYOUTS-ITEM.FAILED`

5. Note down the **Webhook ID** for your environment variables

### 6. Environment Variables for Webhooks

Add these to your server environment:

```env
PAYPAL_WEBHOOK_ID=your_webhook_id_from_paypal
PAYPAL_WEBHOOK_SECRET=your_webhook_secret
```

### 7. Running the Webhook Server

```bash
# Install dependencies
npm install

# Run server in development mode (with auto-restart)
npm run server:dev

# Or run server in production mode
npm run server
```

The webhook server will run on `http://localhost:3001` by default.

### Features Included

- ✅ PayPal Subscriptions (monthly recurring)
- ✅ PayPal Payouts for affiliates
- ✅ Transaction search and monitoring
- ✅ Admin dashboard for payout management
- ✅ Currency support (USD for international, ZAR for South Africa)
- ✅ Capacitor/WebView integration

### Security Notes

- Never expose PayPal client secrets in frontend code
- All payout operations should be handled server-side
- Use HTTPS in production
- Regularly monitor PayPal transaction logs
