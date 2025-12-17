// scripts/seedAdConfig.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// IMPORTANT: Replace with the actual path to your service account key
const serviceAccount = require('../spoilme-service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const AD_CONFIG_DATA = {
  packages: [
    { id: "flash", name: "⚡ 24h Flash", durationDays: 1, priceZAR: 29, priceUSD: 2.00, benefit: "Top of Category + Trending Badge", active: true },
    { id: "pulse", name: "✨ 3-Day Pulse", durationDays: 3, priceZAR: 59, priceUSD: 3.50, benefit: "Top of Category + Search Boost", active: true },
    { id: "icon", name: "💎 Weekly Icon", durationDays: 7, priceZAR: 119, priceUSD: 7.00, benefit: "Top of Category + Search Priority", active: true },
    { id: "spotlight", name: "🔥 Homepage Spotlight", durationDays: 1, priceZAR: 149, priceUSD: 9.00, benefit: "Homepage Top Rail", active: true },
    { id: "crown", name: "👑 The Crown Jewel", durationDays: 3, priceZAR: 349, priceUSD: 20.00, benefit: "Homepage Top Rail + Category Pin", active: true },
  ],
  socialAddon: {
    enabled: true,
    priceZAR: 199,
    priceUSD: 12.00,
    reachCount: 7540,
  }
};

async function seedAdConfig() {
  try {
    console.log("Seeding ad configuration into Firestore...");
    const docRef = db.collection('settings').doc('ad_config');
    await docRef.set(AD_CONFIG_DATA);
    console.log("✅ Successfully seeded 'settings/ad_config' document.");
  } catch (error) {
    console.error("🔥 Error seeding database:", error);
    process.exit(1);
  }
}

seedAdConfig();

