import express from 'express';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { db } from '../firebaseConfig'; // Assuming Firebase is used for database
import { doc, updateDoc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const router = express.Router();

// PayPal Webhook Secret (set this in environment variables)
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || 'your_webhook_id_here';

// Commission rates for different plans
const COMMISSION_RATES = {
  'insider': 1.00, // $1.00 for Insider Club
  'gold': 2.00,    // $2.00 for Gold Member
  'deluxe': 3.00   // $3.00 for Deluxe Vault
};

// Verify PayPal webhook signature
function verifyPayPalSignature(req: Request): boolean {
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
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.data();
    const currentExpiry = userData.membershipExpiry ? new Date(userData.membershipExpiry) : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + 30);

    await updateDoc(userRef, {
      membershipExpiry: newExpiry.toISOString(),
      membershipStatus: 'active',
      lastPaymentDate: new Date().toISOString()
    });

    console.log(`Extended membership for user ${userId} until ${newExpiry.toISOString()}`);
  } catch (error) {
    console.error('Error extending membership:', error);
    throw error;
  }
}

// Process affiliate commission
async function processAffiliateCommission(userId: string, planType: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.data();
    const referrerId = userData.referrerId || userData.affiliateReferrer;

    if (!referrerId) {
      console.log(`No referrer found for user ${userId}`);
      return;
    }

    const commissionAmount = COMMISSION_RATES[planType.toLowerCase()] || 0;

    if (commissionAmount === 0) {
      console.log(`No commission rate found for plan type: ${planType}`);
      return;
    }

    // Update affiliate's wallet balance
    const affiliateRef = doc(db, 'users', referrerId);
    const affiliateDoc = await getDoc(affiliateRef);

    if (!affiliateDoc.exists()) {
      console.error(`Affiliate ${referrerId} not found`);
      return;
    }

    const affiliateData = affiliateDoc.data();
    const currentBalance = affiliateData.affiliateBalance || 0;
    const newBalance = currentBalance + commissionAmount;

    await updateDoc(affiliateRef, {
      affiliateBalance: newBalance,
      lastCommissionDate: new Date().toISOString()
    });

    // Log the commission
    await addDoc(collection(db, 'commissions'), {
      affiliateId: referrerId,
      referredUserId: userId,
      amount: commissionAmount,
      currency: 'USD',
      type: 'subscription',
      planType: planType,
      date: new Date().toISOString(),
      status: 'completed'
    });

    console.log(`Processed commission: $${commissionAmount} to affiliate ${referrerId} for referring user ${userId}`);
  } catch (error) {
    console.error('Error processing affiliate commission:', error);
    throw error;
  }
}

// Handle payment failure
async function handlePaymentFailure(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      membershipStatus: 'grace_period',
      paymentFailedDate: new Date().toISOString(),
      vaultAccessLocked: true
    });

    // TODO: Send email notification
    console.log(`Payment failed for user ${userId} - entered grace period`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(userId: string, subscriptionId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.data();
    const expiryDate = userData.membershipExpiry;

    await updateDoc(userRef, {
      membershipStatus: 'cancelled_pending',
      subscriptionCancelledDate: new Date().toISOString(),
      vaultLadderResetScheduled: expiryDate // Reset vault ladder on expiry
    });

    console.log(`Subscription cancelled for user ${userId} - access until ${expiryDate}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

// Handle payout failure
async function handlePayoutFailure(payoutItemId: string): Promise<void> {
  try {
    // Find the payout record
    const payoutsRef = collection(db, 'payouts');
    const q = query(payoutsRef, where('paypalPayoutItemId', '==', payoutItemId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`Payout record not found for item ID: ${payoutItemId}`);
      return;
    }

    const payoutDoc = querySnapshot.docs[0];
    const payoutData = payoutDoc.data();

    // Update payout status to failed
    await updateDoc(payoutDoc.ref, {
      status: 'failed',
      failedDate: new Date().toISOString()
    });

    // Refund the amount back to affiliate wallet
    const affiliateRef = doc(db, 'users', payoutData.affiliateId);
    const affiliateDoc = await getDoc(affiliateRef);

    if (affiliateDoc.exists()) {
      const affiliateData = affiliateDoc.data();
      const currentBalance = affiliateData.affiliateBalance || 0;
      const refundAmount = payoutData.amount;

      await updateDoc(affiliateRef, {
        affiliateBalance: currentBalance + refundAmount
      });

      console.log(`Refunded $${refundAmount} to affiliate ${payoutData.affiliateId} due to payout failure`);
    }

    // TODO: Send admin notification
    console.log(`Payout failed for affiliate ${payoutData.affiliateEmail} - funds refunded to wallet`);
  } catch (error) {
    console.error('Error handling payout failure:', error);
    throw error;
  }
}

// Main webhook handler
router.post('/paypal', async (req: Request, res: Response) => {
  try {
    // Verify PayPal signature
    if (!verifyPayPalSignature(req)) {
      console.error('Invalid PayPal signature');
      return res.status(401).json({ error: 'Invalid signature' });
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
          return res.status(400).json({ error: 'Missing custom ID' });
        }

        // Determine plan type from amount or subscription details
        const amount = parseFloat(resource.amount.total);
        let planType = 'insider'; // default
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
          return res.status(400).json({ error: 'Missing user ID' });
        }

        await handlePaymentFailure(failedUserId);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        const cancelledUserId = resource.custom_id;
        const subscriptionId = resource.id;

        if (!cancelledUserId) {
          console.error('No user ID found in subscription cancellation');
          return res.status(400).json({ error: 'Missing user ID' });
        }

        await handleSubscriptionCancelled(cancelledUserId, subscriptionId);
        break;

      case 'PAYMENT.PAYOUTS-ITEM.FAILED':
        const payoutItemId = resource.payout_item_id;
        if (!payoutItemId) {
          console.error('No payout item ID found in payout failure');
          return res.status(400).json({ error: 'Missing payout item ID' });
        }

        await handlePayoutFailure(payoutItemId);
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
router.get('/paypal/health', (req: Request, res: Response) => {
  res.json({ status: 'PayPal webhook listener is running' });
});

export default router;
