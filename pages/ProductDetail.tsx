import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Heart, Truck, ShieldCheck, Share2, Star, Check, ChevronDown, User as UserIcon, Gift, Clock, HelpCircle, Info, BadgeCheck, Ruler, ArrowLeft, ArrowRight, Crown, Sparkles, AlertCircle, Facebook, MessageCircle } from 'lucide-react';
import { useResolvedImage, ResolvedImage, handleImageError, getFallbackImage } from '@/utils/imageUtils';
import { EarringMaterial, Review } from '../types';
import ProductCard from '../components/ProductCard';
import { getAnalytics, logEvent } from "firebase/analytics";
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Chain descriptions mapping (Must match Admin)
const CHAIN_DESCRIPTIONS: Record<string, string> = {
  "Choker – 35 cm": "Fits snugly around the base of the neck, sitting just above the collarbone.",
  "Collar – 40 cm": "Lies on the collarbone for a clean line that complements almost any neckline.",
  "Princess – 45 cm": "Falls just below the collarbone, perfectly framing a pendant.",
  "Matinee – 50 cm": "Drops a few centimetres beneath the collarbone for a subtle, elongating effect.",
  "Matinee Long – 60 cm": "Reaches the upper bust, offering a graceful drape over sweaters or dresses."
};

// Simple lookup for Ring Circumference (MM) to US Size
const RING_SIZE_CHART = [
  { size: 5, mm: 49.3 },
  { size: 6, mm: 51.9 },
  { size: 7, mm: 54.4 },
  { size: 8, mm: 57.0 },
  { size: 9, mm: 59.5 },
  { size: 10, mm: 62.1 },
  { size: 11, mm: 64.6 },
  { size: 12, mm: 67.2 },
  { size: 13, mm: 69.7 }
];

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products, addToCart, toggleWishlist, user, shareProduct, cart, currency } = useStore();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [showRRPInfo, setShowRRPInfo] = useState(false);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  
  // Share State
  const [hasShared, setHasShared] = useState(false);

  // Ring Size Wizard State
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [measureMM, setMeasureMM] = useState('');
  const [measuredFinger, setMeasuredFinger] = useState('Ring Finger');
  const [calculatedSize, setCalculatedSize] = useState<number | null>(null);

  // Selections
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<EarringMaterial | null>(null);
  const [selectedChainStyle, setSelectedChainStyle] = useState('');
  const [selectedChainLength, setSelectedChainLength] = useState('');

  // Reviews state
  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [limitCount, setLimitCount] = useState(5);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);

  const product = products.find(p => p.id === id);
  
  // Get related products in same category (excluding current product)
  const relatedProducts = product 
    ? products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  // Ensure view starts at top when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setHasShared(false); // Reset share status on product change
  }, [id]);

  // Analytics logging instead of view count
  useEffect(() => {
    if (product) {
      // Calculate Price in selected Currency
      const displayPrice = getPrice(currentPrice);

      // Log Event to Firebase Analytics (Free) instead of Firestore (Paid)
      const analytics = getAnalytics();
      logEvent(analytics, 'view_item', {
        currency: currency,
        value: displayPrice,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: displayPrice
        }]
      });
    }
  }, [product, currency]);

  // Fetch reviews from Firestore
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product) return;

      try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(
          reviewsRef,
          where('productId', '==', product.id),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setRealReviews(fetchedReviews);
        setHasMoreReviews(fetchedReviews.length === limitCount);
      } catch (error: any) {
        console.error("Review fetch error:", error);
        if (error.code === 'failed-precondition') {
          console.warn("⚠️ INDEX MISSING: Click the link in console to build index.");
        }
      }
    };

    fetchReviews();
  }, [product, limitCount]);

  // Merge legacy and real reviews
  const legacyReviews = (product?.reviews && Array.isArray(product.reviews)) ? product.reviews : [];
  const allReviewsToDisplay = [...legacyReviews, ...realReviews];

  // Initialize defaults
  useEffect(() => {
    if (!product) return;

    // Ring Size Default
    if (product.type === 'Ring' && product.ringStock) {
      const availableSizes = Object.entries(product.ringStock)
        .filter(([_, qty]) => (qty as number) > 0)
        .map(([size]) => size);
      if (availableSizes.length > 0) setSelectedSize(availableSizes[0]);
    }

    // Earring Material Default
    if ((product.type === 'Stud' || product.type === 'Dangle') && product.showEarringOptions && product.earringMaterials && product.earringMaterials.length > 0) {
      setSelectedMaterial(product.earringMaterials[0]);
    }

    // Pendant Default
    if (product.type === 'Pendant' && product.chainStyles && product.chainStyles.length > 0) {
      if (product.chainStyles.includes('Metal Chain')) {
        setSelectedChainStyle('Metal Chain');
      } else {
        setSelectedChainStyle(product.chainStyles[0]);
      }
    }
  }, [product]);

  // Set chain length default
  useEffect(() => {
    if (selectedChainStyle === 'Leather Cord') {
      setSelectedChainLength('45cm');
    } else if (selectedChainStyle === 'Metal Chain' && product?.pendantChainLengths) {
      const firstAvailable = Object.keys(product.pendantChainLengths).find(k => product.pendantChainLengths![k]);
      if (firstAvailable) setSelectedChainLength(firstAvailable);
    }
  }, [selectedChainStyle, product]);

  const quantityInCart = useMemo(() => {
    return cart.find(item => 
        item.id === product?.id &&
        item.selectedSize === selectedSize &&
        item.selectedMaterial === selectedMaterial?.name &&
        item.selectedChainStyle === selectedChainStyle &&
        item.selectedChainLength === selectedChainLength
    )?.quantity || 0;
  }, [cart, product?.id, selectedSize, selectedMaterial, selectedChainStyle, selectedChainLength]);

  const { availableStock, isOutOfStock, isStockLimitInCart, buttonText } = useMemo(() => {
    if (!product) return { availableStock: 0, isOutOfStock: true, isStockLimitInCart: true, buttonText: 'Product not found' };

    let stock = product.stock;
    let outOfStock = stock <= 0;
    let message = 'Add to Cart';

    if (product.type === 'Ring') {
        if (!selectedSize) {
            outOfStock = true;
            message = 'Select a Size';
        } else {
            stock = product.ringStock?.[selectedSize] || 0;
            if (stock <= 0) {
                outOfStock = true;
                message = 'Out of Stock';
            }
        }
    }
    
    if (product.isSoldOut) {
        outOfStock = true;
    }

    const limitReached = stock > 0 && quantityInCart >= stock;
    if (!outOfStock && limitReached) {
        message = 'Stock limit in cart';
    }

    return {
        availableStock: stock,
        isOutOfStock: outOfStock,
        isStockLimitInCart: limitReached,
        buttonText: message,
    };
  }, [product, selectedSize, quantityInCart]);

  if (!product) {
    return <div className="text-center py-20 text-gray-400">Product not found</div>;
  }

  const isLiked = user.wishlist.includes(product.id);
  
  // Determine Price Logic
  const now = new Date();
  const promoStart = product.promoStartsAt ? new Date(product.promoStartsAt) : null;
  const promoExpiry = product.promoExpiresAt ? new Date(product.promoExpiresAt) : null;
  
  const isStartValid = promoStart && !isNaN(promoStart.getTime());
  const isEndValid = promoExpiry && !isNaN(promoExpiry.getTime());

  const isPromoActive = (product.promoPrice || 0) > 0 
    && (!isStartValid || promoStart! <= now) 
    && (!isEndValid || promoExpiry! > now);
  
  // Fixed Member Price: Use stored member prices with fallback to calculation
  const basePrice = currency === 'ZAR' ? product.price : (product.priceUSD || product.price);
  const standardMemberPrice = currency === 'ZAR' ? (product.memberPrice || basePrice * 0.8) : (product.memberPriceUSD || basePrice * 0.8);

  // Effective Base Price Logic
  let currentBasePrice = basePrice;
  let appliedTier = 'none';

  // STRICT MEMBER CHECK: Only apply membership logic if user is logged in as member
  if (user.isMember) {
     // Default to Standard Member Price
     currentBasePrice = standardMemberPrice;

     if (isPromoActive) {
         if (user.membershipTier === 'deluxe' && product.promoDeluxeMemberPrice && product.promoDeluxeMemberPrice > 0) {
             currentBasePrice = product.promoDeluxeMemberPrice;
             appliedTier = 'deluxe';
         } else if (user.membershipTier === 'premium' && product.promoPremiumMemberPrice && product.promoPremiumMemberPrice > 0) {
             currentBasePrice = product.promoPremiumMemberPrice;
             appliedTier = 'premium';
         } else if (user.membershipTier === 'basic' && product.promoBasicMemberPrice && product.promoBasicMemberPrice > 0) {
             currentBasePrice = product.promoBasicMemberPrice;
             appliedTier = 'basic';
         } else {
            // If no specific tier price, check if general promo is better than member 20% off
            if ((product.promoPrice || Infinity) < standardMemberPrice) {
                currentBasePrice = product.promoPrice!;
            }
         }
     }
  } else if (isPromoActive) {
     // Non-members get the general promo price if active
     currentBasePrice = product.promoPrice!;
  }
  
  // Calculate Member Price for Upsell Display (Non-Members)
  const memberUpsellPrice = isPromoActive && product.promoBasicMemberPrice && product.promoBasicMemberPrice > 0
      ? product.promoBasicMemberPrice
      : standardMemberPrice;

  // Final Price Calculation with Modifiers
  let currentPrice = currentBasePrice;
  if (selectedMaterial) {
    currentPrice += selectedMaterial.modifier;
  }

  // Original Price (Base + Mods) for strikethrough comparison
  const standardPrice = basePrice + (selectedMaterial?.modifier || 0);

  // Calculate Savings for Display based on current view (Upsell)
  const upsellSavingsAmount = standardPrice - memberUpsellPrice;
  const upsellSavingsPercent = Math.round((upsellSavingsAmount / standardPrice) * 100);
  
  // Determine if we have tiered promo pricing to show detailed breakdown
  const hasTieredPromo = isPromoActive && (
    (product.promoBasicMemberPrice && product.promoBasicMemberPrice > 0) ||
    (product.promoDeluxeMemberPrice && product.promoDeluxeMemberPrice > 0)
  );

  // Helper for Tier Breakdown Percentage
  const getPercentOff = (price: number) => Math.round(((standardPrice - price) / standardPrice) * 100);

  // Calculate Rating
  const hasReviews = product.reviews && product.reviews.length > 0;
  const averageRating = hasReviews 
    ? (product.reviews!.reduce((acc, curr) => acc + curr.rating, 0) / product.reviews!.length).toFixed(1)
    : "4.9"; 
  const reviewCount = hasReviews ? product.reviews!.length : 128;

  // Find Gift Product
  const giftProduct = product.giftProductId ? products.find(p => p.id === product.giftProductId) : null;

  const handleAddToCart = () => {
    if (isOutOfStock || isStockLimitInCart) return;

    addToCart({ ...product, price: basePrice }, {
      selectedSize,
      selectedMaterial: selectedMaterial?.name,
      selectedMaterialModifier: selectedMaterial?.modifier,
      selectedChainStyle,
      selectedChainLength
    });
    
    if (giftProduct) {
       addToCart(giftProduct, {});
    }
  };

  // Ring Calculator Logic
  const calculateRingSize = () => {
    const mm = parseFloat(measureMM);
    if (!mm || isNaN(mm)) return;

    let bestMatch = RING_SIZE_CHART[0];
    let minDiff = Math.abs(mm - bestMatch.mm);

    for (let i = 1; i < RING_SIZE_CHART.length; i++) {
      const diff = Math.abs(mm - RING_SIZE_CHART[i].mm);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = RING_SIZE_CHART[i];
      }
    }

    if (mm > RING_SIZE_CHART[RING_SIZE_CHART.length - 1].mm + 1.5) {
        setCalculatedSize(13); 
    } else {
        setCalculatedSize(bestMatch.size);
    }
    setWizardStep(4);
  };

  const closeWizard = () => {
    setShowSizeModal(false);
    setWizardStep(1);
    setMeasureMM('');
    setCalculatedSize(null);
  };

  // --- SHARE LOGIC ---
  const handleShare = async (platform: 'whatsapp' | 'facebook' | 'native') => {
      const url = window.location.href;
      const text = "Look at this I just bought or saw this isn't it beautiful!";
      const fullText = `${text} ${url}`;

      // Award Points if logged in and hasn't shared yet this session
      if (user.id && !hasShared) {
          shareProduct(product.id);
          setHasShared(true);
          alert("You earned 50 Loyalty Points for sharing!");
      } else if (!user.id) {
          // Optional: Prompt to login, but allow sharing anyway
      }

      if (platform === 'native' && navigator.share) {
          try {
              await navigator.share({
                  title: product.name,
                  text: text,
                  url: url,
              });
          } catch (err) {
              // Fallback if native share fails or is cancelled
              console.log('Native share cancelled');
          }
      } else if (platform === 'whatsapp') {
          // WhatsApp Web/App Intent
          window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
      } else if (platform === 'facebook') {
          // Facebook Sharer
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
      }
  };

  const resolvedPrimary = useResolvedImage(product.images[activeImage] || product.images[0] || '', getFallbackImage(800, 800, 'Spoil Me Vintage'));

  // Helper functions for currency display
  const getCurrencySymbol = () => currency === 'ZAR' ? 'R' : '$';
  const getPrice = (zarPrice: number, usdPrice?: number) => currency === 'ZAR' ? zarPrice : (usdPrice ?? zarPrice);
  const convertPrice = (zarPrice: number) => currency === 'ZAR' ? zarPrice : zarPrice / 29; // Keep for backwards compatibility

  return (
    <div className="space-y-16 pt-4 pb-16 relative">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
         <Link to="/" className="hover:text-white">Home</Link>
         <span>/</span>
         <Link to={`/collections/${encodeURIComponent(product.category)}`} className="hover:text-white">{product.category}</Link>
         <span>/</span>
         <span className="text-gray-300 truncate max-w-[200px]">{product.name}</span>
      </div>

      {/* Review Explanation Popup */}
      {showReviewPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowReviewPopup(false)} />
          <div className="bg-zinc-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex items-center gap-3 mb-4 text-yellow-400">
                <BadgeCheck size={32} />
                <h3 className="text-xl font-bold text-white">Verified Purchases Only</h3>
             </div>
             <p className="text-gray-300 text-sm leading-relaxed mb-4">
               To maintain the integrity of our reviews, we only accept feedback from verified customers who have purchased this specific item.
             </p>
             <div className="bg-black/40 p-4 rounded-xl border border-gray-800 mb-6">
               <h4 className="text-sm font-bold text-white mb-2">How it works:</h4>
               <ul className="text-xs text-gray-400 space-y-3">
                 <li className="flex gap-2 items-start"><Clock size={14} className="text-cyan-400 shrink-0 mt-0.5" /> <span>A secure review link will be sent to you <strong>25 days after purchase</strong>.</span></li>
                 <li className="flex gap-2 items-start"><Star size={14} className="text-yellow-400 shrink-0 mt-0.5" /> <span>Review honestly and earn <strong>100 Loyalty Points</strong>!</span></li>
                 <li className="flex gap-2 items-start"><Gift size={14} className="text-pink-500 shrink-0 mt-0.5" /> <span>Use points (1000 pts = R10) for discounts on your next order.</span></li>
               </ul>
             </div>
             <button 
               onClick={() => setShowReviewPopup(false)}
               className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-colors"
             >
               Understood
             </button>
          </div>
        </div>
      )}

      {/* Ring Size Wizard Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={closeWizard} />
          <div className="bg-zinc-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
             
             <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <Ruler className="text-pink-500" size={20} /> Find Your Ring Size
               </h3>
               <button onClick={closeWizard} className="text-gray-500 hover:text-white"><Info size={16}/></button>
             </div>

             <div className="min-h-[250px] flex flex-col">
                {/* Step 1: Instructions */}
                {wizardStep === 1 && (
                  <div className="flex-1 space-y-4">
                    <div className="bg-pink-900/20 p-4 rounded-xl border border-pink-500/20 text-center">
                      <span className="text-3xl block mb-2">🧵</span>
                      <p className="text-sm text-pink-200 font-semibold">Step 1</p>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Take a flexible measuring tape or a piece of string and wrap it around the base of the finger you want to wear the ring on.
                    </p>
                    <div className="p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                       <p className="text-xs text-yellow-400 font-bold flex items-center gap-2">
                         <Info size={14} /> Important:
                       </p>
                       <p className="text-xs text-gray-400 mt-1">Please read your measurement in Millimeters (MM), not CM.</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Confirmation */}
                {wizardStep === 2 && (
                  <div className="flex-1 space-y-6 text-center flex flex-col justify-center">
                    <p className="text-white font-semibold">Did you measure your finger with a tape or string?</p>
                    <div className="space-y-3">
                       <button 
                         onClick={() => setWizardStep(3)}
                         className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold transition-all"
                       >
                         Yes, I measured my finger
                       </button>
                       <button 
                         onClick={() => setWizardStep(1)}
                         className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-xl font-medium transition-all"
                       >
                         Back to Instructions
                       </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Input */}
                {wizardStep === 3 && (
                  <div className="flex-1 space-y-4">
                    <div>
                       <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Which finger?</label>
                       <select 
                         className="w-full p-3 bg-black border border-gray-700 rounded-xl text-white text-sm"
                         value={measuredFinger}
                         onChange={(e) => setMeasuredFinger(e.target.value)}
                       >
                         <option>Thumb</option>
                         <option>Index Finger</option>
                         <option>Middle Finger</option>
                         <option>Ring Finger</option>
                         <option>Pinky Finger</option>
                       </select>
                    </div>

                    <div>
                       <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Measured Length (MM)</label>
                       <div className="relative">
                          <input 
                            type="number" 
                            placeholder="e.g. 54.5"
                            className="w-full p-3 bg-black border border-gray-700 rounded-xl text-white text-lg font-bold focus:border-pink-500 focus:outline-none"
                            value={measureMM}
                            onChange={(e) => setMeasureMM(e.target.value)}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">mm</span>
                       </div>
                       <p className="text-xs text-gray-500 mt-2">Please enter the exact circumference.</p>
                    </div>
                  </div>
                )}

                {/* Step 4: Result */}
                {wizardStep === 4 && (
                  <div className="flex-1 text-center flex flex-col justify-center space-y-6">
                    <div>
                       <p className="text-sm text-gray-400 mb-2">Based on your {measuredFinger} measurement:</p>
                       <div className="inline-block p-6 bg-zinc-800 rounded-full border-4 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                          <span className="block text-xs text-gray-400 uppercase tracking-wide">US Size</span>
                          <span className="text-4xl font-black text-white">{calculatedSize}</span>
                       </div>
                    </div>
                    
                    {product.ringStock && product.ringStock[calculatedSize?.toString() || ''] > 0 ? (
                        <button 
                          onClick={() => {
                            setSelectedSize(calculatedSize?.toString() || '');
                            closeWizard();
                          }}
                          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Check size={18} /> Select Size {calculatedSize}
                        </button>
                    ) : (
                        <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-red-300 text-sm">
                           Sorry, Size {calculatedSize} is currently out of stock.
                        </div>
                    )}
                  </div>
                )}
             </div>

             {/* Footer Nav */}
             <div className="flex justify-between mt-6 pt-4 border-t border-gray-800">
                {wizardStep > 1 && wizardStep < 4 ? (
                   <button onClick={() => setWizardStep(prev => prev - 1)} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
                      <ArrowLeft size={14} /> Back
                   </button>
                ) : <div></div>}

                {wizardStep === 1 && (
                   <button onClick={() => setWizardStep(2)} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-500">
                      Next Step <ArrowRight size={14} className="inline" />
                   </button>
                )}
                {wizardStep === 3 && (
                   <button 
                     onClick={calculateRingSize} 
                     disabled={!measureMM}
                     className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      Get My Size
                   </button>
                )}
                {wizardStep === 4 && (
                   <button onClick={closeWizard} className="text-gray-400 hover:text-white text-sm">
                      Close
                   </button>
                )}
             </div>

          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 shadow-lg border border-gray-800 relative group">
            <ResolvedImage src={resolvedPrimary} alt={product.name} className="w-full h-full object-cover opacity-95" onError={handleImageError} />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNewArrival && <span className="bg-cyan-600/90 text-white text-xs font-bold px-3 py-1 rounded-full w-fit">NEW</span>}
                {user.isMember && (
                   <span className="bg-purple-600/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-purple-400 flex items-center gap-1 w-fit">
                      <Crown size={12} fill="currentColor" /> 
                      {appliedTier !== 'none' ? `${appliedTier.toUpperCASE()} PRICE` : 'MEMBER DEAL'}
                   </span>
                )}
            </div>
            {isPromoActive && !user.isMember && <span className="absolute top-4 right-4 bg-green-600/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]">PROMO</span>}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(idx)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-pink-500 opacity-100 shadow-[0_0_10px_rgba(236,72,153,0.4)]' : 'border-gray-800 opacity-60 hover:opacity-100'}`}
              >
                <ResolvedImage src={img} alt={`View ${idx}`} className="w-full h-full object-cover" onError={handleImageError} />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <span className="uppercase tracking-wider font-semibold text-cyan-400">{product.category}</span>
              <span>•</span>
              <div className="flex items-center text-yellow-400 gap-1">
                 <Star size={14} fill="currentColor" /> {averageRating} ({reviewCount} reviews)
              </div>
            </div>
            <h1 className="text-[26px] font-bold text-white mb-4">{product.name}</h1>
            
            {/* Pricing Display */}
            <div className="flex flex-col gap-1">
               {product.compareAtPrice && product.compareAtPrice > currentPrice && (
                  <div className="flex items-center gap-2 relative">
                    <span className="text-sm text-gray-500 line-through">RRP {getCurrencySymbol()}{getPrice(product.compareAtPrice, product.compareAtPriceUSD).toFixed(2)}</span>
                    <button onClick={() => setShowRRPInfo(!showRRPInfo)} className="text-gray-500 hover:text-cyan-400">
                       <HelpCircle size={14} />
                    </button>
                    {showRRPInfo && (
                       <div className="absolute top-6 left-0 z-10 bg-zinc-950 border border-gray-700 p-3 rounded-lg shadow-xl w-64 text-xs text-gray-300 leading-relaxed">
                          Recommended retail price (RRP) set by the manufacturer and used for price comparison purposes.
                       </div>
                    )}
                  </div>
               )}
               
               <div className="flex items-baseline gap-3">
                  <span className={`text-[32px] font-bold drop-shadow-sm ${user.isMember ? 'text-purple-400' : 'text-green-400'}`}>
                     {getCurrencySymbol()}{getPrice(currentPrice).toFixed(2)}
                  </span>
                  {/* Ensure that if Promo is active (or member price is lower), we show the struck through original price */}
                  {standardPrice > currentPrice + 0.01 && (
                     <span className="text-lg text-gray-600 line-through">{getCurrencySymbol()}{getPrice(standardPrice).toFixed(2)}</span>
                  )}
               </div>
               
               {/* Deal Explanation */}
               <div className="flex flex-wrap gap-2 mt-1">
                  {isPromoActive && (
                     <div className="flex items-center gap-2 text-xs bg-green-900/30 border border-green-500/30 text-green-400 px-2 py-1 rounded w-fit">
                        <Clock size={12} /> Ends: {new Date(product.promoExpiresAt!).toLocaleDateString()}
                     </div>
                  )}
                  {user.isMember && (
                     <div className="flex items-center gap-2 text-xs bg-purple-900/30 border border-purple-500/30 text-purple-400 px-2 py-1 rounded w-fit font-bold">
                        <Crown size={12} /> {appliedTier !== 'none' ? appliedTier : 'Member'} Pricing Applied
                     </div>
                  )}
               </div>

               {/* Stock Indicator */}
               <div className="mt-3 flex items-center gap-2 text-sm">
                    {isOutOfStock ? (
                        <span className="bg-red-600 text-white font-black px-3 py-1 rounded-lg shadow-[0_0_10px_rgba(220,38,38,0.8)] border-2 border-red-400 animate-pulse">
                           Just SOLD
                        </span>
                    ) : (
                        <>
                            <div className={`w-2 h-2 rounded-full ${availableStock > 0 ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`}></div>
                            <span className={`${availableStock > 0 ? (availableStock <= 5 ? 'text-orange-400' : 'text-green-400') : 'text-red-400'} font-bold`}>
                               {availableStock > 0 ? (availableStock <= 5 ? `Only ${availableStock} left!` : 'In Stock') : 'Out of Stock'}
                            </span>
                        </>
                    )}
               </div>
            </div>
          </div>
          
          {/* Membership Upsell - Only show for non-members */}
          {!user.isMember && (
             <div className="bg-gradient-to-br from-zinc-900 to-black border border-purple-900/50 rounded-xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Crown size={80} className="text-purple-500 transform rotate-12" />
                </div>
                
                <h3 className="text-purple-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Crown size={16} fill="currentColor" /> Unlock Membership Savings
                </h3>
                
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-sm p-2 rounded bg-zinc-800/50 border border-zinc-700/50">
                      <span className="text-gray-400">Retail Price</span>
                      <span className="text-gray-300 font-medium">{getCurrencySymbol()}{getPrice(standardPrice).toFixed(2)}</span>
                   </div>
                   
                   {/* DYNAMIC MEMBERSHIP PRICING DISPLAY */}
                   {hasTieredPromo ? (
                      <div className="space-y-2">
                          {/* Basic & Premium (Usually same promo price in user example) */}
                          {(product.promoBasicMemberPrice && product.promoBasicMemberPrice > 0) && (
                              <div className="flex justify-between items-center text-sm p-2 rounded bg-purple-900/20 border border-purple-500/40">
                                <div className="flex flex-col">
                                  <span className="text-purple-200 font-bold text-xs">Basic Member</span>
                                  <span className="text-xs text-purple-300 uppercase font-bold">{getPercentOff(product.promoBasicMemberPrice)}% Off</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-purple-400 font-bold text-lg">{getCurrencySymbol()}{getPrice(product.promoBasicMemberPrice).toFixed(0)}</span>
                                </div>
                              </div>
                          )}
                          
                          {(product.promoPremiumMemberPrice && product.promoPremiumMemberPrice > 0 && product.promoPremiumMemberPrice !== product.promoBasicMemberPrice) && (
                               <div className="flex justify-between items-center text-sm p-2 rounded bg-purple-900/20 border border-purple-500/40">
                                 <div className="flex flex-col">
                                   <span className="text-purple-200 font-bold text-xs">Premium Member</span>
                                   <span className="text-xs text-purple-300 uppercase font-bold">{getPercentOff(product.promoPremiumMemberPrice)}% Off</span>
                                 </div>
                                 <div className="text-right">
                                     <span className="block text-purple-400 font-bold text-lg">{getCurrencySymbol()}{getPrice(product.promoPremiumMemberPrice).toFixed(0)}</span>
                                 </div>
                               </div>
                          )}
                          
                          {/* Deluxe */}
                          {(product.promoDeluxeMemberPrice && product.promoDeluxeMemberPrice > 0) && (
                              <div className="flex justify-between items-center text-sm p-2 rounded bg-lime-900/20 border border-lime-500/40">
                                <div className="flex flex-col">
                                  <span className="text-lime-200 font-bold text-xs">Deluxe Member</span>
                                  <span className="text-xs text-lime-300 uppercase font-bold">{getPercentOff(product.promoDeluxeMemberPrice)}% Off</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-lime-400 font-bold text-lg">{getCurrencySymbol()}{getPrice(product.promoDeluxeMemberPrice).toFixed(0)}</span>
                                </div>
                              </div>
                          )}
                      </div>
                   ) : (
                      /* Standard Upsell (No Promo Tiers) */
                      <div className="flex justify-between items-center text-sm p-2 rounded bg-purple-900/20 border border-purple-500/40">
                         <span className="text-purple-200 font-bold">Member Price</span>
                         <div className="text-right">
                            <span className="block text-purple-400 font-bold text-lg">{getCurrencySymbol()}{getPrice(memberUpsellPrice).toFixed(2)}</span>
                            <span className="text-xs text-purple-300 uppercase font-bold">Save {upsellSavingsPercent}%</span>
                         </div>
                       </div>
                   )}
                </div>
                
                <div className="mt-4 text-center">
                   <button 
                      onClick={() => navigate('/membership')}
                      className="w-full py-3 text-sm font-bold uppercase tracking-widest text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
                   >
                      Join Now
                   </button>
                   <p className="text-[10px] text-red-400 font-bold mt-2 uppercase tracking-wide animate-pulse">
                      LIMITED places Available
                   </p>
                </div>
             </div>
          )}

          {/* Description Sections - Moved here as requested */}
          <div className="space-y-6 mt-6 border-t border-gray-800 pt-6">
                <div>
                    <h3 className="font-cherry text-2xl text-pink-500 mb-2 tracking-wide">Description</h3>
                    <p className="text-gray-300 text-sm leading-relaxed font-light">{product.description}</p>
                </div>

                {product.whenAndHowToWear && (
                    <div>
                        <h3 className="font-cherry text-2xl text-cyan-400 mb-2 tracking-wide">Stylish Suggestions</h3>
                        <p className="text-gray-300 text-sm leading-relaxed font-light">{product.whenAndHowToWear}</p>
                    </div>
                )}

                {product.material && (
                    <div>
                        <h3 className="font-cherry text-2xl text-purple-400 mb-2 tracking-wide">Materials</h3>
                        <p className="text-gray-300 text-sm leading-relaxed font-light">{product.material}</p>
                    </div>
                )}

                {/* NEW TIP SECTION: Oxidized Jewelry Care */}
                {product.isUniquePendant && (
                   <div className="bg-orange-900/10 border border-orange-500/20 rounded-xl p-5 mt-4">
                        <h3 className="font-cherry text-xl text-orange-400 mb-3 tracking-wide flex items-center gap-2">
                           <Info size={20} /> Oxidized Jewelry Care
                        </h3>
                        <p className="text-sm text-gray-300 mb-3">
                            This unique pendant features a deliberate oxidized finish (darkened patina) to enhance the vintage detail.
                        </p>
                        <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
                            <li><strong>Do NOT use liquid silver cleaner or dips:</strong> These will strip the antique finish instantly.</li>
                            <li><strong>Avoid polishing cloths:</strong> Aggressive rubbing can remove the darkened details.</li>
                            <li><strong>Keep it dry:</strong> Remove before swimming or showering to preserve the wire wrapping.</li>
                            <li>To clean, simply wipe gently with a soft, dry cotton cloth.</li>
                        </ul>
                   </div>
                )}
          </div>

          {/* --- PROMOTION: FREE GIFT --- */}
          {giftProduct && (
             <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl p-4 flex items-center gap-4 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <div className="p-3 bg-black/50 rounded-full text-pink-400 border border-pink-500/30">
                   <Gift size={24} />
                </div>
                <div>
                   <span className="block text-xs font-bold text-pink-400 uppercase tracking-wider mb-1">Free Gift Included</span>
                   <h4 className="font-bold text-white">{giftProduct.name}</h4>
                   <p className="text-xs text-gray-400">Value: R{product.giftValue || giftProduct.price}</p>
                </div>
                <div className="ml-auto">
                   <img src={giftProduct.images[0]} alt="Gift" className="w-12 h-12 rounded object-cover border border-gray-700" />
                </div>
             </div>
          )}

          {/* --- PRODUCT OPTIONS --- */}
          <div className="space-y-6 py-4 border-t border-gray-800">
            {/* Ring Size Selector */}
            {product.type === 'Ring' && product.ringStock && (
              <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-white">Select Size</h3>
                    <button 
                       onClick={() => { setShowSizeModal(true); setWizardStep(1); }}
                       className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 underline decoration-dotted underline-offset-4"
                    >
                        <Ruler size={14} /> Find My Ring Size
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(product.ringStock).map(([size, qty]) => (
                    <button
                      key={size}
                      disabled={(qty as number) === 0}
                      onClick={() => setSelectedSize(size)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border transition-all ${
                        selectedSize === size 
                          ? 'bg-pink-600 border-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]' 
                          : (qty as number) === 0 
                            ? 'bg-zinc-900 border-gray-800 text-gray-600 cursor-not-allowed decoration-slice line-through' 
                            : 'bg-zinc-900 border-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {selectedSize && product.ringStock[selectedSize] > 0 && (
                  <p className={`text-xs mt-2 flex items-center gap-1 ${product.ringStock[selectedSize] <= 5 ? 'text-orange-400 font-bold' : 'text-green-400'}`}>
                    <Check size={12} /> 
                    {product.ringStock[selectedSize] <= 5 
                        ? `Only ${product.ringStock[selectedSize]} left in stock!` 
                        : 'In Stock'}
                  </p>
                )}
                {selectedSize && product.ringStock[selectedSize] === 0 && (
                    <p className="text-xs text-red-500 mt-2 font-bold">Out of stock for this size.</p>
                )}
              </div>
            )}
             {/* Earring Material Selector */}
            {(product.type === 'Stud' || product.type === 'Dangle') && product.showEarringOptions && product.earringMaterials && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Select Material</h3>
                <div className="grid gap-3">
                   {product.earringMaterials.map((mat) => (
                     <div 
                        key={mat.name}
                        onClick={() => setSelectedMaterial(mat)}
                        className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedMaterial?.name === mat.name 
                            ? 'bg-pink-900/10 border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.2)]' 
                            : 'bg-zinc-900 border-gray-800 hover:border-gray-600'
                        }`}
                     >
                        <div className="flex justify-between items-center">
                           <span className={`font-medium text-sm ${selectedMaterial?.name === mat.name ? 'text-white' : 'text-gray-300'}`}>{mat.name}</span>
                           <span className="text-xs font-bold text-pink-400">
                             {mat.modifier > 0 ? `+${getCurrencySymbol()}${getPrice(mat.modifier).toFixed(0)}` : ''}
                           </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{mat.description}</p>
                        {selectedMaterial?.name === mat.name && (
                          <div className="absolute top-3 right-3 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                             <Check size={10} className="text-white" />
                          </div>
                        )}
                     </div>
                   ))}
                </div>
              </div>
            )}
            {/* Pendant Chain Selector */}
            {product.type === 'Pendant' && product.chainStyles && product.chainStyles.length > 0 && (
               <div className="space-y-6">
                  {product.chainStyles.length > 1 && (
                    <div>
                      <h3 className="text-sm font-medium text-white mb-3">Chain Style</h3>
                      <div className="flex gap-4">
                        {product.chainStyles.map(style => (
                          <button
                            key={style}
                            onClick={() => setSelectedChainStyle(style)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              selectedChainStyle === style 
                                ? 'bg-pink-600 border-pink-600 text-white' 
                                : 'bg-zinc-900 border-gray-700 text-gray-300 hover:border-gray-500'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedChainStyle === 'Metal Chain' && product.pendantChainLengths && (
                     <div className="space-y-3">
                        <h3 className="text-sm font-medium text-white">Select Length</h3>
                        <div className="grid gap-2">
                           {Object.keys(product.pendantChainLengths)
                             .filter(key => product.pendantChainLengths![key])
                             .map(lengthKey => (
                               <button
                                 key={lengthKey}
                                 onClick={() => setSelectedChainLength(lengthKey)}
                                 className={`text-left p-3 rounded-lg border transition-all ${
                                   selectedChainLength === lengthKey 
                                     ? 'bg-cyan-900/20 border-cyan-500' 
                                     : 'bg-zinc-900 border-gray-800 hover:bg-zinc-800'
                                 }`}
                               >
                                  <div className="flex justify-between items-center mb-1">
                                     <span className={`text-sm font-medium ${selectedChainLength === lengthKey ? 'text-cyan-400' : 'text-gray-200'}`}>
                                       {lengthKey}
                                     </span>
                                     {selectedChainLength === lengthKey && <Check size={14} className="text-cyan-400" />}
                                  </div>
                                  <p className="text-xs text-gray-500">{CHAIN_DESCRIPTIONS[lengthKey] || ''}</p>
                               </button>
                             ))
                           }
                        </div>
                     </div>
                  )}
                  {selectedChainStyle === 'Leather Cord' && (
                    <div className="p-3 bg-zinc-800/50 rounded-lg border border-gray-700 flex items-center gap-3">
                       <div className="p-2 bg-gray-700 rounded-full"><Check size={14} className="text-white" /></div>
                       <div>
                          <span className="text-sm font-medium text-white">Fixed Length: 45cm</span>
                          <p className="text-xs text-gray-500">Standard leather cord length.</p>
                       </div>
                    </div>
                  )}
               </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button 
              onClick={handleAddToCart}
              disabled={isOutOfStock || isStockLimitInCart}
              className="flex-1 bg-pink-600 text-white py-4 rounded-xl font-semibold hover:bg-pink-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.4)] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={20} /> {buttonText}
            </button>
            <button 
              onClick={() => toggleWishlist(product.id)}
              className={`p-4 rounded-xl border transition-colors ${isLiked ? 'border-pink-500 bg-pink-500/10 text-pink-500' : 'border-gray-700 hover:bg-zinc-800 text-gray-400 hover:text-white'}`}
            >
              <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
            </button>
          </div>

          {/* --- SHARE & EARN SECTION --- */}
          <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 rounded-xl p-5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                <Share2 size={60} />
             </div>
             <h3 className="font-bold text-white flex items-center gap-2 mb-2">
                 <Gift size={18} className="text-pink-500" /> Share & Earn
             </h3>
             <p className="text-xs text-gray-300 mb-4 max-w-sm">
                 Share this treasure with friends and earn <strong className="text-green-400">50 Loyalty Points</strong> instantly!
             </p>
             
             <div className="flex gap-3">
                <button 
                    onClick={() => handleShare('whatsapp')}
                    className="flex-1 py-2 bg-[#25D366] hover:bg-[#1ebc57] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_10px_rgba(37,211,102,0.4)]"
                >
                    <MessageCircle size={16} /> WhatsApp
                </button>
                <button 
                    onClick={() => handleShare('facebook')}
                    className="flex-1 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_10px_rgba(24,119,242,0.4)]"
                >
                    <Facebook size={16} /> Facebook
                </button>
                {navigator.share && (
                    <button 
                        onClick={() => handleShare('native')}
                        className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                        <Share2 size={16} /> More
                    </button>
                )}
             </div>
             {hasShared && (
                 <div className="mt-3 text-xs text-green-400 font-bold flex items-center gap-1 justify-center animate-in fade-in zoom-in">
                     <Check size={12} /> 50 Points Awarded!
                 </div>
             )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4 pt-8 border-t border-gray-800">
             <div className="flex items-start gap-3">
                <Truck className="text-cyan-400 mt-1" size={20} />
                <div>
                   <h4 className="font-semibold text-sm text-gray-200">Free Delivery</h4>
                   <p className="text-xs text-gray-500">On orders over R500 (PUDO/PAXI only)</p>
                </div>
             </div>
            {/* 2 Year Warranty removed per request */}
          </div>
        </div>
      </div>

      {/* --- REVIEWS SECTION --- */}
      <div className="pt-12 border-t border-gray-800 animate-in fade-in slide-in-from-bottom-10 duration-700">
         
         {/* One-of-a-Kind Disclaimer for Unique Pendants */}
         {product.isUniquePendant && (
            <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl mb-8 flex gap-3 items-start">
               <AlertCircle className="text-purple-400 shrink-0 mt-1" size={20} />
               <p className="text-sm text-gray-300">
                  <strong>Please note:</strong> As this is a one-of-a-kind treasure, these reviews reflect experiences from customers who have purchased similar unique pendants from our collection.
               </p>
            </div>
         )}

         <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
             <div>
                <h2 className="font-cherry text-[26px] font-bold text-white flex items-center gap-3">
                   Customer Reviews 
                   <span className="text-sm font-sans font-normal text-gray-500 bg-zinc-900 px-3 py-1 rounded-full">{allReviewsToDisplay.length}</span>
                </h2>
                
                {/* Verified Badge & Explanation */}
                <div className="mt-2 flex flex-col gap-2">
                   <div className="inline-flex items-center gap-1.5 bg-green-900/20 border border-green-500/30 text-green-400 px-2 py-1 rounded text-xs font-bold w-fit">
                      <BadgeCheck size={14} fill="currentColor" className="text-green-500" /> Verified Purchases Only
                   </div>
                   <p className="text-xs text-gray-500 max-w-md">
                      To ensure authenticity, only customers who have purchased this item can leave a review.
                   </p>
                </div>
             </div>

             <button 
               onClick={() => setShowReviewPopup(true)}
               className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-gray-700 hover:border-gray-600 transition-all flex items-center gap-2 text-sm font-semibold shadow-lg"
             >
                Write a review
             </button>
         </div>

         {allReviewsToDisplay.length > 0 ? (
           <div className="space-y-8">
             {allReviewsToDisplay.map((review, index) => (
               <div key={review.id || `legacy-${index}`} className="flex flex-col md:flex-row gap-6 border-b border-gray-800 pb-8 last:border-0">
                 <div className="md:w-48 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-1">
                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          {(review.userName || review.name || "Verified Buyer").charAt(0)}
                       </div>
                       <span className="font-bold text-gray-200 text-sm">{review.userName || review.name || "Verified Buyer"}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-10 mb-1">
                        <BadgeCheck size={12} className="text-green-500" />
                        <span className="text--[10px] text-green-500 font-medium">Verified Buyer</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-10 mb-2">{review.location || 'Unknown'}</p>
                    <div className="flex items-center gap-1 ml-10">
                       <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={12} 
                              fill={star <= Math.round(review.rating || 5) ? "currentColor" : "none"}
                              className={star <= Math.round(review.rating || 5) ? "text-yellow-400" : "text-gray-700"}
                            />
                          ))}
                       </div>
                       <span className="text-xs font-bold text-gray-400">({review.rating || 5})</span>
                    </div>
                 </div>
                 <div className="flex-1">
                    <div className="bg-zinc-900/50 p-4 rounded-xl rounded-tl-none border border-gray-800/50">
                       <p className="text-gray-300 text-sm italic mb-3 leading-relaxed">"{review.content || review.comment || review.text}"</p>
                       <p className="text-xs text-gray-500 font-medium text-right">{review.date || (review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Recent')}</p>
                    </div>
                 </div>
               </div>
             ))}
             {realReviews.length >= limitCount && (
               <div className="text-center pt-4">
                 <button
                   onClick={() => setLimitCount(prev => prev + 5)}
                   className="w-full py-2 text-gold text-sm underline hover:text-white transition-colors"
                 >
                   Load More Customer Reviews
                 </button>
               </div>
             )}
           </div>
         ) : (
            <div className="bg-zinc-900/30 border border-dashed border-gray-800 rounded-xl p-8 text-center">
               <p className="text-gray-500 text-sm">No reviews yet. Be the first to own and review this treasure!</p>
            </div>
         )}
      </div>

      {/* --- MORE FROM COLLECTION SECTION (NEW) --- */}
      {relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-gray-800">
             <div className="flex justify-between items-end mb-6">
                <h2 className="font-cherry text-[22px] font-bold text-white flex items-center gap-2">
                   <Sparkles size={20} className="text-pink-500" /> More from {product.category}
                </h2>
                <Link 
                   to={`/collections/${encodeURIComponent(product.category)}`} 
                   className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                    View Collection <ArrowRight size={14} />
                </Link>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map(p => (
                    <ProductCard key={p.id} product={p} />
                ))}
             </div>
          </div>
      )}

    </div>
  );
};

export default ProductDetail;
