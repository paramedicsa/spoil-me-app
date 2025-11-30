
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- DATASETS ---

const NAMES_SA = [
    "Thandi", "Jessica", "Precious", "Elize", "Zanele", "Sarah", "Nosipho", "Annelie", 
    "Busi", "Nicole", "Lindiwe", "Megan", "Nompumelelo", "Bianca", "Ayanda", "Michelle",
    "Gugulethu", "Chantelle", "Siphesihle", "Debbie", "Refilwe", "Karen"
];

const NAMES_INDIAN = ["Priya", "Meera", "Anjali", "Deepa", "Lakshmi"]; // 1% target
const NAMES_ASIAN = ["Wei", "Li", "Mei", "Yuki", "Jin"]; // 1% target

const SURNAMES_SA = [
    "Dlamini", "Botha", "Nkosi", "Nel", "Khumalo", "Van Der Merwe", "Molefe", "Smith", 
    "Mthembu", "Coetzee", "Ngcobo", "Fourie", "Mkhize", "Van Wyk", "Zulu", "Kruger"
];
const SURNAMES_INDIAN = ["Naidoo", "Patel", "Govender", "Chetty", "Singh"];
const SURNAMES_ASIAN = ["Chen", "Wang", "Lee", "Zhang", "Liu"];

const LOCATIONS = [
    "Sandton", "Cape Town", "Durban North", "Centurion", "Paarl", "Soweto", 
    "Umhlanga", "Bloemfontein", "Stellenbosch", "George", "Ballito", "Benoni",
    "Midrand", "Somerset West", "Port Elizabeth", "Pretoria East"
];

const SocialProofPopup: React.FC = () => {
  const { products } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  const [currentNotif, setCurrentNotif] = useState<{
      img?: string;
      name: string;
      location: string;
      productName: string;
      productId: string;
      timeAgo: string;
  } | null>(null);

  // Filter eligible products: Stock > 1 AND Sold > 150
  const eligibleProducts = useMemo(() => {
      return products.filter(p => p.stock > 1 && (p.soldCount || 0) > 150);
  }, [products]);

  useEffect(() => {
      if (eligibleProducts.length === 0) return;

      let timeoutId: ReturnType<typeof setTimeout>;

      const triggerPopup = () => {
          // 1. Select Random Product
          const randomProduct = eligibleProducts[Math.floor(Math.random() * eligibleProducts.length)];
          
          // 2. Generate Identity (Weighted)
          const rand = Math.random();
          let firstName = "";
          let surname = "";

          if (rand > 0.99) { 
              // 1% Asian
              firstName = NAMES_ASIAN[Math.floor(Math.random() * NAMES_ASIAN.length)];
              surname = SURNAMES_ASIAN[Math.floor(Math.random() * SURNAMES_ASIAN.length)];
          } else if (rand > 0.98) {
              // 1% Indian
              firstName = NAMES_INDIAN[Math.floor(Math.random() * NAMES_INDIAN.length)];
              surname = SURNAMES_INDIAN[Math.floor(Math.random() * SURNAMES_INDIAN.length)];
          } else {
              // 98% SA General
              firstName = NAMES_SA[Math.floor(Math.random() * NAMES_SA.length)];
              surname = SURNAMES_SA[Math.floor(Math.random() * SURNAMES_SA.length)];
          }

          const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
          const timeAgo = `${Math.floor(Math.random() * 59) + 1} minutes ago`;

          // 3. Construct Data
          // Rule: Pendants & Bracelets = No Image.
          const isNoImage = randomProduct.type === 'Pendant' || randomProduct.type === 'Bracelet';

          setCurrentNotif({
              img: isNoImage ? undefined : randomProduct.images[0],
              name: `${firstName} ${surname.charAt(0)}.`, // Obfuscate surname slightly for privacy feel
              location,
              productName: randomProduct.name,
              productId: randomProduct.id,
              timeAgo
          });

          setIsVisible(true);

          // Hide after 6 seconds
          setTimeout(() => {
              setIsVisible(false);
          }, 6000);

          // Re-trigger after random interval (20s - 45s)
          const nextInterval = Math.floor(Math.random() * (45000 - 20000 + 1) + 20000);
          timeoutId = setTimeout(triggerPopup, nextInterval);
      };

      // Initial trigger delay
      const initialDelay = 5000; 
      timeoutId = setTimeout(triggerPopup, initialDelay);

      return () => clearTimeout(timeoutId);
  }, [eligibleProducts]);

  if (!currentNotif) return null;

  return (
    <div 
        className={`fixed bottom-4 left-4 z-50 max-w-xs w-full transition-all duration-700 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
    >
        <div className="bg-zinc-900/95 backdrop-blur-md border border-gray-800 p-3 rounded-xl shadow-2xl flex items-center gap-3 relative overflow-hidden group">
            {/* Close Button */}
            <button 
                onClick={() => setIsVisible(false)}
                className="absolute top-1 right-1 text-gray-500 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X size={12} />
            </button>

            {/* Image (Conditional) */}
            {currentNotif.img ? (
                <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-700 bg-black">
                    <img src={currentNotif.img} alt="Product" className="w-full h-full object-cover" onError={(e) => { console.warn('Image failed to load in SocialProofPopup:', (e.currentTarget as HTMLImageElement).src); (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/200'; }} />
                </div>
            ) : (
                <div className="w-16 h-16 shrink-0 rounded-lg border border-purple-500/30 bg-purple-900/20 flex items-center justify-center">
                    <span className="font-cherry text-xs text-purple-400 text-center leading-none">Unique<br/>Find</span>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-xs font-bold text-white truncate">{currentNotif.name}</span>
                    <span className="text-[9px] text-gray-400">in {currentNotif.location}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-green-400 font-bold uppercase tracking-wide mb-1">
                    <CheckCircle size={10} /> Verified Purchase
                </div>
                <Link to={`/product/${currentNotif.productId}`} className="block text-xs text-gray-300 hover:text-pink-500 transition-colors truncate line-clamp-2 leading-tight">
                    {currentNotif.productName}
                </Link>
                <div className="text-[9px] text-gray-500 mt-1">
                    {currentNotif.timeAgo}
                </div>
            </div>
        </div>
    </div>
  );
};

export default SocialProofPopup;
