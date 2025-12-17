import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { CustomTemplate } from '../types';
import { ArrowLeft, Sparkles, Crown } from 'lucide-react';

const CustomizedWireWrappedPendants: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'custom_templates'));
      const loadedTemplates: CustomTemplate[] = [];
      querySnapshot.forEach((doc) => {
        loadedTemplates.push({ id: doc.id, ...doc.data() } as CustomTemplate);
      });
      setTemplates(loadedTemplates.filter(t => t.isActive !== false));
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold text-xl">Loading custom pendants...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gold flex items-center gap-2">
              <Sparkles size={32} />
              Customized Wire Wrapped Pendants
            </h1>
            <p className="text-gray-400">Design your own unique wire-wrapped pendant</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create Your Perfect Pendant</h2>
          <p className="text-gray-300 mb-4">
            Choose from our selection of premium wire-wrapped pendant templates. Customize with your choice of stones,
            wire styles, and chain lengths to create a truly unique piece of jewelry.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-gold" />
              <span>Premium Materials</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-gold" />
              <span>Custom Design</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-gold" />
              <span>Handcrafted Quality</span>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Custom Templates Available</h3>
            <p className="text-gray-500">Check back soon for new designs!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div
                key={template.id}
                className="bg-zinc-900 rounded-lg overflow-hidden hover:bg-zinc-800 transition-colors cursor-pointer group"
                onClick={() => navigate(`/customized-wire-wrapped-pendants/${template.id}`)}
              >
                <div className="aspect-square bg-zinc-800 overflow-hidden">
                  <img
                    src={template.mainImage}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gold mb-2">{template.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{template.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">From R{template.basePrice}</span>
                    <button className="px-4 py-2 bg-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors">
                      Customize
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomizedWireWrappedPendants;
