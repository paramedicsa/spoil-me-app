import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import * as crypto from 'crypto';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({
  verify: (req, res, buf) => (req as any).rawBody = buf
}));

// PayPal Webhook ID from environment variable
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '4LY14234R7178403E';

// Commission rates for different plans
const COMMISSION_RATES = {
  'insider': 1.00, // $1.00 for Insider Club
  'gold': 2.00,    // $2.00 for Gold Member
  'deluxe': 3.00   // $3.00 for Deluxe Vault
};

// Verify PayPal webhook signature
function verifyPayPalSignature(req: express.Request): boolean {
  try {
    const signature = req.headers['paypal-transmission-sig'] as string;
    const timestamp = req.headers['paypal-transmission-time'] as string;
    const webhookId = req.headers['paypal-webhook-id'] as string;
    const eventType = req.headers['paypal-event-type'] as string;

    if (!signature || !timestamp || !webhookId || !eventType) {
      console.error('Missing required PayPal headers');
      return false;
    }

    // Verify webhook ID matches
    if (webhookId !== PAYPAL_WEBHOOK_ID) {
      console.error('Webhook ID mismatch');
      return false;
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.PAYPAL_WEBHOOK_SECRET || '')
      .update(timestamp + '.' + JSON.stringify(req.body))
      .digest('hex');

    // Compare signatures (use timing-safe comparison)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Extend user membership by 30 days
async function extendMembership(userId: string): Promise<void> {
  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.data();
    const currentExpiry = userData?.membershipExpiry ? new Date(userData.membershipExpiry) : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + 30);

    await userRef.update({
      membershipExpiry: admin.firestore.Timestamp.fromDate(newExpiry),
      membershipStatus: 'active',
      lastPaymentDate: admin.firestore.Timestamp.fromDate(new Date())
    });

    console.log(`Extended membership for user ${userId} until ${newExpiry.toISOString()}`);
  } catch (error) {
    console.error('Error extending membership:', error);
    throw error;
  }
}

// Process affiliate commission
async function processAffiliateCommission(userId: string, planType: keyof typeof COMMISSION_RATES, orderData?: any): Promise<void> {
  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.data();
    const referrerId = userData?.referrerId || userData?.affiliateReferrer;

    if (!referrerId) {
      console.log(`No referrer found for user ${userId}`);
      return;
    }

    // Check if this is a VIP affiliate referral
    const referralData = orderData?.meta?.affiliateReferral;
    let commissionAmount = 0;
    let currency = 'USD';

    if (referralData) {
      // VIP Affiliate Commission Logic
      const affiliateRef = admin.firestore().collection('users').doc(referrerId);
      const affiliateDoc = await affiliateRef.get();

      if (!affiliateDoc.exists) {
        console.error(`Affiliate ${referrerId} not found`);
        return;
      }

      const affiliateData = affiliateDoc.data();
      const affiliateCurrency = affiliateData?.affiliateCurrency || 'USD';

      // Get the discount and commission from referral data
      const commissionPercent = referralData.commissionPercent || 0;

      // Calculate commission based on order total
      const orderTotal = orderData.total || 0;
      const customerCurrency = orderData.currency || 'ZAR';

      commissionAmount = (orderTotal * commissionPercent) / 100;

      // Currency conversion if needed
      if (customerCurrency !== affiliateCurrency) {
        if (customerCurrency === 'ZAR' && affiliateCurrency === 'USD') {
          // Convert ZAR to USD (assuming 1 USD = 18 ZAR)
          commissionAmount = commissionAmount / 18;
        } else if (customerCurrency === 'USD' && affiliateCurrency === 'ZAR') {
          // Convert USD to ZAR
          commissionAmount = commissionAmount * 18;
        }
      }

      currency = affiliateCurrency;
    } else {
      // Legacy subscription commission
      commissionAmount = COMMISSION_RATES[planType.toLowerCase() as keyof typeof COMMISSION_RATES] || 0;
      currency = 'USD';
    }

    if (commissionAmount === 0) {
      console.log(`No commission calculated for user ${userId}`);
      return;
    }

    // Update affiliate's wallet balance
    const affiliateRef = admin.firestore().collection('users').doc(referrerId);
    const affiliateDoc = await affiliateRef.get();

    if (!affiliateDoc.exists) {
      console.error(`Affiliate ${referrerId} not found`);
      return;
    }

    const affiliateData = affiliateDoc.data();
    const currentBalance = affiliateData?.affiliateBalance || 0;
    const newBalance = currentBalance + commissionAmount;

    await affiliateRef.update({
      affiliateBalance: newBalance,
      lastCommissionDate: admin.firestore.Timestamp.fromDate(new Date())
    });

    // Log the commission
    await admin.firestore().collection('commissions').add({
      affiliateId: referrerId,
      referredUserId: userId,
      amount: commissionAmount,
      currency: currency,
      type: referralData ? 'vip_store' : 'subscription',
      planType: planType,
      commissionPercent: referralData?.commissionPercent,
      orderId: orderData?.id,
      date: admin.firestore.Timestamp.fromDate(new Date()),
      status: 'completed'
    });

    console.log(`Processed commission: ${currency}${commissionAmount} to affiliate ${referrerId} for ${referralData ? 'VIP store sale' : 'referring user'} ${userId}`);
  } catch (error) {
    console.error('Error processing affiliate commission:', error);
    throw error;
  }
}

// Handle payment failure
async function handlePaymentFailure(userId: string): Promise<void> {
  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    await userRef.update({
      membershipStatus: 'grace_period',
      paymentFailedDate: admin.firestore.Timestamp.fromDate(new Date()),
      vaultAccessLocked: true
    });

    console.log(`Payment failed for user ${userId} - entered grace period`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(userId: string, subscriptionId: string): Promise<void> {
  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.data();
    const expiryDate = userData?.membershipExpiry;

    await userRef.update({
      membershipStatus: 'cancelled_pending',
      subscriptionCancelledDate: admin.firestore.Timestamp.fromDate(new Date()),
      vaultLadderResetScheduled: expiryDate // Reset vault ladder on expiry
    });

    console.log(`Subscription cancelled for user ${userId} - access until expiry`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

// Handle payout success
async function handlePayoutSuccess(payoutItemId: string): Promise<void> {
  try {
    // Find the payout record
    const q = admin.firestore().collection('payouts').where('paypalPayoutItemId', '==', payoutItemId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.error(`Payout record not found for item ID: ${payoutItemId}`);
      return;
    }

    const payoutDoc = querySnapshot.docs[0];
    await payoutDoc.ref.update({
      status: 'completed',
      completedDate: admin.firestore.Timestamp.fromDate(new Date())
    });

    console.log(`Payout marked as completed for item ID: ${payoutItemId}`);
  } catch (error) {
    console.error('Error handling payout success:', error);
    throw error;
  }
}

// Handle payout failure
async function handlePayoutFailure(payoutItemId: string): Promise<void> {
  try {
    // Find the payout record
    const q = admin.firestore().collection('payouts').where('paypalPayoutItemId', '==', payoutItemId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.error(`Payout record not found for item ID: ${payoutItemId}`);
      return;
    }

    const payoutDoc = querySnapshot.docs[0];
    const payoutData = payoutDoc.data();

    // Update payout status to failed
    await payoutDoc.ref.update({
      status: 'failed',
      failedDate: admin.firestore.Timestamp.fromDate(new Date())
    });

    // Refund the amount back to affiliate wallet
    const affiliateRef = admin.firestore().collection('users').doc(payoutData.affiliateId);
    const affiliateDoc = await affiliateRef.get();

    if (affiliateDoc.exists) {
      const affiliateData = affiliateDoc.data();
      const currentBalance = affiliateData?.affiliateBalance || 0;
      const refundAmount = payoutData.amount;

      await affiliateRef.update({
        affiliateBalance: currentBalance + refundAmount
      });

      console.log(`Refunded $${refundAmount} to affiliate ${payoutData.affiliateId} due to payout failure`);
    }
  } catch (error) {
    console.error('Error handling payout failure:', error);
    throw error;
  }
}

// Main webhook handler
app.post('/webhooks/paypal', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    // Verify PayPal signature
    if (!verifyPayPalSignature(req)) {
      console.error('Invalid PayPal signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const event = req.body;
    const eventType = event.event_type;
    const resource = event.resource;

    console.log(`Received PayPal webhook: ${eventType}`);

    switch (eventType) {
      case 'PAYMENT.SALE.COMPLETED':
        // Extract user ID from custom field
        const customId = resource.custom || resource.invoice_id;
        if (!customId) {
          console.error('No custom ID found in payment completion');
          res.status(400).json({ error: 'Missing custom ID' });
          return;
        }

        // Determine plan type from amount or subscription details
        const amount = parseFloat(resource.amount.total);
        let planType: keyof typeof COMMISSION_RATES = 'insider'; // default
        if (amount >= 25) planType = 'deluxe';
        else if (amount >= 12) planType = 'gold';

        await extendMembership(customId);
        await processAffiliateCommission(customId, planType);

        console.log(`Payment completed for user ${customId}, plan: ${planType}`);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        const failedUserId = resource.custom_id;
        if (!failedUserId) {
          console.error('No user ID found in payment failure');
          res.status(400).json({ error: 'Missing user ID' });
          return;
        }

        await handlePaymentFailure(failedUserId);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        const cancelledUserId = resource.custom_id;
        const subscriptionId = resource.id;

        if (!cancelledUserId) {
          console.error('No user ID found in subscription cancellation');
          res.status(400).json({ error: 'Missing user ID' });
          return;
        }

        await handleSubscriptionCancelled(cancelledUserId, subscriptionId);
        break;

      case 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED':
        const successPayoutItemId = resource.payout_item_id;
        if (!successPayoutItemId) {
          console.error('No payout item ID found in payout success');
          res.status(400).json({ error: 'Missing payout item ID' });
          return;
        }

        await handlePayoutSuccess(successPayoutItemId);
        break;

      case 'PAYMENT.PAYOUTS-ITEM.FAILED':
        const failedPayoutItemId = resource.payout_item_id;
        if (!failedPayoutItemId) {
          console.error('No payout item ID found in payout failure');
          res.status(400).json({ error: 'Missing payout item ID' });
          return;
        }

        await handlePayoutFailure(failedPayoutItemId);
        break;

      default:
        console.log(`Unhandled PayPal event type: ${eventType}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'PayPal webhook listener is running', timestamp: new Date().toISOString() });
});

// List all Firebase Auth users
app.get('/users', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    // Check if user is authenticated and has admin claims
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Check if user has admin role
    if (!decodedToken.admin && decodedToken.email !== 'spoilmevintagediy@gmail.com') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      disabled: user.disabled,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      },
      customClaims: user.customClaims
    }));

    res.json({ users });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Grant trial membership
app.post('/admin/grantTrial', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    // Check if user is authenticated and has admin claims
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Check if user has admin role
    if (!decodedToken.admin && decodedToken.email !== 'spoilmevintagediy@gmail.com') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Extend membership for the user
    await extendMembership(userId);

    res.json({ success: true, message: `Trial membership granted to user ${userId}` });
  } catch (error) {
    console.error('Error granting trial membership:', error);
    res.status(500).json({ error: 'Failed to grant trial membership' });
  }
});

// Admin Delete User Function
export const deleteUser = functions.https.onCall(async (data: any, context: any) => {
  // 1. ADMIN CHECK
  const isOwner = context.auth?.token.email === 'spoilmevintagediy@gmail.com';
  const isAdmin = context.auth?.token.admin === true;

  if (!context.auth || (!isAdmin && !isOwner)) {
    throw new functions.https.HttpsError('permission-denied', 'Restricted to Admins.');
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required.');
  }

  try {
    // 2. DELETE FROM FIRESTORE FIRST
    // Delete user document from Firestore
    await admin.firestore().collection('users').doc(userId).delete();

    // Delete any related data (orders, notifications, etc.)
    const relatedCollections = ['orders', 'notifications', 'share_logs', 'social_logs'];

    for (const collectionName of relatedCollections) {
      const relatedDocs = await admin.firestore()
        .collection(collectionName)
        .where('userId', '==', userId)
        .get();

      const deletePromises = relatedDocs.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
    }

    // 3. DELETE FROM FIREBASE AUTH
    // This permanently removes the user from Firebase Authentication
    await admin.auth().deleteUser(userId);

    console.log(`User ${userId} permanently deleted from both Firestore and Firebase Auth`);

    return {
      success: true,
      message: `User ${userId} has been permanently deleted.`
    };

  } catch (error: any) {
    console.error("Delete User Error:", error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError('not-found', 'User not found in Firebase Auth.');
    }

    throw new functions.https.HttpsError('internal', 'Failed to delete user completely.');
  }
});

export const purchaseAd = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to purchase an ad.');
    }

    const { productId, packageId, includeSocial } = data;
    const artistUid = context.auth.uid;

    if (!productId || !packageId) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with "productId" and "packageId" arguments.');
    }

    const db = admin.firestore();

    try {
        // 2. Fetch the OFFICIAL prices and artist data in parallel
        const settingsDocRef = db.doc('settings/ad_config');
        const artistDocRef = db.doc(`users/${artistUid}`);

        const [settingsDoc, artistDoc] = await Promise.all([
            settingsDocRef.get(),
            artistDocRef.get()
        ]);

        if (!settingsDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Ad configuration not found. Please contact support.');
        }
        if (!artistDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Artist profile not found.');
        }

        const config = settingsDoc.data();
        const artistData = artistDoc.data();
        const artistCurrency = artistData.currency || 'USD'; // Assume USD if not set

        // 3. Find the selected package and determine the cost
        const selectedPackage = config.packages.find(p => p.id === packageId);
        if (!selectedPackage || !selectedPackage.active) {
            throw new functions.https.HttpsError('not-found', 'The selected ad package is not available.');
        }

        const socialConfig = config.socialAddon;
        let cost = 0;

        if (artistCurrency === 'ZAR') {
            cost = selectedPackage.priceZAR;
            if (includeSocial && socialConfig.enabled) {
                cost += socialConfig.priceZAR;
            }
        } else { // Default to USD
            cost = selectedPackage.priceUSD;
            if (includeSocial && socialConfig.enabled) {
                cost += socialConfig.priceUSD;
            }
        }

        // 4. Validate artist's wallet balance
        const artistWallet = artistData.wallet || { available: 0 };
        if (artistWallet.available < cost) {
            throw new functions.https.HttpsError('failed-precondition', 'Insufficient funds in your wallet. Please top up.');
        }

        // 5. Deduct cost and update product promotion status
        const newBalance = artistWallet.available - cost;
        const promotionEndDate = new Date();
        promotionEndDate.setDate(promotionEndDate.getDate() + selectedPackage.durationDays);

        const productRef = db.doc(`products/${productId}`);

        await db.runTransaction(async (transaction) => {
            // Update artist's wallet
            transaction.update(artistDocRef, { 'wallet.available': newBalance });

            // Update product's ad status
            transaction.update(productRef, {
                isPromoted: true,
                promotedUntil: admin.firestore.Timestamp.fromDate(promotionEndDate),
                promotionTier: packageId,
                'adStats.totalImpressions': 0, // Reset stats for new campaign
                'adStats.totalClicks': 0,
                'adStats.ctr': 0,
                'adStats.lastAdDate': admin.firestore.Timestamp.now(),
            });

            // Create a record of the transaction
            const adTransactionRef = db.collection('ad_transactions').doc();
            transaction.set(adTransactionRef, {
                artistId: artistUid,
                productId: productId,
                packageId: packageId,
                cost: cost,
                currency: artistCurrency,
                purchasedAt: admin.firestore.Timestamp.now(),
                promotionEndsAt: admin.firestore.Timestamp.fromDate(promotionEndDate),
                includesSocial: !!includeSocial,
            });
        });

        return { success: true, message: `Successfully purchased '${selectedPackage.name}' for ${productId}.` };

    } catch (error) {
        console.error("Error purchasing ad:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred while purchasing the ad.');
    }
});

// Cloud Function to track ad metrics (impressions and clicks)
export const trackAdMetric = functions.https.onCall(async (data, context) => {
    const { productId, type } = data; // type can be 'view' or 'click'

    if (!productId || !type || (type !== 'view' && type !== 'click')) {
        throw new functions.https.HttpsError('invalid-argument', 'Requires "productId" and a valid "type" ("view" or "click").');
    }

    const productRef = admin.firestore().doc(`products/${productId}`);
    const increment = admin.firestore.FieldValue.increment(1);

    try {
        if (type === 'view') {
            await productRef.update({ 'adStats.totalImpressions': increment });
        } else if (type === 'click') {
            await productRef.update({ 'adStats.totalClicks': increment });
            // Note: CTR calculation would be best handled on the client or in a separate, less frequent job
        }
        return { success: true };
    } catch (error) {
        console.error(`Error tracking ad ${type} for ${productId}:`, error);
        // Don't throw an error back to the client for this, as it's a background task
        return { success: false };
    }
});

// Scheduled function to check for and deactivate expired ads
export const checkAdExpiry = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    console.log('Running hourly check for expired ads...');
    const now = admin.firestore.Timestamp.now();
    const db = admin.firestore();

    try {
        const expiredAdsQuery = db.collection('products')
            .where('isPromoted', '==', true)
            .where('promotedUntil', '<', now);

        const snapshot = await expiredAdsQuery.get();

        if (snapshot.empty) {
            console.log('No expired ads found.');
            return null;
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            console.log(`Deactivating ad for product: ${doc.id}`);
            const productRef = db.doc(`products/${doc.id}`);
            batch.update(productRef, {
                isPromoted: false,
                // Keep promotionTier for historical reference if needed
            });
            // Optionally, send a notification to the artist
        });

        await batch.commit();
        console.log(`Successfully deactivated ${snapshot.size} expired ads.`);
        return null;

    } catch (error) {
        console.error('Error in checkAdExpiry scheduled function:', error);
        return null;
    }
});

// Export the Express app as a Firebase Cloud Function
export const api = functions.https.onRequest(app);

// Admin Push Notification Function
export const sendAdminPush = functions.https.onCall(async (data: any, context: any) => {
  // 1. ADMIN CHECK
  const isOwner = context.auth?.token.email === 'spoilmevintagediy@gmail.com';
  const isAdmin = context.auth?.token.admin === true;

  if (!context.auth || (!isAdmin && !isOwner)) {
    throw new functions.https.HttpsError('permission-denied', 'Restricted to Admins.');
  }

  const { targetType, targetValue, title, body, imageUrl, link } = data;
  const db = admin.firestore();
  let tokens: string[] = [];

  // 2. GATHER TOKENS
  try {
    if (targetType === 'individual') {
      // Target specific user ID - Fetch from Sub-collection
      const tokensSnap = await db.collection('users').doc(targetValue).collection('push_tokens').get();
      tokens = tokensSnap.docs.map(doc => doc.data().token).filter(Boolean);
    }

    else if (targetType === 'tier') {
      // Target Membership Group (e.g., 'gold') - Fetch from Sub-collection
      const snapshot = await db.collection('users').where('membershipTier', '==', targetValue).get();
      for (const userDoc of snapshot.docs) {
        const tokensSnap = await userDoc.ref.collection('push_tokens').get();
        const userTokens = tokensSnap.docs.map(doc => doc.data().token).filter(Boolean);
        tokens.push(...userTokens);
      }
    }
    else if (targetType === 'all') {
      // Target Everyone (Limit query to prevent timeouts in this version)
      // Note: For massive scale (>10k users), use Topic Messaging instead.
      const snapshot = await db.collection('users').orderBy('createdAt', 'desc').limit(1000).get();
      for (const userDoc of snapshot.docs) {
        const tokensSnap = await userDoc.ref.collection('push_tokens').get();
        const userTokens = tokensSnap.docs.map(doc => doc.data().token).filter(Boolean);
        tokens.push(...userTokens);
      }
    }

    // 3. REMOVE DUPLICATES & VALIDATE
    const uniqueTokens = [...new Set(tokens)].filter(t => t); // Remove null/undefined

    if (uniqueTokens.length === 0) {
      return { success: false, message: "No active devices found for this target." };
    }

    console.log(`Sending Push to ${uniqueTokens.length} devices. [Admin Console]`);

    // 4. SEND BATCH
    const message = {
      tokens: uniqueTokens,
      notification: {
        title: title,
        body: body,
        imageUrl: imageUrl || undefined, // Only send if exists
      },
      data: {
        // Custom data for the app to handle redirection
        url: link || '/'
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    return {
      success: true,
      sentCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error) {
    console.error("Push Error:", error);
    throw new functions.https.HttpsError('internal', 'Failed to send notifications');
  }
});

// Export membership automation functions
export { monthlyCreditScheduler, checkExpiredTrials, grantTrial, adjustStoreCredit } from './membershipAutomation';

// Affiliate Automation Functions
export { runAutoApproveAffiliates, reviewAffiliateApplication } from './affiliateAutomation';
// export { onAffiliateApplicationCreate } from './affiliateAutomation'; // Temporarily disabled - needs Firestore DB

// EMERGENCY CLEANUP FUNCTION
export const emergencyPurgeTokens = functions.https.onRequest(async (req, res) => {
  // 1. HARDCODED SECURITY (Change this ID to the broken User ID from your logs)
  const BROKEN_USER_ID = "REPLACE_WITH_ACTUAL_USER_ID"; // TODO: Replace with the actual user ID

  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(BROKEN_USER_ID);

    // 2. Perform the surgery
    // We delete ONLY the 'fcmTokens' field. Everything else stays safe.
    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.delete()
    });

    res.status(200).send(`Successfully purged fcmTokens from user ${BROKEN_USER_ID}. Document is now unlocked.`);
  } catch (error) {
    console.error("Purge failed:", error);
    res.status(500).send(`Failed to purge: ${error}`);
  }
});

// --- EMERGENCY FIX START ---
export const forceCleanUser = functions.https.onRequest(async (req, res) => {
  // This is the ID from your error logs
  const TARGET_ID = "Dzk5mgkC7UYtlN3F6f3kK2EhM1S2";

  try {
    const db = admin.firestore();

    // This command deletes ONLY the bloated 'fcmTokens' field
    // It leaves the rest of the profile (Name, Email, etc.) safe.
    await db.collection('users').doc(TARGET_ID).update({
      fcmTokens: admin.firestore.FieldValue.delete()
    });

    res.status(200).send(`✅ SUCCESS: User ${TARGET_ID} has been cleaned. Try granting trial now.`);
  } catch (error) {
    res.status(500).send(`❌ FAILED: ${error}`);
  }
});
// --- EMERGENCY FIX END ---
