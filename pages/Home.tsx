import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import WinnerCarousel from '../components/WinnerCarousel';
import { ArrowRight, Clock, Gift, TrendingUp, ChevronLeft, ChevronRight, CreditCard, Crown, Award, Trophy, Sparkles } from 'lucide-react';
import { ResolvedImage, handleImageError, getFallbackImage } from '@/utils/imageUtils';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const { products, categories, user, currency: curr } = useStore();
  
  // Refs for scrolling
  const bestSellersRef = useRef<HTMLDivElement>(null);
  const studsRef = useRef<HTMLDivElement>(null);
  const danglesRef = useRef<HTMLDivElement>(null);
  const uniquePendantsRef = useRef<HTMLDivElement>(null);
  const braceletsRef = useRef<HTMLDivElement>(null);
  const jewelrySetsRef = useRef<HTMLDivElement>(null);

  // Spoil Me Club Spots Logic
  const [spotsFlash, setSpotsFlash] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => setSpotsFlash(prev => !prev), 5000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const monthSeed = now.getMonth() + now.getFullYear() * 12;
  const startingSpots = 23 + (monthSeed % 3);
  const dayOfMonth = now.getDate();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const progress = (dayOfMonth - 1) / (totalDays - 1);
  const spotsLeft = Math.max(2, Math.floor(startingSpots - progress * (startingSpots - 2)));

  // --- SMART FILTERING ---
  // This helper checks Category, Tags, and Name for keywords to ensure products appear
  const matches = (p: any, keywords: string[]) => {
    const searchString = `${p.category || ''} ${p.name || ''} ${p.tags ? p.tags.join(' ') : ''}`.toLowerCase();
    return keywords.some(k => searchString.includes(k.toLowerCase()));
  };

  // 1. Best Sellers: Look for "Best Seller" tag, or fallback to first 16 products
  const taggedBestSellers = products.filter(p => matches(p, ['best seller', 'featured']));
  const bestSellers = (taggedBestSellers.length > 0 ? taggedBestSellers : products).slice(0, 16);

  // 2. Studs: Look for "stud" in name, category, or tags
  const studs = products.filter(p => matches(p, ['stud', 'studs'])).slice(0, 11);

  // 3. Dangles: Look for "dangle", "drop", or "hook"
  const dangles = products.filter(p => matches(p, ['dangle', 'drop', 'hook'])).slice(0, 2);

  // 4. Unique Pendants: Only show Pendants (exclude Necklaces); look for "pendant" or "unique"
  const uniquePendants = products
    .filter(p => (p.type === 'Pendant') && matches(p, ['pendant', 'unique']))
    .slice(0, 23);

  // 5. Bracelets: Look for "bracelet", "bangle", or "wrist"
  const bracelets = products.filter(p => matches(p, ['bracelet', 'bangle'])).slice(0, 6);

  // 6. Jewelry Sets: Look for "set", "combo", or "suite"
  const jewelrySets = products.filter(p => matches(p, ['set', 'combo', 'suite'])).slice(0, 2);

  // Scroll Helper
  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.8;
      ref.current.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    }
  };

  /**
   * REUSABLE COMPONENT: ProductScrollSection
   * variant 'standard': Shows ~2.5 items on mobile (classic swipe)
   * variant 'single': Shows 1 item on mobile (Instagram style focus)
   */
  const ProductScrollSection = ({ title, items, reference, linkTo, icon: Icon, variant = 'standard' }: any) => {
    if (!items || items.length === 0) return null;

    const itemClass = variant === 'single' 
      ? "min-w-[90vw] md:min-w-[90vw] snap-center px-2" 
      : "min-w-[40vw] md:min-w-[200px] snap-start px-2";

    return (
      <section className="py-4">
        <div className="flex justify-between items-end mb-4 px-4">
          <h2 className="font-cherry text-[22px] font-bold text-white border-b-2 border-white/20 pb-1 inline-block flex items-center gap-2">
            {Icon && <Icon size={20} className="text-pink-400" />} {title}
          </h2>
          <Link to={linkTo} className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors bg-white/5 px-3 py-1 rounded-full border border-white/10">
              View All <ArrowRight size={14} />
          </Link>
        </div>
        
        <div className="relative group/slider">
           <button onClick={() => scroll(reference, 'left')} className="block absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg hover:bg-pink-600 transition-colors"><ChevronLeft size={20} /></button>
           <button onClick={() => scroll(reference, 'right')} className="block absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg hover:bg-pink-600 transition-colors"><ChevronRight size={20} /></button>
           
           <div 
             ref={reference} 
             className="flex overflow-x-auto snap-x snap-mandatory pb-6 px-2 no-scrollbar scroll-smooth"
           >
              {items.map((product: any) => (
               <div key={product.id} className={itemClass}>
                 <ProductCard product={product} />
               </div>
             ))}
             
             <div className={`${variant === 'single' ? 'min-w-[90vw]' : 'min-w-[40vw]'} snap-center flex flex-col items-center justify-center p-4`}>
                <Link to={linkTo} className="w-16 h-16 rounded-full bg-zinc-800 border border-gray-600 flex items-center justify-center text-white mb-2 shadow-lg">
                  <ArrowRight />
                </Link>
                <span className="text-gray-400 text-xs">View All</span>
             </div>
           </div>
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. GIFT VOUCHER */}
      <div className="px-4 mt-4">
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-pink-900 via-purple-900 to-indigo-900 border border-pink-500/30 shadow-lg">
           <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-12 translate-x-10"></div>
           <div className="flex flex-col p-6 relative z-10 gap-4">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                     <CreditCard size={24} className="text-pink-300" />
                  </div>
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow animate-pulse">LIMITED OFFER</span>
                     </div>
                     <h2 className="text-xl font-bold text-white leading-tight">Buy a Gift Voucher</h2>
                  </div>
              </div>
              <p className="text-sm text-gray-200">
                 Buy <strong className="text-white">R250-R500</strong>, get <span className="text-yellow-300 font-bold">R100 EXTRA</span>!
              </p>
              <Link to="/gift-cards" className="w-full text-center py-3 bg-white text-purple-900 font-bold rounded-full shadow-lg flex items-center justify-center gap-2">
                 Create Voucher <ArrowRight size={16} />
              </Link>
           </div>
        </section>
      </div>

      {/* 2. THE SPOIL ME CLUB */}
      <div className="px-4">
        <div className="relative rounded-2xl overflow-hidden border-4 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          <section className="relative bg-zinc-900 text-white p-6">
            <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full bg-red-600 text-white border border-red-400 z-20 ${spotsFlash ? 'animate-pulse' : ''}`}>
              {spotsLeft} spots left
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-black to-zinc-900" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <h2 className="font-cherry text-3xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 drop-shadow-lg">
                  🎁 The Spoil Me Club
                </h2>
                <p className="text-sm text-gray-300">Join for just {curr === 'ZAR' ? 'R19' : '$2'} / month.</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>✅ Get a {curr === 'ZAR' ? 'R25' : '$3'} Voucher instantly.</p>
                  <p>✅ Auto-entry into Weekly R500 Drop.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                  <Link to="/membership" className="py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-bold text-xs flex items-center justify-center">
                    JOIN CLUB
                  </Link>
                  <Link to="/weekly-winners" className="py-2.5 border border-gray-600 text-gray-300 rounded-lg font-bold text-xs flex items-center justify-center gap-1">
                    WINNERS <Trophy size={12} />
                  </Link>
                </div>
            </div>
          </section>
          <WinnerCarousel />
        </div>
      </div>

      {/* 3. BEST SELLERS */}
      <ProductScrollSection 
        title="Best Sellers" 
        items={bestSellers} 
        reference={bestSellersRef} 
        linkTo="/catalog"
        icon={TrendingUp}
      />

      {/* 4. CATEGORIES */}
      <section className="px-4">
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-cherry text-[22px] font-bold text-white border-b-2 border-purple-500 pb-1">Shop Categories</h2>
        </div>
        <div className="grid grid-cols-3 gap-2"> 
          {categories.map(cat => (
            <Link key={cat.id} to={`/collections/${encodeURIComponent(cat.name)}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-800 bg-zinc-900 group">
              <ResolvedImage src={cat.image} alt={cat.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" fallback={getFallbackImage(400)} onError={handleImageError} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-2">
                <span className="font-handwriting text-xs md:text-sm font-bold text-white leading-none truncate">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. THE SECRET VAULT */}
      <section className="px-4">
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 rounded-2xl p-6 border-2 border-yellow-400 shadow-lg text-center">
          <Crown className="absolute top-2 left-2 text-yellow-400/20 w-24 h-24 rotate-[-15deg]" />
          <div className="relative z-10 space-y-3">
            <h2 className="font-cherry text-3xl text-yellow-400 drop-shadow-md">THE SECRET VAULT</h2>
            <p className="font-architects text-sm text-gray-200 leading-relaxed">
              Clearance & Samples. Massive discounts for Deluxe Members!
            </p>
            <Link to="/vault" className="inline-block w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-full shadow-lg">
              Enter The Vault
            </Link>
          </div>
        </div>
      </section>

      {/* 6. STUDS */}
      <ProductScrollSection title="Stud Earrings" items={studs} reference={studsRef} linkTo="/catalog/stud" />

      {/* 7. DANGLES */}
      <ProductScrollSection title="Dangle Earrings" items={dangles} reference={danglesRef} linkTo="/catalog/dangle" />

      {/* 8. BENEFITS */}
      <section className="px-4">
        <div className="bg-zinc-900/80 backdrop-blur rounded-xl border border-white/10 p-4 space-y-4 divide-y divide-white/10">
           <Link to="/earn-rewards" className="flex items-center gap-4 pt-1">
              <div className="p-2 bg-pink-900/30 rounded-full text-pink-400"><Gift size={20} /></div>
              <div>
                <h4 className="font-bold text-white text-sm">{user.email ? `Points: ${user.loyaltyPoints}` : 'Loyalty Rewards'}</h4>
                <p className="text-xs text-gray-400">Redeem points for discounts.</p>
              </div>
           </Link>
           <Link to="/affiliate-program" className="flex items-center gap-4 pt-4">
              <div className="p-2 bg-green-900/30 rounded-full text-green-400"><TrendingUp size={20} /></div>
              <div>
                <h4 className="font-bold text-white text-sm">Partnership Program</h4>
                <p className="text-xs text-gray-400">Earn 20% commission.</p>
              </div>
           </Link>
           <div className="flex items-center gap-4 pt-4">
              <div className="p-2 bg-cyan-900/30 rounded-full text-cyan-400"><Clock size={20} /></div>
              <div>
                <h4 className="font-bold text-white text-sm">Flash Sales</h4>
                <p className="text-xs text-gray-400">Daily limited-time offers.</p>
              </div>
           </div>
        </div>
      </section>

      {/* 9. UNIQUE PENDANTS */}
      <ProductScrollSection 
        title="Unique Pendants" 
        items={uniquePendants} 
        reference={uniquePendantsRef} 
        linkTo="/catalog/unique" 
        variant="single"
      />

      {/* 10. BRACELETS */}
      <ProductScrollSection title="Bracelets" items={bracelets} reference={braceletsRef} linkTo="/catalog/bracelet" />

      {/* 11. VIP */}
      <section className="px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-pink-900 p-6 text-center border border-purple-500/30">
           <Sparkles className="absolute top-2 left-2 text-white/20 w-16 h-16 animate-pulse" />
           <div className="relative z-10 space-y-3">
              <h2 className="font-cherry text-2xl text-white">Unlock VIP Pricing</h2>
              <p className="text-xs text-gray-200">
                 Save up to <span className="text-yellow-300 font-bold">50% OFF</span> retail & get monthly free gifts.
              </p>
              <Link to="/membership" className="inline-block w-full py-3 bg-white text-purple-900 font-bold rounded-full shadow-lg mt-2">
                 View Perks
              </Link>
           </div>
        </div>
      </section>

      {/* 12. JEWELRY SETS */}
      <ProductScrollSection title="Jewelry Sets" items={jewelrySets} reference={jewelrySetsRef} linkTo="/catalog/sets" />

      {/* 13. ARTIST NETWORK */}
      <section className="px-4 mb-8">
        <div className="bg-zinc-900 rounded-2xl p-6 border-2 border-yellow-600/50 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-yellow-900/10"></div>
          <div className="relative z-10 space-y-3">
            <h2 className="font-cherry text-2xl text-yellow-500">JOIN OUR ARTIST NETWORK</h2>
            <p className="text-xs text-gray-400">
              Jewelry artist? Showcase to 7,000+ collectors. Only 1% commission!
            </p>
            <Link to="/artist-partnership" className="inline-block w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-full shadow-lg">
              Start Your Shop
            </Link>
            <p className="text-[10px] text-gray-500">From {curr === 'ZAR' ? 'R19' : '$1.50'} / month</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home; 