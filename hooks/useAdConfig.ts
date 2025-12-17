import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Default fallback (Safety net)
const DEFAULT_CONFIG = {
  packages: [
    { id: 'flash', name: '⚡ 24h Flash', durationDays: 1, priceZAR: 29, priceUSD: 2.00, benefit: 'Top of Category', active: true },
    { id: 'pulse', name: '✨ 3-Day Pulse', durationDays: 3, priceZAR: 59, priceUSD: 3.50, benefit: 'Top of Category + Badge', active: true },
    { id: 'icon', name: '💎 Weekly Icon', durationDays: 7, priceZAR: 119, priceUSD: 7.00, benefit: 'Category + Search Priority', active: true },
    { id: 'spotlight', name: '🔥 Homepage Spotlight', durationDays: 1, priceZAR: 149, priceUSD: 9.00, benefit: 'Homepage Top Rail', active: true },
    { id: 'crown', name: '👑 The Crown Jewel', durationDays: 3, priceZAR: 349, priceUSD: 20.00, benefit: 'Homepage + Category Pin', active: true },
  ],
  socialAddon: { enabled: true, priceZAR: 199, priceUSD: 12.00, reachCount: 7540 }
};

export const useAdConfig = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener: If Admin changes price, Artist sees it instantly
    const unsub = onSnapshot(doc(db, 'settings', 'ad_config'), (doc) => {
      if (doc.exists()) {
        setConfig(doc.data() as any);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { packages: config.packages, socialAddon: config.socialAddon, loading };
};
