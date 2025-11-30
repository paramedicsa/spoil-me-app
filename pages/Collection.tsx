
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { ArrowLeft, Sparkles } from 'lucide-react';

const Collection: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const { products, categories } = useStore();

  // Decode the URL parameter (e.g. "Red%20Collection" -> "Red Collection")
  const decodedCategoryName = decodeURIComponent(categoryName || '');

  const category = categories.find(c => c.name === decodedCategoryName);
  const collectionProducts = products.filter(p => p.category === decodedCategoryName);

  // Scroll to top when collection changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [categoryName]);

  if (!category) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Collection Not Found</h2>
        <Link to="/" className="text-pink-500 hover:text-pink-400 flex items-center gap-2">
          <ArrowLeft size={20} /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Header */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-zinc-900 border border-gray-800 shadow-2xl group">
        <img 
          src={category.image} 
          alt={category.name} 
          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-8 w-full">
           <div className="flex items-center gap-2 mb-2">
             <Link to="/" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft size={12} /> Home
             </Link>
             <span className="text-gray-600">/</span>
             <span className="text-xs text-pink-500 font-bold tracking-wider uppercase">Collection</span>
           </div>
           <h1 className="font-cherry text-4xl md:text-6xl text-white drop-shadow-lg mb-2">
             {category.name}
           </h1>
           {category.description && (
             <p className="text-gray-300 max-w-2xl text-sm md:text-base font-light border-l-4 border-pink-500 pl-4">
               {category.description}
             </p>
           )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Sparkles size={20} className="text-cyan-400" /> 
               Available Treasures ({collectionProducts.length})
            </h2>
         </div>

         {collectionProducts.length > 0 ? (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             {collectionProducts.map(product => (
               <ProductCard key={product.id} product={product} />
             ))}
           </div>
         ) : (
           <div className="py-20 text-center border border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-500">No products found in this collection yet.</p>
              <Link to="/" className="text-pink-500 text-sm mt-4 inline-block hover:underline">Browse other collections</Link>
           </div>
         )}
      </div>

    </div>
  );
};

export default Collection;
