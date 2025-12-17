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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSocialAutoPilot = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const geminiService_1 = require("./services/geminiService");
const db = admin.firestore();
// 1. The Schedule (Runs every hour, checks if it should post)
exports.runSocialAutoPilot = functions.pubsub.schedule('every 60 minutes')
    .timeZone('Africa/Johannesburg')
    .onRun(async (context) => {
    // A. Randomness Check (15% chance per hour)
    const shouldPost = Math.random() < 0.15;
    if (!shouldPost) {
        console.log("Skipping this hour to randomize schedule.");
        return null;
    }
    // B. Select Product with Stock
    const productsSnap = await db.collection('products')
        .where('stock', '>', 0)
        .limit(50)
        .get();
    if (productsSnap.empty) {
        console.log("No in-stock products found.");
        return null;
    }
    const products = productsSnap.docs.map(doc => doc.data());
    // Logic: Prioritize Vault/Featured/New, fall back to random
    const vaultItems = products.filter(p => p.isJewelrySet || p.isUniquePendant || p.isFeaturedJewelryBox);
    const newArrivals = products.filter(p => p.isNewArrival);
    const priorityItems = [...vaultItems, ...newArrivals];
    const randomProduct = priorityItems.length > 0
        ? priorityItems[Math.floor(Math.random() * priorityItems.length)]
        : products[Math.floor(Math.random() * products.length)];
    // C. Generate Copy (Parallel AI Calls for Speed)
    // We use Promise.all so we don't wait 3 times in a row
    const [fbPost, instaPost, twitterPost, tiktokPost, pinterestPost] = await Promise.all([
        (0, geminiService_1.generateSocialPost)(randomProduct.name, 'Facebook', randomProduct.price),
        (0, geminiService_1.generateSocialPost)(randomProduct.name, 'Instagram', randomProduct.price),
        (0, geminiService_1.generateSocialPost)(randomProduct.name, 'Twitter', randomProduct.price),
        (0, geminiService_1.generateSocialPost)(randomProduct.name, 'TikTok', randomProduct.price),
        (0, geminiService_1.generateSocialPost)(randomProduct.name, 'Pinterest', randomProduct.price)
    ]);
    const socialPayload = {
        facebook: fbPost,
        instagram: instaPost,
        twitter: twitterPost,
        tiktok: tiktokPost,
        pinterest: pinterestPost,
        imageUrl: randomProduct.images && randomProduct.images.length > 0 ? randomProduct.images[0] : '',
        productName: randomProduct.name,
        price: randomProduct.price,
        postedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    // D. Dispatch to Make.com
    // Use process.env only
    const webhookUrl = process.env.SOCIAL_WEBHOOK_URL;
    if (webhookUrl) {
        try {
            await axios_1.default.post(webhookUrl, socialPayload);
            console.log("🚀 Posted to Social Media Bridge!");
            // E. Log for Analytics
            await db.collection('social_logs').add({
                productName: randomProduct.name,
                time: new Date().getHours(),
                platform: 'all',
                status: 'sent',
                postedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        catch (error) {
            console.error("Failed to post to webhook:", error);
            await db.collection('social_logs').add({
                productName: randomProduct.name,
                time: new Date().getHours(),
                platform: 'all',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                postedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    }
    else {
        console.log("No Social Webhook URL configured.");
    }
    return null;
});
//# sourceMappingURL=socialMedia.js.map