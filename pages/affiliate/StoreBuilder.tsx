// filepath: c:\Users\param\appspoilme\pages\affiliate\StoreBuilder.tsx
import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { TIER_CONFIG, getTierFromSales } from '../../utils/affiliateConfig';
import { Search, Plus, Minus, Target, DollarSign, Percent, Save, Eye, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const StoreBuilder: React.FC = () => {
  const { user, products, currency, updateUser } = useStore();
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<{ discount: number; commission: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get user's tier
  const userTier = getTierFromSales(user.affiliateStats?.totalSalesValue || 0);
  const tierConfig = TIER_CONFIG[userTier];

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addProduct = (product: Product) => {
    if (selectedProducts.length < 5 && !selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleSave = async () => {
    if (selectedProducts.length !== 5 || !selectedStrategy) return;

    setIsSaving(true);
    try {
      const storeConfig = {
        products: selectedProducts.map(p => p.id),
        strategy: selectedStrategy,
        currency: user.affiliateCurrency,
        lastUpdated: new Date().toISOString()
      };

      await updateUser({ affiliateStoreConfig: storeConfig });
      alert('Store configuration saved successfully!');
    } catch (error) {
      console.error('Error saving store config:', error);
      alert('Failed to save store configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const getDiscountedPrice = (product: Product) => {
    if (!selectedStrategy) return product.price;
    const discountAmount = product.price * (selectedStrategy.discount / 100);
    return product.price - discountAmount;
  };

  const getDiscountedPriceUSD = (product: Product) => {
    if (!selectedStrategy) return product.priceUSD;
    const discountAmount = product.priceUSD * (selectedStrategy.discount / 100);
    return product.priceUSD - discountAmount;
  };

  if (!user.affiliateStats?.status === 'approved') {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-400">You need to be an approved affiliate to access this page.</p>
        <Link to="/affiliate" className="inline-block mt-4 px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg">
          Go to Affiliate Program
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/affiliate" className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">VIP Store Builder</h1>
          <p className="text-gray-400">Create your personalized affiliate storefront with 5 curated products.</p>
        </div>
      </div>

      {/* Tier Info */}
      <div className="bg-zinc-900/50 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-yellow-900/20 rounded-lg text-yellow-400">
            <Target size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your Current Tier: {userTier.toUpperCase()}</h3>
            <p className="text-sm text-gray-400">
              Max Commission: {tierConfig.max}% | Available Strategies: {tierConfig.options.length}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tierConfig.options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedStrategy(option)}
              className={`p-4 rounded-lg border transition-all ${
                selectedStrategy?.discount === option.discount && selectedStrategy?.commission === option.commission
                  ? 'bg-pink-900/20 border-pink-500 text-pink-400'
                  : 'bg-zinc-800 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">
                  {option.discount}% OFF / {option.commission}% Commission
                </div>
                <div className="text-xs text-gray-500">
                  Give customers {option.discount}% discount, earn {option.commission}% commission
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Selection */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Select 5 Products ({selectedProducts.length}/5)</h2>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-pink-500 outline-none"
              />
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto space-y-3 custom-scrollbar">
            {filteredProducts.slice(0, 20).map(product => {
              const isSelected = selectedProducts.find(p => p.id === product.id);
              return (
                <div key={product.id} className={`p-4 rounded-lg border transition-all ${
                  isSelected ? 'bg-pink-900/10 border-pink-500' : 'bg-zinc-900 border-gray-800'
                }`}>
                  <div className="flex items-center gap-4">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-700"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-sm">{product.name}</h3>
                      <p className="text-xs text-gray-400">{product.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-green-400">
                          {currency === 'ZAR' ? `R${product.price}` : `$${product.priceUSD}`}
                        </span>
                        {selectedStrategy && (
                          <span className="text-xs text-pink-400">
                            → {currency === 'ZAR' ? `R${getDiscountedPrice(product)}` : `$${getDiscountedPriceUSD(product)}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => isSelected ? removeProduct(product.id) : addProduct(product)}
                      className={`p-2 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : selectedProducts.length >= 5
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-pink-600 hover:bg-pink-500 text-white'
                      }`}
                      disabled={!isSelected && selectedProducts.length >= 5}
                    >
                      {isSelected ? <Minus size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Products Preview */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Your VIP Store Preview</h2>
            <p className="text-sm text-gray-400">
              This is how your storefront will appear to customers visiting your affiliate link.
            </p>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="bg-zinc-900/50 border border-dashed border-gray-700 rounded-xl p-8 text-center">
              <Target size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-400 mb-2">No Products Selected</h3>
              <p className="text-sm text-gray-500">Choose 5 products from the left to build your VIP store.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedProducts.map(product => (
                <div key={product.id} className="bg-zinc-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-20 h-20 rounded-lg object-cover border border-gray-700"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{product.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{product.category}</p>
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <span className="text-gray-500 line-through">
                            {currency === 'ZAR' ? `R${product.price}` : `$${product.priceUSD}`}
                          </span>
                          <span className="text-green-400 font-bold ml-2">
                            {currency === 'ZAR' ? `R${getDiscountedPrice(product)}` : `$${getDiscountedPriceUSD(product)}`}
                          </span>
                        </div>
                        {selectedStrategy && (
                          <div className="text-xs bg-pink-900/20 text-pink-400 px-2 py-1 rounded">
                            {selectedStrategy.discount}% OFF
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {selectedProducts.length === 5 && selectedStrategy && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <Eye size={20} className="text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-400">Store Ready!</h3>
                      <p className="text-sm text-green-300">
                        Your VIP store is configured. Customers will see {selectedStrategy.discount}% off these products and you'll earn {selectedStrategy.commission}% commission.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
                  >
                    {isSaving ? 'Saving...' : 'Save Store Configuration'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreBuilder;
