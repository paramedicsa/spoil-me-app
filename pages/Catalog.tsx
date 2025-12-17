import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { ArrowLeft, SlidersHorizontal, Check } from 'lucide-react';

const Catalog: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const { products, categories } = useStore();
  
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [filterPromo, setFilterPromo] = useState(false);
  const [filterColor, setFilterColor] = useState<string>('');
  const [filterCollection, setFilterCollection] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    window.scrollTo(0, 0);
    setFilterPromo(false);
    setFilterColor('');
    setFilterCollection('');
    setSortBy('newest');
    setCurrentPage(1); // Reset to first page when type changes
  }, [type]);

  const { title, baseProducts } = useMemo(() => {
    let t = '';
    let p = [];
    
    switch(type) {
        case 'stud':
            t = 'Stud Earrings';
            p = products.filter(prod => prod.type === 'Stud' || prod.isFeaturedStud);
            break;
        case 'dangle':
            t = 'Dangle Earrings';
            p = products.filter(prod => prod.type === 'Dangle' || prod.isFeaturedDangle);
            break;
        case 'ring':
            t = 'Rings';
            p = products.filter(prod => prod.type === 'Ring');
            break;
        case 'unique':
            t = 'Unique Pendants';
            p = products.filter(prod => prod.isUniquePendant);
            break;
        case 'bracelet':
            t = 'Bracelets';
            p = products.filter(prod => prod.type === 'Bracelet' || prod.isFeaturedBracelet);
            break;
        case 'watch':
            t = 'Watches';
            p = products.filter(prod => prod.isFeaturedWatch);
            break;
        case 'best':
            t = 'Best Sellers';
            p = products.filter(prod => prod.isBestSeller);
            break;
        case 'sets':
            t = 'Jewelry Sets';
            p = products.filter(prod => prod.isJewelrySet);
            break;
        default:
            t = 'Catalog';
            p = products;
    }
    return { title: t, baseProducts: p };
  }, [type, products]);

  const availableColors = useMemo(() => {
      const colors = new Set<string>();
      baseProducts.forEach(p => {
          p.colors?.forEach(c => colors.add(c));
      });
      return Array.from(colors).sort();
  }, [baseProducts]);

  const filteredProducts = useMemo(() => {
      let result = [...baseProducts];

      if (filterPromo) {
          const now = new Date();
          result = result.filter(p => {
             const promoStart = p.promoStartsAt ? new Date(p.promoStartsAt) : null;
             const promoExpiry = p.promoExpiresAt ? new Date(p.promoExpiresAt) : null;
             const isActive = (p.promoPrice || 0) > 0 
                && (!promoStart || promoStart <= now) 
                && (!promoExpiry || promoExpiry > now);
             return isActive;
          });
      }

      if (filterColor) {
          result = result.filter(p => p.colors?.includes(filterColor));
      }

      if (filterCollection) {
          result = result.filter(p => p.category === filterCollection);
      }

      result.sort((a, b) => {
          if (sortBy === 'price_asc') return a.price - b.price;
          if (sortBy === 'price_desc') return b.price - a.price;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return result;
  }, [baseProducts, filterPromo, filterColor, filterCollection, sortBy]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="space-y-8 pb-12 min-h-screen">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
          <div>
             <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <Link to="/" className="hover:text-white flex items-center gap-1"><ArrowLeft size={12} /> Home</Link>
                <span>/</span>
                <span className="text-pink-500 font-bold">{title}</span>
             </div>
             <h1 className="font-cherry text-3xl md:text-4xl text-white">{title}</h1>
             <p className="text-gray-400 text-sm mt-1">{filteredProducts.length} Items Found</p>
          </div>

          <button 
            className="md:hidden flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded text-white text-sm w-fit"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={16} /> Filters & Sort
          </button>

          <div className={`flex-col md:flex-row gap-4 items-start md:items-center bg-zinc-900/80 p-4 rounded-xl border border-gray-800 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
             
             <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase font-bold">Sort:</span>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-black border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-pink-500 outline-none"
                >
                   <option value="newest">Newest</option>
                   <option value="price_asc">Price Low-High</option>
                   <option value="price_desc">Price High-Low</option>
                </select>
             </div>

             <label className="flex items-center gap-2 cursor-pointer select-none bg-black border border-gray-700 px-3 py-1 rounded hover:border-pink-500 transition-colors">
                <input 
                   type="checkbox" 
                   checked={filterPromo}
                   onChange={e => setFilterPromo(e.target.checked)}
                   className="hidden" 
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${filterPromo ? 'bg-pink-600 border-pink-600' : 'border-gray-500'}`}>
                   {filterPromo && <Check size={10} className="text-white" />}
                </div>
                <span className={`text-sm ${filterPromo ? 'text-pink-400 font-bold' : 'text-gray-300'}`}>Promotions</span>
             </label>

             <select 
               value={filterCollection}
               onChange={e => setFilterCollection(e.target.value)}
               className="bg-black border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-pink-500 outline-none max-w-[150px]"
             >
                <option value="">All Collections</option>
                {categories.map(c => (
                   <option key={c.id} value={c.name}>{c.name}</option>
                ))}
             </select>
             
             {availableColors.length > 0 && (
                <select 
                    value={filterColor}
                    onChange={e => setFilterColor(e.target.value)}
                    className="bg-black border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-pink-500 outline-none max-w-[150px]"
                >
                    <option value="">All Colors</option>
                    {availableColors.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
             )}
             
             {(filterPromo || filterColor || filterCollection) && (
                <button onClick={() => { setFilterPromo(false); setFilterColor(''); setFilterCollection(''); }} className="text-xs text-red-400 hover:text-red-300 underline">
                   Clear
                </button>
             )}
          </div>
       </div>

       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {paginatedProducts.map(product => (
             <ProductCard key={product.id} product={product} />
          ))}
       </div>

       {filteredProducts.length === 0 && (
          <div className="py-20 text-center bg-zinc-900/30 rounded-xl border border-dashed border-gray-800">
             <p className="text-gray-400">No products found matching your filters.</p>
             <button onClick={() => { setFilterPromo(false); setFilterColor(''); setFilterCollection(''); }} className="mt-4 text-pink-500 font-bold hover:underline">
                Clear Filters
             </button>
          </div>
       )}

       {totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-400 mt-8">
             <div>
                Page {currentPage} of {totalPages}
             </div>
             <div className="flex gap-2">
                <button
                   onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                   className="bg-black border border-gray-700 rounded px-3 py-1 hover:bg-gray-800 transition-colors disabled:opacity-50"
                   disabled={currentPage === 1}
                >
                   Previous
                </button>
                <button
                   onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                   className="bg-black border border-gray-700 rounded px-3 py-1 hover:bg-gray-800 transition-colors disabled:opacity-50"
                   disabled={currentPage === totalPages}
                >
                   Next
                </button>
             </div>
          </div>
       )}
    </div>
  );
};

export default Catalog;