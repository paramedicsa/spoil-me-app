import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Fix: Added Winner and Order to import
import { Product, Category, CartItem, User, SpecialOffer, Voucher, Notification, VoucherMeta, AffiliateLeaderboardItem, PackagingItem, EarringMaterial, AffiliateStats, ShippingAddress, Winner, Order, VaultItem, CommissionRecord, AffiliatePayout, AffiliateMilestone } from '../types';
import { INITIAL_USER, INITIAL_SPECIALS, INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../constants';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { initializePushNotifications } from '../utils/pushNotifications';
import { callServerFunction } from '../utils/supabaseClient';

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

  // Add isDemoMode to match Provider value
  isDemoMode: boolean;
  isLoading: boolean;
  dbConnectionError: string | null;
  db: any;
  isSupabaseConfigured?: boolean;

  // Packaging / material presets
  packagingPresets: PackagingItem[];
  materialPresets: EarringMaterial[];
  savePackagingPreset: (item: PackagingItem) => void;
  deletePackagingPreset: (name: string) => void;
  saveMaterialPreset: (item: EarringMaterial) => void;
  deleteMaterialPreset: (name: string) => void;

  // Currency
  currency: 'ZAR' | 'USD';
  setCurrency: (c: 'ZAR' | 'USD') => void;
  toggleCurrency: () => void;

  // Currency
  addSpecial: (special: SpecialOffer) => void;
  resetStore: () => void;
  seedTestUsers: () => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  runDataDiagnostics: () => { status: string; details: string };
  adminAdjustPoints: (userId: string, points: number) => Promise<void>;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (userData: Partial<User>) => Promise<boolean>;
  logout: () => void;
  authErrorMessage: string | null;
  clearAuthError: () => void;
  addToCart: (product: Product, options?: Partial<CartItem>) => void;
  removeFromCart: (productId: string, options?: Partial<CartItem>) => void;
  updateCartQuantity: (productId: string, quantity: number, options?: Partial<CartItem>) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  checkout: (orderData: any) => Promise<Order>;
  submitReview: (productId: string, rating: number, content: string, notificationId: string) => Promise<void>;
  addSystemNotification: (title: string, message: string, type?: any) => void;
  processGiftVoucherPurchase: (amount: number, meta: VoucherMeta) => Promise<void>;

  // Affiliate / artist
  applyForAffiliate: (data: any) => Promise<void>;
  approveAffiliate: (userId: string, note?: string) => Promise<void>;
  rejectAffiliate: (userId: string, note?: string) => Promise<void>;
  sendAffiliateMessage: (userId: string, message: string) => Promise<void>;
  buyAffiliateContent: () => Promise<void>;
  joinAffiliateElite: () => Promise<void>;
  simulateAffiliateSale: (code: string, amount: number) => Promise<{ success: boolean; message: string }>;
  updateAffiliateTier: (userId: string, newRate: number) => Promise<void>;
  assignAffiliateParent: (childId: string, parentId: string) => Promise<void>;

  applyForArtist: (data: any) => Promise<void>;

  // Products / categories / orders
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (order: Order) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  replaceCategories: (newCategories: Category[]) => Promise<void>;

  // Vouchers & helpers
  addVoucher: (voucher: Voucher) => void;
  deleteVoucher: (code: string) => void;
  applyExternalVoucher: (code: string) => boolean;
  setAppliedVoucher: (voucher: Voucher | null) => void;
  shareProduct: (productId: string) => Promise<void>;
  claimSocialReward: (platform: 'tiktok'|'twitter'|'whatsapp'|'facebook'|'pinterest', handle?: string) => Promise<void>;
  updateUserAddress: (address: ShippingAddress) => Promise<void>;
  
  // Voucher Actions
  

  // Helpers
  getCartTotal: () => number;

  // Account convenience: update user profile fields
  updateUser: (fields: Partial<User>) => Promise<void>;
  // Dev helper: sign in using local dev admin stored in localStorage
  signInWithLocalDevAdmin: () => Promise<{ ok: boolean; message?: string }>;

  // Admin Winner Override
  manualWinner: Winner | null;
  setManualWinner: (winner: Winner | null) => void;
  auth: any;

  // Debug / Data Source
  dataSource?: 'supabase' | 'local' | 'demo';

  // Account Management
  closeAccount: (reason: string) => Promise<void>;
  // Convenience alias: legacy name used in some components
  currentUser?: User;
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
        key === 'proactiveRefresh' ||
        key === 'providerData'
      ) continue;

      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const val = sanitizeFirestoreData((data as any)[key], seen);
        if (val !== undefined && val !== null) sanitized[key] = val;
      }
    }
  return sanitized;
};

// Normalize DB user rows to the app User shape (map snake_case, ensure booleans)
const normalizeUserRow = (row: any): User => {
  if (!row) return null as any;
  const u: any = { ...row };
  if (u.is_admin !== undefined) u.isAdmin = Boolean(u.is_admin);
  if (u.isAdmin === undefined) u.isAdmin = false;
  if (u.created_at && !u.createdAt) u.createdAt = typeof u.created_at === 'string' ? u.created_at : (u.created_at.toISOString ? u.created_at.toISOString() : String(u.created_at));
  return u as User;
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
  const [dataSource, setDataSource] = useState<'supabase'|'local'|'demo'>('local');
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
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
        return (t >>> 0) / 4294967296; // Return a number between 0 and 1
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

  // Helper: update arbitrary fields for a user in Supabase users table
  const updateUserFields = async (userId: string, fields: Partial<User>) => {
    if (isDemoMode) return;
    try {
      await supabase.from('users').update(sanitizeFirestoreData(fields)).eq('id', userId);
    } catch (err) {
      console.error('Failed to update user fields in Supabase:', err);
    }
  };

  const pushToIndividual = async (userId: string, title: string, body: string, url: string = '/#/notifications') => {
    if (isDemoMode || !isSupabaseConfigured) return;
    try {
      await callServerFunction('send-push', {
        title,
        body,
        targetGroup: 'individual',
        targetId: userId,
        url
      });
    } catch (err) {
      console.warn('pushToIndividual failed:', err);
    }
  };

  const appendNotificationToUser = async (userId: string, notification: Notification) => {
    if (isDemoMode) return;
    try {
      const { data: userRow } = await supabase.from('users').select('notifications').eq('id', userId).maybeSingle();
      const existing = (userRow && (userRow as any).notifications) || [];
      const notifications = [notification, ...existing];
      await supabase.from('users').update({ notifications }).eq('id', userId);
    } catch (err) {
      console.error('Failed to append notification to user:', err);
    }
  };

  // Convenience: update partial user fields and persist locally and remotely
  const updateUser = async (fields: Partial<User>) => {
    const updatedUser: User = { ...user, ...fields } as User;
    setUser(updatedUser);
    persistUser(updatedUser);
    if (!isDemoMode && user.id && user.id !== 'guest') {
      await updateUserFields(user.id, sanitizeFirestoreData(updatedUser));
    }
  };

  // Dev helper: sign in using the local dev admin stored in localStorage (if any)
  const signInWithLocalDevAdmin = async (): Promise<{ ok: boolean; message?: string }> => {
    try {
      if (typeof window === 'undefined') return { ok: false, message: 'Not in browser' };
      const raw = localStorage.getItem('spv_dev_admin');
      if (!raw) return { ok: false, message: 'No local dev admin found' };
      const profile = JSON.parse(raw);
      const userObj: User = { ...INITIAL_USER, ...profile, id: profile.id || 'admin_local', email: profile.email } as User;
      setUser(userObj);
      persistUser(userObj);
      console.log('signInWithLocalDevAdmin: signed in as local dev admin', userObj.email);
      return { ok: true, message: 'Signed in as local dev admin' };
    } catch (err: any) {
      console.warn('signInWithLocalDevAdmin failed:', err);
      return { ok: false, message: err?.message || String(err) };
    }
  };

  const clearAuthError = () => setAuthErrorMessage(null);

  // REAL-TIME USER SYNC
  useEffect(() => {
      if (isDemoMode || !user.id || user.id === 'guest' || !isSupabaseConfigured) return;

      let cancelled = false;

      // Initial fetch of up-to-date user row from Supabase (skip when supabase not configured)
      (async () => {
        try {
          const { data: u, error } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
          if (!cancelled && !error && u) {
            const merged = { ...user, ...u } as User;
            setUser(merged);
            persistUser(merged);
          }
        } catch (err) {
          console.warn('Failed to fetch user from Supabase:', err);
        }
      })();

      // Subscribe to realtime user updates via Supabase
      const chan = supabase
        .channel(`users:${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, (payload) => {
          const newRow = (payload as any).new;
          if (newRow) {
            const merged = { ...user, ...newRow } as User;
            setUser(merged);
            persistUser(merged);
          }
        })
        .subscribe();

      return () => {
        cancelled = true;
        try { chan.unsubscribe(); } catch (_) {}
      };
  }, [user.id, isDemoMode]);

  // Push token registration (best-effort)
  useEffect(() => {
    if (isDemoMode || !isSupabaseConfigured) return;
    if (!user?.id || user.id === 'guest') return;
    initializePushNotifications(user.id, user.name || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined));
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
    setAuthErrorMessage(null);

    try {
      // 1. Perform supabase.auth.signInWithPassword
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: pass });

      if (error) {
        console.warn('Supabase signInWithPassword failed:', error.message);
        setAuthErrorMessage(error.message || 'Sign-in failed.');
        return false;
      }

      if (!data?.user) {
        setAuthErrorMessage('Authentication failed - no user data returned.');
        return false;
      }

      const uid = data.user.id;

      // 2. IMMEDIATELY after auth, fetch the user's profile from the 'users' table using their ID
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();

      if (profileError) {
        console.warn('Failed to fetch user profile:', profileError);
        // Create a basic profile if it doesn't exist
        const basicUser: User = {
          ...INITIAL_USER,
          id: uid,
          email: normalizedEmail,
          name: data.user.user_metadata?.full_name || ''
        } as User;
        try {
          await supabase.from('users').upsert([sanitizeFirestoreData(basicUser)]);
        } catch (e) {
          console.warn('Failed to create basic user profile:', e);
        }
        // 3. Merge this profile data (using basic profile since fetch failed)
        let loggedInUser = normalizeUserRow(basicUser);
        // 4. HARDCODE A SAFETY CHECK: If email === 'spoilmevintagediy@gmail.com', force isAdmin = true
        if (normalizedEmail === 'spoilmevintagediy@gmail.com') {
          loggedInUser.isAdmin = true;
        }
        // 5. Remove any old code that tries to insert isAdmin (camelCase) into the database. Only use is_admin (snake_case)
        // (This is already handled by sanitizeFirestoreData which converts camelCase to snake_case)

        // Check if account is marked for deletion
        if (loggedInUser.isActive === false) {
          setAuthErrorMessage('Account is deactivated.');
          return false;
        }

        setUser(loggedInUser);
        persistUser(loggedInUser);
        sendUserDataToServiceWorker(loggedInUser);
        return true;
      }

      // 3. Merge this profile data (using fetched profile)
      let loggedInUser = normalizeUserRow({ ...(profile as any), id: uid });

      // 4. HARDCODE A SAFETY CHECK: If email === 'spoilmevintagediy@gmail.com', force isAdmin = true
      if (normalizedEmail === 'spoilmevintagediy@gmail.com') {
        loggedInUser.isAdmin = true;
      }

      // Check if account is marked for deletion
      if (loggedInUser.isActive === false) {
        setAuthErrorMessage('Account is deactivated.');
        return false;
      }

      setUser(loggedInUser);
      persistUser(loggedInUser);
      sendUserDataToServiceWorker(loggedInUser);
      return true;

    } catch (err: any) {
      console.warn('Login error:', err);
      setAuthErrorMessage(err?.message || String(err));
      return false;
    }
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
          // Attempt to create Supabase auth user and users row if credentials provided
          if ((userData as any).password && userData.email) {
              try {
                  const { data, error } = await supabase.auth.signUp({ email: userData.email!, password: (userData as any).password });
                  if (error) {
                      console.warn('Supabase signUp failed (falling back to local user):', error.message);
                  } else if (data?.user) {
                      newUser.id = data.user.id;
                      // Try to sign in immediately so session exists for subsequent DB actions
                      try {
                        const signInRes = await supabase.auth.signInWithPassword({ email: userData.email!, password: (userData as any).password });
                        if (signInRes.error) {
                          console.warn('Immediate signIn after signUp failed:', signInRes.error.message);
                        } else {
                          console.log('Signed in after registration, session ready');
                        }
                      } catch (siErr) {
                        console.warn('Error signing in after signUp:', siErr);
                      }
                  }
              } catch (err) {
                  console.warn('Supabase signup attempt failed (continuing with local user):', err);
              }
          }

          // Try to upsert into users table (best-effort)
          try {
            const { error: upsertErr } = await supabase.from('users').upsert([sanitizeFirestoreData(newUser)]);
            if (upsertErr) console.warn('Upsert to users table failed (continuing locally):', upsertErr);
          } catch (err) {
            console.warn('Upsert to users table threw (continuing locally):', err);
          }

          setUser(newUser);
          persistUser(newUser);
          return true;
      } catch (e) {
          console.error("Registration Failed (unexpected)", e);
          setUser(newUser);
          persistUser(newUser);
          return true;
      }
  };

  const logout = () => {
    setUser(INITIAL_USER);
    localStorage.removeItem('spv_active_user');
    try { supabase.auth.signOut(); } catch (e) { /* ignore */ }
  };

  const updateUserAddress = async (address: ShippingAddress) => {
      const updatedUser = { ...user, shippingAddress: address };
      setUser(updatedUser);
      persistUser(updatedUser);
      if (!isDemoMode && user.id !== 'guest') {
          try {
              await supabase.from('users').update({ shippingAddress: address }).eq('id', user.id);
          } catch (e) {
              console.error("Error saving address to DB", e);
          }
      }
  };

  const seedTestUsers = async () => {
      if (isDemoMode) {
          alert("Cannot seed users in Demo Mode.");
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
              try {
                const { error } = await supabase.from('users').upsert([sanitizeFirestoreData(u)]);
                if (error) throw error;
              } catch (err) {
                console.error('Failed to upsert test user into Supabase:', err);
              }
          }
          alert("Test Users Created!");
      } catch (error) {
          console.error("Error seeding users:", error);
      }
  };

  useEffect(() => {
    console.log('Loading products, isDemoMode:', isDemoMode, 'isSupabaseConfigured:', isSupabaseConfigured);
      console.log('Loading products, isDemoMode:', isDemoMode, 'isSupabaseConfigured:', isSupabaseConfigured);
    if (isDemoMode || !isSupabaseConfigured) {
      // If Supabase isn't configured, fall back to local storage/demo data so the app still works in dev without env vars
      setDataSource(isDemoMode ? 'demo' : 'local');
      if (!isSupabaseConfigured) setDbConnectionError('Supabase not configured; running with local/demo data. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Supabase.');
      const localProds = localStorage.getItem('spv_products');
      const parsedProds = localProds ? JSON.parse(localProds) : INITIAL_PRODUCTS;
      const publishedProds = (parsedProds as any[]).filter((p: any) => p.status === 'published');
      setProducts(publishedProds);
      const localCats = localStorage.getItem('spv_categories');
      setCategories(localCats ? JSON.parse(localCats) : INITIAL_CATEGORIES);
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
      const imageURLCache = new Map<string, string>();
      const normalizeImage = async (img: any): Promise<string | null> => {
          if (!img) return null;
          if (typeof img === 'string') {
              if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('blob:') || img.startsWith('/')) return img;
                    if (img.startsWith('gs://')) {
                      // Convert gs:// Firebase Storage references to a public Firebase download URL
                      try {
                        const gsMatch = img.match(/^gs:\/\/([^/]+)\/(.+)$/);
                        if (gsMatch) {
                          const bucket = gsMatch[1];
                          const path = gsMatch[2];
                          const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
                          imageURLCache.set(img, url);
                          return url;
                        }
                      } catch (err) {
                        console.error('Failed to convert gs:// URL to a public URL', img, err);
                        return null;
                      }
              }
                // If it's a path-like string (e.g., 'products/..jpg') try to resolve via Supabase Storage
                if (!img.startsWith('http')) {
                  try {
                    if (imageURLCache.has(img)) return imageURLCache.get(img)!;
                    const bucketsToTry = ['public', 'products', 'images', 'spoilme'];
                    for (const b of bucketsToTry) {
                      try {
                        const { data } = supabase.storage.from(b).getPublicUrl(img);
                        if (data && (data as any).publicUrl) {
                          imageURLCache.set(img, (data as any).publicUrl);
                          return (data as any).publicUrl;
                        }
                      } catch (_) { /* ignore and try next */ }
                    }
                  } catch (err) {
                    // Not a storage path - leave as-is
                  }
                }
              return img;
          } else if (typeof img === 'object') {
                if (img.fullPath || img.path) {
                  try {
                    const path = img.fullPath || img.path;
                    const key = path + '::path';
                    if (imageURLCache.has(key)) return imageURLCache.get(key)!;
                    const bucketsToTry = ['public', 'products', 'images', 'spoilme'];
                    for (const b of bucketsToTry) {
                      try {
                        const { data } = supabase.storage.from(b).getPublicUrl(path);
                        if (data && (data as any).publicUrl) {
                          imageURLCache.set(key, (data as any).publicUrl);
                          return (data as any).publicUrl;
                        }
                      } catch (_) { /* ignore */ }
                    }
                  } catch (err) {
                    console.error('Failed to convert storage object path to public URL', img, err);
                    return null;
                  }
                }
          }
          return null;
      };

      const parseMaybeJson = (value: any) => {
        if (typeof value !== 'string') return value;
        const s = value.trim();
        if (!s) return value;
        const looksJson = (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));
        if (!looksJson) return value;
        try {
          return JSON.parse(s);
        } catch {
          return value;
        }
      };

      const coalesce = <T,>(...values: T[]) => {
        for (const v of values) {
          // keep 0/false, but ignore null/undefined/empty string
          if (v !== null && v !== undefined && (typeof v !== 'string' || v.trim() !== '')) return v;
        }
        return undefined;
      };

      const normalizeProductRow = async (row: any): Promise<Product> => {
        // Normalize snake_case keys from Supabase to camelCase (best-effort)
        const normalized: any = {};
        Object.entries(row || {}).forEach(([k, v]) => {
          const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          normalized[camel] = v;
        });

        // Parse JSON-ish fields
        normalized.options = parseMaybeJson(normalized.options);
        const options = (normalized.options && typeof normalized.options === 'object' && !Array.isArray(normalized.options))
          ? normalized.options
          : {};

        // Fix common field mismatches / aliases
        normalized.id = coalesce(normalized.id, row?.id) as any;
        normalized.code = coalesce(normalized.code, normalized.sku, row?.sku, row?.code, options?.sku, options?.code) as any;

        // USD naming mismatch (app expects priceUSD etc.)
        const priceUSD = coalesce(normalized.priceUSD, normalized.priceUsd, row?.price_usd, row?.priceUSD, options?.priceUSD, options?.priceUsd);
        if (priceUSD !== undefined) normalized.priceUSD = typeof priceUSD === 'number' ? priceUSD : parseFloat(String(priceUSD)) || 0;

        const compareAtPriceUSD = coalesce(
          normalized.compareAtPriceUSD,
          normalized.compareAtPriceUsd,
          row?.compare_at_price_usd,
          row?.compareAtPriceUSD,
          options?.compareAtPriceUSD,
          options?.compareAtPriceUsd
        );
        if (compareAtPriceUSD !== undefined) normalized.compareAtPriceUSD = typeof compareAtPriceUSD === 'number' ? compareAtPriceUSD : parseFloat(String(compareAtPriceUSD)) || 0;

        const memberPriceUSD = coalesce(
          normalized.memberPriceUSD,
          normalized.memberPriceUsd,
          row?.member_price_usd,
          row?.memberPriceUSD,
          options?.memberPriceUSD,
          options?.memberPriceUsd
        );
        if (memberPriceUSD !== undefined) normalized.memberPriceUSD = typeof memberPriceUSD === 'number' ? memberPriceUSD : parseFloat(String(memberPriceUSD)) || 0;

        // Merge key display fields from options JSON if missing
        if (!normalized.type && options?.type) normalized.type = options.type;
        if ((!normalized.colors || (Array.isArray(normalized.colors) && normalized.colors.length === 0)) && options?.colors) normalized.colors = options.colors;
        if ((!normalized.tags || (Array.isArray(normalized.tags) && normalized.tags.length === 0)) && options?.tags) normalized.tags = options.tags;
        if (!normalized.material && options?.material) normalized.material = options.material;
        if (!normalized.description && options?.description) normalized.description = options.description;
        if (!normalized.name && options?.name) normalized.name = options.name;

        // createdAt / updatedAt
        if (!normalized.createdAt && row?.created_at) {
          try {
            normalized.createdAt = typeof row.created_at === 'string'
              ? row.created_at
              : row.created_at?.toISOString
                ? row.created_at.toISOString()
                : String(row.created_at);
          } catch {
            normalized.createdAt = String(row.created_at);
          }
        }
        if (!normalized.updatedAt && row?.updated_at) {
          try {
            normalized.updatedAt = typeof row.updated_at === 'string'
              ? row.updated_at
              : row.updated_at?.toISOString
                ? row.updated_at.toISOString()
                : String(row.updated_at);
          } catch {
            normalized.updatedAt = String(row.updated_at);
          }
        }

        // Ensure arrays exist (and parse if stored as JSON string)
        const imagesParsed = parseMaybeJson(normalized.images);
        normalized.images = Array.isArray(imagesParsed) ? imagesParsed : (imagesParsed ? [imagesParsed] : []);
        const tagsParsed = parseMaybeJson(normalized.tags);
        normalized.tags = Array.isArray(tagsParsed) ? tagsParsed : (tagsParsed ? [tagsParsed] : []);
        const colorsParsed = parseMaybeJson(normalized.colors);
        normalized.colors = Array.isArray(colorsParsed) ? colorsParsed : (colorsParsed ? [colorsParsed] : []);
        const seoParsed = parseMaybeJson(normalized.seoKeywords);
        normalized.seoKeywords = Array.isArray(seoParsed) ? seoParsed : (seoParsed ? [seoParsed] : []);

        const reviewsParsed = parseMaybeJson(normalized.reviews);
        normalized.reviews = Array.isArray(reviewsParsed) ? reviewsParsed : (reviewsParsed ? [reviewsParsed] : []);

        // Resolve any storage URLs (gs:// or storage paths)
        try {
          if (normalized.images && Array.isArray(normalized.images)) {
            const resolved = await Promise.all(normalized.images.map(async (img: any) => await normalizeImage(img)));
            normalized.images = resolved.filter(Boolean) as string[];
          }
        } catch (err) {
          console.error('Failed resolving product images for', normalized.id || row?.id, err);
        }

        return normalized as Product;
      };

      // Fetch products, categories, and orders from Supabase
      const fetchAll = async () => {
        try {
          const { data: prodData, error: prodErr } = await supabase.from('products').select('*').eq('status', 'published').order('created_at', { ascending: false });
          
          // --- DEBUGGING START ---
          console.log("🔥 SUPABASE ERROR:", prodErr);
          console.log("✅ SUPABASE DATA:", prodData);
          // --- DEBUGGING END ---
          
          if (!prodErr && prodData) {
            const productData = await Promise.all((prodData as any[]).map(async (row) => await normalizeProductRow(row)));
            console.log('Loaded products from Supabase:', productData.length);
            setDataSource('supabase');
            if (productData.length === 0) {
              try {
                const { data: anyProducts } = await supabase.from('products').select('*').limit(5);
                console.warn('No published products found — sample rows from products table:', anyProducts);
              } catch (err) {
                console.warn('Failed to fetch sample products for debug:', err);
              }
            }
            setProducts(productData);
          }
            else if (prodErr && String(prodErr?.message || prodErr?.code || '').toLowerCase().includes('permission')) {
            // fallback to server endpoint that uses the service role key
            try {
              const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
              const apiBase = isLocal ? `http://${window.location.hostname}:3001/api` : (process.env.REACT_APP_API_URL || '/api');
              const resp = await fetch(`${apiBase}/products?limit=100`);
                if (resp.ok) {
                  const j = await resp.json();
                  const fromServer = Array.isArray(j.products) ? j.products : [];
                  const productData = await Promise.all((fromServer as any[]).map(async (row) => await normalizeProductRow(row)));
                  console.log('Loaded products from server endpoint:', productData.length);
                  setDataSource('supabase');
                  setProducts(productData);
                }
              } catch (err2) {
                console.warn('Fallback to /api/products failed:', err2);
              }
            }

          const { data: catData, error: catErr } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
          if (!catErr && catData && catData.length > 0) {
            const mappedCats = await Promise.all((catData as any[]).map(async (row) => {
              const normalized: any = {};
              Object.entries(row).forEach(([k, v]) => {
                const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
                normalized[camel] = v;
              });
              // Resolve image if needed
              try {
                if (normalized.image) {
                  const resolved = await normalizeImage(normalized.image);
                  if (resolved) normalized.image = resolved;
                }
              } catch (err) {
                // ignore
              }
              return normalized as Category;
            }));
            setCategories(mappedCats);
          } else {
            // Fallback to initial categories if none found in Supabase
            setCategories(INITIAL_CATEGORIES);
          }

          // Orders: admins see all, customers see their orders
          if (user?.isAdmin) {
            const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
            if (ordersData) setOrders(ordersData as Order[]);
          } else if (user?.email) {
            const { data: ordersData } = await supabase.from('orders').select('*').eq('customer_email', user.email).order('created_at', { ascending: false });
            if (ordersData) setOrders(ordersData as Order[]);
          }

          clearTimeout(safetyTimeout);
          setIsLoading(false);
        } catch (err) {
          console.warn('Supabase fetch failed, falling back to Firestore where available:', err);
        }
      };

      // Only fetch if Supabase is configured to avoid proxy errors
      if (isSupabaseConfigured) {
        fetchAll();

        // Realtime subscriptions (best-effort). Subscribe to products, categories, orders changes.
        const prodChan = supabase.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchAll()).subscribe();
        const catChan = supabase.channel('public:categories').on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchAll()).subscribe();
        const ordersChan = supabase.channel('public:orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAll()).subscribe();

        return () => { clearTimeout(safetyTimeout); try { prodChan.unsubscribe(); } catch(_){} try { catChan.unsubscribe(); } catch(_){} try { ordersChan.unsubscribe(); } catch(_){} };
      } else {
        // When Supabase isn't configured we don't set up realtime channels
        return () => { clearTimeout(safetyTimeout); };
      }
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
          appliedAt: new Date().toISOString(),
          autoApproveAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          userEmail: user.email,
          userName: `${data.name} ${data.surname}`,
          gender: data.gender,
          reason: data.reason,
          socials: data.socials
      };

      if (!isDemoMode) {
          try {
              await supabase.from('affiliate_applications').insert([applicationData]);
          } catch (error) {
              console.error('Error submitting affiliate application to Supabase:', error);
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
      if (!isDemoMode && user.id !== 'guest') {
          await updateUserFields(user.id, sanitizeFirestoreData(updatedUser));
      }
  };

  const approveAffiliate = async (userId: string, note?: string) => {
      if (isDemoMode) return;
      const notification: Notification = {
          id: `aff_status_${Date.now()}`,
          type: 'affiliate_msg',
          title: 'Welcome to the Partnership Program!',
          message: `Welcome to Spoil Me Vintage Partnership Program! We are thrilled to have you on the team.${note ? ` Note from admin: ${note}` : ''}`,
          date: new Date().toISOString(),
          isRead: false
      };

      try {
        const { data: u } = await supabase.from('users').select('notifications').eq('id', userId).maybeSingle();
        const existing = (u && (u as any).notifications) || [];
        await supabase.from('users').update({ affiliateStats: { status: 'approved', commissionRate: 10, adminNote: note || '' }, notifications: [notification, ...existing] }).eq('id', userId);
        await pushToIndividual(userId, notification.title, notification.message, '/#/affiliate-program');
      } catch (err) {
        console.error('approveAffiliate failed:', err);
      }
  };

  const rejectAffiliate = async (userId: string, note?: string) => {
      if (isDemoMode) return;
      const notification: Notification = {
          id: `aff_status_${Date.now()}`,
          type: 'affiliate_msg',
          title: 'Partnership Application Update',
          message: `We regret to inform you that your application has been declined.${note ? ` Note: ${note}` : ''}`,
          date: new Date().toISOString(),
          isRead: false
      };
      try {
        const { data: u } = await supabase.from('users').select('notifications').eq('id', userId).maybeSingle();
        const existing = (u && (u as any).notifications) || [];
        await supabase.from('users').update({ affiliateStats: { status: 'rejected', adminNote: note || '' }, notifications: [notification, ...existing] }).eq('id', userId);
        await pushToIndividual(userId, notification.title, notification.message, '/#/notifications');
      } catch (err) {
        console.error('rejectAffiliate failed:', err);
      }
  };

  const sendAffiliateMessage = async (userId: string, message: string) => {
      if (isDemoMode) return;
      const notification: Notification = {
          id: `aff_msg_${Date.now()}`,
          type: 'affiliate_msg',
          title: 'Partnership Update',
          message: message,
          date: new Date().toISOString(),
          isRead: false
      };
      await appendNotificationToUser(userId, notification);
      await pushToIndividual(userId, notification.title, notification.message, '/#/notifications');
  };

  const updateAffiliateTier = async (userId: string, newRate: number) => {
      if (isDemoMode) return;
      await updateUserFields(userId, { affiliateStats: { ...(user.affiliateStats || {}), commissionRate: newRate } as any });
  };

  const assignAffiliateParent = async (childId: string, parentId: string) => {
      if (isDemoMode) return;
      await updateUserFields(childId, { affiliateStats: { ...(user.affiliateStats || {}), parentId } as any });
  };

  const buyAffiliateContent = async () => {
      const updatedUser: User = { ...user, affiliateStats: { ...(user.affiliateStats as AffiliateStats), hasContentAccess: true } };
      setUser(updatedUser);
      persistUser(updatedUser);
      if (!isDemoMode && user.id !== 'guest') {
          await updateUserFields(user.id, sanitizeFirestoreData(updatedUser));
      }
  };

  const joinAffiliateElite = async () => {
      const updatedUser: User = { ...user, affiliateStats: { ...(user.affiliateStats as AffiliateStats), isElite: true } };
      setUser(updatedUser);
      persistUser(updatedUser);
      if (!isDemoMode && user.id !== 'guest') {
          await updateUserFields(user.id, sanitizeFirestoreData(updatedUser));
      }
  };

  const simulateAffiliateSale = async (code: string, amount: number): Promise<{ success: boolean; message: string }> => {
      if (!isDemoMode && !supabase) return { success: false, message: "Database not ready" };
      let targetUser: User | null = null;

      if (isDemoMode) {
          if (user.affiliateCode === code) targetUser = user;
          else return { success: false, message: "In Demo Mode, only your own code works." };
      } else {
          const { data: found, error } = await supabase.from('users').select('*').eq('affiliateCode', code).limit(1).maybeSingle();
          if (found && !error) {
            targetUser = found as User;
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
      } else {
          const notif: Notification = { id: `sale_${Date.now()}`, type: 'system', title: 'New Partnership Sale!', message: `You earned R${commission.toFixed(2)} commission!`, date: new Date().toISOString(), isRead: false };
          try {
            await supabase.from('users').update({ affiliateStats: newStats, notifications: [notif, ...(targetUser.notifications || [])] }).eq('id', targetUser.id);
          } catch (err) {
            console.error('Failed to update affiliate user after sale:', err);
          }

          // Parent commission logic (if applicable) handled in processAffiliateCommissions or via the parent update routines.
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
      if (user.id === userId) {
           const updated = { ...user, loyaltyPoints: user.loyaltyPoints + points };
           setUser(updated);
           persistUser(updated);
           await supabase.from('users').update({ loyaltyPoints: updated.loyaltyPoints }).eq('id', userId);
      } else {
           try {
             const { data: target } = await supabase.from('users').select('loyaltyPoints').eq('id', userId).maybeSingle();
             const newPoints = ((target && (target as any).loyaltyPoints) || 0) + points;
             await supabase.from('users').update({ loyaltyPoints: newPoints }).eq('id', userId);
           } catch (err) {
             console.error('adminAdjustPoints failed:', err);
           }
      }
  };

  const getAllUsers = async (): Promise<User[]> => {
      if (isDemoMode) return [];
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return (data || []).map(d => sanitizeFirestoreData(d) as User);
      } catch (err) {
        console.error('getAllUsers failed:', err);
        return [];
      }
  };

  // Ensure the client has a fresh ID token with admin claims (if available).
  const ensureAdminToken = async () => {
    // Supabase uses session tokens managed by the client. No special admin token refresh required here.
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        console.log('ensureAdminToken: session active');
      }
    } catch (e) {
      console.warn('ensureAdminToken check failed:', e);
    }
  };

  // Sync any locally-saved products to Supabase when available.
  const syncLocalProducts = async () => {
    if (isDemoMode) return;
    try {
      const local = localStorage.getItem('spv_products');
      if (!local) return;
      const parsed = JSON.parse(local);
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      console.log('syncLocalProducts: found', parsed.length, 'local products to push');
      for (const p of parsed) {
        try {
          const safe = sanitizeFirestoreData(p);
          try {
            const { error } = await supabase.from('products').upsert([safe]);
            if (error) throw error;
            console.log('syncLocalProducts: pushed product to Supabase', safe.id);
          } catch (err) {
            console.warn('syncLocalProducts: Supabase push failed, saving back to local storage instead:', err);
            try {
              const existing = JSON.parse(localStorage.getItem('spv_products') || '[]');
              localStorage.setItem('spv_products', JSON.stringify([safe, ...existing]));
            } catch (_) {}
          }
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

      if (!isDemoMode && isSupabaseConfigured) {
        // --- Simplified, guaranteed-write flow ---
        try {

          // >>> DEBUG LOG <<<
          console.log("DEBUG: Final Product Data to Firestore (Add):", JSON.stringify(safeProduct, null, 2));

          try {
            const { error } = await supabase.from('products').upsert([safeProduct]);
            if (error) throw error;
            setDbConnectionError(null);
          } catch (err) {
            console.warn('Supabase addProduct failed, saving to local storage instead:', err);
            try {
              const existing = JSON.parse(localStorage.getItem('spv_products') || '[]');
              localStorage.setItem('spv_products', JSON.stringify([safeProduct, ...existing]));
            } catch (_) {}
          }
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

    if (!isDemoMode && isSupabaseConfigured) {
       try {

         // >>> DEBUG LOG <<<
         console.log("DEBUG: Final Product Data to Firestore (Update):", JSON.stringify(safeProduct, null, 2));

         try {
           const { error } = await supabase.from('products').update(safeProduct).eq('id', safeProduct.id);
           if (error) throw error;
           setDbConnectionError(null);
         } catch (err) {
           console.warn('Supabase updateProduct failed, saving to local storage instead:', err);
           try {
             const existing = JSON.parse(localStorage.getItem('spv_products') || '[]');
             const updated = existing.map((p: any) => p.id === safeProduct.id ? safeProduct : p);
             localStorage.setItem('spv_products', JSON.stringify(updated));
           } catch (_) {}
         }
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

    if (!isDemoMode && isSupabaseConfigured) {
      try {

        console.log("DEBUG: Final Product Delete to Supabase/Firestore:", productId);
        try {
          const { error } = await supabase.from('products').delete().eq('id', productId);
          if (error) throw error;
        } catch (err) {
          console.warn('Supabase deleteProduct failed, removing from local storage instead:', err);
          try {
            const existing = JSON.parse(localStorage.getItem('spv_products') || '[]');
            localStorage.setItem('spv_products', JSON.stringify(existing.filter((p: any) => p.id !== productId)));
          } catch (_) {}
        }
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
    if (!isDemoMode && isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('orders').upsert([safeOrder]);
          if (error) throw error;
        } catch (err) {
          console.error('Failed to addOrder to Supabase, saving to local storage instead:', err);
          try { const existing = JSON.parse(localStorage.getItem('spv_orders') || '[]'); localStorage.setItem('spv_orders', JSON.stringify([safeOrder, ...existing])); } catch(_) {}
        }
    }
  };

  const updateOrder = async (order: Order) => {
    const safeOrder = sanitizeFirestoreData(order);
    setOrders(prev => prev.map(o => o.id === safeOrder.id ? safeOrder : o));
    if (!isDemoMode && isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('orders').update(safeOrder).eq('id', safeOrder.id);
          if (error) throw error;
        } catch (err) {
          console.error('Failed to updateOrder in Supabase, saving to local storage instead:', err);
          try {
            const existing = JSON.parse(localStorage.getItem('spv_orders') || '[]'); 
            const updated = existing.map((o: any) => o.id === safeOrder.id ? safeOrder : o);
            localStorage.setItem('spv_orders', JSON.stringify(updated));
          } catch (_) {}
        }
    }
  };

  const deleteOrder = async (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (!isDemoMode && isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('orders').delete().eq('id', orderId);
          if (error) throw error;
        } catch (err) {
          console.error('Failed to deleteOrder in Supabase, removing from local storage instead:', err);
          try { const existing = JSON.parse(localStorage.getItem('spv_orders') || '[]'); localStorage.setItem('spv_orders', JSON.stringify(existing.filter((o:any) => o.id !== orderId))); } catch(_) {}
        }
    }
  };

  const addCategory = async (category: Category) => {
    const safeCat = sanitizeFirestoreData(category);
    setCategories(prev => [...prev, safeCat]);
    if (!isDemoMode && isSupabaseConfigured) {
        try {
          // upsert into Supabase categories table
          const { error } = await supabase.from('categories').upsert([safeCat]);
          if (error) throw error;
        } catch (err) {
          console.error('Supabase addCategory error, saving to local storage instead:', err);
          try { const existing = JSON.parse(localStorage.getItem('spv_categories') || '[]'); localStorage.setItem('spv_categories', JSON.stringify([safeCat, ...existing])); } catch(_) {}
        }
    } else {
        localStorage.setItem('spv_categories', JSON.stringify([...categories, safeCat]));
    }
  };

  const updateCategory = async (category: Category) => {
    const safeCat = sanitizeFirestoreData(category);
    setCategories(prev => prev.map(c => c.id === safeCat.id ? safeCat : c));
    if (!isDemoMode && isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('categories').update(safeCat).eq('id', safeCat.id);
          if (error) throw error;
        } catch (err) {
          console.error('Supabase updateCategory error, saving to local storage instead:', err);
          try { const existing = JSON.parse(localStorage.getItem('spv_categories') || '[]'); const updated = existing.map((c:any) => c.id === safeCat.id ? safeCat : c); localStorage.setItem('spv_categories', JSON.stringify(updated)); } catch(_) {}
        }
    } else {
        const updated = categories.map(c => c.id === safeCat.id ? safeCat : c);
        localStorage.setItem('spv_categories', JSON.stringify(updated));
    }
  };

  const deleteCategory = async (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    if (!isDemoMode && isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('categories').delete().eq('id', categoryId);
          if (error) throw error;
        } catch (err) {
          console.error('Supabase deleteCategory error, removing from local storage instead:', err);
          try { const existing = JSON.parse(localStorage.getItem('spv_categories') || '[]'); localStorage.setItem('spv_categories', JSON.stringify(existing.filter((c:any) => c.id !== categoryId))); } catch(_) {}
        }
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

    if (!isDemoMode && user.id !== 'guest') {
        await updateUserFields(user.id, sanitizeFirestoreData(updatedUser));
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
       if (!isDemoMode && user.id !== 'guest') {
           await updateUserFields(user.id, sanitizeFirestoreData(updatedUser));
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
      if(!isDemoMode && user.id !== 'guest') await updateUserFields(user.id, sanitizeFirestoreData(updatedUser));
  };

  const shareProduct = async (productId: string) => {
      const updatedUser = { ...user, loyaltyPoints: user.loyaltyPoints + 50 };
      setUser(updatedUser);
      persistUser(updatedUser);
      if (!isDemoMode && user.id !== 'guest') await updateUserFields(user.id, { loyaltyPoints: updatedUser.loyaltyPoints });
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
      if(!isDemoMode && user.id !== 'guest') await updateUserFields(user.id, sanitizeFirestoreData(updatedUser));
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
    if (isDemoMode) {
      // In demo mode, just update local user if it matches
      if (user.affiliateCode === affiliateCode) {
        const stats = user.affiliateStats || { status: 'none', totalSalesCount: 0, totalSalesValue: 0, commissionRate: 10, balance: 0, recurringBalance: 0, weeklyMilestones: { membershipsSold:0, salesValue:0, vaultItemsSold:0, weekStart: '' } } as AffiliateStats;
        const total = cart.reduce((s, i) => s + ((currency === 'ZAR' ? i.price : i.priceUSD) * i.quantity), 0);
        const newStats = { ...stats, totalSalesCount: stats.totalSalesCount + cart.length, totalSalesValue: stats.totalSalesValue + total, balance: stats.balance + (total * (stats.commissionRate/100)) };
        setUser({ ...user, affiliateStats: newStats });
        persistUser({ ...user, affiliateStats: newStats });
      }
      return;
    }

    try {
      const { data: affiliateUser } = await supabase.from('users').select('*').eq('affiliateCode', affiliateCode).limit(1).maybeSingle();
      if (!affiliateUser || affiliateUser.affiliateStats?.status !== 'approved') return;

      const stats = affiliateUser.affiliateStats as AffiliateStats;
      const standardItems = cart.filter(item => !item.vaultItem);
      const vaultItems = cart.filter(item => item.vaultItem);

      let totalStandardCommission = 0;
      let totalVaultCommission = 0;
      let vaultItemsSold = 0;
      const commissionRecords: CommissionRecord[] = [];

      for (const item of standardItems) {
        const basePrice = currency === 'ZAR' ? item.price : item.priceUSD;
        const commissionRate = stats.commissionRate / 100;
        const commissionAmount = basePrice * item.quantity * commissionRate;
        totalStandardCommission += commissionAmount;
        commissionRecords.push({ id: `comm_${Date.now()}_${item.id}`, affiliateId: affiliateUser.id, orderId, itemId: item.id, itemName: item.name, itemType: 'standard', basePrice, commissionRate: stats.commissionRate, commissionAmount, currency, date: new Date().toISOString() });
      }

      for (const item of vaultItems) {
        const basePrice = currency === 'ZAR' ? item.price : item.priceUSD;
        const commissionAmount = basePrice * item.quantity * 0.01;
        totalVaultCommission += commissionAmount;
        vaultItemsSold += item.quantity;
        commissionRecords.push({ id: `comm_${Date.now()}_${item.id}`, affiliateId: affiliateUser.id, orderId, itemId: item.id, itemName: item.name, itemType: 'vault', basePrice, commissionRate: 1, commissionAmount, currency, date: new Date().toISOString() });
      }

      const totalCommission = totalStandardCommission + totalVaultCommission;

      const newStats: AffiliateStats = {
        ...stats,
        totalSalesCount: stats.totalSalesCount + cart.length,
        totalSalesValue: stats.totalSalesValue + cart.reduce((sum, item) => sum + ((currency === 'ZAR' ? item.price : item.priceUSD) * item.quantity), 0),
        balance: (stats.balance || 0) + totalCommission,
        vaultPurchasesThisMonth: (stats.vaultPurchasesThisMonth || 0) + vaultItemsSold,
        weeklyMilestones: {
          ...stats.weeklyMilestones,
          salesValue: (stats.weeklyMilestones?.salesValue || 0) + cart.reduce((sum, item) => sum + ((currency === 'ZAR' ? item.price : item.priceUSD) * item.quantity), 0),
          vaultItemsSold: (stats.weeklyMilestones?.vaultItemsSold || 0) + vaultItemsSold
        }
      };

      // Adjust tier
      if (newStats.totalSalesValue >= 50000) newStats.commissionRate = 20;
      else if (newStats.totalSalesValue >= 15000) newStats.commissionRate = 15;
      else if (newStats.totalSalesValue >= 5000) newStats.commissionRate = 11;

      // Update affiliate user with new stats and a notification
      const notif: Notification = { id: `commission_${Date.now()}`, type: 'system', title: 'New Commission Earned!', message: `You earned ${currency === 'ZAR' ? 'R' : '$'}${totalCommission.toFixed(2)} from this sale!`, date: new Date().toISOString(), isRead: false };
      await supabase.from('users').update({ affiliateStats: newStats, notifications: [notif, ...(affiliateUser.notifications || [])] }).eq('id', affiliateUser.id);

      // Parent commission
      if (stats.parentId) {
        try {
          const { data: parent } = await supabase.from('users').select('*').eq('id', stats.parentId).maybeSingle();
          if (parent && parent.affiliateStats?.status === 'approved') {
            const parentStats = parent.affiliateStats as AffiliateStats;
            const parentCommission = totalCommission * 0.01;
            const updatedParentStats = { ...parentStats, balance: (parentStats.balance || 0) + parentCommission };
            const parentNotif: Notification = { id: `team_bonus_${Date.now()}`, type: 'system', title: 'Team Leader Bonus', message: `You earned ${currency === 'ZAR' ? 'R' : '$'}${parentCommission.toFixed(2)} from a recruit's sale!`, date: new Date().toISOString(), isRead: false };
            await supabase.from('users').update({ affiliateStats: updatedParentStats, notifications: [parentNotif, ...(parent.notifications || [])] }).eq('id', parent.id);
          }
        } catch (err) {
          console.error('Failed to process parent commission', err);
        }
      }

      // Persist commission records to DB
      try {
        if (commissionRecords.length > 0) await supabase.from('commission_records').insert(commissionRecords);
      } catch (err) {
        console.error('Failed to persist commission_records to Supabase:', err);
        const existingRecords = JSON.parse(localStorage.getItem('commission_records') || '[]');
        localStorage.setItem('commission_records', JSON.stringify([...existingRecords, ...commissionRecords]));
      }

      // Store milestones locally if needed
      try {
        const milestones: AffiliateMilestone[] = [];
        const weekStartISO = new Date().toISOString().split('T')[0];
        if (newStats.weeklyMilestones.membershipsSold >= 5) {
          const existing = localStorage.getItem(`milestone_${affiliateUser.id}_sprinter_${weekStartISO}`);
          if (!existing) {
            const bonus = currency === 'ZAR' ? 50 : 5;
            newStats.balance += bonus;
            milestones.push({ id: `milestone_${Date.now()}`, affiliateId: affiliateUser.id, type: 'sprinter', achievedAt: new Date().toISOString(), bonusAmount: bonus, currency, weekStart: weekStartISO });
            localStorage.setItem(`milestone_${affiliateUser.id}_sprinter_${weekStartISO}`, 'true');
          }
        }
        if (milestones.length > 0) {
          const existingMilestones = JSON.parse(localStorage.getItem('affiliate_milestones') || '[]');
          localStorage.setItem('affiliate_milestones', JSON.stringify([...existingMilestones, ...milestones]));
        }
      } catch (err) {
        console.warn('Failed processing affiliate milestones locally', err);
      }

    } catch (error) {
      console.error('Failed to process affiliate commissions', error);
    }
  };

  const closeAccount = async (reason: string) => {
      if (isDemoMode || user.id === 'guest') return;

      try {
        const adminNotification: Notification = {
            id: `acct_close_admin_${Date.now()}`,
            type: 'system',
            title: 'Account Closure Request',
            message: `${user.name} (${user.email}) has requested account closure. Reason: ${reason}`,
            date: new Date().toISOString(),
            isRead: false
        };

        // Update user to mark closure requested
        await supabase.from('users').update({ isActive: false, closureReason: reason, closureRequestedAt: new Date().toISOString(), scheduledDeletionAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }).eq('id', user.id);

        // Notify admin
        const { data: admin } = await supabase.from('users').select('notifications').eq('email', 'spoilmevintagediy@gmail.com').limit(1).maybeSingle();
        if (admin) {
          const existing = (admin as any).notifications || [];
          await supabase.from('users').update({ notifications: [adminNotification, ...existing] }).eq('email', 'spoilmevintagediy@gmail.com');
        }

        // Notify user
        const userNotification: Notification = { id: `acct_close_user_${Date.now()}`, type: 'system', title: 'Account Closure Requested', message: 'Your account closure has been requested. Your account and all data will be permanently deleted within 24 hours.', date: new Date().toISOString(), isRead: false };
        await appendNotificationToUser(user.id, userNotification);
        await pushToIndividual(user.id, userNotification.title, userNotification.message, '/#/profile');
      } catch (error) {
        console.error('Error closing account:', error);
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
          if (!isDemoMode) {
            console.error("Cannot apply for artist as guest user.");
            return;
          }
          // allow demo-mode submissions without a real user id
      }

      // Resolve effective user id (prefer Supabase auth uid over local demo 'user_' ids)
      let effectiveUserId: string | null = user && user.id ? String(user.id) : null;
      if (effectiveUserId && /^user_/.test(effectiveUserId) && typeof supabase !== 'undefined' && supabase) {
        try {
          const sessionRes = await supabase.auth.getUser();
          const realId = (sessionRes as any)?.data?.user?.id;
          if (realId) effectiveUserId = realId;
        } catch (e) {
          console.warn('applyForArtist: could not resolve real auth user id, proceeding with existing id', e);
        }
      }

      // Prevent duplicate/pending applications (use canonical column 'user_id')
      try {
        const { data: existing, error: existingErr } = await supabase.from('artist_applications').select('id,status').eq('user_id', effectiveUserId).in('status', ['pending','approved']);
        if (existingErr) {
          console.warn('applyForArtist duplicate check could not complete (Supabase error), continuing:', existingErr);
        } else if (existing && existing.length > 0) {
          throw new Error('You already have an active application.');
        }
      } catch (err) {
        console.warn('applyForArtist duplicate check encountered an unexpected error, continuing as best-effort:', err);
      }

      // Create artist application document
        const applicationData = {
          uid: effectiveUserId || user.id,
          user_id: effectiveUserId || user.id,
          name: data.name,
          surname: data.surname,
          artistTradeName: data.artistTradeName,
          contactNumber: data.contactNumber,
          email: data.email,
          productImages: data.productImages,
          product_images: JSON.stringify(data.productImages || []),
          plan: (data as any).plan || null,
          termsAgreed: !!(data as any).termsAgreed,
          terms_agreed: !!(data as any).termsAgreed,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
      };

          if (!isDemoMode) {
            try {
              const res = await supabase.from('artist_applications').insert([applicationData]).select().maybeSingle();
                // Log full response to help diagnose 400/422 errors coming from Postgres / Supabase
                console.log('artist_applications.insert response', res);
                const inserted = (res as any)?.data || (res as any);
                if ((res as any)?.error) {
                  console.error('Insert into artist_applications returned error object:', (res as any));
                  throw (res as any).error || (res as any);
                }
              // Update user's local state to block re-apply and show In Review
              const updatedUser: User = { ...user, artistApplicationStatus: 'pending', artistApplicationId: inserted?.id || null } as User;
              setUser(updatedUser);
              persistUser(updatedUser);
              await updateUserFields(user.id, { artistApplicationStatus: 'pending', artistApplicationId: inserted?.id || null } as any);

              // Send a professional acknowledgement notification to the user
              const notification: Notification = {
                id: `artist_app_sub_${Date.now()}`,
                type: 'system',
                title: 'Artist Application Received',
                message: 'Thank you for applying to the Spoil Me Vintage Artist Program. We will review your application and respond within 72 hours. If approved, you will receive instructions on next steps.',
                date: new Date().toISOString(),
                isRead: false
              };
              await appendNotificationToUser(user.id, notification);
              await pushToIndividual(user.id, notification.title, notification.message);
            } catch (error) {
              console.error('Error submitting artist application:', error);
              throw error;
            }
          } else {
            // Demo mode: persist the application locally so it can be reviewed in the admin view
              // Try to insert into Supabase even in demo mode (best-effort). If it fails, fall back to local persistence.
              try {
                const res = await supabase.from('artist_applications').insert([applicationData]).select().maybeSingle();
                if ((res as any)?.error) throw (res as any).error;
                const inserted = (res as any)?.data || (res as any);
                // update user's local state to block re-apply and show In Review
                const updatedUser: User = { ...user, artistApplicationStatus: 'pending', artistApplicationId: inserted?.id || null } as User;
                setUser(updatedUser);
                persistUser(updatedUser);
                try { await updateUserFields(user.id, { artistApplicationStatus: 'pending', artistApplicationId: inserted?.id || null } as any); } catch (_) {}

                const notification: Notification = {
                  id: `artist_app_sub_${Date.now()}`,
                  type: 'system',
                  title: 'Artist Application Received',
                  message: 'Thank you for applying to the Spoil Me Vintage Artist Program. We will review your application and respond within 72 hours.',
                  date: new Date().toISOString(),
                  isRead: false
                };
                try { await appendNotificationToUser(user.id, notification); await pushToIndividual(user.id, notification.title, notification.message); } catch (_) { }
              } catch (err) {
                console.warn('Supabase insert failed in demo mode; falling back to local persistence', err);
                try {
                  const localAppsRaw = localStorage.getItem('spv_artist_applications');
                  const localApps = localAppsRaw ? JSON.parse(localAppsRaw) : [];
                  const id = `demo_${Date.now()}`;
                  const demoApp = { ...applicationData, id, uid: user?.id || 'demo_user' };
                  localApps.unshift(demoApp);
                  localStorage.setItem('spv_artist_applications', JSON.stringify(localApps));
                  // update local user state if present
                  const updatedUser: User = { ...user, artistApplicationStatus: 'pending', artistApplicationId: id } as User;
                  setUser(updatedUser);
                  persistUser(updatedUser);
                  const notification: Notification = {
                    id: `artist_app_sub_${Date.now()}`,
                    type: 'system',
                    title: 'Artist Application Received',
                    message: 'Thank you for applying to the Spoil Me Vintage Artist Program (demo). We will review your application and respond within 72 hours.',
                    date: new Date().toISOString(),
                    isRead: false
                  };
                  await appendNotificationToUser(user?.id || 'demo_user', notification);
                } catch (err2) {
                  console.error('Failed to persist demo application locally', err2);
                  throw err2;
                }
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
      if (!isDemoMode && user.id !== 'guest') {
          await updateUserFields(user.id, sanitizeFirestoreData(updatedUser));
      }
  };

  return (
    <StoreContext.Provider value={{
      products, categories, cart, user, currentUser: user, specials, vouchers, appliedVoucher, affiliateLeaderboard, memberCount, weeklyWinners, isDemoMode, isLoading, dbConnectionError, db: supabase, orders,
      isStickyProgressBarVisible, setIsStickyProgressBarVisible,
      currency, setCurrency, toggleCurrency,
      packagingPresets, materialPresets, savePackagingPreset, deletePackagingPreset, saveMaterialPreset, deleteMaterialPreset,
      login, logout, register, addToCart, removeFromCart, updateCartQuantity, clearCart, toggleWishlist, checkout, submitReview, addSystemNotification, processGiftVoucherPurchase,
      applyForAffiliate, approveAffiliate, rejectAffiliate, sendAffiliateMessage, buyAffiliateContent, joinAffiliateElite, simulateAffiliateSale, updateAffiliateTier, assignAffiliateParent,
      applyForArtist,
      addProduct, updateProduct, deleteProduct, addOrder, updateOrder, deleteOrder, addCategory, updateCategory, deleteCategory, replaceCategories,
      addSpecial, resetStore, seedTestUsers, getAllUsers, runDataDiagnostics, adminAdjustPoints,
      getCartTotal, addVoucher, deleteVoucher, applyExternalVoucher, setAppliedVoucher, shareProduct, claimSocialReward, updateUserAddress,
      updateUser,

      // Admin Winner Override
      manualWinner, setManualWinner, auth: supabase.auth,
      authErrorMessage, clearAuthError, signInWithLocalDevAdmin, isSupabaseConfigured: isSupabaseConfigured,
      dataSource,

      // Account Management
      closeAccount,
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