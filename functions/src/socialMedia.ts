import * as functions from 'firebase-functions/v1';
import * as admin from "firebase-admin";
import axios from "axios";
import { generateSocialPost } from "./services/geminiService";

const db = admin.firestore();

// 1. The Schedule (Runs every hour, checks if it should post)
export const runSocialAutoPilot = functions.pubsub.schedule('every 60 minutes')
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
        generateSocialPost(randomProduct.name, 'Facebook', randomProduct.price),
        generateSocialPost(randomProduct.name, 'Instagram', randomProduct.price),
        generateSocialPost(randomProduct.name, 'Twitter', randomProduct.price),
        generateSocialPost(randomProduct.name, 'TikTok', randomProduct.price),
        generateSocialPost(randomProduct.name, 'Pinterest', randomProduct.price)
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
            await axios.post(webhookUrl, socialPayload);
            console.log("🚀 Posted to Social Media Bridge!");

            // E. Log for Analytics
            await db.collection('social_logs').add({
                productName: randomProduct.name,
                time: new Date().getHours(),
                platform: 'all',
                status: 'sent',
                postedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
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
    } else {
        console.log("No Social Webhook URL configured.");
    }

    return null;
});