import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import WinnerAnimation from '../components/WinnerAnimation';
import WinnerCarousel from '../components/WinnerCarousel';
import { ArrowRight, Clock, Gift, TrendingUp, Sparkles, ChevronLeft, ChevronRight, CreditCard, Crown, Award, Box, Droplet, Trophy } from 'lucide-react';
import { ResolvedImage, handleImageError, getFallbackImage } from '@/utils/imageUtils';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const { products, categories, specials, user, memberCount, weeklyWinners, currency: curr } = useStore();
  const bestSellersRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const braceletsRef = useRef<HTMLDivElement>(null);
  const uniquePendantsRef = useRef<HTMLDivElement>(null);
  const studsRef = useRef<HTMLDivElement>(null);
  const danglesRef = useRef<HTMLDivElement>(null);
  const jewelrySetsRef = useRef<HTMLDivElement>(null);
  const watchesRef = useRef<HTMLDivElement>(null);
  const boxesRef = useRef<HTMLDivElement>(null);
  const perfumeRef = useRef<HTMLDivElement>(null);
  const newArrivalsRef = useRef<HTMLDivElement>(null);

  const [spotsFlash, setSpotsFlash] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsFlash(prev => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const bestSellers = products.filter(p => p.isBestSeller);
  const rings = products.filter(p => p.type === 'Ring' || p.isFeaturedRing);
  const bracelets = products.filter(p => p.type === 'Bracelet' || p.isFeaturedBracelet);
  const uniquePendants = products.filter(p => p.isUniquePendant);
  const studs = products.filter(p => p.type === 'Stud' || p.isFeaturedStud);
  const dangles = products.filter(p => p.type === 'Dangle' || p.isFeaturedDangle);
  const jewelrySets = products.filter(p => p.isJewelrySet);
  const watches = products.filter(p => p.type === 'Watch' || p.isFeaturedWatch);
  const boxes = products.filter(p => p.type === 'Jewelry Box' || p.isFeaturedJewelryBox);
  const perfumes = products.filter(p => p.type === 'Perfume Holder' || p.isFeaturedPerfumeHolder);
  const newArrivals = products.filter(p => p.isNewArrival);

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthSeed = month + year * 12;
  const startingSpots = 23 + (monthSeed % 3); // 23, 24, or 25
  const dayOfMonth = now.getDate();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const progress = (dayOfMonth - 1) / (totalDays - 1);
  const totalSpots = startingSpots - progress * (startingSpots - 2);
  const spotsLeft = Math.max(2, Math.floor(totalSpots));

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.8; // Scroll 80% of width
      ref.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-12">
      
      <div className="space-y-2">
          {/* GIFT VOUCHER PROMO BANNER (Added above Hero) */}
          <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-pink-900 via-purple-900 to-indigo-900 border border-pink-500/30 shadow-[0_0_20px_rgba(236,72,153,0.2)] group hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] transition-all">
             <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-20 group-hover:translate-x-10 transition-transform duration-700"></div>
             <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 relative z-10 gap-6">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg hidden sm:block">
                       <CreditCard size={32} className="text-pink-300" />
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow animate-pulse">LIMITED OFFER</span>
                          <span className="text-pink-300 text-xs font-bold uppercase tracking-wider">Give the perfect gift</span>
                       </div>
                       <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Buy a Gift Voucher</h2>
                       <p className="text-sm md:text-base text-gray-200">
                          Purchase between <strong className="text-white">R250 - R500</strong> and get an <span className="text-yellow-300 font-bold underline decoration-wavy">EXTRA R100</span> to spend!
                       </p>
                    </div>
                </div>
                <Link 
                   to="/gift-cards" 
                   className="whitespace-nowrap px-8 py-3 bg-white text-purple-900 font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2 group/btn"
                >
                   Create Voucher <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
             </div>
          </section>
      </div>


      {/* Combined Spoil Me Package Hero & Winners Marquee */}
      <div
        className="relative rounded-2xl overflow-hidden border-4 border-cyan-500"
        style={{ boxShadow: '0 0 25px 5px rgba(34, 211, 238, 0.4)' }}
      >
        {/* Spoil Me Package Hero Section */}
        <section className="relative bg-zinc-900 text-white">
          <div className={`absolute top-2 right-2 text-xs font-bold px-3 py-1 rounded-full border shadow-md z-20 bg-red-600 border-red-400 text-red-500 ${spotsFlash ? 'animate-pulse' : ''}`}>
            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-black to-zinc-900" />
          
          <div className="relative z-10 p-4 flex flex-col justify-center">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              
              <div className="space-y-1">
                  <h2 className="font-cherry text-3xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 drop-shadow-lg py-1">
                    🎁 The Spoil Me Club
                  </h2>
                  <p className="text-sm text-gray-300">Join for just R19 / $2 per month. Cancel anytime.</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center items-center text-sm text-gray-200">
                    <span>✅ Get a R25 / $3 Voucher instantly.</span>
                    <span>✅ Automatic entry into the Weekly R500 Drop.</span>
                  </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link to="/membership" className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-semibold transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] flex items-center justify-center gap-2 text-xs">
                  [ JOIN THE CLUB ] <ArrowRight size={14} />
                </Link>
                <Link to="/weekly-winners" className="px-5 py-2.5 border border-gray-500 hover:border-cyan-400 hover:text-cyan-400 hover:bg-cyan-950/30 text-gray-300 rounded-lg font-semibold transition-all text-xs flex items-center justify-center gap-2">
                  [ View Past Winners ] <Trophy size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Winners Marquee */}
        <WinnerCarousel />
      </div>

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="font-cherry text-[22px] font-bold text-white border-b-2 border-yellow-400 pb-1 inline-block transform -rotate-1 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">
              Best Sellers
            </h2>
            <Link to="/catalog/best" className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors">
                View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="relative group/slider">
             {/* Mobile Arrows */}
             <button 
               onClick={() => scroll(bestSellersRef, 'left')}
               className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/slider:opacity-100 transition-opacity focus:opacity-100"
             >
               <ChevronLeft size={20} />
             </button>
             <button 
               onClick={() => scroll(bestSellersRef, 'right')}
               className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/slider:opacity-100 transition-opacity focus:opacity-100"
             >
               <ChevronRight size={20} />
             </button>

             {/* Scroll Container */}
             <div 
               ref={bestSellersRef}
               className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar scroll-smooth"
             >
               {bestSellers.map(product => (
                 <div key={product.id} className="min-w-[calc(50%-8px)] snap-start md:min-w-0">
                   <ProductCard product={product} />
                 </div>
               ))}
             </div>
          </div>
        </section>
      )}

      {/* The Secret Vault Section */}
      <section className="relative">
        <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 rounded-2xl p-8 border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Crown className="text-yellow-400 animate-pulse" size={48} />
              <h2 className="font-cherry text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                THE SECRET VAULT
              </h2>
              <Crown className="text-yellow-400 animate-pulse" size={48} />
            </div>
            <p className="font-architects text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
              Exclusive Clearance & Samples for Deluxe Members. Unlock massive discounts on vintage treasures!
            </p>
            <Link
              to="/vault"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(250,204,21,0.6)]"
            >
              <Crown size={24} />
              Enter The Vault
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-cherry text-[22px] font-bold text-white border-b-2 border-purple-500 pb-1 inline-block transform -rotate-1 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
            Shop by Category
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-1 md:gap-8 md:p-4"> 
          {categories.map(cat => {
            const isRedCollection = cat.name === 'Red Collection';
            const collectionLink = `/collections/${encodeURIComponent(cat.name)}`;
            
            if (isRedCollection) {
               return (
                  <div key={cat.id} className="relative aspect-[4/5] md:aspect-square group cursor-pointer z-10">
                    {/* MAIN CARD CONTAINER MATCHING HERO STYLE */}
                    <Link 
                        to={collectionLink}
                        className="block w-full h-full relative rounded-xl md:rounded-2xl overflow-hidden bg-zinc-900 text-white border-2 md:border-4 border-black transition-transform duration-300 hover:scale-[1.02]"
                        style={{ 
                            boxShadow: '0 0 15px 3px rgba(220, 38, 38, 0.6)' // Red Shadow for Red Collection
                        }}
                    >
                        <ResolvedImage src={cat.image} alt={cat.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" fallback={getFallbackImage(600)} onError={handleImageError} />
                        <div className="absolute bottom-0 left-0 p-1.5 md:p-4 w-full bg-gradient-to-t from-black/80 to-transparent">
                          <h3 className="font-handwriting text-xl md:text-3xl font-bold mb-0.5 md:mb-1 text-white drop-shadow-md truncate">
                            {cat.name}
                          </h3>
                          <p className="text-gray-200 text-[9px] md:text-xs drop-shadow-md line-clamp-1">{cat.description}</p>
                        </div>
                    </Link>
                  </div>
               );
            }

            // Standard Card
            return (
              <div key={cat.id} className="relative aspect-[4/5] md:aspect-square cursor-pointer overflow-hidden transition-all duration-300 rounded-lg md:rounded-xl border border-gray-800 bg-zinc-900 hover:border-gray-600 group">
                <Link to={collectionLink} className="block w-full h-full relative">
                  <ResolvedImage src={cat.image} alt={cat.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" fallback={getFallbackImage(600)} onError={handleImageError} />
                  <div className="absolute bottom-0 left-0 p-1.5 md:p-4 w-full bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="font-handwriting text-xl md:text-3xl font-bold mb-0.5 md:mb-1 text-white drop-shadow-md truncate">
                      {cat.name}
                    </h3>
                    <p className="text-gray-200 text-[9px] md:text-xs drop-shadow-md line-clamp-1">{cat.description}</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-y border-gray-800 bg-zinc-900/50 backdrop-blur-sm rounded-xl px-6 my-8">
         <Link to="/earn-rewards" className="flex items-center gap-3 group cursor-pointer">
            <div className="p-3 bg-zinc-800 text-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.2)] group-hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all">
               {user.email ? <Award size={20} /> : <Gift size={20} />}
            </div>
            <div>
              <h4 className="font-bold text-gray-100 text-base">
                  {user.email ? `My Points: ${user.loyaltyPoints}` : 'Loyalty Rewards'}
              </h4>
              <p className="text-xs text-gray-400">
                  {user.email ? 'Redeem for discounts or earn more' : 'Earn points on every vintage find.'}
              </p>
            </div>
         </Link>
         
         {/* Partnership Link - Updated */}
         <Link to="/affiliate-program" className="flex items-center gap-3 group cursor-pointer">
            <div className="p-3 bg-zinc-800 text-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.2)] group-hover:shadow-[0_0_15px_rgba(74,222,128,0.5)] transition-all">
               <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-100 text-base">Partnership Program</h4>
              <p className="text-xs text-gray-400">Earn 20% commission on referrals.</p>
            </div>
         </Link>

         <div className="flex items-center gap-3 group">
            <div className="p-3 bg-zinc-800 text-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.2)] group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all">
               <Clock size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-100 text-base">Flash Sales</h4>
              <p className="text-xs text-gray-400">Daily limited-time offers.</p>
            </div>
         </div>
      </section>

      {/* Unique Pendants Section */}
      {uniquePendants.length > 0 && (
        <section>
            <div className="flex justify-between items-end mb-6">
                <h2 className="font-cherry text-[22px] font-bold text-white border-l-4 border-purple-500 pl-4 inline-block">
                Unique Pendants
                </h2>
                <Link to="/catalog/unique" className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight size={14} />
                </Link>
            </div>
            
            <div className="relative group/pendants">
            {/* Mobile Arrows */}
            <button 
                onClick={() => scroll(uniquePendantsRef, 'left')}
                className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/pendants:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronLeft size={20} />
            </button>
            <button 
                onClick={() => scroll(uniquePendantsRef, 'right')}
                className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/pendants:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronRight size={20} />
            </button>

            {/* Scroll Container */}
            <div 
                ref={uniquePendantsRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar scroll-smooth"
            >
                {uniquePendants.map(product => (
                <div key={product.id} className="min-w-[calc(50%-8px)] snap-start md:min-w-0">
                    <ProductCard product={product} />
                </div>
                ))}
            </div>
            </div>
        </section>
      )}

      {/* Link to Customized Wire Wrapped Pendants */}
      <div className="mb-6">
        <Link to="/customized-wire-wrapped-pendants" className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors">
          Explore Customized Wire Wrapped Pendants <ArrowRight size={14} />
        </Link>
      </div>

      {/* Rings Section */}
      {rings.length > 0 && (
        <section id="rings">
            <div className="flex justify-between items-end mb-6">
                <h2 className="font-cherry text-[22px] font-bold text-white border-l-4 border-pink-500 pl-4 inline-block">
                Rings
                </h2>
                <Link to="/catalog/ring" className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight size={14} />
                </Link>
            </div>
            
            <div className="relative group/rings">
            {/* Mobile Arrows */}
            <button 
                onClick={() => scroll(ringsRef, 'left')}
                className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/rings:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronLeft size={20} />
            </button>
            <button 
                onClick={() => scroll(ringsRef, 'right')}
                className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/rings:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronRight size={20} />
            </button>

            {/* Scroll Container */}
            <div 
                ref={ringsRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar scroll-smooth"
            >
                {rings.map(product => (
                <div key={product.id} className="min-w-[calc(50%-8px)] snap-start md:min-w-0">
                    <ProductCard product={product} />
                </div>
                ))}
            </div>
            </div>
        </section>
      )}

      {/* Bracelets Section */}
      {bracelets.length > 0 && (
        <section id="bracelets">
            <div className="flex justify-between items-end mb-6">
                <h2 className="font-cherry text-[22px] font-bold text-white border-l-4 border-teal-500 pl-4 inline-block">
                Bracelets
                </h2>
                <Link to="/catalog/bracelet" className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight size={14} />
                </Link>
            </div>
            
            <div className="relative group/bracelets">
            {/* Mobile Arrows */}
            <button 
                onClick={() => scroll(braceletsRef, 'left')}
                className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/bracelets:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronLeft size={20} />
            </button>
            <button 
                onClick={() => scroll(braceletsRef, 'right')}
                className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/bracelets:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronRight size={20} />
            </button>

            {/* Scroll Container */}
            <div 
                ref={braceletsRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar scroll-smooth"
            >
                {bracelets.map(product => (
                <div key={product.id} className="min-w-[calc(50%-8px)] snap-start md:min-w-0">
                    <ProductCard product={product} />
                </div>
                ))}
            </div>
            </div>
        </section>
      )}

      {/* Stud Earrings Section */}
      {studs.length > 0 && (
        <section id="studs">
            <div className="flex justify-between items-end mb-6">
                <h2 className="font-cherry text-[22px] font-bold text-white border-l-4 border-pink-400 pl-4 inline-block">
                Stud Earrings
                </h2>
                <Link to="/catalog/stud" className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight size={14} />
                </Link>
            </div>
            
            <div className="relative group/studs">
            {/* Mobile Arrows */}
            <button 
                onClick={() => scroll(studsRef, 'left')}
                className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/studs:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronLeft size={20} />
            </button>
            <button 
                onClick={() => scroll(studsRef, 'right')}
                className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/studs:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronRight size={20} />
            </button>

            {/* Scroll Container */}
            <div 
                ref={studsRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar scroll-smooth"
            >
                {studs.map(product => (
                <div key={product.id} className="min-w-[calc(50%-8px)] snap-start md:min-w-0">
                    <ProductCard product={product} />
                </div>
                ))}
            </div>
            </div>
        </section>
      )}

      {/* Dangle Earrings Section */}
      {dangles.length > 0 && (
        <section id="dangles">
            <div className="flex justify-between items-end mb-6">
                <h2 className="font-cherry text-[22px] font-bold text-white border-l-4 border-cyan-400 pl-4 inline-block">
                Dangle Earrings
                </h2>
                <Link to="/catalog/dangle" className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight size={14} />
                </Link>
            </div>
            
            <div className="relative group/dangles">
            {/* Mobile Arrows */}
            <button 
                onClick={() => scroll(danglesRef, 'left')}
                className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/dangles:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronLeft size={20} />
            </button>
            <button 
                onClick={() => scroll(danglesRef, 'right')}
                className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/dangles:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronRight size={20} />
            </button>

            {/* Scroll Container */}
            <div 
                ref={danglesRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar scroll-smooth"
            >
                {dangles.map(product => (
                <div key={product.id} className="min-w-[calc(50%-8px)] snap-start md:min-w-0">
                    <ProductCard product={product} />
                </div>
                ))}
            </div>
            </div>
        </section>
      )}

      {/* GLOWING MEMBERSHIP BENEFIT CARD */}
      <section className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center border-2 border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.4)] group mt-12">
         <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-zinc-900"></div>
         <div className="relative z-10 flex flex-col items-center gap-6">
             <div className="bg-purple-600 p-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse">
                 <Crown size={40} className="text-white" />
             </div>
             <h2 className="font-cherry text-3xl md:text-5xl text-white drop-shadow-md">
                 Unlock VIP Pricing
             </h2>
             <p className="text-gray-300 max-w-2xl text-lg leading-relaxed">
                 Join our exclusive membership club to save up to <span className="text-purple-400 font-bold">50% OFF</span> retail prices, receive monthly free gifts, and access members-only collections.
             </p>
             <Link to="/membership" className="px-8 py-4 bg-white text-purple-900 font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2">
                 View Membership Perks <ArrowRight size={20} />
             </Link>
         </div>
      </section>

      {/* Watches Section */}
      {watches.length > 0 && (
        <section id="watches" className="mt-12">
            <div className="flex justify-between items-end mb-6">
                <h2 className="font-cherry text-[22px] font-bold text-white border-l-4 border-yellow-500 pl-4 inline-block">
                Watches
                </h2>
                <Link to="/catalog/watch" className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight size={14} />
                </Link>
            </div>
            
            <div className="relative group/watches">
                <button 
                    onClick={() => scroll(watchesRef, 'left')}
                    className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/watches:opacity-100 transition-opacity focus:opacity-100"
                >
                    <ChevronLeft size={20} />
                </button>
                <button 
                    onClick={() => scroll(watchesRef, 'right')}
                    className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/watches:opacity-100 transition-opacity focus:opacity-100"
                >
                    <ChevronRight size={20} />
                </button>

                <div 
                    ref={watchesRef}
                    className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar scroll-smooth"
                >
                    {watches.map(product => (
                    <div key={product.id} className="min-w-[calc(50%-8px)] snap-start md:min-w-0">
                        <ProductCard product={product} />
                    </div>
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* Jewelry Boxes Section */}
      {boxes.length > 0 && (
        <section id="jewelry-boxes" className="mt-12">
            <div className="flex justify-between items-end mb-6">
                <h2 className="font-cherry text-[22px] font-bold text-white border-l-4 border-orange-500 pl-4 inline-block flex items-center gap-2">
                <Box size={20} /> Jewelry Boxes
                </h2>
                <Link to="/catalog/box" className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight size={14} />
                </Link>
            </div>
            
            <div className="relative group/boxes">
                <button 
                    onClick={() => scroll(boxesRef, 'left')}
                    className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/boxes:opacity-100 transition-opacity focus:opacity-100"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={() => scroll(boxesRef, 'right')}
                    className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/boxes:opacity-100 transition-opacity focus:opacity-100"
                >
                    <ChevronRight size={20} />
                </button>

                <div 
                    ref={boxesRef}
                    className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar scroll-smooth"
                >
                    {boxes.map(product => (
                    <div key={product.id} className="min-w-[calc(50%-8px)] snap-start md:min-w-0">
                        <ProductCard product={product} />
                    </div>
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* Perfume Holders Section */}
      {perfumes.length > 0 && (
        <section id="perfumes" className="mt-12">
            <div className="flex justify-between items-end mb-6">
                <h2 className="font-cherry text-[22px] font-bold text-white border-l-4 border-blue-500 pl-4 inline-block flex items-center gap-2">
                <Droplet size={20} /> Perfume Holders
                </h2>
                <Link to="/catalog/perfume" className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight size={14} />
                </Link>
            </div>
            
            <div className="relative group/perfumes">
                <button 
                    onClick={() => scroll(perfumeRef, 'left')}
                    className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/perfumes:opacity-100 transition-opacity focus:opacity-100"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={() => scroll(perfumeRef, 'right')}
                    className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/perfumes:opacity-100 transition-opacity focus:opacity-100"
                >
                    <ChevronRight size={20} />
                </button>

                <div 
                    ref={perfumeRef}
                    className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar scroll-smooth"
                >
                    {perfumes.map(product => (
                    <div key={product.id} className="min-w-[calc(50%-8px)] snap-start md:min-w-0">
                        <ProductCard product={product} />
                    </div>
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* Jewelry Sets Section */}
      {jewelrySets.length > 0 && (
        <section id="jewelry-sets" className="mt-12">
            <div className="flex justify-between items-end mb-6">
                <h2 className="font-cherry text-[22px] font-bold text-white border-l-4 border-pink-500 pl-4 inline-block">
                Jewelry Sets
                </h2>
                <Link to="/catalog/sets" className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight size={14} />
                </Link>
            </div>
            
            <div className="relative group/sets">
            {/* Mobile Arrows */}
            <button 
                onClick={() => scroll(jewelrySetsRef, 'left')}
                className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/sets:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronLeft size={20} />
            </button>
            <button 
                onClick={() => scroll(jewelrySetsRef, 'right')}
                className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/sets:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronRight size={20} />
            </button>

            {/* Scroll Container */}
            <div 
                ref={jewelrySetsRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar scroll-smooth"
            >
                {jewelrySets.map(product => (
                <div key={product.id} className="min-w-[calc(50%-8px)] snap-start md:min-w-0">
                    <ProductCard product={product} />
                </div>
                ))}
            </div>
            </div>
        </section>
      )}

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section id="new-arrivals" className="mt-12">
            <div className="flex justify-between items-end mb-6">
                <h2 className="font-cherry text-[22px] font-bold text-white border-l-4 border-green-500 pl-4 inline-block">
                New Arrivals
                </h2>
                <Link to="/catalog/new" className="text-cyan-400 font-medium text-sm hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight size={14} />
                </Link>
            </div>

            <div className="relative group/newarrivals">
            {/* Mobile Arrows */}
            <button
                onClick={() => scroll(newArrivalsRef, 'left')}
                className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/newarrivals:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronLeft size={20} />
            </button>
            <button
                onClick={() => scroll(newArrivalsRef, 'right')}
                className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 text-white rounded-full shadow-lg backdrop-blur-sm border border-gray-700 opacity-0 group-hover/newarrivals:opacity-100 transition-opacity focus:opacity-100"
            >
                <ChevronRight size={20} />
            </button>

            {/* Scroll Container */}
            <div
                ref={newArrivalsRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar scroll-smooth"
            >
                {newArrivals.map(product => (
                <div key={product.id} className="min-w-[calc(50%-8px)] snap-start md:min-w-0">
                    <ProductCard product={product} />
                </div>
                ))}
            </div>
            </div>
        </section>
      )}

      {/* Artist Partnership Section */}
      <section className="relative">
        <div className="bg-gradient-to-r from-yellow-900 via-orange-900 to-yellow-900 rounded-2xl p-8 border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Crown className="text-yellow-400 animate-pulse" size={48} />
              <h2 className="font-cherry text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                JOIN OUR ARTIST NETWORK
              </h2>
              <Crown className="text-yellow-400 animate-pulse" size={48} />
            </div>
            <p className="font-architects text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
              Are you a jewelry artist? Showcase your unique creations to over 7,000 collectors worldwide. Only 1% commission on sales!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/artist-partnership"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(250,204,21,0.6)]"
              >
                Start Your Shop <ArrowRight size={18} />
              </Link>
              <p className="text-sm text-gray-300">Starting from {curr === 'ZAR' ? 'R19' : '$1.50'} / month</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
