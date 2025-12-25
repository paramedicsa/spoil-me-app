import { Product, Category, User, SpecialOffer } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'bc0ef8b5-e4b9-4bc8-aedd-d677391d74c0', name: 'Red Collection', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763528572144%2F1763528976141_red%20model.png?alt=media&token=1deef60f-3c4f-4e3e-beae-763d1b39621e', description: 'Passion & Energy' },
  { id: '23bcfca6-5735-4481-ab25-9d61ac83bc3f', name: 'Pink Collection', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763716235698%2F1763716259515_pink%20model.png?alt=media&token=c41510b1-9946-49d0-8b19-f679f24d392b', description: 'Love & Softness' },
  { id: '3427e08d-f82c-47c7-b5e7-2b8567733f38', name: 'Silver Collection', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763732069765%2F1763732089246_silver%20model.png?alt=media&token=eb30db54-99d1-4c3f-ba97-0f2b34934d79', description: 'Sleek & Modern' },
  { id: '3efca09b-07d8-40f2-8b6e-104049593cb3', name: 'Colorfull', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763849326772%2F1763849625346_colorfull.jpg?alt=media&token=41d78666-4aa1-47a0-935f-c5361b4538ac', description: 'Vibrant & Fun' },
  { id: '530b80f1-ac27-4ab4-ac10-f093d9d48dde', name: 'Green Collection', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763732028982%2F1763732064239_download%20(1).png?alt=media&token=1b184b78-799f-4d79-9e55-8d122c2c07eb', description: 'Nature & Harmony' },
  { id: '5fa9457f-3d9b-421c-9746-6bffbee4d4da', name: 'Yellow Collection', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763732120801%2F1763732142964_download.png?alt=media&token=49c0be99-48b2-47ba-9cb4-38628d2876fe', description: 'Joy & Sunshine' },
  { id: '6e673b67-9dd3-44b8-8797-51cc7e4ddf07', name: 'Orange Collection', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763732327301%2F1763732349258_orange%20model.png?alt=media&token=78d402fc-e0f7-4b73-b0d3-a7502f7bc6d3', description: 'Warmth & Creativity' },
  { id: '80da52b5-5130-462c-8f27-bdf7ff1c6564', name: 'Black Collection', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763732028102%2F1763732058240_1.jpg?alt=media&token=6458bde4-9255-4c11-9015-ec738b79a8cb', description: 'Bold & Mysterious' },
  { id: '8e8e275a-98fb-42b9-8551-ffeff03fb92a', name: 'Purple Collection', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763529047916%2F1763529076550_purple%20model.png?alt=media&token=10fa0811-7c4c-4c41-9165-262addea89f3', description: 'Royalty & Spirit' },
  { id: '9667b780-6f85-48ad-a19e-da0951efc590', name: 'Bronze and Brown Collection', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763732005647%2F1763732023012_copper%20model.png?alt=media&token=72619e26-b086-4913-a97f-ed8bea238d23', description: 'Earthy & Ancient' },
  { id: '9d24210c-eb1c-4273-8f6d-beebe2016fc4', name: 'Blue Collection', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763529024900%2F1763529043293_2.jpg?alt=media&token=29dcba53-1264-45a2-9b68-a661a277cc91', description: 'Calm & Ocean' },
  { id: '9d9fff97-3b25-409e-9e39-4a3b6412bb57', name: 'Girls', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1764232246395%2F1764232265823_girls%20color%20background.jpg?alt=media&token=13860e81-a2e7-48fc-a6b3-42d0763c8d41', description: 'Fun & Playful' },
  { id: 'b40795f0-5b04-4e95-8e84-40ca3c9561d1', name: 'White & Pearl Collection', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763731966302%2F1763731995895_white%20model.png?alt=media&token=56bdfed9-00c4-4442-ac6a-358d1223e04c', description: 'Elegance & Purity' },
  { id: '1ef06240-10e5-4bdf-9286-84d355991e95', name: 'Gold Collection', image: 'https://firebasestorage.googleapis.com/v0/b/spoilme-edee0.firebasestorage.app/o/categories%2Fcat_1763732095040%2F1763732116711_gold%20model.png?alt=media&token=25b5331b-6bf1-4ecc-94c8-1ceb31ccdcc7', description: 'Luxury & Wealth' },
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
    priceUSD: 2.00,
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
    reviews: [
      {
        id: 'rev1',
        userName: 'Amelia Thompson',
        location: 'London, UK',
        content: 'The sparkle of these earrings is absolutely mesmerizing, perfect for adding elegance to any outfit.',
        rating: 5,
        date: '2024-11-15T10:30:00Z'
      },
      {
        id: 'rev2',
        userName: 'Carlos Ramirez',
        location: 'Mexico City, Mexico',
        content: 'Good quality, but the durability could be better for everyday wear.',
        rating: 4,
        date: '2024-12-20T14:45:00Z'
      },
      {
        id: 'rev3',
        userName: 'Yuki Tanaka',
        location: 'Tokyo, Japan',
        content: 'These arrived faster than expected and the craftsmanship is impeccable. Highly recommend for special occasions.',
        rating: 5,
        date: '2025-01-22T09:15:00Z'
      },
      {
        id: 'rev4',
        userName: 'Fatima Al-Zahra',
        location: 'Dubai, UAE',
        content: 'Beautiful design, though the price feels a bit high for the materials used.',
        rating: 4,
        date: '2025-02-25T16:20:00Z'
      },
      {
        id: 'rev5',
        userName: 'Liam O\'Sullivan',
        location: 'Dublin, Ireland',
        content: 'The color is vibrant and the design is unique. Perfect for everyday wear.',
        rating: 4,
        date: '2025-03-28T11:00:00Z'
      },
      {
        id: 'rev6',
        userName: 'Priya Sharma',
        location: 'Mumbai, India',
        content: 'Nice piece, but I wish it sparkled more under different lights.',
        rating: 3,
        date: '2025-04-01T13:30:00Z'
      },
      {
        id: 'rev7',
        userName: 'Hans Mueller',
        location: 'Berlin, Germany',
        content: 'Exceeded my expectations in terms of quality and style. The opal shines beautifully under light.',
        rating: 5,
        date: '2025-05-03T08:45:00Z'
      },
      {
        id: 'rev8',
        userName: 'Isabella Rossi',
        location: 'Rome, Italy',
        content: 'Elegant design, but the durability is questionable after a few wears.',
        rating: 3,
        date: '2025-06-05T17:10:00Z'
      },
      {
        id: 'rev9',
        userName: 'Ahmed Hassan',
        location: 'Cairo, Egypt',
        content: 'The ring fits perfectly and the stone has amazing play of colors. Worth every penny.',
        rating: 5,
        date: '2025-07-07T12:25:00Z'
      },
      {
        id: 'rev10',
        userName: 'Sophie Dubois',
        location: 'Paris, France',
        content: 'Charming, and the price is reasonable for the sparkle it provides.',
        rating: 4,
        date: '2025-08-09T15:50:00Z'
      },
      {
        id: 'rev11',
        userName: 'Raj Patel',
        location: 'Sydney, Australia',
        content: 'Fast shipping and the product is as described. Very satisfied with the purchase.',
        rating: 5,
        date: '2025-09-11T10:05:00Z'
      },
      {
        id: 'rev12',
        userName: 'Elena Petrova',
        location: 'Moscow, Russia',
        content: 'Unique style, but the durability leaves much to be desired.',
        rating: 3,
        date: '2025-10-13T14:30:00Z'
      },
      {
        id: 'rev13',
        userName: 'Miguel Santos',
        location: 'São Paulo, Brazil',
        content: 'The earrings are lightweight and comfortable to wear all day. Love the red color.',
        rating: 4,
        date: '2025-11-15T09:20:00Z'
      }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '1762477248818',
    code: 'SPV-052',
    name: 'Ethereal Aurora Oval Opal Ring',
    slug: 'ethereal-aurora-oval-opal-ring',
    description: 'Experience the captivating play of color in this unique oval opal ring, meticulously set in gleaming sterling silver.',
    price: 129.00,
    priceUSD: 7.00,
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
    reviews: [
      {
        id: 'rev14',
        userName: 'Aisha Khan',
        location: 'Karachi, Pakistan',
        content: 'Gorgeous sparkle, but the price is a bit steep for what you get.',
        rating: 4,
        date: '2024-11-17T16:45:00Z'
      },
      {
        id: 'rev15',
        userName: 'Oliver Jensen',
        location: 'Copenhagen, Denmark',
        content: 'High-quality materials and excellent customer service. The ring is a standout piece.',
        rating: 5,
        date: '2024-12-19T11:15:00Z'
      },
      {
        id: 'rev16',
        userName: 'Nina Kowalski',
        location: 'Warsaw, Poland',
        content: 'Decent value, though durability could be improved.',
        rating: 3,
        date: '2025-01-21T13:40:00Z'
      },
      {
        id: 'rev17',
        userName: 'Diego Fernandez',
        location: 'Buenos Aires, Argentina',
        content: 'The opal\'s iridescence is mesmerizing. Arrived well-packaged and on time.',
        rating: 5,
        date: '2025-02-23T08:55:00Z'
      },
      {
        id: 'rev18',
        userName: 'Layla Al-Farsi',
        location: 'Riyadh, Saudi Arabia',
        content: 'Stylish accessory with great sparkle, worth the investment.',
        rating: 5,
        date: '2025-03-25T17:25:00Z'
      },
      {
        id: 'rev19',
        userName: 'Finn Larsen',
        location: 'Oslo, Norway',
        content: 'Great attention to detail in the craftsmanship. Perfect for gifting.',
        rating: 4,
        date: '2025-04-27T12:10:00Z'
      },
      {
        id: 'rev20',
        userName: 'Zara Ahmed',
        location: 'Lagos, Nigeria',
        content: 'Impressive quality, but the durability is not as expected.',
        rating: 3,
        date: '2025-05-29T15:35:00Z'
      },
      {
        id: 'rev21',
        userName: 'Luca Bianchi',
        location: 'Milan, Italy',
        content: 'The earrings sparkle just right and the resin is smooth. Very happy with this buy.',
        rating: 5,
        date: '2025-06-31T10:50:00Z'
      },
      {
        id: 'rev22',
        userName: 'Anika Gupta',
        location: 'Delhi, India',
        content: 'Solid choice, and the price matches the sparkle and quality.',
        rating: 4,
        date: '2025-07-02T14:15:00Z'
      },
      {
        id: 'rev23',
        userName: 'Victor Nguyen',
        location: 'Ho Chi Minh City, Vietnam',
        content: 'Beautiful design and the silver setting enhances the opal perfectly. Highly recommended.',
        rating: 5,
        date: '2025-08-04T09:30:00Z'
      },
      {
        id: 'rev24',
        userName: 'Maya Cohen',
        location: 'Tel Aviv, Israel',
        content: 'Lovely item with excellent durability for daily use.',
        rating: 4,
        date: '2025-09-06T16:55:00Z'
      },
      {
        id: 'rev25',
        userName: 'Johan Svensson',
        location: 'Stockholm, Sweden',
        content: 'The product exceeded my expectations. The color and fit are spot on.',
        rating: 5,
        date: '2025-10-08T11:40:00Z'
      }
    ],
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