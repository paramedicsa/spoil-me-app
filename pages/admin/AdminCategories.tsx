
import React, { useRef, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Category } from '../../types';
import { ArrowUp, ArrowDown, X, Upload, Plus, Loader2 } from 'lucide-react';
import { uploadFile } from '@repo/utils/supabaseClient';

const AdminCategories: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, replaceCategories } = useStore();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newCategories.length) {
      [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
      replaceCategories(newCategories);
    }
  };

  const handleImageUpload = async (id: string, file: File) => {
    if (!file) return;

    // Try uploading to Supabase Storage (fallback to Base64 if offline)
    try {
      setUploadingId(id);
      const timestamp = Date.now();
      const path = `categories/${id}/${timestamp}_${file.name}`;
      const url = await uploadFile('categories', path, file);
      const category = categories.find(c => c.id === id);
      if (category) updateCategory({ ...category, image: url });
      setUploadingId(null);
      return;
    } catch (err) {
      console.warn('Supabase upload failed, falling back to base64:', err);
    }

    // 2. Fallback: Local Base64 (Demo Mode or Offline)
    const reader = new FileReader();
    reader.onloadend = () => {
      const category = categories.find(c => c.id === id);
      if (category && typeof reader.result === 'string') {
        updateCategory({ ...category, image: reader.result });
      }
      setUploadingId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleNewCategory = () => {
    addCategory({
      id: `cat_${Date.now()}`,
      name: 'New Collection',
      image: 'https://picsum.photos/400/400?grayscale', // Placeholder
      description: ''
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-[22px] font-bold text-white">Category Management</h1>
        <button 
          onClick={handleNewCategory}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-500 transition-colors text-sm"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="space-y-4">
        {categories.map((cat, index) => (
          <div key={cat.id} className="flex items-center gap-4 bg-zinc-900 p-4 rounded-xl border border-gray-800 shadow-sm animate-in fade-in">
            
            {/* Reorder Controls */}
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => handleMove(index, 'up')}
                disabled={index === 0}
                className={`p-1 rounded hover:bg-gray-800 ${index === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
              >
                <ArrowUp size={18} />
              </button>
              <button 
                onClick={() => handleMove(index, 'down')}
                disabled={index === categories.length - 1}
                className={`p-1 rounded hover:bg-gray-800 ${index === categories.length - 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
              >
                <ArrowDown size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Name Input */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Collection Name</label>
                <input 
                  type="text" 
                  value={cat.name}
                  onChange={(e) => updateCategory({ ...cat, name: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Image Upload */}
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className={`w-12 h-12 rounded object-cover bg-zinc-800 border border-gray-700 ${uploadingId === cat.id ? 'opacity-50' : ''}`}
                  />
                  {uploadingId === cat.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin text-pink-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                   <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Cover Image</label>
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => fileInputRefs.current[cat.id]?.click()}
                        disabled={uploadingId === cat.id}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-xs rounded border border-gray-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingId === cat.id ? 'Uploading...' : 'Change Image'}
                      </button>
                      <input 
                        type="file" 
                        ref={(el) => { fileInputRefs.current[cat.id] = el; }}
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => e.target.files && handleImageUpload(cat.id, e.target.files[0])}
                      />
                   </div>
                </div>
              </div>

            </div>

            {/* Delete */}
            <div className="ml-2">
               <button 
                 onClick={() => { if(window.confirm('Delete this category?')) deleteCategory(cat.id); }}
                 className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-all"
               >
                 <X size={20} />
               </button>
            </div>

          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No categories found. Click "Add Category" to start.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
