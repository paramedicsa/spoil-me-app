// filepath: c:\Users\param\appspoilme\utils\affiliateConfig.ts
export const TIER_CONFIG = {
  bronze:  { max: 15, options: [{ d: 5, c: 10 }, { d: 10, c: 5 }] },
  silver:  { max: 20, options: [{ d: 10, c: 10 }, { d: 15, c: 5 }] },
  gold:    { max: 25, options: [{ d: 10, c: 15 }, { d: 15, c: 10 }, { d: 20, c: 5 }] },
  platinum:{ max: 30, options: [{ d: 10, c: 20 }, { d: 15, c: 15 }, { d: 20, c: 10 }, { d: 25, c: 5 }] }
};

export const getTierFromSales = (totalSales: number): keyof typeof TIER_CONFIG => {
  if (totalSales >= 10001) return 'platinum';
  if (totalSales >= 5001) return 'gold';
  if (totalSales >= 2001) return 'silver';
  return 'bronze';
};

export const getCommissionRate = (tier: keyof typeof TIER_CONFIG): number => {
  switch (tier) {
    case 'bronze': return 10;
    case 'silver': return 11;
    case 'gold': return 15;
    case 'platinum': return 20;
    default: return 10;
  }
};
