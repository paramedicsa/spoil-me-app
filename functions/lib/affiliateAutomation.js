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
exports.reviewAffiliateApplication = exports.runAutoApproveAffiliates = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// 1. THE CRON JOB (Auto-Approver)
exports.runAutoApproveAffiliates = functions.pubsub.schedule('every 10 minutes').onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    // Find pending apps that are older than 1 hour
    const overdueApps = await db.collection('affiliate_applications')
        .where('status', '==', 'pending')
        .where('autoApproveAt', '<=', now)
        .get();
    if (overdueApps.empty)
        return null;
    const batch = db.batch();
    overdueApps.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId;
        const userRef = db.collection('users').doc(userId);
        // Generate a simple code: FirstName + Random 3 digits
        // (In production, fetch user name first, here we simulate)
        const code = `PARTNER${Math.floor(1000 + Math.random() * 9000)}`;
        // 1. Approve Application
        batch.update(doc.ref, { status: 'approved', approvedBy: 'system_timer' });
        // 2. Upgrade User
        batch.update(userRef, {
            isAffiliate: true,
            affiliateCode: code,
            affiliateStatus: 'active'
        });
        // 3. Send Notification
        const notifRef = db.collection('notifications').doc();
        batch.set(notifRef, {
            userId,
            title: 'Application Approved! 🌟',
            message: 'Your partner application was automatically approved. You can now access your dashboard.',
            type: 'system',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
    await batch.commit();
    console.log(`Auto-approved ${overdueApps.size} affiliates.`);
    return null;
});
// 2. MANUAL REVIEW (Admin Action)
exports.reviewAffiliateApplication = functions.https.onCall(async (data, context) => {
    var _a, _b, _c;
    // Check Admin Permissions
    const isOwner = ((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.email) === 'spoilmevintagediy@gmail.com';
    const isAdmin = ((_b = context.auth) === null || _b === void 0 ? void 0 : _b.token.admin) === true;
    if (!context.auth || (!isAdmin && !isOwner)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can review applications.');
    }
    const { applicationId, decision, reason } = data;
    const appRef = db.collection('affiliate_applications').doc(applicationId);
    const appDoc = await appRef.get();
    if (!appDoc.exists)
        throw new functions.https.HttpsError('not-found', 'Application not found');
    const userId = (_c = appDoc.data()) === null || _c === void 0 ? void 0 : _c.userId;
    const userRef = db.collection('users').doc(userId);
    if (decision === 'approve') {
        const code = `VIP${Math.floor(1000 + Math.random() * 9000)}`; // Simplify generation
        await appRef.update({ status: 'approved', approvedBy: 'admin' });
        await userRef.update({ isAffiliate: true, affiliateCode: code });
        // Send Push/In-App
        await sendNotification(userId, "You're In! 🚀", "Welcome to the team. Access your dashboard now.");
    }
    else if (decision === 'reject') {
        await appRef.update({
            status: 'rejected',
            rejectionReason: reason,
            approvedBy: 'admin'
        });
        // Send Push/In-App
        await sendNotification(userId, "Application Update", `Your application was not approved. Reason: ${reason}`);
    }
    return { success: true };
});
// 3. APPLICATION TRIGGER (When user applies) - TEMPORARILY DISABLED
// Firestore database needs to be created first
// export const onAffiliateApplicationCreate = functions.firestore
//     .document('affiliate_applications/{applicationId}')
//     .onCreate(async (snap, context) => {
//         const data = snap.data();
//         const userId = data.userId;
//         // Send notification to admin
//         const adminNotification = {
//             userId: 'admin', // You might want to store admin user IDs
//             title: 'New Affiliate Application 📋',
//             message: `New partner application received from user ${userId}. Please review.`,
//             type: 'system',
//             read: false,
//             createdAt: admin.firestore.FieldValue.serverTimestamp()
//         };
//         await db.collection('notifications').add(adminNotification);
//         console.log(`New affiliate application created for user ${userId}`);
//         return null;
//     });
// Helper for Notifications
async function sendNotification(userId, title, body) {
    // 1. Write to In-App
    await db.collection('notifications').add({
        userId,
        title,
        message: body,
        type: 'system',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // 2. Send Push (Logic from previous steps)
    // TODO: Implement FCM push logic here
    console.log(`Notification sent to ${userId}: ${title}`);
}
//# sourceMappingURL=affiliateAutomation.js.map