// filepath: c:\Users\param\appspoilme\pages/AffiliateLandingPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { ShoppingCart, Heart, Star, ArrowRight, Target, Percent } from 'lucide-react';

const AffiliateLandingPage: React.FC = () => {
  const { affiliateCode } = useParams<{ affiliateCode: string }>();
  const { products, currency, addToCart, toggleWishlist } = useStore();
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAffiliateStore = async () => {
      try {
        // In a real implementation, you'd fetch affiliate data from Firestore
        // For now, we'll simulate with local data
        const mockAffiliateData = {
          code: affiliateCode,
          name: 'Sarah Johnson', // This would come from Firestore
          currency: 'ZAR',
          storeConfig: {
            products: ['product1', 'product2', 'product3', 'product4', 'product5'], // Mock product IDs
            strategy: { discount: 10, commission: 15 },
            currency: 'ZAR'
          }
        };

        setAffiliateData(mockAffiliateData);

        // Filter products based on affiliate's selection
        const selectedProducts = products.filter(p =>
          mockAffiliateData.storeConfig.products.includes(p.id)
        );
        setStoreProducts(selectedProducts);

        // Track referral (localStorage)
        const trackingData = {
          code: mockAffiliateData.code,
          discountPercent: mockAffiliateData.storeConfig.strategy.discount,
          commissionPercent: mockAffiliateData.storeConfig.strategy.commission,
          currency: mockAffiliateData.currency,
          expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        };
        localStorage.setItem('spoilme_referral', JSON.stringify(trackingData));

      } catch (error) {
        console.error('Error loading affiliate store:', error);
      } finally {
        setLoading(false);
      }
    };

    if (affiliateCode) {
      loadAffiliateStore();
    }
  }, [affiliateCode, products]);

  const getDiscountedPrice = (product: Product) => {
    if (!affiliateData?.storeConfig?.strategy) return product.price;
    const discountAmount = product.price * (affiliateData.storeConfig.strategy.discount / 100);
    return product.price - discountAmount;
  };

  const getDiscountedPriceUSD = (product: Product) => {
    if (!affiliateData?.storeConfig?.strategy) return product.priceUSD;
    const discountAmount = product.priceUSD * (affiliateData.storeConfig.strategy.discount / 100);
    return product.priceUSD - discountAmount;
  };

  const handleAddToCart = (product: Product) => {
    // addToCart accepts product and optional cart options in the store
    addToCart(product, {
      quantity: 1,
      price: getDiscountedPrice(product),
      priceUSD: getDiscountedPriceUSD(product)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading VIP store...</p>
        </div>
      </div>
    );
  }

  if (!affiliateData || storeProducts.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">VIP Store Not Found</h1>
          <p className="text-gray-400 mb-6">This affiliate store is not available or has been deactivated.</p>
          <Link to="/" className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg">
            Shop Regular Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-pink-900/30 border border-pink-500/50 text-pink-400 px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Target size={16} /> VIP ACCESS
            </div>
            <h1 className="text-4xl md:text-6xl font-cherry text-white mb-4">
              Welcome to {affiliateData.name}'s VIP Collection
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Exclusive {affiliateData.storeConfig.strategy.discount}% OFF everything in this curated collection
            </p>
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 inline-block">
              <div className="flex items-center gap-2 text-yellow-400">
                <Percent size={20} />
                <span className="font-bold">
                  {affiliateData.storeConfig.strategy.discount}% Discount Applied Automatically
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {storeProducts.map(product => (
            <div key={product.id} className="bg-zinc-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-pink-500/50 transition-all group">
              <div className="relative">
                <Link to={`/product/${product.slug}`}>
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <div className="absolute top-4 left-4">
                  <div className="bg-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {affiliateData.storeConfig.strategy.discount}% OFF
                  </div>
                </div>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart size={20} />
                </button>
              </div>

              <div className="p-6">
                <Link to={`/product/${product.slug}`}>
                  <h3 className="text-lg font-bold text-white mb-2 hover:text-pink-400 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-gray-400 mb-4">{product.category}</p>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">(4.8)</span>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <span className="text-lg font-bold text-green-400">
                    {currency === 'ZAR'
                      ? `R${getDiscountedPrice(product)}`
                      : `$${getDiscountedPriceUSD(product)}`
                    }
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {currency === 'ZAR' ? `R${product.price}` : `$${product.priceUSD}`}
                  </span>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-zinc-900/50 border border-gray-800 rounded-2xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Didn't find what you love?</h2>
            <p className="text-gray-400 mb-6">
              Browse our full collection and enjoy {affiliateData.storeConfig.strategy.discount}% OFF on everything!
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              Browse Full Catalog <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateLandingPage;
