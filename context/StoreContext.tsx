
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Fix: Added Winner and Order to import
import { Product, Category, CartItem, User, SpecialOffer, Voucher, Notification, VoucherMeta, AffiliateLeaderboardItem, PackagingItem, EarringMaterial, AffiliateStats, ShippingAddress, Winner, Order } from '../types';
import { INITIAL_USER, INITIAL_SPECIALS, INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../constants';
import { db, storage } from '../firebaseConfig';
import { getDownloadURL, ref as sRef } from 'firebase/storage';
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
  getDoc
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
  checkout: (orderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'customerName' | 'customerEmail' | 'status'>) => Promise<Order>;
  submitReview: (productId: string, rating: number, content: string, notificationId: string) => Promise<void>;
  shareProduct: (productId: string) => void;
  claimSocialReward: (platform: 'tiktok' | 'twitter' | 'whatsapp' | 'facebook', handle?: string) => Promise<void>;
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

  // STRICT OBJECT FILTERING
  // If the object is a complex class instance (like Firebase internal classes Q$1, Sa, etc.), 
  // we typically want to avoid it unless we know it's safe.
  // We check if the prototype is Object or null (plain object) OR if it's a standard array.
  const proto = Object.getPrototypeOf(data);
  if (proto && proto !== Object.prototype && proto !== null) {
      // It is a class instance. 
      // If it's a known safe class, fine. If it's a Firebase internal, SKIP IT.
      // For now, we skip unknown class instances to prevent the crash.
      return null; 
  }

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
const generateWeeklyWinners = (): Winner[] => {
    const names = [
      "Thandiwe Zulu", "Jessica Nel", "Precious Khumalo", "Sarah Van Der Merwe",
      "Amahle Dlamini", "Chloe Naidoo", "Nicole Botha", "Zanele Mthembu",
      "Ashley Smith", "Bianca Fourie", "Elize Venter", "Fayruz Adams",
      "Gugulethu Mchunu", "Megan Reddy", "Nosipho Cele", "Anelisa Peterson",
      "Busisiwe Malinga", "Danielle Jacobs", "Fatima Khan", "Isabella Martins",
      "Liesl Jacobs", "Nomvula Gqola", "Pieterse Van Zyl", "Rethabile Mokoena",
      "Sibusiso Ndlovu", "Tshegofatso Moloi", "Lerato Pillay", "Anja Pretorius",
      "Fatima Akoojee", "Mandisa Botha"
    ];
    
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const weekOfYear = Math.ceil(dayOfYear / 7);
    const seed = now.getFullYear() * 100 + weekOfYear;
    
    const seededRandom = (s: number) => {
        let t = s += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };

    const shuffledNames = [...names].sort((a, b) => seededRandom(seed + a.length) - 0.5);

    const winners: Winner[] = [];
    const prizes = [
        500, // 1st
        250, // 2nd
        200, // 3rd
        ...Array(7).fill(100), // 4th-10th
        ...Array(10).fill(50), // 11th-20th
    ];
    
    for (let i = 0; i < prizes.length; i++) {
      winners.push({
        rank: i + 1,
        name: shuffledNames[i],
        prize: prizes[i]
      });
    }
    return winners;
  };

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
    setWeeklyWinners(generateWeeklyWinners());

    const now = new Date();
    const seed = now.getFullYear() * 100 + now.getMonth(); 
    const seededRandom = (s: number) => {
        let t = s += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    setMemberCount(780 + Math.floor(seededRandom(seed) * 15));

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

    if (normalizedEmail === 'spoilmevintagediy@gmail.com' && pass === 'admin@spoilme') {
      loggedInUser = {
        ...INITIAL_USER,
        id: 'admin_01',
        name: 'Admin User',
        email: email,
        isAdmin: true,
        isMember: true,
        membershipTier: 'deluxe',
        loyaltyPoints: 9999,
        affiliateCode: 'ADMIN_MASTER',
        socialRewards: {}
      };
    }

    if (!loggedInUser && pass === 'test') {
        if (normalizedEmail === 'eliz@gmail.com') {
            loggedInUser = { ...INITIAL_USER, id: 'u1', name: 'Elize Test 1', email: 'eliz@gmail.com', isMember: false, membershipTier: 'none' };
        } else if (normalizedEmail === 'anna@gmail.com') {
            loggedInUser = { ...INITIAL_USER, id: 'u2', name: 'Anna Test 2', email: 'anna@gmail.com', isMember: true, membershipTier: 'basic', loyaltyPoints: 100 };
        }
    }

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
        setUser(loggedInUser);
        persistUser(loggedInUser);
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
      setProducts(localProds ? JSON.parse(localProds) : []);
      const localCats = localStorage.getItem('spv_categories');
      setCategories(localCats ? JSON.parse(localCats) : []);
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
      const qProducts = query(collection(db!, "products"), orderBy("createdAt", "desc"));
      const imageURLCache = new Map<string, string>();
      const normalizeImage = async (img: any): Promise<string | null> => {
          if (!img) return null;
          if (typeof img === 'string') {
              if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('blob:') || img.startsWith('/')) return img;
              if (img.startsWith('gs://')) {
                  try {
                      const gsMatch = img.match(/^gs:\/\/[^/]+\/(.+)$/);
                      const path = gsMatch ? gsMatch[1] : img;
                      if (imageURLCache.has(img)) return imageURLCache.get(img)!;
                      if (storage) {
                          const url = await getDownloadURL(sRef(storage, decodeURIComponent(path)));
                          imageURLCache.set(img, url);
                          return url;
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

  const addProduct = async (product: Product) => {
    const safeProduct = sanitizeFirestoreData(product);
    setProducts(prev => [safeProduct, ...prev]);
    if (!isDemoMode && db) {
      await setDoc(doc(db, "products", safeProduct.id), safeProduct);
    } else {
        localStorage.setItem('spv_products', JSON.stringify([safeProduct, ...products]));
    }
  };

  const updateProduct = async (product: Product) => {
    const safeProduct = sanitizeFirestoreData(product);
    setProducts(prev => prev.map(p => p.id === safeProduct.id ? safeProduct : p));
    if (!isDemoMode && db) {
      await setDoc(doc(db, "products", safeProduct.id), safeProduct);
    } else {
        const updated = products.map(p => p.id === safeProduct.id ? safeProduct : p);
        localStorage.setItem('spv_products', JSON.stringify(updated));
    }
  };

  const deleteProduct = async (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (!isDemoMode && db) {
      await deleteDoc(doc(db, "products", productId));
    } else {
        const updated = products.filter(p => p.id !== productId);
        localStorage.setItem('spv_products', JSON.stringify(updated));
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
  
  const checkout = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'customerName' | 'customerEmail' | 'status'>): Promise<Order> => {
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
    
    const earnedPoints = Math.floor((orderData.total / 10));
    const updatedUser = {
       ...user,
       loyaltyPoints: Math.max(0, user.loyaltyPoints + earnedPoints),
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

  const claimSocialReward = async (platform: 'tiktok' | 'twitter' | 'whatsapp' | 'facebook', handle?: string) => {
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

  return (
    <StoreContext.Provider value={{
      products, categories, cart, user, specials, vouchers, appliedVoucher, affiliateLeaderboard, memberCount, weeklyWinners, isLoading, isDemoMode, dbConnectionError, orders,
      isStickyProgressBarVisible, setIsStickyProgressBarVisible,
      packagingPresets, materialPresets, savePackagingPreset, deletePackagingPreset, saveMaterialPreset, deleteMaterialPreset,
      login, logout, register, addToCart, removeFromCart, updateCartQuantity, clearCart, toggleWishlist, checkout, submitReview, addSystemNotification, processGiftVoucherPurchase,
      applyForAffiliate, approveAffiliate, rejectAffiliate, sendAffiliateMessage, buyAffiliateContent, joinAffiliateElite, simulateAffiliateSale, updateAffiliateTier, assignAffiliateParent,
      addProduct, updateProduct, deleteProduct, addOrder, updateOrder, deleteOrder, addCategory, updateCategory, deleteCategory, replaceCategories,
      addSpecial, resetStore, seedTestUsers, getAllUsers, runDataDiagnostics, adminAdjustPoints,
      getCartTotal, addVoucher, deleteVoucher, applyExternalVoucher, setAppliedVoucher, shareProduct, claimSocialReward, updateUserAddress
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
