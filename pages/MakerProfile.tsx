import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { Star, Package, TrendingUp, Award, ArrowLeft } from 'lucide-react';

const MakerProfile: React.FC = () => {
  const { makerName } = useParams<{ makerName: string }>();
  const { products } = useStore();
  
  // Decode the URL-encoded maker name
  const decodedMakerName = makerName ? decodeURIComponent(makerName) : '';

  // Filter products by this maker (including sold out ones for stats)
  const makerProducts = useMemo(() => {
    return products.filter(p => 
      (p.madeBy || 'Spoil Me Vintage').toLowerCase() === decodedMakerName.toLowerCase()
    );
  }, [products, decodedMakerName]);

  // Available products (not sold out)
  const availableProducts = useMemo(() => {
    return makerProducts.filter(p => !p.isSoldOut && p.stock > 0 && p.status === 'published');
  }, [makerProducts]);

  // Calculate total items sold
  const totalSold = useMemo(() => {
    return makerProducts.reduce((sum, p) => sum + (p.soldCount || 0), 0);
  }, [makerProducts]);

  // Calculate average rating from all reviews
  const { averageRating, totalReviews } = useMemo(() => {
    let totalRatingSum = 0;
    let reviewCount = 0;

    makerProducts.forEach(product => {
      if (product.reviews && product.reviews.length > 0) {
        product.reviews.forEach(review => {
          totalRatingSum += review.rating;
          reviewCount++;
        });
      }
    });

    const avg = reviewCount > 0 ? (totalRatingSum / reviewCount) : 0;
    return {
      averageRating: avg.toFixed(1),
      totalReviews: reviewCount
    };
  }, [makerProducts]);

  // Calculate stats
  const totalProducts = makerProducts.length;
  const activeListings = availableProducts.length;

  if (!decodedMakerName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Maker Not Found</h2>
          <Link to="/catalog" className="text-cyan-400 hover:text-cyan-300">
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Back Button */}
      <div className="mb-6">
        <Link 
          to="/catalog" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Maker Header */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-gray-800 rounded-2xl p-8 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar/Logo Placeholder */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
            {decodedMakerName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-cherry text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 mb-2">
              {decodedMakerName}
            </h1>
            <p className="text-gray-400 mb-4">
              Handcrafted jewelry and unique pieces made with love
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Average Rating */}
              <div className="bg-zinc-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center gap-2 text-yellow-400 mb-1">
                  <Star size={16} fill="currentColor" />
                  <span className="text-xs text-gray-400">Rating</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {averageRating}
                </div>
                <div className="text-xs text-gray-500">{totalReviews} reviews</div>
              </div>

              {/* Total Sold */}
              <div className="bg-zinc-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center gap-2 text-green-400 mb-1">
                  <TrendingUp size={16} />
                  <span className="text-xs text-gray-400">Sold</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {totalSold}
                </div>
                <div className="text-xs text-gray-500">items</div>
              </div>

              {/* Active Listings */}
              <div className="bg-zinc-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                  <Package size={16} />
                  <span className="text-xs text-gray-400">Available</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {activeListings}
                </div>
                <div className="text-xs text-gray-500">products</div>
              </div>

              {/* Total Products */}
              <div className="bg-zinc-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <Award size={16} />
                  <span className="text-xs text-gray-400">Total</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {totalProducts}
                </div>
                <div className="text-xs text-gray-500">created</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Package size={24} className="text-cyan-400" />
          Available Products
        </h2>
        {availableProducts.length === 0 ? (
          <div className="bg-zinc-900 border border-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No products currently available from this maker.</p>
            <Link to="/catalog" className="text-cyan-400 hover:text-cyan-300">
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {availableProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Previously Sold Section (if any sold out items exist) */}
      {makerProducts.some(p => p.isSoldOut || p.stock === 0) && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-400 mb-4 flex items-center gap-2">
            <Award size={20} className="text-gray-500" />
            Previously Available
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 opacity-60">
            {makerProducts
              .filter(p => p.isSoldOut || p.stock === 0)
              .slice(0, 8)
              .map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MakerProfile;
