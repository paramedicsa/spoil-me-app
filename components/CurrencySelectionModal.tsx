// filepath: c:\Users\param\appspoilme\components/CurrencySelectionModal.tsx
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { AlertTriangle, CheckCircle, DollarSign, MapPin } from 'lucide-react';

interface CurrencySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CurrencySelectionModal: React.FC<CurrencySelectionModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useStore();
  const [selectedCurrency, setSelectedCurrency] = useState<'ZAR' | 'USD' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedCurrency) return;

    setIsSaving(true);
    try {
      await updateUser({
        affiliateCurrency: selectedCurrency,
        currencyLocked: true
      });
      onClose();
    } catch (error) {
      console.error('Error saving currency:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/95 backdrop-blur-xl">
      <div className="bg-zinc-900 border border-pink-500/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(236,72,153,0.3)] animate-in zoom-in-95 duration-300">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-pink-900/20 border-2 border-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign size={32} className="text-pink-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Choose Your Earning Currency</h2>
          <p className="text-gray-400 text-sm">This choice determines how you receive commissions and cannot be changed later.</p>
        </div>

        <div className="space-y-4 mb-6">
          <button
            onClick={() => setSelectedCurrency('ZAR')}
            className={`w-full p-4 rounded-xl border transition-all ${
              selectedCurrency === 'ZAR'
                ? 'bg-green-900/20 border-green-500 text-green-400'
                : 'bg-zinc-800 border-gray-700 text-gray-300 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-900/20 rounded-full flex items-center justify-center">
                <MapPin size={16} className="text-green-400" />
              </div>
              <div className="text-left">
                <div className="font-bold">🇿🇦 South African Rand (ZAR)</div>
                <div className="text-xs text-gray-400">EFT Bank Transfer Payouts</div>
              </div>
              {selectedCurrency === 'ZAR' && <CheckCircle size={20} className="text-green-400 ml-auto" />}
            </div>
          </button>

          <button
            onClick={() => setSelectedCurrency('USD')}
            className={`w-full p-4 rounded-xl border transition-all ${
              selectedCurrency === 'USD'
                ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                : 'bg-zinc-800 border-gray-700 text-gray-300 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-900/20 rounded-full flex items-center justify-center">
                <MapPin size={16} className="text-blue-400" />
              </div>
              <div className="text-left">
                <div className="font-bold">🇺🇸 US Dollar (USD)</div>
                <div className="text-xs text-gray-400">PayPal Payouts</div>
              </div>
              {selectedCurrency === 'USD' && <CheckCircle size={20} className="text-blue-400 ml-auto" />}
            </div>
          </button>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-bold text-sm mb-1">Permanent Choice</h4>
              <p className="text-yellow-300 text-xs">
                Once selected, your currency cannot be changed. Choose based on your payout preferences.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!selectedCurrency || isSaving}
          className="w-full py-3 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg"
        >
          {isSaving ? 'Saving...' : 'Confirm Currency Choice'}
        </button>
      </div>
    </div>
  );
};

export default CurrencySelectionModal;
