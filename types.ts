




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
  type: 'review_request' | 'system' | 'gift_ready' | 'gift_received' | 'affiliate_msg' | 'winner_notification';
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
  compareAtPrice?: number;
  memberPrice?: number; // Exclusive price for members (50%+ off)
  costPrice: number; // Base Product Cost
  shippingCost?: number; // Estimated shipping to get product to us
  packaging?: PackagingItem[]; // Breakdown of packaging costs
  backOfficeLink?: string; // Temu/Source link
  madeBy?: string; // Spoil Me Vintage or other

  // Categorization
  category: string;
  type: 'Ring' | 'Stud' | 'Dangle' | 'Pendant' | 'Bracelet' | 'Watch' | 'Jewelry Box' | 'Perfume Holder' | 'Other';
  status: 'published' | 'draft';
  
  // Media
  images: string[];
  
  // Inventory & Variants
  stock: number; // General stock
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
  
  createdAt: string;
}

export interface Category {
  id: string;
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
  joinReason?: string;
  isElite?: boolean; // Paid tier
  hasContentAccess?: boolean; // Paid or unlocked via 100 sales
  adminNote?: string; // Feedback from admin
  parentId?: string; // ID of the recruiter (Upline / Parent Affiliate)
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
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For demo authentication
  birthday?: string; // ISO Date YYYY-MM-DD
  isMember: boolean; // Paid membership status
  membershipTier?: 'none' | 'basic' | 'premium' | 'deluxe'; 
  loyaltyPoints: number;
  
  // Affiliate
  affiliateCode: string;
  affiliateStats?: AffiliateStats;
  affiliateEarnings: number; // Legacy field, migrate to affiliateStats.balance

  wishlist: string[];
  notifications: Notification[];
  isAdmin: boolean;
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
}