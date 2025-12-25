import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Heart, ShoppingBag, HelpCircle, Star, TrendingUp, Crown, Clock, Eye } from 'lucide-react';
import { ResolvedImage, handleImageError, getFallbackImage } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, toggleWishlist, user, cart, currency: curr } = useStore();
  const [showRRP, setShowRRP] = useState(false);
  const isLiked = user.wishlist?.includes(product.id) || false;
  const navigate = useNavigate();

  // Promo Logic (Time Limited)
  const now = new Date();
  const promoStart = product.promoStartsAt ? new Date(product.promoStartsAt) : null;
  const promoExpiry = product.promoExpiresAt ? new Date(product.promoExpiresAt) : null;
  
  // Robust Date Check: Active if promoPrice > 0 AND (Start is null or passed) AND (End is null or future)
  // Also handle Invalid Date cases
  const isStartValid = promoStart && !isNaN(promoStart.getTime());
  const isEndValid = promoExpiry && !isNaN(promoExpiry.getTime());

  const isPromoActive = (product.promoPrice || 0) > 0 
    && (!isStartValid || promoStart! <= now) 
    && (!isEndValid || promoExpiry! > now);
  
  // Standard Member Price (Use stored member prices with fallback)
  const basePrice = curr === 'ZAR' ? product.price : (product.priceUSD || product.price);
  const standardMemberPrice = curr === 'ZAR' ? (product.memberPrice || basePrice * 0.8) : (product.memberPriceUSD || basePrice * 0.8);

  // Determine effective price for the user based on Tier + Promo
  let currentPrice = basePrice;
  let isMemberPricingEffective = false;
  let appliedTier = 'none';

  if (user.isMember) {
      isMemberPricingEffective = true;
      // If Promo is active, check for Tier-Specific Pricing
      if (isPromoActive) {
          if (user.membershipTier === 'deluxe' && product.promoDeluxeMemberPrice && product.promoDeluxeMemberPrice > 0) {
              currentPrice = product.promoDeluxeMemberPrice;
              appliedTier = 'deluxe';
          } else if (user.membershipTier === 'premium' && product.promoPremiumMemberPrice && product.promoPremiumMemberPrice > 0) {
              currentPrice = product.promoPremiumMemberPrice;
              appliedTier = 'premium';
          } else if (user.membershipTier === 'basic' && product.promoBasicMemberPrice && product.promoBasicMemberPrice > 0) {
              currentPrice = product.promoBasicMemberPrice;
              appliedTier = 'basic';
          } else {
              // Fallback: If specific tier has no promo price set, use standard member price (20% off)
              // UNLESS the general promo price is better.
              currentPrice = Math.min(standardMemberPrice, product.promoPrice || Infinity);
          }
      } else {
          // No Promo active -> Standard 20% off
          currentPrice = standardMemberPrice;
      }
  } else if (isPromoActive) {
      // Non-member gets Promo Price if active
      currentPrice = product.promoPrice!;
  }

  // Determine price to show as "Member Price" upsell for non-members
  const displayMemberUpsellPrice = isPromoActive && product.promoBasicMemberPrice && product.promoBasicMemberPrice > 0
      ? product.promoBasicMemberPrice
      : standardMemberPrice;

  // Stats
  const hasReviews = product.reviews && product.reviews.length > 0;
  const averageRating = hasReviews 
    ? (product.reviews!.reduce((acc, curr) => acc + curr.rating, 0) / product.reviews!.length).toFixed(1)
    : "5.0";
  const reviewCount = product.reviews ? product.reviews.length : 0;
  const soldCount = product.soldCount || 0;

  // Time Remaining
  const getTimeRemaining = () => {
    if (!isEndValid || !promoExpiry) return null;
    const diff = promoExpiry.getTime() - now.getTime();
    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const timeLeft = isPromoActive ? getTimeRemaining() : null;

    // IMAGE: use the first product image directly

  // CHECK IF OPTIONS REQUIRED
  const requiresOptions = 
      product.type === 'Ring' || 
      (product.showEarringOptions && product.earringMaterials && product.earringMaterials.length > 1) ||
      (product.type === 'Pendant' && product.chainStyles && product.chainStyles.length > 1);

  // Respect admin `isSoldOut` override; treat as sold out if flag set or stock <= 0
  const isSoldOut = !!product.isSoldOut || product.stock <= 0;

  // Check quantity in cart for simple products
  const quantityInCartForThisProduct = cart
    .filter(item => item.id === product.id)
    .reduce((sum, item) => sum + item.quantity, 0);
  
  const isStockLimitReached = !requiresOptions && quantityInCartForThisProduct >= product.stock;

  const handleActionClick = () => {
      if (isSoldOut || isStockLimitReached) return;
      if (requiresOptions) {
          navigate(`/product/${product.id}`);
      } else {
          addToCart({ ...product, price: currentPrice });
      }
  };

  // Check if tiered pricing exists for display
  const hasTieredPromo = isPromoActive && (
    (product.promoBasicMemberPrice && product.promoBasicMemberPrice > 0) ||
    (product.promoDeluxeMemberPrice && product.promoDeluxeMemberPrice > 0)
  );

  // Helper function for currency display
  const getCurrencySymbol = () => curr === 'ZAR' ? 'R' : '$';
  const getPrice = (zarPrice: number, usdPrice?: number) => {
    if (curr === 'ZAR') return zarPrice;
    if (curr === 'USD') return usdPrice !== undefined ? usdPrice : 0; // Don't fallback to ZAR price
    return zarPrice;
  };

  // Get the base price for calculations
  const baseCompareAtPrice = curr === 'ZAR' ? product.compareAtPrice : (product.compareAtPriceUSD || product.compareAtPrice);
  const baseMemberPrice = curr === 'ZAR' ? (product.memberPrice || product.price * 0.8) : (product.memberPriceUSD || (product.priceUSD || product.price) * 0.8);

  return (
    <div className="group relative bg-zinc-900 rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-pink-500/20 transition-all duration-300 border border-gray-800 hover:border-pink-500/50 z-0 flex flex-col h-full">
      
      {/* Image Container */}
    

    <Link to={`/product/${product.id}`} className="block relative overflow-hidden aspect-square rounded-t-lg">
                <ResolvedImage
                    src={product.image_url || product.imageUrl || product.images?.[0]}
                    alt={product.name}
                    className={`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ${product.stock <= 0 ? 'opacity-50 grayscale' : 'opacity-90 group-hover:opacity-100'}`}
                    fallback={getFallbackImage(600)}
                    onError={handleImageError}
                />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {isMemberPricingEffective && (
               <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm border border-purple-400/30 flex items-center gap-1">
                   <Crown size={10} fill="currentColor" /> 
                   {appliedTier !== 'none' ? `${appliedTier.toUpperCase()} PRICE` : 'MEMBER'}
               </span>
            )}
            {!isMemberPricingEffective && isPromoActive && (
                <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm border border-green-500/30">
                    PROMO
                </span>
            )}
            {product.isNewArrival && (
               <span className="bg-cyan-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm border border-cyan-500/30">
                  NEW
               </span>
            )}
        </div>


        {/* Promo Timer Overlay - Show for everyone if promo active */}
        {isPromoActive && timeLeft && !isSoldOut && (
             <div className="absolute bottom-0 left-0 w-full bg-black/80 backdrop-blur-md py-1 px-2 flex items-center justify-center gap-1.5 text-[10px] text-green-400 font-bold border-t border-green-500/30">
                <Clock size={10} /> Ends in: {timeLeft}
             </div>
        )}
      </Link>

      {/* Wishlist Button */}
      <button 
        onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
        className={`absolute top-2 right-2 p-2 rounded-full bg-black/50 backdrop-blur-md shadow-md transition-colors border border-transparent hover:border-pink-500 z-20 ${isLiked ? 'text-pink-500' : 'text-gray-300 hover:text-white'}`}
      >
        <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
      </button>

      <div className="p-4 rounded-b-lg flex flex-col flex-1 space-y-2">
        
        {/* 1. Category & Action Button (Moved Here) */}
        <div className="flex justify-between items-start">
            <p className="text-xs text-cyan-400 font-medium uppercase tracking-wider truncate pr-2">{product.category}</p>
            <button
                onClick={handleActionClick}
                disabled={isSoldOut || isStockLimitReached}
                className={`p-1.5 rounded-full transition-all flex-shrink-0 -mt-1 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    user.isMember 
                        ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-500/30' 
                        : 'bg-zinc-800 text-gray-300 hover:bg-cyan-500 hover:text-black border border-gray-700'
                }`}
                title={requiresOptions ? "View Options" : isSoldOut ? "Sold Out" : isStockLimitReached ? "Stock limit in cart" : "Add to Cart"}
            >
                {requiresOptions ? <Eye size={16} /> : <ShoppingBag size={16} />}
            </button>
            
        </div>
        
        {/* 2. Title */}
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-bold text-gray-100 leading-tight group-hover:text-pink-500 transition-colors line-clamp-2 h-10">
            {product.name}
          </h3>
        </Link>
        
        {/* 3. Rating & Sold Count */}
        <div className="flex items-center justify-between">
             <div className="flex items-center gap-1 text-yellow-400">
                <Star size={12} fill="currentColor" />
                <span className="text-xs font-bold text-gray-300">{averageRating}</span>
                <span className="text-[10px] text-gray-500">({reviewCount})</span>
             </div>
             <div className="flex items-center gap-2 text-[10px]">
                {soldCount > 0 && (
                    <div className="text-gray-500 font-medium flex items-center gap-1">
                        {soldCount} sold
                    </div>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                    <div className="text-orange-400 font-medium flex items-center gap-1">
                        Low Stock
                    </div>
                )}
             </div>
        </div>

        {/* 4. RRP & Retail Price Info */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-h-[20px]">
            {baseCompareAtPrice && (
                <div className="flex items-center gap-1 relative">
                    <span className="text-[10px] text-gray-500 line-through">RRP {getCurrencySymbol()}{baseCompareAtPrice.toFixed(2)}</span>
                    <button
                        onClick={(e) => { e.preventDefault(); setShowRRP(!showRRP); }}
                        className="text-gray-600 hover:text-gray-400 focus:outline-none"
                    >
                        <HelpCircle size={10} />
                    </button>
                    {showRRP && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-950 border border-gray-700 rounded shadow-xl text-[10px] text-gray-300 z-50">
                            Recommended retail price.
                        </div>
                    )}
                </div>
            )}
            <span className="text-sm font-bold text-green-400">
                Retail {getCurrencySymbol()}{basePrice.toFixed(2)}
            </span>
        </div>

        <div className="mt-auto pt-2 border-t border-gray-800/50">
            {/* 5. Pricing Logic (Buttons Removed) */}
            {user.isMember ? (
                /* MEMBER VIEW */
                <div className="flex items-end justify-between">
                    <div className="flex flex-col w-full">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide flex items-center gap-1">
                            <Crown size={10} /> {appliedTier !== 'none' ? appliedTier : 'Member'} Price
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-white drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
                                {getCurrencySymbol()}{getPrice(currentPrice).toFixed(2)}
                            </span>
                            {currentPrice < product.price && (
                                <span className="text-xs text-gray-500 line-through">{getCurrencySymbol()}{getPrice(product.price).toFixed(2)}</span>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* NON-MEMBER VIEW */
                <div className="flex items-end justify-between">
                     <div className="flex flex-col w-full">
                         {/* Effective Retail Price (or Promo Price) */}
                         {isPromoActive ? (
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-green-400">
                                    {getCurrencySymbol()}{getPrice(currentPrice).toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-400 line-through">{getCurrencySymbol()}{getPrice(product.price).toFixed(2)}</span>
                            </div>
                         ) : null}
                         
                         {/* Member Upsell - Visible to non-members */}
                         {hasTieredPromo ? (
                            <div className="flex flex-col gap-0.5 mt-1">
                                <div className="flex justify-between text-[9px] text-gray-400">
                                    <span>Basic & Premium:</span>
                                    <span className="text-purple-400 font-bold">{getCurrencySymbol()}{getPrice(product.promoBasicMemberPrice || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[9px] text-gray-400">
                                    <span>Deluxe:</span>
                                    <span className="text-purple-400 font-bold">{getCurrencySymbol()}{getPrice(product.promoDeluxeMemberPrice || 0).toFixed(2)}</span>
                                </div>
                            </div>
                         ) : (
                             <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                Members: <span className="text-purple-400 font-bold">{getCurrencySymbol()}{getPrice(displayMemberUpsellPrice).toFixed(2)}</span>
                             </div>
                         )}
                     </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default ProductCard;
