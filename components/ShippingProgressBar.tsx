import React from 'react';
import { Truck, ArrowRight, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const FREE_SHIPPING_THRESHOLD = 500;

interface ShippingProgressBarProps {
  subtotal: number;
  isSticky?: boolean;
  onContinueShopping?: () => void;
  onClose?: () => void;
}

const ShippingProgressBar: React.FC<ShippingProgressBarProps> = ({
  subtotal,
  isSticky = false,
  onContinueShopping,
  onClose,
}) => {
  const { currency: curr } = useStore();

  // Hide the shipping progress bar for USD currency (international shipping)
  if (curr === 'USD') {
    return null;
  }

  const getCurrencySymbol = () => curr === 'ZAR' ? 'R' : '$';
  const getPrice = (zarPrice: number, usdPrice?: number) => curr === 'ZAR' ? zarPrice : (usdPrice ?? zarPrice);

  const threshold = getPrice(FREE_SHIPPING_THRESHOLD);
  const amountLeft = threshold - subtotal;
  const progress = Math.min((subtotal / threshold) * 100, 100);
  const isFreeShipping = subtotal >= threshold;

  const message = isFreeShipping
    ? "Congratulations! You've unlocked FREE shipping!"
    : `You're ${getCurrencySymbol()}${getPrice(amountLeft).toFixed(2)} away from free shipping!`;

  if (isSticky) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-gray-800 p-3 z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="p-2 bg-pink-900/20 text-pink-500 rounded-full border border-pink-500/30">
            <Truck size={20} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-bold ${isFreeShipping ? 'text-green-400' : 'text-white'}`}>
              {message}
            </p>
            <div className="w-full bg-black/50 rounded-full h-2 mt-1 overflow-hidden border border-gray-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isFreeShipping ? 'bg-green-500' : 'bg-pink-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-black border border-pink-500/30 rounded-2xl p-6 shadow-lg mb-8">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="p-3 bg-pink-900/30 text-pink-400 rounded-full border border-pink-500/30">
          <Truck size={28} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className={`text-lg font-bold ${isFreeShipping ? 'text-green-400' : 'text-white'}`}>
            {message}
          </h3>
          <div className="w-full bg-black rounded-full h-2.5 mt-2 overflow-hidden border border-gray-700 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFreeShipping ? 'bg-green-500' : 'bg-pink-500'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {!isFreeShipping && (
          <button
            onClick={onContinueShopping}
            className="w-full md:w-auto mt-2 md:mt-0 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            Continue Shopping <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ShippingProgressBar;
