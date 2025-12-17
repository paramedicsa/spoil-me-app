import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Crown, Search, Plus, Calendar, Package, DollarSign, AlertTriangle, Check } from 'lucide-react';

const AdminVault: React.FC = () => {
  const { products } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [vaultPriceZAR, setVaultPriceZAR] = useState('');
  const [vaultPriceUSD, setVaultPriceUSD] = useState('');
  const [vaultStock, setVaultStock] = useState('');
  const [goLiveDate, setGoLiveDate] = useState('');
  const [vaultItems, setVaultItems] = useState<any[]>([]);

  // Load vault items from localStorage for demo
  useEffect(() => {
    const saved = localStorage.getItem('vaultItems');
    if (saved) {
      setVaultItems(JSON.parse(saved));
    }
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToVault = () => {
    if (!selectedProduct || !vaultPriceZAR || !vaultPriceUSD || !vaultStock) return;

    const newVaultItem = {
      id: Date.now().toString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productImage: selectedProduct.images[0],
      vaultPriceZAR: parseFloat(vaultPriceZAR),
      vaultPriceUSD: parseFloat(vaultPriceUSD),
      vaultStock: parseInt(vaultStock),
      goLiveDate: goLiveDate || new Date().toISOString().split('T')[0],
      isActive: false
    };

    const updatedItems = [...vaultItems, newVaultItem];
    setVaultItems(updatedItems);
    localStorage.setItem('vaultItems', JSON.stringify(updatedItems));

    // Reset form
    setSelectedProduct(null);
    setVaultPriceZAR('');
    setVaultPriceUSD('');
    setVaultStock('');
    setGoLiveDate('');
  };

  const toggleVaultStatus = (id: string) => {
    const updatedItems = vaultItems.map(item =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    setVaultItems(updatedItems);
    localStorage.setItem('vaultItems', JSON.stringify(updatedItems));
  };

  const removeFromVault = (id: string) => {
    const updatedItems = vaultItems.filter(item => item.id !== id);
    setVaultItems(updatedItems);
    localStorage.setItem('vaultItems', JSON.stringify(updatedItems));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-[22px] font-bold text-white flex items-center gap-3">
          <Crown className="text-yellow-400" size={28} />
          Vault Management
        </h1>
      </div>

      {/* Add to Vault Section */}
      <div className="bg-zinc-900 border border-gray-700 p-6 rounded-xl shadow-lg">
        <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-3">
          <Plus size={20} className="text-green-400" />
          Add Product to Vault
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Selector */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Search & Select Product</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full bg-zinc-800 border border-gray-600 rounded p-3 pl-10 text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto bg-zinc-800 rounded border border-gray-600">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-zinc-700 ${
                    selectedProduct?.id === product.id ? 'bg-cyan-900/30 border-cyan-500' : ''
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-center gap-3">
                    <img src={product.images[0]} className="w-12 h-12 rounded object-cover" alt="" />
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-gray-400 text-sm">Stock: {product.stock}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vault Settings */}
          <div className="space-y-4">
            {selectedProduct && (
              <div className="bg-zinc-800 p-4 rounded border border-cyan-500/30">
                <h4 className="text-white font-medium mb-2">Selected Product</h4>
                <div className="flex items-center gap-3 mb-3">
                  <img src={selectedProduct.images[0]} className="w-16 h-16 rounded object-cover" alt="" />
                  <div>
                    <p className="text-white">{selectedProduct.name}</p>
                    <p className="text-gray-400 text-sm">Stock: {selectedProduct.stock}</p>
                  </div>
                </div>
                {/* Product Price Display */}
                <div className="bg-zinc-700 p-3 rounded border border-gray-600">
                  <p className="text-sm text-gray-400 mb-1">Current Product Price</p>
                  <div className="flex gap-4">
                    <p className="text-green-400 font-bold">R{selectedProduct.price}</p>
                    <p className="text-blue-400 font-bold">${selectedProduct.priceUSD}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Vault Price (ZAR)</label>
                <input
                  type="number"
                  placeholder="e.g., 10"
                  className="w-full bg-zinc-800 border border-gray-600 rounded p-3 text-white"
                  value={vaultPriceZAR}
                  onChange={(e) => setVaultPriceZAR(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Vault Price (USD)</label>
                <input
                  type="number"
                  placeholder="e.g., 1"
                  className="w-full bg-zinc-800 border border-gray-600 rounded p-3 text-white"
                  value={vaultPriceUSD}
                  onChange={(e) => setVaultPriceUSD(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Vault Stock Quantity</label>
              <input
                type="number"
                placeholder="e.g., 50"
                className="w-full bg-zinc-800 border border-gray-600 rounded p-3 text-white"
                value={vaultStock}
                onChange={(e) => setVaultStock(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Go Live Date</label>
              <input
                type="date"
                className="w-full bg-zinc-800 border border-gray-600 rounded p-3 text-white"
                value={goLiveDate}
                onChange={(e) => setGoLiveDate(e.target.value)}
              />
            </div>

            <button
              onClick={handleAddToVault}
              disabled={!selectedProduct || !vaultPriceZAR || !vaultPriceUSD || !vaultStock}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add to Vault Batch
            </button>
          </div>
        </div>
      </div>

      {/* Vault Items Management */}
      <div className="bg-zinc-900 border border-gray-700 p-6 rounded-xl shadow-lg">
        <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-3">
          <Package size={20} className="text-purple-400" />
          Vault Items ({vaultItems.length})
        </h3>

        <div className="space-y-4">
          {vaultItems.map(item => (
            <div key={item.id} className="bg-zinc-800 p-4 rounded border border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={item.productImage} className="w-16 h-16 rounded object-cover" alt="" />
                  <div>
                    <h4 className="text-white font-medium">{item.productName}</h4>
                    <p className="text-gray-400 text-sm">
                      Vault: R{item.vaultPriceZAR} / ${item.vaultPriceUSD} | Stock: {item.vaultStock}
                    </p>
                    <p className="text-gray-400 text-sm">Go Live: {item.goLiveDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.isActive ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleVaultStatus(item.id)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      item.isActive
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                  >
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => removeFromVault(item.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          {vaultItems.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Crown size={48} className="mx-auto mb-4 opacity-50" />
              <p>No items in the vault yet. Add some products above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVault;
