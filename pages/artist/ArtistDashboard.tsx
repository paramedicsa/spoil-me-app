import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { queryDocuments, subscribeToTable, createDocument, updateDocument } from '@repo/utils/supabaseClient';
import { Package, Truck, DollarSign, AlertCircle, CheckCircle, Upload, Plus } from 'lucide-react';

interface ArtistProduct {
  id: string;
  artistId: string;
  productId: string;
  name: string;
  images: string[];
  description: string;
  price: number;
  stockLevel: number;
  status: 'pending_approval' | 'approved' | 'rejected' | 'live';
  shippingTracking?: string;
  receivedAtHub?: Date;
  approvedAt?: Date;
  additionalStockFee?: number;
  createdAt: Date;
}

interface ArtistProfile {
  uid: string;
  shopName: string;
  slotLimit: number;
  slotsUsed: number;
  wallet: {
    pending: number;
    available: number;
    currency: 'ZAR' | 'USD';
  };
  status: 'active' | 'suspended';
  isFirstTime?: boolean;
}

const ArtistDashboard: React.FC = () => {
  const { user } = useStore();
  const [products, setProducts] = useState<ArtistProduct[]>([]);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    price: 0,
    images: [] as string[],
    shippingTracking: ''
  });
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({});
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductsForStock, setSelectedProductsForStock] = useState<{[productId: string]: number}>({});
  const [shippingTracking, setShippingTracking] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      // Load artist profile
      const profile = await queryDocuments<any>('artists', { filters: { uid: user.id }, limit: 1 });
      if (profile && profile.length > 0) setArtistProfile(profile[0] as ArtistProfile);

      // Load products
      const prods = await queryDocuments<any>('artist_products', { filters: { artist_id: user.id } });
      setProducts((prods || []).map((p: any) => ({ id: p.id, ...p, createdAt: p.created_at ? new Date(p.created_at) : new Date(), receivedAtHub: p.received_at_hub ? new Date(p.received_at_hub) : null, approvedAt: p.approved_at ? new Date(p.approved_at) : null })));
      setLoading(false);
    };

    load();

    const unsubProfile = subscribeToTable('artists', async () => {
      const profile = await queryDocuments<any>('artists', { filters: { uid: user.id }, limit: 1 });
      if (profile && profile.length > 0) setArtistProfile(profile[0] as ArtistProfile);
    });

    const unsubProducts = subscribeToTable('artist_products', async () => {
      const prods = await queryDocuments<any>('artist_products', { filters: { artist_id: user.id } });
      setProducts((prods || []).map((p: any) => ({ id: p.id, ...p, createdAt: p.created_at ? new Date(p.created_at) : new Date(), receivedAtHub: p.received_at_hub ? new Date(p.received_at_hub) : null, approvedAt: p.approved_at ? new Date(p.approved_at) : null })));
    });

    return () => {
      if (unsubProfile) unsubProfile();
      if (unsubProducts) unsubProducts();
    };
  }, [user?.id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const urls = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadForm(prev => ({ ...prev, images: urls }));
    }
  };

  const handleUploadProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !artistProfile) return;

    // Check if artist can upload more products
    if (artistProfile.isFirstTime && products.length >= 1) {
      alert('First-time artists can only upload 1 product initially. Please wait for approval and stock arrival.');
      return;
    }

    try {
      const productData = {
        artistId: user.uid,
        productId: `prod_${Date.now()}`,
        name: uploadForm.name,
        description: uploadForm.description,
        price: uploadForm.price,
        images: uploadForm.images,
        stockLevel: 0, // Will be updated when stock arrives
        status: 'pending_approval' as const,
        shippingTracking: uploadForm.shippingTracking,
        createdAt: new Date()
      };

      await createDocument('artist_products', productData as any);

      // Update artist's slots used
      await updateDocument('artists', user.uid, {
        slots_used: artistProfile.slotsUsed + 1,
      } as any);

      alert('Product uploaded successfully! Please ship the item to our Worcester Hub with the tracking number.');
      setShowUploadForm(false);
      setUploadForm({
        name: '',
        description: '',
        price: 0,
        images: [],
        shippingTracking: ''
      });
    } catch (error) {
      console.error('Error uploading product:', error);
      alert('Failed to upload product. Please try again.');
    }
  };

  const handleAddStock = async (productId: string, trackingNumber: string) => {
    try {
      await updateDocument('artist_products', productId, {
        shipping_tracking: trackingNumber,
        status: 'pending_approval',
      } as any);
      alert('Shipping information updated. We will notify you when the item arrives.');
    } catch (error) {
      console.error('Error updating shipping:', error);
      alert('Failed to update shipping information.');
    }
  };

  const handleAddAdditionalStock = async (productId: string, quantity: number) => {
    if (!artistProfile) return;

    const feePerItem = artistProfile.wallet.currency === 'USD' ? 0.05 : 0.50;
    const totalFee = quantity * feePerItem;

    if (!confirm(`Adding ${quantity} additional items will cost ${artistProfile.wallet.currency === 'USD' ? '$' : 'R'}${totalFee}. Continue?`)) {
      return;
    }

    try {
      await updateDocument('artist_products', productId, {
        stock_level: products.find(p => p.id === productId)?.stockLevel + quantity,
        additional_stock_fee: (products.find(p => p.id === productId)?.additionalStockFee || 0) + totalFee,
      } as any);

      alert(`Additional stock added successfully! Fee of ${artistProfile.wallet.currency === 'USD' ? '$' : 'R'}${totalFee} has been charged.`);
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add additional stock.');
    }
  };

  const calculateStockFees = () => {
    if (!artistProfile) return 0;
    const feePerItem = artistProfile.wallet.currency === 'USD' ? 0.05 : 0.50;
    let totalFee = 0;

    Object.entries(selectedProductsForStock).forEach(([productId, quantity]) => {
      if (quantity > 1) {
        totalFee += (quantity - 1) * feePerItem; // Only charge for items beyond the first one
      }
    });

    return totalFee;
  };

  const handleLockStockShipping = async () => {
    if (!artistProfile || Object.keys(selectedProductsForStock).length === 0 || !shippingTracking.trim()) {
      alert('Please select products and enter a tracking number.');
      return;
    }

    const totalFee = calculateStockFees();
    if (totalFee > 0) {
      if (!confirm(`Additional stock fee: ${artistProfile.wallet.currency === 'USD' ? '$' : 'R'}${totalFee}. Continue?`)) {
        return;
      }
    }

    try {
      // Update each selected product with stock quantities and tracking
      const updatePromises = Object.entries(selectedProductsForStock).map(async ([productId, quantity]) => {
        const currentProduct = products.find(p => p.id === productId);
        if (!currentProduct) return;

        const additionalFee = quantity > 1 ? (quantity - 1) * (artistProfile.wallet.currency === 'USD' ? 0.05 : 0.50) : 0;

        return updateDocument('artist_products', productId, {
          stock_level: currentProduct.stockLevel + quantity,
          shipping_tracking: shippingTracking,
          status: 'pending_approval',
          additional_stock_fee: (currentProduct.additionalStockFee || 0) + additionalFee,
        } as any);
      });

      await Promise.all(updatePromises);

      alert('Stock shipping locked successfully! We will notify you when items arrive at the hub.');
      setShowStockModal(false);
      setSelectedProductsForStock({});
      setShippingTracking('');
    } catch (error) {
      console.error('Error locking stock shipping:', error);
      alert('Failed to lock stock shipping. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-white">Loading artist dashboard...</div>
      </div>
    );
  }

  if (!artistProfile) {
    return (
      <div className="p-6">
        <div className="text-white">Artist profile not found. Please contact support.</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Artist Dashboard</h1>

      {/* Artist Info */}
      <div className="bg-zinc-900 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">Welcome, {artistProfile.shopName}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-800 p-4 rounded">
            <div className="text-gray-400">Slots Used</div>
            <div className="text-2xl font-bold text-white">{artistProfile.slotsUsed} / {artistProfile.slotLimit}</div>
          </div>
          <div className="bg-zinc-800 p-4 rounded">
            <div className="text-gray-400">Available Balance</div>
            <div className="text-2xl font-bold text-green-400">
              {artistProfile.wallet.currency === 'USD' ? '$' : 'R'}{artistProfile.wallet.available}
            </div>
          </div>
          <div className="bg-zinc-800 p-4 rounded">
            <div className="text-gray-400">Pending Balance</div>
            <div className="text-2xl font-bold text-yellow-400">
              {artistProfile.wallet.currency === 'USD' ? '$' : 'R'}{artistProfile.wallet.pending}
            </div>
          </div>
          <div className="bg-zinc-800 p-4 rounded">
            <div className="text-gray-400">Status</div>
            <div className={`text-lg font-bold ${artistProfile.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
              {artistProfile.status}
            </div>
          </div>
        </div>
      </div>

      {/* Important Rules Reminder */}
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
          <AlertCircle size={24} />
          Important Rules
        </h3>
        <ul className="text-zinc-300 space-y-2">
          <li>• <strong>First-time artists:</strong> Only 1 product allowed initially</li>
          <li>• <strong>Physical Stock Required:</strong> Ship items to Worcester Hub before they go live</li>
          <li>• <strong>Tracking Number:</strong> Always provide tracking when shipping</li>
          <li>• <strong>Additional Stock:</strong> R0.50/$0.05 per extra item beyond initial stock</li>
          <li>• <strong>Admin Approval:</strong> Products only go live after inspection</li>
        </ul>
      </div>

      {/* Upload Product Button */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={() => setShowUploadForm(true)}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          disabled={artistProfile.isFirstTime && products.length >= 1}
        >
          <Plus size={20} />
          Upload New Product
        </button>
        <button
          onClick={() => setShowStockModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Truck size={20} />
          Ship Stock to Hub
        </button>
      </div>
      {artistProfile.isFirstTime && products.length >= 1 && (
        <p className="text-red-400 mt-2">First-time artists can only upload 1 product initially.</p>
      )}

      {/* Products List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-yellow-400">Your Products</h2>
        {products.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No products uploaded yet. Click "Upload New Product" to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-zinc-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">{product.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    product.status === 'live' ? 'bg-green-600' :
                    product.status === 'approved' ? 'bg-blue-600' :
                    product.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
                  }`}>
                    {product.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-2">{product.description}</p>
                <p className="text-lg font-bold text-green-400 mb-2">
                  {artistProfile.wallet.currency === 'USD' ? '$' : 'R'}{product.price}
                </p>
                <p className="text-xs text-gray-500 mb-4">Stock Level: {product.stockLevel}</p>

                {product.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {product.images.slice(0, 3).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Product Image ${index + 1}`}
                        className="w-full h-16 object-cover rounded border border-zinc-700"
                      />
                    ))}
                  </div>
                )}

                {product.status === 'pending_approval' && !product.shippingTracking && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-300 mb-1">Shipping Tracking Number</label>
                    <input
                      type="text"
                      placeholder="Enter tracking number"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-white"
                      onChange={(e) => {
                        // Store temporarily for submission
                        setTrackingNumbers(prev => ({ ...prev, [product.id]: e.target.value }));
                      }}
                    />
                    <button
                      onClick={() => handleAddStock(product.id, trackingNumbers[product.id] || '')}
                      className="w-full mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Lock Shipping
                    </button>
                  </div>
                )}

                {product.shippingTracking && (
                  <div className="mt-4 p-2 bg-blue-900/20 border border-blue-500/30 rounded">
                    <p className="text-xs text-blue-400">
                      <Truck size={14} className="inline mr-1" />
                      Tracking: {product.shippingTracking}
                    </p>
                  </div>
                )}

                {product.status === 'rejected' && (
                  <div className="mt-4 p-2 bg-red-900/20 border border-red-500/30 rounded">
                    <p className="text-xs text-red-400">
                      This product was rejected. Please check quality standards and re-submit.
                    </p>
                  </div>
                )}

                {/* Additional Stock Section */}
                {product.status === 'live' && (
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded">
                    <p className="text-sm text-green-400 mb-2">
                      This product is live. You can add more stock at any time.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddAdditionalStock(product.id, 1)}
                        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
                      >
                        Add 1 Item
                      </button>
                      <button
                        onClick={() => handleAddAdditionalStock(product.id, 5)}
                        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
                      >
                        Add 5 Items
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowUploadForm(false)} />
          <div className="relative bg-zinc-900 border-2 border-purple-400 rounded-2xl p-8 max-w-lg w-full shadow-[0_0_50px_rgba(147,51,234,0.4)] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUploadForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-purple-400 mb-2">Upload New Product</h2>
              <p className="text-zinc-300">Add a new product to your shop</p>
            </div>

            <form onSubmit={handleUploadProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Product Name</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Price ({artistProfile.wallet.currency})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={uploadForm.price}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Product Images (Upload up to 5 images or take photos)</label>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium min-h-[48px] touch-manipulation"
                  >
                    <Upload size={18} />
                    <span className="hidden xs:inline">Upload Images</span>
                    <span className="xs:hidden">Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 bg-green-600 hover:bg-green-500 active:bg-green-400 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium min-h-[48px] touch-manipulation"
                  >
                    <span className="text-lg">📷</span>
                    <span className="hidden xs:inline">Take Photo</span>
                    <span className="xs:hidden">Camera</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadForm.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-600">
                    <div className="w-full text-sm text-zinc-300 mb-2 font-medium">
                      Selected Images ({uploadForm.images.length}/5):
                    </div>
                    {uploadForm.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Upload ${index + 1}`}
                          className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded-lg border-2 border-zinc-500 hover:border-zinc-400 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUploadForm(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index)
                            }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 active:bg-red-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition-colors min-h-[24px] min-w-[24px] touch-manipulation"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  💡 <strong>Tip:</strong> Use your camera for instant photos or upload existing images from your gallery. High-quality images help your products stand out!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Shipping Tracking Number</label>
                <input
                  type="text"
                  value={uploadForm.shippingTracking}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, shippingTracking: e.target.value }))}
                  placeholder="Enter tracking number for shipping to Worcester Hub"
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-400 text-black font-bold py-3 px-4 rounded-lg hover:bg-purple-500 transition-colors"
              >
                Upload Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stock Shipping Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowStockModal(false)} />
          <div className="relative bg-zinc-900 border-2 border-blue-400 rounded-2xl p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(59,130,246,0.4)] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowStockModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-blue-400 mb-2">Ship Stock to Worcester Hub</h2>
              <p className="text-zinc-300">Select products and quantities to ship to our hub</p>
            </div>

            <div className="space-y-4">
              {/* Product Selection */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Select Products & Quantities</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {products.filter(p => p.status !== 'live').map((product) => (
                    <div key={product.id} className="bg-zinc-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {product.images.length > 0 && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded border border-zinc-600"
                            />
                          )}
                          <div>
                            <h4 className="font-medium text-white">{product.name}</h4>
                            <p className="text-sm text-gray-400">{product.description}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          product.status === 'approved' ? 'bg-blue-600' :
                          product.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
                        }`}>
                          {product.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={!!selectedProductsForStock[product.id]}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductsForStock(prev => ({ ...prev, [product.id]: 1 }));
                              } else {
                                const newSelection = { ...selectedProductsForStock };
                                delete newSelection[product.id];
                                setSelectedProductsForStock(newSelection);
                              }
                            }}
                            className="rounded border-zinc-600"
                          />
                          Include in shipment
                        </label>

                        {selectedProductsForStock[product.id] && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-300">Quantity:</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={selectedProductsForStock[product.id]}
                              onChange={(e) => {
                                const quantity = parseInt(e.target.value) || 1;
                                setSelectedProductsForStock(prev => ({ ...prev, [product.id]: quantity }));
                              }}
                              className="w-20 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-white text-center"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Tracking */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Shipping Tracking Number</label>
                <input
                  type="text"
                  value={shippingTracking}
                  onChange={(e) => setShippingTracking(e.target.value)}
                  placeholder="Enter tracking number for this shipment"
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                />
              </div>

              {/* Fee Calculation */}
              {Object.keys(selectedProductsForStock).length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="font-bold text-yellow-400 mb-2">Shipping Summary</h4>
                  <div className="space-y-1 text-sm text-gray-300">
                    {Object.entries(selectedProductsForStock).map(([productId, quantity]) => {
                      const product = products.find(p => p.id === productId);
                      const fee = quantity > 1 ? (quantity - 1) * (artistProfile.wallet.currency === 'USD' ? 0.05 : 0.50) : 0;
                      return (
                        <div key={productId} className="flex justify-between">
                          <span>{product?.name}: {quantity} items</span>
                          <span className={fee > 0 ? 'text-yellow-400' : 'text-green-400'}>
                            {fee > 0 ? `${artistProfile.wallet.currency === 'USD' ? '$' : 'R'}${fee}` : 'Free'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-yellow-500/30 mt-2 pt-2 flex justify-between font-bold">
                    <span>Total Additional Fees:</span>
                    <span className="text-yellow-400">
                      {artistProfile.wallet.currency === 'USD' ? '$' : 'R'}{calculateStockFees()}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleLockStockShipping}
                disabled={Object.keys(selectedProductsForStock).length === 0 || !shippingTracking.trim()}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lock Stock Shipping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistDashboard;
