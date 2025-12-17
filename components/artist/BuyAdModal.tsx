import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAdConfig } from '../../hooks/useAdConfig';
import { functions } from '../../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

interface BuyAdModalProps {
  productId: string;
  onClose: () => void;
}

const BuyAdModal: React.FC<BuyAdModalProps> = ({ productId, onClose }) => {
  const { currency, user } = useStore();
  const { packages, socialAddon, loading } = useAdConfig();
  const [selectedPackage, setSelectedPackage] = useState('');
  const [includeSocial, setIncludeSocial] = useState(false);
  const [processing, setProcessing] = useState(false);

  const selectedPkg = packages.find(p => p.id === selectedPackage);
  const totalCost = selectedPkg
    ? (currency === 'ZAR' ? selectedPkg.priceZAR : selectedPkg.priceUSD) +
      (includeSocial ? (currency === 'ZAR' ? socialAddon.priceZAR : socialAddon.priceUSD) : 0)
    : 0;

  const walletBalance = user?.wallet?.available || 0;

  const handlePurchase = async () => {
    if (!selectedPkg) return;

    setProcessing(true);
    try {
      const purchaseAd = httpsCallable(functions, 'purchaseAd');
      // result may be untyped from firebase functions SDK; treat as unknown and guard
      const result: any = await purchaseAd({
        productId,
        packageId: selectedPkg.id,
        includeSocial,
        paymentMethod: 'wallet'
      });
      const success = result?.data?.success;
      const message = result?.data?.message;

      if (success) {
        alert('Ad purchased successfully! Your product is now promoted.');
        onClose();
        // Optionally refresh the page or update state
        window.location.reload();
      } else {
        alert('Purchase failed: ' + (message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert('Purchase failed: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-zinc-900 p-6 rounded-lg">
          <div className="text-white">Loading ad packages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Promote Your Product</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Select Package</label>
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
            >
              <option value="">Choose a package...</option>
              {packages.filter(p => p.active).map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} - {currency === 'ZAR' ? `R${pkg.priceZAR}` : `$${pkg.priceUSD}`}
                </option>
              ))}
            </select>
          </div>

          {socialAddon.enabled && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="social"
                checked={includeSocial}
                onChange={(e) => setIncludeSocial(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="social" className="text-sm text-zinc-300">
                Include Social Media Promotion (+{currency === 'ZAR' ? `R${socialAddon.priceZAR}` : `$${socialAddon.priceUSD}`})
              </label>
            </div>
          )}

          {selectedPkg && (
            <div className="bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-bold text-yellow-400 mb-2">{selectedPkg.name}</h3>
              <p className="text-sm text-zinc-400 mb-2">{selectedPkg.benefit}</p>
              <p className="text-sm text-zinc-400">Duration: {selectedPkg.durationDays} days</p>
              {includeSocial && (
                <p className="text-sm text-zinc-400">Social Reach: {socialAddon.reachCount.toLocaleString()} people</p>
              )}
            </div>
          )}

          {selectedPkg && (
            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-300">Package Cost:</span>
                <span className="text-white">
                  {currency === 'ZAR' ? `R${selectedPkg.priceZAR}` : `$${selectedPkg.priceUSD}`}
                </span>
              </div>
              {includeSocial && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-300">Social Add-on:</span>
                  <span className="text-white">
                    {currency === 'ZAR' ? `R${socialAddon.priceZAR}` : `$${socialAddon.priceUSD}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center font-bold text-yellow-400 border-t border-zinc-700 pt-2">
                <span>Total:</span>
                <span>{currency === 'ZAR' ? `R${totalCost}` : `$${totalCost}`}</span>
              </div>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-zinc-300">Your Balance:</span>
                <span className={walletBalance >= totalCost ? 'text-green-400' : 'text-red-400'}>
                  {currency === 'ZAR' ? `R${walletBalance}` : `$${walletBalance}`}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
            {walletBalance >= totalCost ? (
              <button
                onClick={handlePurchase}
                disabled={processing || !selectedPkg}
                className="flex-1 bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Pay with Wallet'}
              </button>
            ) : (
              <button
                onClick={() => alert('Insufficient funds. Please top up your wallet or contact support.')}
                className="flex-1 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Insufficient Funds
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyAdModal;
