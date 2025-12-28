export interface EarringMaterial {
  name: string;
  modifier: number;
  description: string;
}

export interface RingStock {
  [key: string]: number; // "5": 10, "6": 2
}

export interface Review {
  id: string;
  userName: string;
  location: string;
  content: string;
  rating: number;
  date: string;
}

export interface AdPackage {
  id: string;
  name: string;
  durationHours: number;
  priceZAR: number;
  priceUSD: number;
  placement: string;
  strategy: string;
  tier: 'flash' | 'pulse' | 'icon' | 'spotlight' | 'crown';
}

export interface PackagingItem {
  id: string;
  name: string; // e.g. Box, Wrapping, Plastic
  bulkCost: number; // Total cost of the package (e.g. 100)
  bulkQuantity: number; // How many items in package (e.g. 50)
  unitCost: number; // Calculated (100/50 = R2)
  supplierLink?: string;
}

export interface VoucherMeta {
  recipientName: string;
  senderName: string;
  message: string;
  whatsappNumber?: string;
  deliveryMethod: 'self' | 'recipient';
}

export interface Notification {
  id: string;
  type: 'review_request' | 'system' | 'gift_ready' | 'gift_received' | 'affiliate_msg' | 'winner_notification' | 'credit_received' | 'trial_started' | 'trial_ended' | 'credit_adjusted';
  title: string;
  message: string;
  productId?: string; // If related to a product
  productName?: string;
  productImage?: string;
  date: string;
  isRead: boolean;
  // For Gift Vouchers
  voucherData?: {
    code: string;
    amount: number;
    meta: VoucherMeta;
  };
}

export interface SocialPlatform {
  id: string;
  name: string;
  icon: string; // icon name
  isConnected: boolean;
  accountName?: string;
  urlTemplate: string; // For sharing intent
}

export interface Product {
  id: string;
  code: string; // SPV-00X
  name: string;
  slug: string;
  description: string;
  whenAndHowToWear?: string;
  
  // Pricing & Sourcing
  price: number;
  priceUSD: number;
  compareAtPrice?: number;
  compareAtPriceUSD?: number;
  memberPrice?: number; // Exclusive price for members (50%+ off)
  memberPriceUSD?: number; // Exclusive price for members in USD
  costPrice: number; // Base Product Cost
  shippingCost?: number; // Estimated shipping to get product to us
  packaging?: PackagingItem[]; // Breakdown of packaging costs
  backOfficeLink?: string; // Temu/Source link
  madeBy?: string; // Spoil Me Vintage or other

  // Categorization
  category: string;
  type: 'Ring' | 'Stud' | 'Dangle' | 'Pendant' | 'Necklace' | 'Bracelet' | 'Watch' | 'Jewelry Box' | 'Perfume Holder' | 'Other';
  status: 'published' | 'draft';
  
  // Media
  images: string[];
  imageUrl?: string;
  image_url?: string;
  
  // Inventory & Variants
  stock: number; // General stock
  isSoldOut?: boolean; // Admin flag: show "Sorry Just SOLD out!" badge and keep product sold-out regardless of stock
  soldCount?: number; // Manual or automated sales count
  ringStock?: RingStock; // Specific for rings
  earringMaterials?: EarringMaterial[]; // Specific for earrings
  showEarringOptions?: boolean;
  pendantChainLengths?: Record<string, boolean>; // Specific for pendants
  pendantWireWrapped?: boolean;
  chainStyles?: string[]; // ['Metal Chain', 'Leather Cord']
  colors?: string[];
  material?: string;

  // Marketing
  tags: string[];
  seoKeywords?: string[];
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeaturedRing?: boolean;
  isFeaturedBracelet?: boolean;
  isFeaturedWatch?: boolean;
  isUniquePendant?: boolean;
  isFeaturedStud?: boolean;
  isFeaturedDangle?: boolean;
  isFeaturedJewelryBox?: boolean;
  isFeaturedPerfumeHolder?: boolean;
  isJewelrySet?: boolean;
  reviews?: Review[];

  // Promotions
  giftProductId?: string; // ID of another product given as gift
  giftValue?: number;
  
  // Promo - Non-Member
  promoPrice?: number; // Temporary sale price (Max 45% off)
  promoStartsAt?: string; // ISO Date for when promo starts
  promoExpiresAt?: string; // ISO Date for when promo ends
  
  // Promo - Member Tiers (Overrides standard member price during promo)
  promoBasicMemberPrice?: number;
  promoPremiumMemberPrice?: number;
  promoDeluxeMemberPrice?: number;
  
  // Ad Platform
  ads?: ProductAds;

  createdAt: string;
}

export interface ProductAds {
  isPromoted: boolean;
  promotedUntil: string; // ISO Date
  promotionTier: 'flash' | 'pulse' | 'icon' | 'spotlight' | 'crown';
  adStats: {
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    lastAdDate: string; // ISO Date
  };
}

export interface Category {
  id:string;
  name: string;
  image: string;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string; // If ring
  selectedMaterial?: string; // If earring
  selectedMaterialModifier?: number; // Added cost for material
  selectedChainStyle?: string; // If pendant
  selectedChainLength?: string; // If pendant
  voucherMeta?: VoucherMeta; // For Gift Cards
  vaultItem?: boolean;
  customDetails?: {
    stone: string;
    stoneImage: string;
    wire: string;
    wireImage: string;
    chainLength: string;
  };
}

export interface AffiliateStats {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  totalSalesCount: number;
  totalSalesValue: number;
  commissionRate: number; // 10, 11, 15, 20
  balance: number;
  recurringBalance: number; // Separate balance for membership commissions
  bankDetails?: string;
  // Extended Profile
  gender?: 'Male' | 'Female' | 'Other';
  country?: string;
  favoriteColor?: string;
  joinReason?: string;
  isElite?: boolean; // Paid tier
  hasContentAccess?: boolean; // Paid or unlocked via 100 sales
  adminNote?: string; // Feedback from admin
  parentId?: string; // ID of the recruiter (Upline / Parent Affiliate)
  // New vault and milestone tracking
  vaultPurchasesThisMonth?: number; // Track vault purchases for limits
  membershipMonths?: number; // Track consecutive membership months for vault limits
  weeklyMilestones?: {
    membershipsSold: number;
    salesValue: number;
    vaultItemsSold: number;
    weekStart: string; // ISO date of week start
  };
  paypalEmail?: string; // For international payouts
  location?: 'south_africa' | 'international'; // Determines payout method
}

export interface AffiliateLeaderboardItem {
  id: string;
  name: string;
  sales: number;
  rank: number;
  change: 'up' | 'down' | 'same';
}

export interface ShippingAddress {
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
  email?: string;
}

export interface User {
  id: string;
  uid?: string; // Firebase UID
  name: string;
  surname?: string;
  artistTradeName?: string;
  gender?: 'Male' | 'Female' | 'Other';
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string; // For demo authentication
  birthday?: string; // ISO Date YYYY-MM-DD
  isMember: boolean; // Paid membership status
  membershipTier?: 'none' | 'basic' | 'premium' | 'deluxe' | 'Spoil Me' | 'Basic' | 'Premium' | 'Deluxe Boss' | 'Insider Club' | 'Gold Member' | 'Deluxe Vault';
  membershipMonths?: number;
  membershipStatus?: 'active' | 'trial' | 'expired' | 'cancelled';
  trialExpiresAt?: Date;
  nextCreditDrop?: Date;
  storeCredit?: number;
  creditCurrency?: 'ZAR' | 'USD';
  loyaltyPoints: number;
  // Wallet for in-app payments
  wallet?: {
    available: number;
    currency?: 'ZAR' | 'USD';
  };
  
  // Affiliate
  affiliateCode: string;
  affiliateStats?: AffiliateStats;
  affiliateEarnings: number; // Legacy field, migrate to affiliateStats.balance
  affiliateCurrency?: 'ZAR' | 'USD';
  currencyLocked?: boolean;
  affiliateStoreConfig?: {
    products: string[];
    strategy: { d: number; c: number };
    currency: 'ZAR' | 'USD';
    lastUpdated: string;
  };

  wishlist: string[];
  notifications: Notification[];
  isAdmin: boolean;
  isActive?: boolean;
  createdAt?: string;
  socialRewards?: {
    tiktok?: boolean;
    twitter?: boolean;
    whatsapp?: boolean;
    facebook?: boolean;
    [key: string]: boolean | undefined;
  };
  socialHandles?: {
    tiktok?: string;
    twitter?: string;
    facebook?: string;
    whatsapp?: string;
    [key: string]: string | undefined;
  };
  shippingAddress?: ShippingAddress;
  adminPermissions?: {
    [key: string]: boolean; // Permission keys like 'orders', 'products', 'vault', etc.
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingMethod: string;
  shippingDetails: string;
  shippingCost: number;
}

export interface Voucher {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minSpend?: number;
  expiresAt: string;
}

export interface SpecialOffer {
  id: string;
  title: string;
  products: string[];
  discountPercentage: number;
  endsAt: string;
  image: string;
}

export interface Winner {
  rank: number;
  name: string;
  prize: number;
  currency: 'ZAR' | 'USD';
}

export interface VaultItem {
  id: string;
  productId: string; // Reference to original product
  productName: string;
  productImage: string;
  vaultPriceZAR: number; // R10
  vaultPriceUSD: number; // $1
  vaultStock: number;
  goLiveDate: string; // When it becomes available
  isActive: boolean;
  category: string;
  type: string;
}

export interface CommissionRecord {
  id: string;
  affiliateId: string;
  orderId: string;
  itemId: string;
  itemName: string;
  itemType: 'standard' | 'vault';
  basePrice: number;
  commissionRate: number; // 0.01 for vault, 0.10-0.20 for standard
  commissionAmount: number;
  currency: 'ZAR' | 'USD';
  date: string;
  isTeamBonus?: boolean; // 1% bonus for direct recruits
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  method: 'eft' | 'paypal';
  currency: 'ZAR' | 'USD';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  dateRequested: string;
  dateProcessed?: string;
  reference?: string;
  commissions: CommissionRecord[];
}

export interface AffiliateMilestone {
  id: string;
  affiliateId: string;
  type: 'sprinter' | 'big_spender' | 'vault_king';
  achievedAt: string;
  bonusAmount: number;
  currency: 'ZAR' | 'USD';
  weekStart: string; // Reset weekly
}

// PayPal Integration Types
export interface PayPalSubscription {
  id: string;
  planId: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  subscriberEmail: string;
  subscriberName?: string;
  startTime: string;
  nextBillingTime?: string;
  amount: number;
  currency: 'USD';
  tier: 'insider' | 'gold' | 'deluxe';
}

export interface PayPalPayout {
  id: string;
  payoutId: string;
  recipientEmail: string;
  amount: number;
  currency: 'USD';
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNCLAIMED';
  createdAt: string;
  completedAt?: string;
  note?: string;
}

export interface PayPalTransaction {
  id: string;
  type: 'subscription' | 'payout' | 'refund';
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  payerEmail?: string;
  recipientEmail?: string;
  description?: string;
  paypalTransactionId: string;
}

// Global PayPal SDK types
declare global {
  interface Window {
    paypal?: {
      Buttons: (config: any) => {
        render: (container: HTMLElement) => void;
      };
      subscription: {
        create: (data: any) => Promise<any>;
      };
    };
  }
}

export interface CustomTemplate {
  id: string;
  name: string; // e.g. "The Forest Witch Custom"
  basePrice: number;
  description: string; // "Takes 4 weeks..."
  mainImage: string; // Cover photo

  // 1. THE STONES (Page 1 Content)
  stones: {
    id: string;
    name: string; // e.g. "Amethyst - Heart Large"
    image: string; // URL
    priceModifier: number;
  }[];

  // 2. THE WIRE FRAMES (Page 2 Content - Flippable)
  wireStyles: {
    id: string;
    name: string; // e.g. "Elven Weave"
    imageFrameOnly: string; // URL: Shows just the wire structure
    imageWithExample: string; // URL: Shows wire wrapped around a dummy stone
    priceModifier: number;
  }[];

  // 3. CHAINS
  chainOptions: string[]; // ["45cm", "50cm"]
  isActive: boolean;
}

// Artist Partnership Types
export interface ArtistProfile {
  uid: string;
  shopName: string;
  slotLimit: number; // 5, 20, 50, 100, 250
  slotsUsed: number;
  wallet: {
    pending: number;
    available: number;
    currency: 'ZAR' | 'USD';
  };
  status: 'active' | 'suspended';
  subscriptionTier: string;
  subscriptionExpiresAt?: Date;
}

export interface ArtistApplication {
  id: string;
  uid: string;
  name: string;
  surname: string;
  artistTradeName?: string;
  contactNumber: string;
  email: string;
  productImages: string[]; // URLs to uploaded images
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewerNotes?: string;
}

export interface ArtistProduct {
  id: string;
  artistId: string;
  name: string;
  description: string;
  images: string[];
  requestedPrice: number;
  currency: 'ZAR' | 'USD';
  status: 'pending' | 'approved' | 'rejected';
  adminSetPrice?: number;
  adminSetRRP?: number;
  uploadedAt: Date;
  approvedAt?: Date;
}

export interface ArtistPayout {
  id: string;
  artistId: string;
  amount: number;
  currency: 'ZAR' | 'USD';
  type: 'sale' | 'commission';
  orderId: string;
  releasedAt: Date;
  status: 'pending' | 'released';
}
