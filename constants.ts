

import { Product, Category, User, SpecialOffer } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'c_red', name: 'Red Collection', image: 'https://picsum.photos/400/400?random=1', description: 'Passion & Energy' },
  { id: 'c_black', name: 'Black Collection', image: 'https://picsum.photos/400/400?random=2', description: 'Bold & Mysterious' },
  { id: 'c_orange', name: 'Orange Collection', image: 'https://picsum.photos/400/400?random=3', description: 'Warmth & Creativity' },
  { id: 'c_yellow', name: 'Yellow Collection', image: 'https://picsum.photos/400/400?random=4', description: 'Joy & Sunshine' },
  { id: 'c_purple', name: 'Purple Collection', image: 'https://picsum.photos/400/400?random=5', description: 'Royalty & Spirit' },
  { id: 'c_pink', name: 'Pink Collection', image: 'https://picsum.photos/400/400?random=6', description: 'Love & Softness' },
  { id: 'c_bronze', name: 'Bronze Collection', image: 'https://picsum.photos/400/400?random=7', description: 'Earthy & Ancient' },
  { id: 'c_white', name: 'White or Pearl Collection', image: 'https://picsum.photos/400/400?random=8', description: 'Elegance & Purity' },
  { id: 'c_blue', name: 'Blue Collection', image: 'https://picsum.photos/400/400?random=9', description: 'Calm & Ocean' },
  { id: 'c_green', name: 'Green Collection', image: 'https://picsum.photos/400/400?random=10', description: 'Nature & Harmony' },
  { id: 'c_gold', name: 'Gold Collection', image: 'https://picsum.photos/400/400?random=11', description: 'Luxury & Wealth' },
  { id: 'c_silver', name: 'Silver Collection', image: 'https://picsum.photos/400/400?random=12', description: 'Sleek & Modern' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1761729812469',
    code: 'SPV-003',
    name: 'Sweetheart Red Resin Stud Earrings',
    slug: 'sweetheart-red-resin-studs',
    description: 'Embrace a touch of whimsy with these adorable sweetheart stud earrings, meticulously crafted from vibrant epoxy resin. Each glossy red heart reflects light beautifully.',
    whenAndHowToWear: 'Perfect for date nights or adding a pop of color to a monochrome outfit.',
    price: 29.00,
    compareAtPrice: 45.00,
    memberPrice: 14.50, // 50% off
    costPrice: 5.00,
    category: 'Red Collection',
    type: 'Stud',
    status: 'published',
    images: [],
    stock: 58,
    tags: ['Red heart earrings', 'stud earrings', 'resin jewelry', 'handmade'],
    seoKeywords: ['heart earrings', 'red studs'],
    earringMaterials: [
      { name: 'Sterling Silver', modifier: 30, description: 'Durable, premium metal' },
      { name: 'Stainless Steel', modifier: 0, description: 'Hypo-allergenic' }
    ],
    isNewArrival: false,
    isBestSeller: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '1762477248818',
    code: 'SPV-052',
    name: 'Ethereal Aurora Oval Opal Ring',
    slug: 'ethereal-aurora-oval-opal-ring',
    description: 'Experience the captivating play of color in this unique oval opal ring, meticulously set in gleaming sterling silver.',
    price: 129.00,
    costPrice: 50.00,
    memberPrice: 60.00,
    backOfficeLink: 'https://www.temu.com/example-ring-link',
    madeBy: 'Outsourced',
    category: 'White or Pearl Collection',
    type: 'Ring',
    status: 'published',
    images: [],
    stock: 7,
    ringStock: {
      "5": 1, "6": 1, "7": 1, "8": 1, "9": 1, "10": 1, "11": 1
    },
    tags: ['Opal ring', 'sterling silver', 'statement ring'],
    isNewArrival: true,
    isFeaturedRing: true,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_USER: User = {
  id: 'guest',
  name: 'Guest',
  email: '',
  isMember: false,
  membershipTier: 'none',
  loyaltyPoints: 0,
  affiliateCode: '',
  affiliateEarnings: 0,
  wishlist: [],
  notifications: [],
  isAdmin: false,
  socialRewards: {},
  shippingAddress: {
    street: '',
    suburb: '',
    city: '',
    province: '',
    postalCode: ''
  }
};

export const INITIAL_SPECIALS: SpecialOffer[] = [
  {
    id: 's1',
    title: 'Summer Tech Sale',
    products: ['1761729812469'],
    discountPercentage: 15,
    endsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    image: 'https://picsum.photos/800/400?random=20',
  }
];