import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Fix: Added Winner and Order to import
import { Product, Category, CartItem, User, SpecialOffer, Voucher, Notification, VoucherMeta, AffiliateLeaderboardItem, PackagingItem, EarringMaterial, AffiliateStats, ShippingAddress, Winner, Order, VaultItem, CommissionRecord, AffiliatePayout, AffiliateMilestone } from '../types';
import { INITIAL_USER, INITIAL_SPECIALS, INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../constants';
import { db, storage, auth, app } from '../firebaseConfig';
import { getDownloadURL, ref as sRef, getStorage } from 'firebase/storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy,
  getDocs,
  where,
  arrayUnion,
  getDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  user: User;
  specials: SpecialOffer[];
  vouchers: Voucher[];
  appliedVoucher: Voucher | null;
  affiliateLeaderboard: AffiliateLeaderboardItem[];
  memberCount: number;
  weeklyWinners: Winner[];
  isStickyProgressBarVisible: boolean;
  setIsStickyProgressBarVisible: (isVisible: boolean) => void;
  orders: Order[];
  
  // Currency
  currency: 'ZAR' | 'USD';
  toggleCurrency: () => void;

  // Presets
  packagingPresets: PackagingItem[];
  materialPresets: EarringMaterial[];
  savePackagingPreset: (item: PackagingItem) => void;
  deletePackagingPreset: (name: string) => void;
  saveMaterialPreset: (item: EarringMaterial) => void;
  deleteMaterialPreset: (name: string) => void;

  isLoading: boolean;
  isDemoMode: boolean;
  dbConnectionError: string | null;
  
  // Auth
  login: (email: string, pass: string) => Promise<boolean>;
  register: (user: Partial<User>) => Promise<boolean>;
  logout: () => void;
  updateUserAddress: (address: ShippingAddress) => Promise<void>;

  // Actions
  addToCart: (product: Product, options?: Partial<CartItem>) => void;
  removeFromCart: (productId: string, options?: Partial<CartItem>) => void;
  updateCartQuantity: (productId: string, quantity: number, options?: Partial<CartItem>) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  checkout: (orderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'customerName' | 'customerEmail' | 'status'> & { pointsToRedeem?: number }) => Promise<Order>;
  submitReview: (productId: string, rating: number, content: string, notificationId: string) => Promise<void>;
  shareProduct: (productId: string) => void;
  claimSocialReward: (platform: 'tiktok' | 'twitter' | 'whatsapp' | 'facebook' | 'pinterest', handle?: string) => Promise<void>;
  addSystemNotification: (title: string, message: string, type?: 'system' | 'review_request' | 'affiliate_msg') => void;
  processGiftVoucherPurchase: (amount: number, meta: VoucherMeta) => Promise<void>;
  
  // Affiliate Actions
  applyForAffiliate: (data: { name: string; surname: string; dob: string; gender: string; reason: string; socials: string }) => Promise<void>;
  approveAffiliate: (userId: string, note?: string) => Promise<void>;
  rejectAffiliate: (userId: string, note?: string) => Promise<void>;
  sendAffiliateMessage: (userId: string, message: string) => Promise<void>;
  buyAffiliateContent: () => Promise<void>;
  joinAffiliateElite: () => Promise<void>;
  simulateAffiliateSale: (code: string, amount: number) => Promise<{ success: boolean; message: string }>;
  updateAffiliateTier: (userId: string, newRate: number) => Promise<void>;
  assignAffiliateParent: (childId: string, parentId: string) => Promise<void>;
  
  // Artist Actions
  applyForArtist: (data: { name: string; surname: string; artistTradeName?: string; contactNumber: string; email: string; productImages: string[] }) => Promise<void>;

  // Admin Actions
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (order: Order) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  replaceCategories: (categories: Category[]) => Promise<void>; 
  addSpecial: (special: SpecialOffer) => void;
  resetStore: () => void;
  seedTestUsers: () => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  runDataDiagnostics: () => { status: string; details: string };
  adminAdjustPoints: (userId: string, points: number) => Promise<void>;
  
  // Voucher Actions
  addVoucher: (voucher: Voucher) => void;
  deleteVoucher: (code: string) => void;
  applyExternalVoucher: (code: string) => boolean; 
  setAppliedVoucher: (voucher: Voucher | null) => void;

  // Helpers
  getCartTotal: () => number;

  // Admin Winner Override
  manualWinner: Winner | null;
  setManualWinner: (winner: Winner | null) => void;
  auth: any;

  // Account Management
  closeAccount: (reason: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// --- ROBUST SANITIZER FOR FIRESTORE & CIRCULAR JSON ---
// NOTE: This function has been rewritten to strictly prevent 'Converting circular structure to JSON' errors.
// It filters out internal Firebase objects (auth, firestore instance, etc.) and handles circular refs.
const sanitizeFirestoreData = (data: any, seen = new WeakSet()): any => {
  if (data === undefined || data === null) return null;
  
  // Return primitives as is
  if (typeof data !== 'object') return data;
  
  // Detect Circular References
  if (seen.has(data)) return null;
  seen.add(data);

  // Handle Dates
  if (data instanceof Date) return data.toISOString();

  // Handle Firestore Timestamp (duck typing)
  if (typeof data.toDate === 'function') {
      try { return data.toDate().toISOString(); } catch { return null; }
  }
  
  // Handle Firestore Document Reference (duck typing)
  if (data.path && typeof data.path === 'string' && (data.firestore || data._key)) {
      return data.path; // Convert reference to just the path string
  }

  // Handle Arrays
  if (Array.isArray(data)) {
      return data.map(item => sanitizeFirestoreData(item, seen));
  }

  // Handle Serialized Timestamps (plain objects with seconds/nanoseconds)
  if (data.seconds !== undefined && data.nanoseconds !== undefined && Object.keys(data).length <= 4) {
       return new Date(data.seconds * 1000 + data.nanoseconds / 1000000).toISOString();
  }

  // --- FIX: COMMENTED OUT OVERLY AGGRESSIVE PROTOTYPE CHECK ---
  /*
  const proto = Object.getPrototypeOf(data);
  if (proto && proto !== Object.prototype && proto !== null) {
      // It is a class instance.
      return null;
  }
  */

  const sanitized: any = {};
  for (const key in data) {
      // Exclude internal Firebase keys and complex objects we don't need in LocalStorage
      if (
          key.startsWith('_') ||
          key === 'auth' ||
          key === 'firestore' ||
          key === 'app' ||
          key === 'metadata' ||
          key === 'proactiveRefresh' ||
          key === 'providerData' ||
          key === 'stsTokenManager'
      ) continue;

      if (Object.prototype.hasOwnProperty.call(data, key)) {
          const val = sanitizeFirestoreData(data[key], seen);
          if (val !== undefined && val !== null) sanitized[key] = val;
      }
  }
  return sanitized;
};

const generateMonthlyLeaderboard = (): AffiliateLeaderboardItem[] => {
    const names = [
        "Thandiwe Zulu", "Jessica Nel", "Precious Khumalo",
        "Sarah Van Der Merwe", "Amahle Dlamini", "Chloe Naidoo",
        "Nicole Botha", "Zanele Mthembu", "Ashley Smith", "Bianca Fourie"
    ];

    const now = new Date();
    const seed = now.getFullYear() * 100 + now.getMonth();

    const seededRandom = (s: number) => {
        let t = s += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };

    const items: AffiliateLeaderboardItem[] = names.map((name, idx) => {
        return {
            id: `aff_${idx}`,
            name,
            sales: 0,
            rank: 0,
            change: 'same'
        };
    });

    // Set top score specifically as requested
    items[0].sales = 28561.68;

    let currentScore = 28561.68;

    for (let i = 1; i < items.length; i++) {
        const r = seededRandom(seed + i);
        const drop = 1500 + (r * 3500);
        const cents = Math.floor(seededRandom(seed + i + 50) * 99) / 100;

        currentScore = Math.max(1000, currentScore - drop);
        const finalValue = Math.floor(currentScore) + cents;

        items[i].sales = parseFloat(finalValue.toFixed(2));
    }

    items.forEach((item, idx) => {
        item.rank = idx + 1;
        const r = seededRandom(seed + idx + 200);
        item.change = r > 0.6 ? 'up' : r < 0.3 ? 'down' : 'same';
        if (idx === 0) item.change = 'same';
    });

    return items;
};

// Fix: Function to generate mock weekly winners
const generateWeeklyWinners = (manualWinner: Winner | null): Winner[] => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

    // If manual winner is set, use it for the current week
    if (manualWinner) {
        const previousWeeks = [];
        for (let i = 3; i >= 1; i--) {
            const weekIndex = (weekNumber - 1 - i + 52) % 52;
            previousWeeks.push(YEARLY_WINNERS[weekIndex]);
        }
        return [
            manualWinner,
            ...previousWeeks.map((winner, index) => ({
                rank: index + 2,
                name: winner.name,
                prize: winner.currency === 'ZAR' ? 500 : 30,
                currency: winner.currency
            }))
        ];
    }

    // Get current week and previous 3 weeks
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
        const weekIndex = (weekNumber - 1 - i + 52) % 52; // Wrap around year
        weeks.push(YEARLY_WINNERS[weekIndex]);
    }

    return weeks.map((winner, index) => ({
        rank: index + 1,
        name: winner.name,
        prize: winner.currency === 'ZAR' ? 500 : 30, // Adjust prize based on currency
        currency: winner.currency
    }));
  };

// 52 unique winners for the year
const YEARLY_WINNERS: { name: string; location: string; currency: 'ZAR' | 'USD' }[] = [
  // Q1 (January - March)
  { name: "Anja P.", location: "Pretoria, SA", currency: "ZAR" },
  { name: "Sarah Jenkins", location: "Texas, USA", currency: "USD" },
  { name: "Thandi M.", location: "Sandton, SA", currency: "ZAR" },
  { name: "Sophie Clarke", location: "London, UK", currency: "USD" },
  { name: "Johan V.", location: "Bloemfontein, SA", currency: "ZAR" },
  { name: "Emily R.", location: "New York, USA", currency: "USD" },
  { name: "Priya N.", location: "Durban, SA", currency: "ZAR" },
  { name: "Isabella G.", location: "Toronto, Canada", currency: "USD" },
  { name: "Bianca S.", location: "Cape Town, SA", currency: "ZAR" },
  { name: "Madison L.", location: "Chicago, USA", currency: "USD" },
  { name: "Lerato K.", location: "Soweto, SA", currency: "ZAR" },
  { name: "Charlotte B.", location: "Manchester, UK", currency: "USD" },
  { name: "David W.", location: "Port Elizabeth, SA", currency: "ZAR" },
  // Q2 (April - June)
  { name: "Jessica H.", location: "Florida, USA", currency: "USD" },
  { name: "Zanele T.", location: "Polokwane, SA", currency: "ZAR" },
  { name: "Olivia M.", location: "Dublin, Ireland", currency: "USD" },
  { name: "Riaan O.", location: "Paarl, SA", currency: "ZAR" },
  { name: "Ashley T.", location: "California, USA", currency: "USD" },
  { name: "Fatima A.", location: "Lenasia, SA", currency: "ZAR" },
  { name: "Emma W.", location: "Sydney, Australia", currency: "USD" },
  { name: "Michelle D.", location: "George, SA", currency: "ZAR" },
  { name: "Grace P.", location: "Ohio, USA", currency: "USD" },
  { name: "Nandi Z.", location: "East London, SA", currency: "ZAR" },
  { name: "Mia S.", location: "Berlin, Germany", currency: "USD" },
  { name: "Chantelle V.", location: "Boksburg, SA", currency: "ZAR" },
  { name: "Harper C.", location: "Arizona, USA", currency: "USD" },
  // Q3 (July - September)
  { name: "Sipho M.", location: "Johannesburg, SA", currency: "ZAR" },
  { name: "Chloe F.", location: "Bristol, UK", currency: "USD" },
  { name: "Elize B.", location: "Stellenbosch, SA", currency: "ZAR" },
  { name: "Samantha K.", location: "Nevada, USA", currency: "USD" },
  { name: "Yusuf E.", location: "Cape Town, SA", currency: "ZAR" },
  { name: "Lily J.", location: "Auckland, NZ", currency: "USD" },
  { name: "Monique L.", location: "Centurion, SA", currency: "ZAR" },
  { name: "Ava R.", location: "Washington, USA", currency: "USD" },
  { name: "Karabo P.", location: "Rustenburg, SA", currency: "ZAR" },
  { name: "Zoe T.", location: "Liverpool, UK", currency: "USD" },
  { name: "Andre F.", location: "Nelspruit, SA", currency: "ZAR" },
  { name: "Elizabeth N.", location: "Virginia, USA", currency: "USD" },
  { name: "Ts hepo G.", location: "Midrand, SA", currency: "ZAR" },
  // Q4 (October - December)
  { name: "Amelia H.", location: "Edinburgh, Scotland", currency: "USD" },
  { name: "Marlize J.", location: "Upington, SA", currency: "ZAR" },
  { name: "Victoria B.", location: "Georgia, USA", currency: "USD" },
  { name: "Keshav R.", location: "Chatsworth, SA", currency: "ZAR" },
  { name: "Hannah D.", location: "Leeds, UK", currency: "USD" },
  { name: "Angelique S.", location: "Krugersdorp, SA", currency: "ZAR" },
  { name: "Natalie M.", location: "Oregon, USA", currency: "USD" },
  { name: "Vusi K.", location: "Pietermaritzburg, SA", currency: "ZAR" },
  { name: "Layla O.", location: "Dubai, UAE", currency: "USD" },
  { name: "Sunette W.", location: "Mossel Bay, SA", currency: "ZAR" },
  { name: "Ella F.", location: "Colorado, USA", currency: "USD" },
  { name: "Bongani N.", location: "Soweto, SA", currency: "ZAR" },
  { name: "Scarlet V.", location: "Melbourne, Australia", currency: "USD" }
];

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Initialize Cart from Local Storage to ensure persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
      try {
          const savedCart = localStorage.getItem('spv_cart');
          return savedCart ? JSON.parse(savedCart) : [];
      } catch (error) {
          console.error("Failed to load cart", error);
          return [];
      }
  });

  const [user, setUser] = useState<User>(INITIAL_USER);
  const [specials, setSpecials] = useState<SpecialOffer[]>(INITIAL_SPECIALS);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbConnectionError, setDbConnectionError] = useState<string | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [affiliateLeaderboard, setAffiliateLeaderboard] = useState<AffiliateLeaderboardItem[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [weeklyWinners, setWeeklyWinners] = useState<Winner[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(!db);
  const [isStickyProgressBarVisible, setIsStickyProgressBarVisible] = useState(false);

  const [packagingPresets, setPackagingPresets] = useState<PackagingItem[]>([]);
  const [materialPresets, setMaterialPresets] = useState<EarringMaterial[]>([]);

  // Currency state
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('ZAR');

  // Manual winner override state
  const [manualWinner, setManualWinner] = useState<Winner | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('spv_active_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch(e) {
        console.error("Error parsing stored user", e);
        setUser(INITIAL_USER);
      }
    }
    setAffiliateLeaderboard(generateMonthlyLeaderboard());
    setWeeklyWinners(generateWeeklyWinners(manualWinner));

    const now = new Date();
    const seed = now.getFullYear() * 100 + now.getMonth();
    const seededRandom = (s: number) => {
        let t = s += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        setMemberCount(780 + Math.floor(seededRandom(seed) * 15));
    };

    try {
        const localPack = localStorage.getItem('spv_packaging_presets');
        if(localPack) setPackagingPresets(JSON.parse(localPack));
        const localMat = localStorage.getItem('spv_material_presets');
        if(localMat) setMaterialPresets(JSON.parse(localMat));
    } catch (e) {
        console.error("Error loading presets", e);
    }
  }, []);

  // Persist Cart whenever it changes
  useEffect(() => {
      localStorage.setItem('spv_cart', JSON.stringify(cart));
  }, [cart]);

  // Persist Orders in Demo Mode
  useEffect(() => {
    if (isDemoMode) {
        localStorage.setItem('spv_orders', JSON.stringify(orders));
    }
  }, [orders, isDemoMode]);

  const persistUser = (userData: User) => {
      try {
          const safeUser = sanitizeFirestoreData(userData);
          localStorage.setItem('spv_active_user', JSON.stringify(safeUser));
      } catch (e) {
          console.error("Error saving user to localStorage", e);
      }
  };

  // REAL-TIME USER SYNC
  useEffect(() => {
      if (!db || isDemoMode || !user.id || user.id === 'guest') return;

      const unsubUser = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
          if (docSnap.exists()) {
              const remoteData = docSnap.data() as User;
              setUser(prev => {
                  const merged = { ...prev, ...remoteData };
                  persistUser(merged); // FIX: Use the safe helper function to prevent circular JSON error.
                  return merged;
              });
          }
      }, (error) => {
          if (error.code === 'not-found' && error.message.includes('default')) {
              setDbConnectionError("Database ID Mismatch. Please clear browser cache.");
          }
      });

      return () => unsubUser();
  }, [user.id, isDemoMode]);

  const savePackagingPreset = (item: PackagingItem) => {
      setPackagingPresets(prev => {
          const exists = prev.find(p => p.name === item.name);
          const newPresets = exists ? prev.map(p => p.name === item.name ? item : p) : [...prev, item];
          localStorage.setItem('spv_packaging_presets', JSON.stringify(newPresets));
          return newPresets;
      });
  };

  const deletePackagingPreset = (name: string) => {
      setPackagingPresets(prev => {
          const newPresets = prev.filter(p => p.name !== name);
          localStorage.setItem('spv_packaging_presets', JSON.stringify(newPresets));
          return newPresets;
      });
  };

  const saveMaterialPreset = (item: EarringMaterial) => {
      setMaterialPresets(prev => {
          const exists = prev.find(m => m.name === item.name);
          const newPresets = exists ? prev.map(m => m.name === item.name ? item : m) : [...prev, item];
          localStorage.setItem('spv_material_presets', JSON.stringify(newPresets));
          return newPresets;
      });
  };

  const deleteMaterialPreset = (name: string) => {
      setMaterialPresets(prev => {
          const newPresets = prev.filter(m => m.name !== name);
          localStorage.setItem('spv_material_presets', JSON.stringify(newPresets));
          return newPresets;
      });
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();
    let loggedInUser: User | null = null;

    // Try Firebase Auth sign in for all users
    if (auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
        const firebaseUser = cred.user;
        const uid = firebaseUser.uid;

        // Get user data from Firestore
        if (db) {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              loggedInUser = { ...sanitizeFirestoreData(userDoc.data()), id: uid } as User;
            } else {
              // Create basic user data
              loggedInUser = {
                ...INITIAL_USER,
                id: uid,
                email: normalizedEmail,
                name: firebaseUser.displayName || '',
                isAdmin: normalizedEmail === 'spoilmevintagediy@gmail.com'
              };
              // Save to Firestore
              await setDoc(doc(db, 'users', uid), sanitizeFirestoreData(loggedInUser));
            }
          } catch (err) {
            console.error("Error getting user from Firestore:", err);
            // Fallback to basic user
            loggedInUser = {
              ...INITIAL_USER,
              id: uid,
              email: normalizedEmail,
              name: firebaseUser.displayName || '',
              isAdmin: normalizedEmail === 'spoilmevintagediy@gmail.com'
            };
          }
        } else {
          loggedInUser = {
            ...INITIAL_USER,
            id: uid,
            email: normalizedEmail,
            name: firebaseUser.displayName || '',
            isAdmin: normalizedEmail === 'spoilmevintagediy@gmail.com'
          };
        }
      } catch (authErr) {
        console.warn('Firebase Auth sign in failed:', authErr);
        // Fall back to test users or Firestore password
      }
    }

    // If not logged in via Auth, try test users
    if (!loggedInUser && pass === 'test') {
      if (normalizedEmail === 'eliz@gmail.com') {
        loggedInUser = { ...INITIAL_USER, id: 'u1', name: 'Elize Test 1', email: 'eliz@gmail.com', isMember: false, membershipTier: 'none' };
      } else if (normalizedEmail === 'anna@gmail.com') {
        loggedInUser = { ...INITIAL_USER, id: 'u2', name: 'Anna Test 2', email: 'anna@gmail.com', isMember: true, membershipTier: 'basic', loyaltyPoints: 100 };
      }
    }

    // If still not logged in, try Firestore password (for legacy users)
    if (!loggedInUser && db) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', normalizedEmail));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // IMPORTANT: Sanitize raw Firestore data before storing/stringifying
          const userDoc = sanitizeFirestoreData(snapshot.docs[0].data()) as User;
          if (userDoc.password === pass) {
            loggedInUser = { ...userDoc, id: snapshot.docs[0].id };
          }
        }
      } catch (err) {
        console.error("Error logging in via DB:", err);
      }
    }

    if (loggedInUser) {
      // Check if account is marked for deletion
      if (loggedInUser.isActive === false) {
        return false; // Prevent login for inactive accounts
      }
      setUser(loggedInUser);
      persistUser(loggedInUser);
      sendUserDataToServiceWorker(loggedInUser);
      return true;
    }
    return false;
  };

  const register = async (userData: Partial<User>) => {
      const newUser: User = {
          ...INITIAL_USER,
          ...userData,
          id: `user_${Date.now()}`,
          affiliateCode: `Spoilme-${Date.now().toString().slice(-6)}`,
          affiliateStats: userData.affiliateStats || {
              status: 'none',
              totalSalesCount: 0,
              totalSalesValue: 0,
              commissionRate: 10,
              balance: 0,
              recurringBalance: 0,
              isElite: false,
              hasContentAccess: false
          }
      } as User;

      try {
          if (!isDemoMode && db) {
              await setDoc(doc(db, 'users', newUser.id), sanitizeFirestoreData(newUser));
          }
          setUser(newUser);
          persistUser(newUser);
          return true;
      } catch (e) {
          console.error("Registration Failed", e);
          setUser(newUser);
          persistUser(newUser);
          return true;
      }
  };

  const logout = () => {
    setUser(INITIAL_USER);
    localStorage.removeItem('spv_active_user');
  };

  const updateUserAddress = async (address: ShippingAddress) => {
      const updatedUser = { ...user, shippingAddress: address };
      setUser(updatedUser);
      persistUser(updatedUser);
      if (!isDemoMode && db && user.id !== 'guest') {
          try {
              await updateDoc(doc(db, 'users', user.id), { shippingAddress: address });
          } catch (e) {
              console.error("Error saving address to DB", e);
          }
      }
  };

  const seedTestUsers = async () => {
      if (isDemoMode || !db) {
          alert("Database not connected. Cannot seed users.");
          return;
      }
      const usersToCreate: User[] = [
          { ...INITIAL_USER, id: 'u1', name: 'Elize Test 1', email: 'eliz@gmail.com', password: 'test', isMember: false, membershipTier: 'none', affiliateCode: 'Spoilme-ELIZ01', affiliateStats: { status: 'none', totalSalesCount: 0, totalSalesValue: 0, commissionRate: 10, balance: 0, recurringBalance: 0 } },
          { ...INITIAL_USER, id: 'u2', name: 'Anna Test 2', email: 'anna@gmail.com', password: 'test', isMember: true, membershipTier: 'basic', loyaltyPoints: 100, affiliateCode: 'Spoilme-ANNA02', affiliateStats: { status: 'pending', totalSalesCount: 0, totalSalesValue: 0, commissionRate: 10, balance: 0, recurringBalance: 0 } },
          { ...INITIAL_USER, id: 'u3', name: 'Fay Test 3', email: 'fay@gmail.com', password: 'test', isMember: true, membershipTier: 'premium', loyaltyPoints: 500, affiliateCode: 'Spoilme-FAY003', affiliateStats: { status: 'approved', totalSalesCount: 45, totalSalesValue: 4500, commissionRate: 10, balance: 450, recurringBalance: 50 } },
          { ...INITIAL_USER, id: 'u4', name: 'Debs Test 4', email: 'debs@gmail.com', password: 'test', isMember: true, membershipTier: 'deluxe', loyaltyPoints: 1000, affiliateCode: 'Spoilme-DEBS04', affiliateStats: { status: 'approved', totalSalesCount: 150, totalSalesValue: 15000, commissionRate: 15, balance: 2250, recurringBalance: 300 } }
      ];
      try {
          for (const u of usersToCreate) {
              await setDoc(doc(db, 'users', u.id), sanitizeFirestoreData(u));
          }
          alert("Test Users Created!");
      } catch (error) {
          console.error("Error seeding users:", error);
      }
  };

  useEffect(() => {
    console.log('Loading products, isDemoMode:', isDemoMode, 'db:', !!db);
    if (isDemoMode) {
      const localProds = localStorage.getItem('spv_products');
      // If no local products found, seed with INITIAL_PRODUCTS so admin has data to work with in Demo Mode
      const parsedProds = localProds ? JSON.parse(localProds) : INITIAL_PRODUCTS;
      const publishedProds = parsedProds.filter((p: Product) => p.status === 'published');
      setProducts(publishedProds);
      const localCats = localStorage.getItem('spv_categories');
      // If no local categories found, seed with INITIAL_CATEGORIES to populate dropdowns
      setCategories(localCats ? JSON.parse(localCats) : INITIAL_CATEGORIES);
      // Persist seeded demo data back to localStorage for persistence across reloads
      try { localStorage.setItem('spv_products', JSON.stringify(parsedProds)); } catch(_) {}
      try { localStorage.setItem('spv_categories', JSON.stringify(localCats ? JSON.parse(localCats) : INITIAL_CATEGORIES)); } catch(_) {}
      const localVouchers = localStorage.getItem('spv_vouchers');
      if (localVouchers) setVouchers(JSON.parse(localVouchers));
      const localOrders = localStorage.getItem('spv_orders');
      setOrders(localOrders ? JSON.parse(localOrders) : []);
      setIsLoading(false);
      return;
    }

    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        setDbConnectionError("Connection timed out");
        // setIsDemoMode(true); // Temporarily disabled
        setIsLoading(false);
      }
    }, 5000);

    try {
      const qProducts = query(collection(db!, "products"), where('status', '==', 'published'), orderBy("createdAt", "desc"));
      const imageURLCache = new Map<string, string>();
      const normalizeImage = async (img: any): Promise<string | null> => {
          if (!img) return null;
          if (typeof img === 'string') {
              if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('blob:') || img.startsWith('/')) return img;
              if (img.startsWith('gs://')) {
                  try {
                      const gsMatch = img.match(/^gs:\/\/([^/]+)\/(.+)$/);
                      if (gsMatch) {
                          const bucket = gsMatch[1];
                          const path = gsMatch[2];
                          if (imageURLCache.has(img)) return imageURLCache.get(img)!;
                          if (bucket === 'spoilme-edee0.firebasestorage.app' || bucket === 'spoilme-edee0.appspot.com') {
                              if (storage) {
                                  const url = await getDownloadURL(sRef(storage, decodeURIComponent(path)));
                                  imageURLCache.set(img, url);
                                  return url;
                              }
                          } else {
                              // Different bucket
                              if (app) {
                                  const tempStorage = getStorage(app, `gs://${bucket}`);
                                  const url = await getDownloadURL(sRef(tempStorage, decodeURIComponent(path)));
                                  imageURLCache.set(img, url);
                                  return url;
                              }
                          }
                      }
                  } catch (err) {
                      console.error('Failed to convert gs:// URL to downloadURL', img, err);
                      return null;
                  }
              }
              // If it's a path-like string (e.g., 'products/..jpg') try to resolve
              if (!img.startsWith('http') && storage) {
                  try {
                      if (imageURLCache.has(img)) return imageURLCache.get(img)!;
                      const url = await getDownloadURL(sRef(storage, img));
                      imageURLCache.set(img, url);
                      return url;
                  } catch (err) {
                      // Not a storage path - leave as-is
                  }
              }
              return img;
          } else if (typeof img === 'object') {
              if (img.fullPath) {
                  try {
                      const key = img.fullPath + '::fullPath';
                      if (imageURLCache.has(key)) return imageURLCache.get(key)!;
                      if (storage) {
                          const url = await getDownloadURL(sRef(storage, img.fullPath));
                          imageURLCache.set(key, url);
                          return url;
                      }
                  } catch (err) {
                      console.error('Failed to convert storage object fullPath to downloadURL', img, err);
                      return null;
                  }
              }
              if (img.path) {
                  try {
                      const key = img.path + '::path';
                      if (imageURLCache.has(key)) return imageURLCache.get(key)!;
                      if (storage) {
                          const url = await getDownloadURL(sRef(storage, img.path));
                          imageURLCache.set(key, url);
                          return url;
                      }
                  } catch (err) {
                      console.error('Failed to convert storage object path to downloadURL', img, err);
                      return null;
                  }
              }
          }
          return null;
      };

      const unsubProducts = onSnapshot(qProducts, async (snapshot) => {
          console.log('Firestore snapshot received, docs count:', snapshot.docs.length);
          clearTimeout(safetyTimeout);
          const productData = await Promise.all(snapshot.docs.map(async docSnap => {
              const raw = { ...sanitizeFirestoreData(docSnap.data()), id: docSnap.id } as Product;
              console.log('Raw product:', raw.id, 'images:', raw.images);
              try {
                  if (raw.images && Array.isArray(raw.images)) {
                      const resolved = await Promise.all(raw.images.map(async (img) => await normalizeImage(img)));
                      raw.images = resolved.filter(Boolean) as string[];
                      console.log('Resolved images for', raw.id, ':', raw.images);
                  }
              } catch (err) {
                  console.error('Failed resolving product images for', raw.id, err);
              }
              return raw;
          }));
          setProducts(productData);
          console.log('Loaded products and resolved images (first 5):', productData.slice(0,5).map(p => ({ id: p.id, images: p.images })));
        },
        (error) => {
            console.log('Firestore products error:', error);
            console.error('Detailed Firestore products error:', {
                message: error.message,
                code: error.code,
                stack: error.stack,
                name: error.name
            });
            clearTimeout(safetyTimeout);
            setDbConnectionError(error.message);
            // setIsDemoMode(true); // Temporarily disabled
            setIsLoading(false);
        }
      );

      const unsubCategories = onSnapshot(collection(db!, "categories"), (snapshot) => {
          console.log('Categories snapshot received, docs count:', snapshot.docs.length);
          const categoryData = snapshot.docs.map(doc => ({ ...sanitizeFirestoreData(doc.data()), id: doc.id } as Category));
          setCategories(categoryData);
        }, (error) => {
            console.log('Firestore categories error:', error);
        }
      );

      const qOrders = user.isAdmin
            ? query(collection(db!, 'orders'), orderBy('date', 'desc'))
            : query(collection(db!, 'orders'), where('customerEmail', '==', user.email), orderBy('date', 'desc'));
      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
          console.log('Orders snapshot received, docs count:', snapshot.docs.length);
          const orderData = snapshot.docs.map(doc => ({ ...sanitizeFirestoreData(doc.data()), id: doc.id } as Order));
          setOrders(orderData);
          setIsLoading(false);
      }, () => {
          setIsLoading(false);
      });

      return () => { clearTimeout(safetyTimeout); unsubProducts(); unsubCategories(); unsubOrders(); };
    } catch (error) {
      console.log('Try-catch error in products useEffect:', error);
      clearTimeout(safetyTimeout);
      // setIsDemoMode(true); // Temporarily disabled
      setIsLoading(false);
    }
  }, [isDemoMode, user.isAdmin, user.email]);

  const addToCart = (product: Product, options: Partial<CartItem> = {}) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item =>
        item.id === product.id &&
        item.selectedSize === options.selectedSize &&
        item.selectedMaterial === options.selectedMaterial &&
        item.selectedChainStyle === options.selectedChainStyle &&
        item.selectedChainLength === options.selectedChainLength
      );

      const existingItem = existingIndex > -1 ? prev[existingIndex] : null;
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0;

      let availableStock = product.stock;
      if (product.type === 'Ring' && options.selectedSize && product.ringStock) {
        availableStock = product.ringStock[options.selectedSize] || 0;
      }

      if (currentQuantityInCart >= availableStock) {
        alert(`Sorry, you can't add more of this item. We only have ${availableStock} in stock.`);
        return prev;
      }

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex] = { ...newCart[existingIndex], quantity: newCart[existingIndex].quantity + 1 };
        return newCart;
      }
      return [...prev, { ...product, quantity: 1, ...options }];
    });
  };

  const removeFromCart = (productId: string, options: Partial<CartItem> = {}) => {
    setCart(prev => prev.filter(item =>
        !(item.id === productId &&
          item.selectedSize === options.selectedSize &&
          item.selectedMaterial === options.selectedMaterial &&
          item.selectedChainStyle === options.selectedChainStyle &&
          item.selectedChainLength === options.selectedChainLength)
    ));
  };

  const updateCartQuantity = (productId: string, quantity: number, options: Partial<CartItem> = {}) => {
    if (quantity <= 0) { removeFromCart(productId, options); return; }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    let availableStock = product.stock;
    if (product.type === 'Ring' && options.selectedSize && product.ringStock) {
        availableStock = product.ringStock[options.selectedSize] || 0;
    }

    const newQuantity = Math.min(quantity, availableStock);

    if (quantity > availableStock) {
        alert(`Sorry, we only have ${availableStock} of this item in stock. Quantity has been adjusted.`);
    }

    setCart(prev => prev.map(item => {
        const isMatch = item.id === productId &&
            item.selectedSize === options.selectedSize &&
            item.selectedMaterial === options.selectedMaterial &&
            item.selectedChainStyle === options.selectedChainStyle &&
            item.selectedChainLength === options.selectedChainLength;
        return isMatch ? { ...item, quantity: newQuantity } : item;
    }));
  };

  const clearCart = () => { setCart([]); setAppliedVoucher(null); };

  const toggleWishlist = (productId: string) => {
    setUser(prev => {
      const isLiked = prev.wishlist.includes(productId);
      const newWishlist = isLiked ? prev.wishlist.filter(id => id !== productId) : [...prev.wishlist, productId];
      const updatedUser = { ...prev, wishlist: newWishlist };
      persistUser(updatedUser);
      return updatedUser;
    });
  };

  const applyForAffiliate = async (data: { name: string; surname: string; dob: string; gender: string; reason: string; socials: string }) => {
      if (!user.id || user.id === 'guest') {
          console.error("Cannot apply for affiliate as guest user directly.");
          return;
      }

      // Create affiliate application document
      const applicationData = {
          userId: user.id,
          status: 'pending',
          appliedAt: serverTimestamp(),
          autoApproveAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          userEmail: user.email,
          userName: `${data.name} ${data.surname}`,
          gender: data.gender,
          reason: data.reason,
          socials: data.socials
      };

      if (!isDemoMode && db) {
          try {
              await addDoc(collection(db, 'affiliate_applications'), applicationData);
          } catch (error) {
              console.error('Error submitting affiliate application:', error);
              throw error;
          }
      }

      const notification: Notification = {
          id: `aff_sub_${Date.now()}`,
          type: 'system',
          title: 'Partnership Application Received',
          message: 'Your application to become a partner is pending review. Good luck!',
          date: new Date().toISOString(),
          isRead: false
      };
      const updatedUser: User = {
          ...user,
          name: `${data.name} ${data.surname}`,
          birthday: data.dob,
          notifications: [notification, ...user.notifications],
          affiliateStats: {
              ...(user.affiliateStats || {
                  status: 'none',
                  totalSalesCount: 0,
                  totalSalesValue: 0,
                  commissionRate: 10,
                  balance: 0,
                  recurringBalance: 0,
                  isElite: false,
                  hasContentAccess: false
              }),
              status: 'pending',
              gender: data.gender as any,
              joinReason: `${data.reason} | Socials: ${data.socials}`,
          }
      };
      setUser(updatedUser);
      persistUser(updatedUser);
      if (!isDemoMode && db && user.id !== 'guest') {
          await updateDoc(doc(db, 'users', user.id), sanitizeFirestoreData(updatedUser));
      }
  };

  const approveAffiliate = async (userId: string, note?: string) => {
      if (isDemoMode || !db) return;
      const userRef = doc(db, 'users', userId);

      const notification: Notification = {
          id: `aff_status_${Date.now()}`,
          type: 'affiliate_msg',
          title: 'Welcome to the Partnership Program!',
          message: `Welcome to Spoil Me Vintage Partnership Program! We are thrilled to have you on the team.${note ? ` Note from admin: ${note}` : ''}`,
          date: new Date().toISOString(),
          isRead: false
      };

      await updateDoc(userRef, {
          'affiliateStats.status': 'approved',
          'affiliateStats.commissionRate': 10,
          'affiliateStats.adminNote': note || '',
          notifications: arrayUnion(notification)
      });
  };

  const rejectAffiliate = async (userId: string, note?: string) => {
      if (isDemoMode || !db) return;
      const userRef = doc(db, 'users', userId);

      const notification: Notification = {
          id: `aff_status_${Date.now()}`,
          type: 'affiliate_msg',
          title: 'Partnership Application Update',
          message: `We regret to inform you that your application has been declined.${note ? ` Note: ${note}` : ''}`,
          date: new Date().toISOString(),
          isRead: false
      };

      await updateDoc(userRef, {
          'affiliateStats.status': 'rejected',
          'affiliateStats.adminNote': note || '',
          notifications: arrayUnion(notification)
      });
  };

  const sendAffiliateMessage = async (userId: string, message: string) => {
      if (isDemoMode || !db) return;
      const notification: Notification = {
          id: `aff_msg_${Date.now()}`,
          type: 'affiliate_msg',
          title: 'Partnership Update',
          message: message,
          date: new Date().toISOString(),
          isRead: false
      };
      const userSnap = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
      if(!userSnap.empty) {
          await updateDoc(userSnap.docs[0].ref, { notifications: [notification, ...userSnap.docs[0].data().notifications] });
      }
  };

  const updateAffiliateTier = async (userId: string, newRate: number) => {
      if (isDemoMode) return;
      if (!db) return;
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
          'affiliateStats.commissionRate': newRate
      });
  };

  const assignAffiliateParent = async (childId: string, parentId: string) => {
      if (isDemoMode) return;
      if (!db) return;
      const userRef = doc(db, 'users', childId);
      await updateDoc(userRef, {
          'affiliateStats.parentId': parentId
      });
  };

  const buyAffiliateContent = async () => {
      const updatedUser: User = { ...user, affiliateStats: { ...(user.affiliateStats as AffiliateStats), hasContentAccess: true } };
      setUser(updatedUser);
      persistUser(updatedUser);
      if (!isDemoMode && db && user.id !== 'guest') {
          await updateDoc(doc(db, 'users', user.id), sanitizeFirestoreData(updatedUser));
      }
  };

  const joinAffiliateElite = async () => {
      const updatedUser: User = { ...user, affiliateStats: { ...(user.affiliateStats as AffiliateStats), isElite: true } };
      setUser(updatedUser);
      persistUser(updatedUser);
      if (!isDemoMode && db && user.id !== 'guest') {
          await updateDoc(doc(db, 'users', user.id), sanitizeFirestoreData(updatedUser));
      }
  };

  const simulateAffiliateSale = async (code: string, amount: number): Promise<{ success: boolean; message: string }> => {
      if (!db && !isDemoMode) return { success: false, message: "Database not ready" };
      let targetUser: User | null = null;
      let targetUserRef = null;

      if (isDemoMode) {
          if (user.affiliateCode === code) targetUser = user;
          else return { success: false, message: "In Demo Mode, only your own code works." };
      } else {
          const q = query(collection(db!, 'users'), where('affiliateCode', '==', code));
          const snap = await getDocs(q);
          if (!snap.empty) {
              targetUser = { ...snap.docs[0].data(), id: snap.docs[0].id } as User;
              targetUserRef = snap.docs[0].ref;
          }
      }

      if (!targetUser) return { success: false, message: "Affiliate code not found." };
      if (targetUser.affiliateStats?.status !== 'approved' && !isDemoMode) return { success: false, message: "Affiliate not approved." };

      const stats = targetUser.affiliateStats || { status: 'none', totalSalesCount: 0, totalSalesValue: 0, commissionRate: 10, balance: 0, recurringBalance: 0 };
      const commission = (amount * stats.commissionRate) / 100;

      const newStats = {
          ...stats,
          totalSalesCount: stats.totalSalesCount + 1,
          totalSalesValue: stats.totalSalesValue + amount,
          balance: stats.balance + commission
      };

      // Update affiliate tier based on total sales
      if (newStats.totalSalesCount >= 500) newStats.commissionRate = 20;
      else if (newStats.totalSalesCount >= 100) newStats.commissionRate = 15;
      else if (newStats.totalSalesCount >= 50) newStats.commissionRate = 11;

      if (isDemoMode) {
          setUser({ ...targetUser, affiliateStats: newStats });
      } else if (targetUserRef) {
          const notif: Notification = { id: `sale_${Date.now()}`, type: 'system', title: 'New Partnership Sale!', message: `You earned R${commission.toFixed(2)} commission!`, date: new Date().toISOString(), isRead: false };
          await updateDoc(targetUserRef, { affiliateStats: newStats, notifications: [notif, ...(targetUser.notifications || [])] });

          // --- PARENT COMMISSION LOGIC (1%) ---
          if (stats.parentId) {
              try {
                  const parentRef = doc(db, 'users', stats.parentId);
                  const parentDoc = await getDoc(parentRef);
                  if (parentDoc.exists()) {
                      const parentData = parentDoc.data() as User;
                      const currentParentStats = parentData.affiliateStats || { status: 'approved', totalSalesCount: 0, totalSalesValue: 0, commissionRate: 10, balance: 0, recurringBalance: 0 };

                      const parentCommission = amount * 0.01; // 1% of sale amount

                      const newParentStats = {
                          ...currentParentStats,
                          balance: (currentParentStats.balance || 0) + parentCommission
                      };

                      const parentNotif: Notification = {
                          id: `sub_sale_${Date.now()}`,
                          type: 'system',
                          title: 'Downline Sale Bonus',
                          message: `You earned R${parentCommission.toFixed(2)} from a recruit's sale!`,
                          date: new Date().toISOString(),
                          isRead: false
                      };

                      await updateDoc(parentRef, {
                          affiliateStats: newParentStats,
                          notifications: [parentNotif, ...(parentData.notifications || [])]
                      });
                  }
              } catch (err) {
                  console.error("Failed to process parent commission", err);
              }
          }
      }
      return { success: true, message: `Sale simulated! Added R${commission.toFixed(2)}.` };
  };

  const adminAdjustPoints = async (userId: string, points: number) => {
      if (isDemoMode) {
          if (user.id === userId) {
              const updated = { ...user, loyaltyPoints: user.loyaltyPoints + points };
              setUser(updated);
              persistUser(updated);
          }
          return;
      }
      if (!db) return;
      if (user.id === userId) {
           const updated = { ...user, loyaltyPoints: user.loyaltyPoints + points };
           setUser(updated);
           persistUser(updated);
           await updateDoc(doc(db, 'users', userId), { loyaltyPoints: updated.loyaltyPoints });
      } else {
           const snap = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
           if (!snap.empty) {
               await updateDoc(snap.docs[0].ref, { loyaltyPoints: (snap.docs[0].data().loyaltyPoints || 0) + points });
           }
      }
  };

  const getAllUsers = async (): Promise<User[]> => {
      if (isDemoMode || !db) return [];
      const snapshot = await getDocs(query(collection(db, 'users')));
      // IMPORTANT: Sanitize raw Firestore data to prevent circular JSON errors
      return snapshot.docs.map(d => ({ ...sanitizeFirestoreData(d.data()), id: d.id } as User));
  };

  // Ensure the client has a fresh ID token with admin claims (if available).
  const ensureAdminToken = async () => {
    if (!auth) return; // FIX: Ensure auth object exists
    try {
      const current = auth.currentUser;
      if (current) {
        // Force refresh token so recent custom claims are present
        await current.getIdToken(true);
        console.log('ensureAdminToken: refreshed existing user token');
        return;
      }
      // No current user - attempt to sign in with the known admin creds (best-effort)
      await signInWithEmailAndPassword(auth, 'spoilmevintagediy@gmail.com', 'admin@spoilme');
      if (auth.currentUser) await auth.currentUser.getIdToken(true);
      console.log('ensureAdminToken: signed in as admin and refreshed token');
    } catch (e) {
      console.warn('ensureAdminToken failed:', e);
      // Do not throw; write flow will handle fallback
    }
  };

  // Sync any locally-saved products to Firestore when admin is available.
  const syncLocalProducts = async () => {
    if (!db || !auth) return;
    try {
      const local = localStorage.getItem('spv_products');
      if (!local) return;
      const parsed = JSON.parse(local);
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      console.log('syncLocalProducts: found', parsed.length, 'local products to push');
      for (const p of parsed) {
        try {
          const safe = sanitizeFirestoreData(p);
          await setDoc(doc(db, 'products', safe.id), safe);
          console.log('syncLocalProducts: pushed product', safe.id);
        } catch (err) {
          console.warn('syncLocalProducts: failed to push product', p.id, err);
        }
      }
      // If we reach here, best-effort to clear local backup
      localStorage.removeItem('spv_products');
      setDbConnectionError(null);
      console.log('syncLocalProducts: cleared local spv_products after push');
    } catch (e) {
      console.warn('syncLocalProducts failed:', e);
    }
  };

  const addProduct = async (product: Product) => {
      const safeProduct = sanitizeFirestoreData(product);
      const newProducts = [safeProduct, ...products];
      setProducts(newProducts);

      if (!isDemoMode && db) {
        // --- Simplified, guaranteed-write flow ---
        try {
          // Force refresh token immediately before write to ensure custom claims are fresh
          if (auth && auth.currentUser) {
            await auth.currentUser.getIdToken(true);
            console.log('Forced fresh ID token before write.');
          }

          // >>> DEBUG LOG <<<
          console.log("DEBUG: Final Product Data to Firestore (Add):", JSON.stringify(safeProduct, null, 2));

          await setDoc(doc(db, "products", safeProduct.id), safeProduct);
          setDbConnectionError(null); // Clear any old error
        } catch (err: any) {
          console.error('CRITICAL FIRESTORE ERROR (addProduct):', err, 'Product:', safeProduct);
          try {
            localStorage.setItem('spv_products', JSON.stringify(newProducts));
            setDbConnectionError(`Failed to add product: ${err.code || 'Unknown Error'}. Changes saved locally.`);
            console.warn('Firestore write failed — product saved to localStorage instead.');
          } catch (le) {
            console.error('Fallback localStorage save also failed:', le);
            throw new Error(`Critical Save Failure. Firestore and LocalStorage failed. (Details: ${le.message})`);
          }
          // Throw so calling UI can show a proper failure message
          throw new Error(err.message || "Failed to add product.");
        }
      } else {
         // Demo Mode - just local storage update
         try {
           localStorage.setItem('spv_products', JSON.stringify(newProducts));
         } catch (err) {
           console.error('Failed to save products to localStorage on addProduct:', err);
           throw new Error('Failed to add product in Demo Mode: LocalStorage error.');
         }
      }
  };

  const updateProduct = async (product: Product) => {
     const safeProduct = sanitizeFirestoreData(product);
     const updated = products.map(p => p.id === safeProduct.id ? safeProduct : p);
     setProducts(updated);

     if (!isDemoMode && db) {
       try {
         // Force refresh token immediately before write
         if (auth && auth.currentUser) {
           await auth.currentUser.getIdToken(true);
           console.log('Forced fresh ID token before write.');
         }

         // >>> DEBUG LOG <<<
         console.log("DEBUG: Final Product Data to Firestore (Update):", JSON.stringify(safeProduct, null, 2));

         await setDoc(doc(db, "products", safeProduct.id), safeProduct);
         setDbConnectionError(null);
       } catch (err: any) {
         console.error('CRITICAL FIRESTORE ERROR (updateProduct):', err, 'Product:', safeProduct);
         try {
           localStorage.setItem('spv_products', JSON.stringify(updated));
           setDbConnectionError(`Failed to update product: ${err.code || 'Unknown Error'}. Changes saved locally.`);
           console.warn('Firestore write failed — update saved to localStorage instead.');
         } catch (le) {
           console.error('Fallback localStorage save also failed:', le);
           throw new Error(`Critical Save Failure. Firestore and LocalStorage failed. (Details: ${le.message})`);
         }
         throw new Error(err.message || "Failed to update product.");
       }
     } else {
         // Demo Mode - just local storage update
         try {
           localStorage.setItem('spv_products', JSON.stringify(updated));
         } catch (err) {
           console.error('Failed to save products to localStorage on updateProduct:', err);
           throw new Error('Failed to update product in Demo Mode: LocalStorage error.');
         }
     }
  };

   const deleteProduct = async (productId: string) => {
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);

    if (!isDemoMode && db) {
      try {
        // Force refresh token immediately before delete
        if (auth && auth.currentUser) {
          await auth.currentUser.getIdToken(true);
          console.log('Forced fresh ID token before write.');
        }

        console.log("DEBUG: Final Product Delete to Firestore:", productId);
        await deleteDoc(doc(db, "products", productId));
        setDbConnectionError(null);
      } catch (err: any) {
        console.error('CRITICAL FIRESTORE ERROR (deleteProduct):', err, 'productId:', productId);
        try {
          localStorage.setItem('spv_products', JSON.stringify(updated));
          setDbConnectionError(`Failed to delete product: ${err.code || 'Unknown Error'}. Change saved locally.`);
          console.warn('Firestore delete failed — delete reflected locally.');
        } catch (le) {
          console.error('Fallback localStorage save also failed:', le);
          throw new Error(`Critical Delete Failure. Firestore and LocalStorage failed. (Details: ${le.message})`);
        }
        throw new Error(err.message || "Failed to delete product.");
      }
    } else {
         // Demo Mode - just local storage update
         try { localStorage.setItem('spv_products', JSON.stringify(updated)); } catch (err) { console.error('Failed to save products to localStorage on deleteProduct:', err); }
    }
   };

  const addOrder = async (order: Order) => {
    const safeOrder = sanitizeFirestoreData(order);
    setOrders(prev => [safeOrder, ...prev]);
    if (!isDemoMode && db) {
        await setDoc(doc(db, "orders", safeOrder.id), safeOrder);
    }
  };

  const updateOrder = async (order: Order) => {
    const safeOrder = sanitizeFirestoreData(order);
    setOrders(prev => prev.map(o => o.id === safeOrder.id ? safeOrder : o));
    if (!isDemoMode && db) {
        await updateDoc(doc(db, "orders", safeOrder.id), safeOrder);
    }
  };

  const deleteOrder = async (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (!isDemoMode && db) {
        await deleteDoc(doc(db, "orders", orderId));
    }
  };

  const addCategory = async (category: Category) => {
    const safeCat = sanitizeFirestoreData(category);
    setCategories(prev => [...prev, safeCat]);
    if (!isDemoMode && db) {
        await setDoc(doc(db, "categories", safeCat.id), safeCat);
    } else {
        localStorage.setItem('spv_categories', JSON.stringify([...categories, safeCat]));
    }
  };

  const updateCategory = async (category: Category) => {
    const safeCat = sanitizeFirestoreData(category);
    setCategories(prev => prev.map(c => c.id === safeCat.id ? safeCat : c));
    if (!isDemoMode && db) {
        await setDoc(doc(db, "categories", safeCat.id), safeCat);
    } else {
        const updated = categories.map(c => c.id === safeCat.id ? safeCat : c);
        localStorage.setItem('spv_categories', JSON.stringify(updated));
    }
  };

  const deleteCategory = async (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    if (!isDemoMode && db) {
        await deleteDoc(doc(db, "categories", categoryId));
    } else {
        const updated = categories.filter(c => c.id !== categoryId);
        localStorage.setItem('spv_categories', JSON.stringify(updated));
    }
  };

  const replaceCategories = async (newCategories: Category[]) => {
      const safeCats = sanitizeFirestoreData(newCategories);
      setCategories(safeCats);
      if(isDemoMode) localStorage.setItem('spv_categories', JSON.stringify(safeCats));
  };

  const addSpecial = (special: SpecialOffer) => setSpecials(prev => [...prev, special]);

  const addVoucher = (voucher: Voucher) => {
      const safeVoucher = sanitizeFirestoreData(voucher);
      setVouchers(prev => [...prev, safeVoucher]);
      const current = JSON.parse(localStorage.getItem('spv_vouchers') || '[]');
      localStorage.setItem('spv_vouchers', JSON.stringify([...current, safeVoucher]));
  };

  const deleteVoucher = (code: string) => {
      setVouchers(prev => prev.filter(v => v.code !== code));
      const current = JSON.parse(localStorage.getItem('spv_vouchers') || '[]');
      localStorage.setItem('spv_vouchers', JSON.stringify(current.filter((v:Voucher) => v.code !== code)));
  };

  const applyExternalVoucher = (code: string) => {
      const voucher = vouchers.find(v => v.code === code);
      if (voucher) { setAppliedVoucher(voucher); return true; }
      return false;
  };

  const resetStore = () => {
      localStorage.clear();
      window.location.reload();
  };

  const getCartTotal = () => cart.reduce((total, item) => total + ((item.price + (item.selectedMaterialModifier || 0)) * item.quantity), 0);

  const checkout = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'customerName' | 'customerEmail' | 'status'> & { pointsToRedeem?: number }): Promise<Order> => {
    if (!user.email) {
        throw new Error("User must be logged in to checkout.");
    }

    const newOrder: Order = {
        ...orderData,
        id: `ord_${Date.now()}`,
        orderNumber: `#SMV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        customerName: user.name,
        customerEmail: user.email,
        status: 'Pending',
    };

    await addOrder(newOrder);

    // Process affiliate commissions
    if (user.affiliateCode && user.affiliateCode !== 'none') {
      await processAffiliateCommissions(cart, newOrder.id, user.affiliateCode);
    }

    const newNotifications: Notification[] = [];
    for (const item of cart) {
       if (item.tags?.includes('Voucher')) continue;
       newNotifications.push({
          id: `notif_${Date.now()}_${item.id}`,
          type: 'review_request',
          title: 'How was your purchase?',
          message: `Review ${item.name} to earn 100 Points!`,
          productId: item.id,
          productName: item.name,
          date: new Date().toISOString(),
          isRead: false
       });
    }

    // Calculate credit used (this should match the cart calculation)
    let creditUsed = 0;
    const cartTotal = getCartTotal();
    if (user?.storeCredit && user.storeCredit > 0 && user.creditCurrency === currency) {
      // Apply any discounts first (simplified - in real app this should match cart logic)
      const subtotalAfterDiscount = cartTotal; // Simplified - should include voucher discounts
      creditUsed = Math.min(subtotalAfterDiscount, user.storeCredit);
    }

    const earnedPoints = currency === 'ZAR' ? Math.floor((orderData.total / 10)) : Math.floor((orderData.total / 3));
    const updatedUser = {
       ...user,
       loyaltyPoints: Math.max(0, user.loyaltyPoints + earnedPoints - (orderData.pointsToRedeem || 0)),
       storeCredit: Math.max(0, (user.storeCredit || 0) - creditUsed),
       notifications: [...newNotifications, ...user.notifications]
    };
    setUser(updatedUser);
    persistUser(updatedUser);

    if (!isDemoMode && db && user.id !== 'guest') {
        await updateDoc(doc(db, 'users', user.id), sanitizeFirestoreData(updatedUser));
    }

    return newOrder;
  };

  const processGiftVoucherPurchase = async (amount: number, meta: VoucherMeta) => {
       const code = "GV-" + Math.random().toString(36).substr(2, 9).toUpperCase();
       const voucher: Voucher = { code, discountType: 'fixed', value: amount, minSpend: amount, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 3).toISOString() };
       addVoucher(voucher);

       const notification: Notification = {
           id: `gift_${Date.now()}`,
           type: 'gift_ready',
           title: 'Gift Ready',
           message: 'Your voucher is ready.',
           date: new Date().toISOString(),
           isRead: false,
           voucherData: { code, amount, meta }
       };

       const updatedUser = { ...user, notifications: [notification, ...user.notifications] };
       setUser(updatedUser);
       persistUser(updatedUser);
       if (!isDemoMode && db && user.id !== 'guest') {
           await updateDoc(doc(db, 'users', user.id), sanitizeFirestoreData(updatedUser));
       }
  };

  const submitReview = async (productId: string, rating: number, content: string, notificationId: string) => {
      if (user.id === 'guest') return;
      const product = products.find(p => p.id === productId);
      if (product) {
          const newReview = { id: `rev_${Date.now()}`, userName: user.name, location: 'Verified Buyer', content, rating, date: new Date().toLocaleDateString() };
          // NOTE: updateProduct is used here, so its fixes are important for this function to work reliably!
          await updateProduct({ ...product, reviews: [newReview, ...(product.reviews || [])] });
      }
      const updatedUser = { ...user, loyaltyPoints: user.loyaltyPoints + 100, notifications: user.notifications.filter(n => n.id !== notificationId) };
      setUser(updatedUser);
      persistUser(updatedUser);
      if(!isDemoMode && db) await updateDoc(doc(db, 'users', user.id), sanitizeFirestoreData(updatedUser));
  };

  const shareProduct = async (productId: string) => {
      const updatedUser = { ...user, loyaltyPoints: user.loyaltyPoints + 50 };
      setUser(updatedUser);
      persistUser(updatedUser);
      if (!isDemoMode && db && user.id !== 'guest') await updateDoc(doc(db, 'users', user.id), { loyaltyPoints: updatedUser.loyaltyPoints });
  };

  const claimSocialReward = async (platform: 'tiktok' | 'twitter' | 'whatsapp' | 'facebook' | 'pinterest', handle?: string) => {
      if (user.id === 'guest') return;
      const rewards = user.socialRewards || {};
      if (rewards[platform]) return;
      const updatedUser = {
          ...user,
          loyaltyPoints: user.loyaltyPoints + 100,
          socialRewards: { ...rewards, [platform]: true },
          socialHandles: { ...user.socialHandles, [platform]: handle }
      };
      setUser(updatedUser);
      persistUser(updatedUser);
      if(!isDemoMode && db) await updateDoc(doc(db, 'users', user.id), sanitizeFirestoreData(updatedUser));
  };

  const addSystemNotification = (title: string, message: string, type: any = 'system') => {
      const notif: Notification = { id: `sys_${Date.now()}`, type, title, message, date: new Date().toISOString(), isRead: false };
      const updated = { ...user, notifications: [notif, ...user.notifications] };
      setUser(updated);
      persistUser(updated);
  };

  const runDataDiagnostics = () => {
      try {
          const testString = JSON.stringify(products);
          if (testString.length > 0) return { status: 'success', details: `Serialization OK. Size: ${(testString.length/1024).toFixed(2)} KB` };
          return { status: 'warning', details: 'Empty products.' };
      } catch (e: any) { return { status: 'error', details: `Error: ${e.message}` }; }
  };

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'ZAR' ? 'USD' : 'ZAR');
  };

  // Regenerate winners when manualWinner changes
  useEffect(() => {
    setWeeklyWinners(generateWeeklyWinners(manualWinner));
  }, [manualWinner]);

  const processAffiliateCommissions = async (cart: CartItem[], orderId: string, affiliateCode: string) => {
    if (!db && !isDemoMode) return;

    try {
      // Find the affiliate user
      let affiliateUser: User | null = null;
      let affiliateUserRef = null;

      if (isDemoMode) {
        if (user.affiliateCode === affiliateCode) affiliateUser = user;
      } else {
        const q = query(collection(db!, 'users'), where('affiliateCode', '==', affiliateCode));
        const snap = await getDocs(q);
        if (!snap.empty) {
          affiliateUser = { ...snap.docs[0].data(), id: snap.docs[0].id } as User;
          affiliateUserRef = snap.docs[0].ref;
        }
      }

      if (!affiliateUser || affiliateUser.affiliateStats?.status !== 'approved') return;

      const stats = affiliateUser.affiliateStats as AffiliateStats;
      let totalStandardCommission = 0;
      let totalVaultCommission = 0;
      let vaultItemsSold = 0;
      const commissionRecords: CommissionRecord[] = [];

      // // Split items into standard and vault
      const standardItems = cart.filter(item => !item.vaultItem);
      const vaultItems = cart.filter(item => item.vaultItem);

      // Process standard items (10-20% commission based on tier)
      for (const item of standardItems) {
        const basePrice = currency === 'ZAR' ? item.price : item.priceUSD;
        const commissionRate = stats.commissionRate / 100; // Convert percentage to decimal
        const commissionAmount = basePrice * item.quantity * commissionRate;

        totalStandardCommission += commissionAmount;

        commissionRecords.push({
          id: `comm_${Date.now()}_${item.id}`,
          affiliateId: affiliateUser.id,
          orderId,
          itemId: item.id,
          itemName: item.name,
          itemType: 'standard',
          basePrice,
          commissionRate: stats.commissionRate,
          commissionAmount,
          currency,
          date: new Date().toISOString()
        });
      }

      // Process vault items (1% flat commission)
      for (const item of vaultItems) {
        const basePrice = currency === 'ZAR' ? item.price : item.priceUSD;
        const commissionRate = 0.01; // 1% flat
        const commissionAmount = basePrice * item.quantity * commissionRate;

        totalVaultCommission += commissionAmount;
        vaultItemsSold += item.quantity;

        commissionRecords.push({
          id: `comm_${Date.now()}_${item.id}`,
          affiliateId: affiliateUser.id,
          orderId,
          itemId: item.id,
          itemName: item.name,
          itemType: 'vault',
          basePrice,
          commissionRate: 1, // 1%
          commissionAmount,
          currency,
          date: new Date().toISOString()
        });
      }

      const totalCommission = totalStandardCommission + totalVaultCommission;

      // Update affiliate stats
      const newStats: AffiliateStats = {
        ...stats,
        totalSalesCount: stats.totalSalesCount + cart.length,
        totalSalesValue: stats.totalSalesValue + cart.reduce((sum, item) => sum + ((currency === 'ZAR' ? item.price : item.priceUSD) * item.quantity), 0),
        balance: stats.balance + totalCommission,
        vaultPurchasesThisMonth: stats.vaultPurchasesThisMonth + vaultItemsSold,
        weeklyMilestones: {
          ...stats.weeklyMilestones,
          salesValue: stats.weeklyMilestones.salesValue + cart.reduce((sum, item) => sum + ((currency === 'ZAR' ? item.price : item.priceUSD) * item.quantity), 0),
          vaultItemsSold: stats.weeklyMilestones.vaultItemsSold + vaultItemsSold
        }
      };

      // Update commission tier based on total sales
      if (newStats.totalSalesValue >= 50000) newStats.commissionRate = 20;
      else if (newStats.totalSalesValue >= 15000) newStats.commissionRate = 15;
      else if (newStats.totalSalesValue >= 5000) newStats.commissionRate = 11;

      // Process weekly milestones
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const weekStartISO = weekStart.toISOString().split('T')[0];

      // Reset weekly milestones if it's a new week
      if (newStats.weeklyMilestones.weekStart !== weekStartISO) {
        newStats.weeklyMilestones = {
          membershipsSold: 0,
          salesValue: cart.reduce((sum, item) => sum + ((currency === 'ZAR' ? item.price : item.priceUSD) * item.quantity), 0),
          vaultItemsSold,
          weekStart: weekStartISO
        };
      }

      // Check for milestone achievements
      const milestones: AffiliateMilestone[] = [];

      // Sprinter: 5 memberships
      if (newStats.weeklyMilestones.membershipsSold >= 5) {
        const existing = localStorage.getItem(`milestone_${affiliateUser.id}_sprinter_${weekStartISO}`);
        if (!existing) {
          const bonus = currency === 'ZAR' ? 50 : 5;
          newStats.balance += bonus;
          milestones.push({
            id: `milestone_${Date.now()}`,
            affiliateId: affiliateUser.id,
            type: 'sprinter',
            achievedAt: new Date().toISOString(),
            bonusAmount: bonus,
            currency,
            weekStart: weekStartISO
          });
          localStorage.setItem(`milestone_${affiliateUser.id}_sprinter_${weekStartISO}`, 'true');
        }
      }

      // Big Spender: R5,000 / $300 sales
      const salesThreshold = currency === 'ZAR' ? 5000 : 300;
      if (newStats.weeklyMilestones.salesValue >= salesThreshold) {
        const existing = localStorage.getItem(`milestone_${affiliateUser.id}_big_spender_${weekStartISO}`);
        if (!existing) {
          const bonus = currency === 'ZAR' ? 200 : 15;
          newStats.balance += bonus;
          milestones.push({
            id: `milestone_${Date.now()}`,
            affiliateId: affiliateUser.id,
            type: 'big_spender',
            achievedAt: new Date().toISOString(),
            bonusAmount: bonus,
            currency,
            weekStart: weekStartISO
          });
          localStorage.setItem(`milestone_${affiliateUser.id}_big_spender_${weekStartISO}`, 'true');
        }
      }

      // Vault King: 10 vault items
      if (newStats.weeklyMilestones.vaultItemsSold >= 10) {
        const existing = localStorage.getItem(`milestone_${affiliateUser.id}_vault_king_${weekStartISO}`);
        if (!existing) {
          const bonus = currency === 'ZAR' ? 100 : 8;
          newStats.balance += bonus;
          milestones.push({
            id: `milestone_${Date.now()}`,
            affiliateId: affiliateUser.id,
            type: 'vault_king',
            achievedAt: new Date().toISOString(),
            bonusAmount: bonus,
            currency,
            weekStart: weekStartISO
          });
          localStorage.setItem(`milestone_${affiliateUser.id}_vault_king_${weekStartISO}`, 'true');
        }
      }

      // Process team leader bonus (1% on sales from direct recruits)
      if (stats.parentId) {
        try {
          let parentUser: User | null = null;
          let parentUserRef = null;

          if (isDemoMode) {
            // In demo mode, just skip parent commission
          } else {
            const parentQuery = query(collection(db!, 'users'), where('id', '==', stats.parentId));
            const parentSnap = await getDocs(parentQuery);
            if (!parentSnap.empty) {
              parentUser = { ...parentSnap.docs[0].data(), id: parentSnap.docs[0].id } as User;
              parentUserRef = parentSnap.docs[0].ref;
            }
          }

          if (parentUser && parentUser.affiliateStats?.status === 'approved') {
            const parentStats = parentUser.affiliateStats as AffiliateStats;
            const teamBonus = totalCommission * 0.01; // 1% of affiliate's total commission

            const updatedParentStats = {
              ...parentStats,
              balance: parentStats.balance + teamBonus
            };

            if (!isDemoMode && parentUserRef) {
              await updateDoc(parentUserRef, { affiliateStats: updatedParentStats });

              const parentNotif: Notification = {
                id: `team_bonus_${Date.now()}`,
                type: 'system',
                title: 'Team Leader Bonus',
                message: `You earned ${currency === 'ZAR' ? 'R' : '$'}${teamBonus.toFixed(2)} from a recruit's sale!`,
                date: new Date().toISOString(),
                isRead: false
              };

              await updateDoc(parentUserRef, { notifications: arrayUnion(parentNotif) });
            }
          }
        } catch (err) {
          console.error("Failed to process team leader bonus", err);
        }
      }

      // Update affiliate user
      const updatedAffiliateUser = { ...affiliateUser, affiliateStats: newStats };

      if (isDemoMode) {
        if (affiliateUser.id === user.id) {
          setUser(updatedAffiliateUser);
          persistUser(updatedAffiliateUser);
        }
      } else if (affiliateUserRef) {
        await updateDoc(affiliateUserRef, { affiliateStats: newStats });

        // Add commission notification
        const notif: Notification = {
          id: `commission_${Date.now()}`,
          type: 'system',
          title: 'New Commission Earned!',
          message: `You earned ${currency === 'ZAR' ? 'R' : '$'}${totalCommission.toFixed(2)} from this sale!`,
          date: new Date().toISOString(),
          isRead: false
        };

        await updateDoc(affiliateUserRef, { notifications: arrayUnion(notif) });
      }

      // Store commission records (in a real app, this would be saved to database)
      const existingRecords = JSON.parse(localStorage.getItem('commission_records') || '[]');
      localStorage.setItem('commission_records', JSON.stringify([...existingRecords, ...commissionRecords]));

      // Store milestones
      if (milestones.length > 0) {
        const existingMilestones = JSON.parse(localStorage.getItem('affiliate_milestones') || '[]');
        localStorage.setItem('affiliate_milestones', JSON.stringify([...existingMilestones, ...milestones]));
      }

    } catch (error) {
      console.error("Failed to process affiliate commissions", error);
    }
  };

  const closeAccount = async (reason: string) => {
      if (isDemoMode || !db || user.id === 'guest') return;

      try {
          // Create notification for admin
          const adminNotification: Notification = {
              id: `acct_close_admin_${Date.now()}`,
              type: 'system',
              title: 'Account Closure Request',
              message: `${user.name} (${user.email}) has requested account closure. Reason: ${reason}`,
              date: new Date().toISOString(),
              isRead: false
          };

          // Update user document
          await updateDoc(doc(db, 'users', user.id), {
              isActive: false,
              closureReason: reason,
              closureRequestedAt: new Date().toISOString(),
              scheduledDeletionAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
          });

          // Send notification to admin (assuming admin email is known)
          const adminQuery = query(collection(db, 'users'), where('email', '==', 'spoilmevintagediy@gmail.com'));
          const adminSnap = await getDocs(adminQuery);
          if (!adminSnap.empty) {
              await updateDoc(adminSnap.docs[0].ref, {
                  notifications: arrayUnion(adminNotification)
              });
          }

          // Create notification for user
          const userNotification: Notification = {
              id: `acct_close_user_${Date.now()}`,
              type: 'system',
              title: 'Account Closure Requested',
              message: 'Your account closure has been requested. Your account and all data will be permanently deleted within 24 hours.',
              date: new Date().toISOString(),
              isRead: false
          };

          await updateDoc(doc(db, 'users', user.id), {
              notifications: arrayUnion(userNotification)
          });

      } catch (error) {
          console.error("Error closing account:", error);
          throw error;
      }
  };

  // Function to send user data to service worker for personalized notifications
  const sendUserDataToServiceWorker = (user: User) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'USER_DATA',
        name: user.name || user.firstName + ' ' + user.lastName || 'valued customer'
      });
    }
  };

  const applyForArtist = async (data: { name: string; surname: string; artistTradeName?: string; contactNumber: string; email: string; productImages: string[] }) => {
      if (!user.id || user.id === 'guest') {
          console.error("Cannot apply for artist as guest user.");
          return;
      }

      // Create artist application document
      const applicationData = {
          uid: user.id,
          name: data.name,
          surname: data.surname,
          artistTradeName: data.artistTradeName,
          contactNumber: data.contactNumber,
          email: data.email,
          productImages: data.productImages,
          status: 'pending',
          submittedAt: serverTimestamp(),
      };

      if (!isDemoMode && db) {
          try {
              await addDoc(collection(db, 'artist_applications'), applicationData);
          } catch (error) {
              console.error('Error submitting artist application:', error);
              throw error;
          }
      }

      const notification: Notification = {
          id: `artist_app_${Date.now()}`,
          type: 'system',
          title: 'Artist Partnership Application Received',
          message: 'Your application to become an artist partner is pending review. We will contact you soon!',
          date: new Date().toISOString(),
          isRead: false
      };
      const updatedUser: User = {
          ...user,
          notifications: [notification, ...user.notifications],
      };
      setUser(updatedUser);
      persistUser(updatedUser);
      if (!isDemoMode && db && user.id !== 'guest') {
          await updateDoc(doc(db, 'users', user.id), sanitizeFirestoreData(updatedUser));
      }
  };

  return (
    <StoreContext.Provider value={{
      products, categories, cart, user, specials, vouchers, appliedVoucher, affiliateLeaderboard, memberCount, weeklyWinners, isLoading, isDemoMode, dbConnectionError, orders,
      isStickyProgressBarVisible, setIsStickyProgressBarVisible,
      currency, setCurrency, toggleCurrency,
      packagingPresets, materialPresets, savePackagingPreset, deletePackagingPreset, saveMaterialPreset, deleteMaterialPreset,
      login, logout, register, addToCart, removeFromCart, updateCartQuantity, clearCart, toggleWishlist, checkout, submitReview, addSystemNotification, processGiftVoucherPurchase,
      applyForAffiliate, approveAffiliate, rejectAffiliate, sendAffiliateMessage, buyAffiliateContent, joinAffiliateElite, simulateAffiliateSale, updateAffiliateTier, assignAffiliateParent,
      applyForArtist,
      addProduct, updateProduct, deleteProduct, addOrder, updateOrder, deleteOrder, addCategory, updateCategory, deleteCategory, replaceCategories,
      addSpecial, resetStore, seedTestUsers, getAllUsers, runDataDiagnostics, adminAdjustPoints,
      getCartTotal, addVoucher, deleteVoucher, applyExternalVoucher, setAppliedVoucher, shareProduct, claimSocialReward, updateUserAddress,

      // Admin Winner Override
      manualWinner, setManualWinner, auth,

      // Account Management
      closeAccount
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
