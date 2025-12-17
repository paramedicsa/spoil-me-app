import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Crown, Info, ShoppingCart, Lock, Filter, SortAsc, AlertTriangle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Vault: React.FC = () => {
  const { user, currency: curr, addToCart, products } = useStore();
  const navigate = useNavigate();
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Load vault items
  useEffect(() => {
    const saved = localStorage.getItem('vaultItems');
    if (saved) {
      const items = JSON.parse(saved).filter((item: any) => item.isActive);
      setVaultItems(items);
      setFilteredItems(items);
    }
  }, []);

  // Filter and sort items
  useEffect(() => {
    let filtered = vaultItems;

    if (selectedType) {
      filtered = filtered.filter(item => item.productName.toLowerCase().includes(selectedType.toLowerCase()));
    }

    if (selectedColor) {
      filtered = filtered.filter(item => item.productName.toLowerCase().includes(selectedColor.toLowerCase()));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (curr === 'ZAR' ? a.vaultPriceZAR : a.vaultPriceUSD) - (curr === 'ZAR' ? b.vaultPriceZAR : b.vaultPriceUSD);
        case 'price-high':
          return (curr === 'ZAR' ? b.vaultPriceZAR : b.vaultPriceUSD) - (curr === 'ZAR' ? a.vaultPriceZAR : a.vaultPriceUSD);
        case 'newest':
        default:
          return new Date(b.goLiveDate).getTime() - new Date(a.goLiveDate).getTime();
      }
    });

    setFilteredItems(filtered);
  }, [vaultItems, selectedType, selectedColor, sortBy, curr]);

  const isDeluxeMember = user.membershipType === 'deluxe' || user.membershipType === 'Deluxe';

  const handleAddToCart = (item: any) => {
    if (!isDeluxeMember) {
      setSelectedItem(item);
      setShowUpsellModal(true);
      return;
    }

    // Check monthly limit based on membership duration
    const membershipMonths = user.membershipMonths || 0;
    let userLimit = 5; // Default for new members
    if (membershipMonths >= 3) userLimit = 10; // Month 4+: Unlimited (represented as 10 for UI)
    else if (membershipMonths >= 2) userLimit = 7; // Month 2-3: 7 items
    // Month 1: 5 items (default)

    const monthlyPurchases = JSON.parse(localStorage.getItem(`vaultPurchases_${user.id}_${new Date().getMonth()}`) || '[]');

    if (monthlyPurchases.length >= userLimit) {
      const message = membershipMonths >= 3
        ? "You have reached your monthly limit of 10 Vault items. Keep your subscription active for unlimited access!"
        : `You have reached your limit of ${userLimit} Vault items this month. Keep your subscription to unlock ${membershipMonths >= 2 ? 'unlimited' : '7'} items next month!`;
      alert(message);
      return;
    }

    // Add to cart
    addToCart({
      id: item.id,
      name: item.productName,
      price: curr === 'ZAR' ? item.vaultPriceZAR : item.vaultPriceUSD,
      image: item.productImage,
      quantity: 1,
      vaultItem: true
    });

    // Track purchase
    monthlyPurchases.push(item.id);
    localStorage.setItem(`vaultPurchases_${user.id}_${new Date().getMonth()}`, JSON.stringify(monthlyPurchases));

    alert('Added to cart!');
  };

  const handleUpsellAction = (action: 'subscribe' | 'payfull') => {
    setShowUpsellModal(false);
    if (action === 'subscribe') {
      navigate('/membership');
    } else {
      // In real app, redirect to regular product page
      alert('Redirecting to regular product page...');
    }
  };

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Crown className="text-yellow-400" size={40} />
          <h1 className="font-cherry text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
            THE SECRET VAULT
          </h1>
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Info size={20} />
          </button>
        </div>

        <p className="font-architects text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
          Exclusive Clearance & Samples for Deluxe Members.
        </p>

        {/* Tooltip */}
        {showTooltip && (
          <div className="bg-zinc-900 border border-cyan-500/30 p-4 rounded-lg max-w-md mx-auto text-left">
            <h4 className="text-cyan-400 font-bold mb-2">How The Vault Works:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• <strong className="text-white">Exclusive Access:</strong> Only Deluxe Members can purchase.</li>
              <li>• <strong className="text-white">Loyalty Limits:</strong> Month 1 members can buy 5 items. Limits increase every month.</li>
              <li>• <strong className="text-white">First Come, First Serve:</strong> Stock is limited. Once it's gone, it's gone.</li>
              <li>• <strong className="text-white">As-Is:</strong> Items may be samples or have minor imperfections.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Filters & Sort */}
      <div className="bg-zinc-900 border border-gray-700 p-4 rounded-xl sticky top-4 z-10">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-zinc-800 border border-gray-600 rounded p-2 text-white text-sm"
              >
                <option value="">All Types</option>
                <option value="earring">Earrings</option>
                <option value="ring">Rings</option>
                <option value="necklace">Necklaces</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Color</label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="bg-zinc-800 border border-gray-600 rounded p-2 text-white text-sm"
              >
                <option value="">All Colors</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="rose">Rose Gold</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-800 border border-gray-600 rounded p-2 text-white text-sm"
            >
              <option value="newest">Newest Added</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-zinc-900 border border-gray-700 rounded-xl p-4 hover:border-cyan-500/50 transition-colors">
            <div className="relative">
              <img src={item.productImage} className="w-full h-48 object-cover rounded-lg mb-4" alt="" />
              {item.vaultStock < 5 && (
                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                  Almost Gone!
                </div>
              )}
            </div>

            <h3 className="text-white font-medium mb-2">{item.productName}</h3>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-green-400">
                {curr === 'ZAR' ? `R${item.vaultPriceZAR}` : `$${item.vaultPriceUSD}`}
              </span>
              <span className="text-gray-500 line-through text-sm">
                {(() => {
                  const originalProduct = products.find(p => p.id === item.productId);
                  if (originalProduct) {
                    return curr === 'ZAR' ? `R${originalProduct.price}` : `$${originalProduct.priceUSD}`;
                  }
                  return curr === 'ZAR' ? `R${item.vaultPriceZAR * 10}` : `$${item.vaultPriceUSD * 10}`;
                })()}
              </span>
            </div>

            <div className="text-xs text-gray-400 mb-4">
              Stock: {item.vaultStock} left
            </div>

            <button
              onClick={() => handleAddToCart(item)}
              className={`w-full py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
                isDeluxeMember
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
              }`}
            >
              {isDeluxeMember ? (
                <>
                  <ShoppingCart size={16} />
                  ADD TO CART
                </>
              ) : (
                <>
                  <Lock size={16} />
                  🔒 UNLOCK PRICE
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <Crown size={64} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">The Vault is Empty</h3>
          <p className="text-gray-500">Check back later for exclusive deals!</p>
        </div>
      )}

      {/* Upsell Modal */}
      {showUpsellModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowUpsellModal(false)} />
          <div className="relative bg-zinc-900 border-2 border-pink-500 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(236,72,153,0.4)]">
            <button
              onClick={() => setShowUpsellModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <Lock size={48} className="mx-auto mb-4 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white mb-2">🔒 Access Denied</h2>
              <p className="text-gray-300">
                You have found The Secret Vault, but you don't have the key!
              </p>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-4 mb-4">
                <img src={selectedItem.productImage} className="w-16 h-16 rounded object-cover" alt="" />
                <div>
                  <h4 className="text-white font-medium">{selectedItem.productName}</h4>
                  <p className="text-green-400 font-bold">
                    Vault Price: {curr === 'ZAR' ? `R${selectedItem.vaultPriceZAR}` : `$${selectedItem.vaultPriceUSD}`}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-300">
                This <strong>{curr === 'ZAR' ? `R${selectedItem.vaultPriceZAR}` : `$${selectedItem.vaultPriceUSD}`}</strong> deal is reserved exclusively for Deluxe Members.
              </p>
            </div>

            <p className="text-gray-300 text-sm mb-6">
              Want this item? Subscribe to the Deluxe Package today and get instant access to the Vault, plus R150 monthly store credit.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleUpsellAction('subscribe')}
                className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-lg transition-colors"
              >
                BECOME A DELUXE MEMBER - R199 / $25
              </button>
              <button
                onClick={() => handleUpsellAction('payfull')}
                className="w-full py-2 text-gray-400 hover:text-white text-sm underline"
              >
                No thanks, I'll pay full price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vault;
