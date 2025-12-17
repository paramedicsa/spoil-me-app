"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustStoreCredit = exports.grantTrial = exports.checkExpiredTrials = exports.monthlyCreditScheduler = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
// --- HELPER: Strict Admin Check ---
const isAdminOrOwner = (context) => {
    var _a, _b;
    const isOwner = ((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.email) === 'spoilmevintagediy@gmail.com';
    const isAdmin = ((_b = context.auth) === null || _b === void 0 ? void 0 : _b.token.admin) === true;
    return context.auth && (isAdmin || isOwner);
};
// Credit amounts by plan
const CREDIT_AMOUNTS = {
    // ZAR Plans
    'Spoil Me': { amount: 25, currency: 'ZAR' },
    'Basic': { amount: 50, currency: 'ZAR' },
    'Premium': { amount: 100, currency: 'ZAR' },
    'Deluxe Vault': { amount: 150, currency: 'ZAR' },
    'Deluxe Boss': { amount: 150, currency: 'ZAR' },
    // USD Plans
    'Insider Club': { amount: 5, currency: 'USD' },
    'Gold Member': { amount: 12, currency: 'USD' },
    'Deluxe': { amount: 15, currency: 'USD' },
};
// Function A: Monthly Credit Scheduler (Runs Daily)
exports.monthlyCreditScheduler = functions.pubsub.schedule('0 9 * * *')
    .timeZone('Africa/Johannesburg')
    .onRun(async (context) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day
    // We also want to capture the end of the day for the query
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    try {
        // Query users due for credit today (Check Timestamp ranges)
        const usersSnapshot = await db
            .collection('users')
            .where('membershipStatus', '==', 'active')
            .where('nextCreditDrop', '>=', today)
            .where('nextCreditDrop', '<=', endOfDay)
            .get();
        const batch = db.batch();
        let operationCount = 0;
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            const plan = userData.membershipTier;
            const currency = userData.creditCurrency || 'ZAR';
            const creditData = CREDIT_AMOUNTS[plan] || { amount: 0, currency: 'ZAR' };
            const creditAmount = creditData.amount;
            if (creditAmount > 0) {
                const userRef = db.collection('users').doc(doc.id);
                // Update Wallet
                batch.update(userRef, {
                    storeCredit: admin.firestore.FieldValue.increment(creditAmount),
                    // Set next drop to 30 days from NOW
                    nextCreditDrop: admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
                });
                // Send Notification
                const notificationRef = db.collection('notifications').doc();
                batch.set(notificationRef, {
                    userId: doc.id,
                    message: `Your monthly member credit of ${currency === 'USD' ? '$' : 'R'}${creditAmount} has arrived! Happy Shopping.`,
                    type: 'credit_received',
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                operationCount++;
            }
        });
        if (operationCount > 0) {
            await batch.commit();
        }
        console.log(`Processed ${operationCount} users for monthly credit`);
    }
    catch (error) {
        console.error('Error in monthlyCreditScheduler:', error);
    }
});
// Function B: Check Expired Trials (Runs Daily)
exports.checkExpiredTrials = functions.pubsub.schedule('0 10 * * *')
    .timeZone('Africa/Johannesburg')
    .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    try {
        const expiredTrialsSnapshot = await db
            .collection('users')
            .where('membershipStatus', '==', 'trial')
            .where('trialExpiresAt', '<', now)
            .get();
        const batch = db.batch();
        expiredTrialsSnapshot.forEach((doc) => {
            const userRef = db.collection('users').doc(doc.id);
            batch.update(userRef, {
                membershipStatus: 'expired',
                membershipTier: admin.firestore.FieldValue.delete(), // Remove tier
            });
            const notificationRef = db.collection('notifications').doc();
            batch.set(notificationRef, {
                userId: doc.id,
                message: 'Your VIP Trial has ended. Subscribe to keep your benefits.',
                type: 'trial_ended',
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        if (!expiredTrialsSnapshot.empty) {
            await batch.commit();
        }
        console.log(`Processed ${expiredTrialsSnapshot.size} expired trials`);
    }
    catch (error) {
        console.error('Error in checkExpiredTrials:', error);
    }
});
// Function C: Grant Trial (Called by Admin)
exports.grantTrial = functions.https.onCall(async (data, context) => {
    // 1. SECURITY
    if (!isAdminOrOwner(context)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can grant trials.');
    }
    const { userId, plan, days } = data;
    if (!userId || !plan || !days) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }
    try {
        const expiryDate = Date.now() + (Number(days) * 24 * 60 * 60 * 1000);
        // Better Currency Logic
        const currency = (plan.includes('USD') || plan.includes('$')) ? 'USD' : 'ZAR';
        await db.runTransaction(async (transaction) => {
            const userRef = db.collection('users').doc(userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'User not found');
            }
            transaction.update(userRef, {
                membershipTier: plan,
                membershipStatus: 'trial',
                trialExpiresAt: admin.firestore.Timestamp.fromMillis(expiryDate),
                creditCurrency: currency,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            const notificationRef = db.collection('notifications').doc();
            transaction.set(notificationRef, {
                userId: userId,
                title: 'VIP Trial Activated! 🎁',
                message: `You have been gifted a ${days}-day trial for the ${plan} membership. Enjoy!`,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        return { success: true, message: `Trial granted to ${userId}` };
    }
    catch (error) {
        console.error('Error granting trial:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update user database.');
    }
});
// Function D: Adjust Store Credit (Called by Admin)
exports.adjustStoreCredit = functions.https.onCall(async (data, context) => {
    // 1. SECURITY
    if (!isAdminOrOwner(context)) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    const { userId, amount } = data;
    if (!userId || typeof amount !== 'number') {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid parameters');
    }
    try {
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
            storeCredit: admin.firestore.FieldValue.increment(amount),
        });
        if (amount > 0) {
            await db.collection('notifications').add({
                userId: userId,
                message: `Your store credit has been adjusted by +${amount}.`,
                type: 'credit_adjusted',
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return { success: true };
    }
    catch (error) {
        console.error('Error adjusting store credit:', error);
        throw new functions.https.HttpsError('internal', 'Failed to adjust credit');
    }
});
//# sourceMappingURL=membershipAutomation.js.map