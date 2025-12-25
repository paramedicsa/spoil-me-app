import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { getDocument, createDocument } from '@repo/utils/supabaseClient';
import { CustomTemplate } from '../types';
import { ArrowLeft, ShoppingCart, Sparkles, Crown } from 'lucide-react';

interface SelectedOptions {
  stone: string;
  wireStyle: string;
  chainLength: string;
}

const CustomPendantBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, addToCart } = useStore();
  const [template, setTemplate] = useState<CustomTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    stone: '',
    wireStyle: '',
    chainLength: ''
  });
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const fetched = await getDocument<CustomTemplate>('custom_templates', id!);
      if (fetched) {
        setTemplate(fetched as CustomTemplate);
      } else {
        navigate('/customized-wire-wrapped-pendants');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      navigate('/customized-wire-wrapped-pendants');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!template) return 0;

    let total = template.basePrice;

    if (selectedOptions.stone) {
      const stone = template.stones.find(s => s.id === selectedOptions.stone);
      if (stone) total += stone.priceModifier;
    }

    if (selectedOptions.wireStyle) {
      const wire = template.wireStyles.find(w => w.id === selectedOptions.wireStyle);
      if (wire) total += wire.priceModifier;
    }

    return total;
  };

  const handleAddToCart = async () => {
    if (!user || !template) return;

    if (!selectedOptions.stone || !selectedOptions.wireStyle || !selectedOptions.chainLength) {
      alert('Please select all options before adding to cart.');
      return;
    }

    setAddingToCart(true);
    try {
      const selectedStone = template.stones.find(s => s.id === selectedOptions.stone);
      const selectedWire = template.wireStyles.find(w => w.id === selectedOptions.wireStyle);

      const customItem = {
        id: `custom-${Date.now()}`,
        code: `CUSTOM-${Date.now()}`,
        name: `${template.name} - Custom`,
        slug: `custom-pendant-${Date.now()}`,
        description: `Custom pendant with ${selectedStone?.name} stone, ${selectedWire?.name} wire style, ${selectedOptions.chainLength} chain`,
        price: calculateTotalPrice(),
        priceUSD: calculateTotalPrice() / 18, // Approximate USD conversion
        costPrice: template.basePrice + (selectedStone?.priceModifier || 0) + (selectedWire?.priceModifier || 0),
        category: 'Custom Pendants',
        type: 'Pendant' as const,
        status: 'published' as const,
        stock: 1,
        images: [template.mainImage],
        tags: ['custom', 'pendant', 'wire-wrapped'],
        createdAt: new Date().toISOString(),
        quantity: 1,
        customOptions: {
          templateId: template.id,
          stone: selectedStone,
          wireStyle: selectedWire,
          chainLength: selectedOptions.chainLength
        },
        isCustom: true
      };

      await createDocument('cart_items', {
        user_id: user.uid,
        product_id: customItem.id,
        ...customItem,
        added_at: new Date().toISOString(),
      });

      addToCart(customItem);
      alert('Custom pendant added to cart!');
      navigate('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold text-xl">Loading custom builder...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Template not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/customized-wire-wrapped-pendants')}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gold">{template.name}</h1>
            <p className="text-gray-400">{template.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden">
              <img
                src={template.mainImage}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Preview of selected options */}
            {selectedOptions.wireStyle && (
              <div className="bg-zinc-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Wire Style Preview</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const wire = template.wireStyles.find(w => w.id === selectedOptions.wireStyle);
                    return wire ? (
                      <>
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Frame Only</p>
                          <img src={wire.imageFrameOnly} alt="Frame" className="w-full aspect-square object-cover rounded" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-2">With Example</p>
                          <img src={wire.imageWithExample} alt="Example" className="w-full aspect-square object-cover rounded" />
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Customization Options */}
          <div className="space-y-6">
            {/* Stone Selection */}
            <div className="bg-zinc-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-gold" />
                Choose Your Stone
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {template.stones.map(stone => (
                  <button
                    key={stone.id}
                    onClick={() => setSelectedOptions(prev => ({ ...prev, stone: stone.id }))}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedOptions.stone === stone.id
                        ? 'border-gold bg-gold/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <img src={stone.image} alt={stone.name} className="w-full aspect-square object-cover rounded mb-2" />
                    <h4 className="font-semibold">{stone.name}</h4>
                    <p className="text-sm text-gray-400">
                      {stone.priceModifier > 0 ? `+R${stone.priceModifier}` : 'No extra cost'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Wire Style Selection */}
            <div className="bg-zinc-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Crown size={20} className="text-gold" />
                Choose Wire Style
              </h3>
              <div className="space-y-4">
                {template.wireStyles.map(wire => (
                  <button
                    key={wire.id}
                    onClick={() => setSelectedOptions(prev => ({ ...prev, wireStyle: wire.id }))}
                    className={`w-full p-4 rounded-lg border-2 transition-colors ${
                      selectedOptions.wireStyle === wire.id
                        ? 'border-gold bg-gold/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-left">{wire.name}</h4>
                        <p className="text-sm text-gray-400">
                          {wire.priceModifier > 0 ? `+R${wire.priceModifier}` : 'No extra cost'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <img src={wire.imageFrameOnly} alt="Frame" className="w-16 h-16 object-cover rounded" />
                        <img src={wire.imageWithExample} alt="Example" className="w-16 h-16 object-cover rounded" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chain Length Selection */}
            <div className="bg-zinc-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Chain Length</h3>
              <div className="grid grid-cols-2 gap-4">
                {template.chainOptions.map((chain, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOptions(prev => ({ ...prev, chainLength: chain }))}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedOptions.chainLength === chain
                        ? 'border-gold bg-gold/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <span className="font-semibold">{chain}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price and Add to Cart */}
            <div className="bg-zinc-900 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg">Total Price:</span>
                <span className="text-2xl font-bold text-gold">R{calculateTotalPrice()}</span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !selectedOptions.stone || !selectedOptions.wireStyle || !selectedOptions.chainLength}
                className="w-full bg-gold text-black font-bold py-4 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
              </button>

              {(!selectedOptions.stone || !selectedOptions.wireStyle || !selectedOptions.chainLength) && (
                <p className="text-sm text-gray-400 mt-2 text-center">
                  Please select all options to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomPendantBuilder;
