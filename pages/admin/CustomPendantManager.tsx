import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomTemplate } from '../../types';
import { Plus, Edit2, Trash2, Save, X, Upload, Loader2, ImagePlus, Check } from 'lucide-react';
import { uploadFile, queryDocuments, createDocument, updateDocument, deleteDocument } from '../../utils/supabaseClient';

const CustomPendantManager: React.FC = () => {
  const { user } = useStore();
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<CustomTemplate>>({
    name: '',
    basePrice: 0,
    description: '',
    mainImage: '',
    stones: [],
    wireStyles: [],
    chainOptions: [],
    isActive: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const loadedTemplates = await queryDocuments<CustomTemplate>('custom_templates', { orderBy: { column: 'created_at', ascending: false } });
      setTemplates((loadedTemplates || []) as CustomTemplate[]);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingTemplate.name || !editingTemplate.description) return;

    setIsSaving(true);
    try {
      const templateData = {
        ...editingTemplate,
        stones: editingTemplate.stones || [],
        wireStyles: editingTemplate.wireStyles || [],
        chainOptions: editingTemplate.chainOptions || []
      };

      if (editingTemplate.id) {
        await updateDocument('custom_templates', editingTemplate.id!, templateData as any);
      } else {
        await createDocument('custom_templates', templateData as any);
      }

      await loadTemplates();
      setIsEditing(false);
      setEditingTemplate({
        name: '',
        basePrice: 0,
        description: '',
        mainImage: '',
        stones: [],
        wireStyles: [],
        chainOptions: [],
        isActive: true
      });
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await deleteDocument('custom_templates', id);
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const path = `custom-templates/${Date.now()}-${file.name}`;
    return await uploadFile('custom-templates', path, file);
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file);
      setEditingTemplate(prev => ({ ...prev, mainImage: url }));
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const addStone = () => {
    setEditingTemplate(prev => ({
      ...prev,
      stones: [...(prev.stones || []), { id: Date.now().toString(), name: '', image: '', priceModifier: 0 }]
    }));
  };

  const updateStone = (index: number, field: string, value: any) => {
    setEditingTemplate(prev => ({
      ...prev,
      stones: prev.stones?.map((stone, i) => i === index ? { ...stone, [field]: value } : stone)
    }));
  };

  const removeStone = (index: number) => {
    setEditingTemplate(prev => ({
      ...prev,
      stones: prev.stones?.filter((_, i) => i !== index)
    }));
  };

  const handleStoneImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file);
      updateStone(index, 'image', url);
    } catch (error) {
      console.error('Error uploading stone image:', error);
    }
  };

  const addWireStyle = () => {
    setEditingTemplate(prev => ({
      ...prev,
      wireStyles: [...(prev.wireStyles || []), { id: Date.now().toString(), name: '', imageFrameOnly: '', imageWithExample: '', priceModifier: 0 }]
    }));
  };

  const updateWireStyle = (index: number, field: string, value: any) => {
    setEditingTemplate(prev => ({
      ...prev,
      wireStyles: prev.wireStyles?.map((wire, i) => i === index ? { ...wire, [field]: value } : wire)
    }));
  };

  const removeWireStyle = (index: number) => {
    setEditingTemplate(prev => ({
      ...prev,
      wireStyles: prev.wireStyles?.filter((_, i) => i !== index)
    }));
  };

  const handleWireImageUpload = async (index: number, type: 'frame' | 'example', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file);
      updateWireStyle(index, type === 'frame' ? 'imageFrameOnly' : 'imageWithExample', url);
    } catch (error) {
      console.error('Error uploading wire image:', error);
    }
  };

  const addChainOption = () => {
    setEditingTemplate(prev => ({
      ...prev,
      chainOptions: [...(prev.chainOptions || []), '']
    }));
  };

  const updateChainOption = (index: number, value: string) => {
    setEditingTemplate(prev => ({
      ...prev,
      chainOptions: prev.chainOptions?.map((chain, i) => i === index ? value : chain)
    }));
  };

  const removeChainOption = (index: number) => {
    setEditingTemplate(prev => ({
      ...prev,
      chainOptions: prev.chainOptions?.filter((_, i) => i !== index)
    }));
  };

  if (!user?.isAdmin) {
    return <div className="p-6 text-center">Access denied. Admin only.</div>;
  }

  if (isLoading) {
    return <div className="p-6 text-center"><Loader2 className="animate-spin mx-auto" size={24} /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Custom Pendant Templates</h1>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-500 flex items-center gap-2"
        >
          <Plus size={20} /> New Template
        </button>
      </div>

      {/* Templates List */}
      <div className="grid gap-4">
        {templates.map(template => (
          <div key={template.id} className="bg-zinc-800 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <p className="text-gray-400">{template.description}</p>
                <p className="text-sm text-gray-500">Base Price: R{template.basePrice}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingTemplate(template);
                    setIsEditing(true);
                  }}
                  className="p-2 text-blue-400 hover:text-blue-300"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingTemplate.id ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Template Name"
                  value={editingTemplate.name || ''}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="p-2 bg-zinc-800 rounded"
                />
                <input
                  type="number"
                  placeholder="Base Price"
                  value={editingTemplate.basePrice || 0}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, basePrice: parseFloat(e.target.value) }))}
                  className="p-2 bg-zinc-800 rounded"
                />
              </div>

              <textarea
                placeholder="Description"
                value={editingTemplate.description || ''}
                onChange={(e) => setEditingTemplate(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 bg-zinc-800 rounded h-20"
              />

              {/* Main Image */}
              <div>
                <label className="block mb-2">Main Image</label>
                <input type="file" accept="image/*" onChange={handleMainImageUpload} />
                {editingTemplate.mainImage && (
                  <img src={editingTemplate.mainImage} alt="Main" className="w-32 h-32 object-cover mt-2 rounded" />
                )}
              </div>

              {/* Stones */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Stones</h3>
                  <button onClick={addStone} className="px-3 py-1 bg-green-600 text-white rounded text-sm">
                    Add Stone
                  </button>
                </div>
                <div className="space-y-4">
                  {editingTemplate.stones?.map((stone, index) => (
                    <div key={stone.id} className="bg-zinc-800 p-4 rounded flex gap-4 items-center">
                      <input
                        type="text"
                        placeholder="Stone Name"
                        value={stone.name}
                        onChange={(e) => updateStone(index, 'name', e.target.value)}
                        className="flex-1 p-2 bg-zinc-700 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Price Modifier"
                        value={stone.priceModifier}
                        onChange={(e) => updateStone(index, 'priceModifier', parseFloat(e.target.value))}
                        className="w-24 p-2 bg-zinc-700 rounded"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleStoneImageUpload(index, e)}
                      />
                      {stone.image && <img src={stone.image} alt={stone.name} className="w-16 h-16 object-cover rounded" />}
                      <button onClick={() => removeStone(index)} className="p-2 text-red-400">
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wire Styles */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Wire Styles</h3>
                  <button onClick={addWireStyle} className="px-3 py-1 bg-green-600 text-white rounded text-sm">
                    Add Wire Style
                  </button>
                </div>
                <div className="space-y-4">
                  {editingTemplate.wireStyles?.map((wire, index) => (
                    <div key={wire.id} className="bg-zinc-800 p-4 rounded space-y-4">
                      <input
                        type="text"
                        placeholder="Wire Style Name"
                        value={wire.name}
                        onChange={(e) => updateWireStyle(index, 'name', e.target.value)}
                        className="w-full p-2 bg-zinc-700 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Price Modifier"
                        value={wire.priceModifier}
                        onChange={(e) => updateWireStyle(index, 'priceModifier', parseFloat(e.target.value))}
                        className="w-24 p-2 bg-zinc-700 rounded"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2">Frame Only Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleWireImageUpload(index, 'frame', e)}
                          />
                          {wire.imageFrameOnly && <img src={wire.imageFrameOnly} alt="Frame" className="w-16 h-16 object-cover mt-2 rounded" />}
                        </div>
                        <div>
                          <label className="block mb-2">With Example Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleWireImageUpload(index, 'example', e)}
                          />
                          {wire.imageWithExample && <img src={wire.imageWithExample} alt="Example" className="w-16 h-16 object-cover mt-2 rounded" />}
                        </div>
                      </div>
                      <button onClick={() => removeWireStyle(index)} className="p-2 text-red-400">
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chain Options */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Chain Options</h3>
                  <button onClick={addChainOption} className="px-3 py-1 bg-green-600 text-white rounded text-sm">
                    Add Chain
                  </button>
                </div>
                <div className="space-y-2">
                  {editingTemplate.chainOptions?.map((chain, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Chain Length"
                        value={chain}
                        onChange={(e) => updateChainOption(index, e.target.value)}
                        className="flex-1 p-2 bg-zinc-700 rounded"
                      />
                      <button onClick={() => removeChainOption(index)} className="p-2 text-red-400">
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-pink-600 text-white rounded disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomPendantManager;
