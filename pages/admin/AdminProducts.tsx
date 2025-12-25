import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, PackagingItem, Review } from '../../types';
import { Plus, Edit2, Trash2, Sparkles, Save, X, Link as LinkIcon, Tag, MessageSquare, Star, Gift, Clock, Package, ExternalLink, AlertTriangle, Crown, Percent, Truck, RefreshCw, Upload, Loader2, Camera, Check, Info, Bot, DollarSign, BarChart3, Search, Filter, Layers, ImagePlus, Smartphone, FileDown, Bookmark, Gem } from 'lucide-react';
import { generateProductDescription, generateProductMetadataFromImage, generateSouthAfricanReviews, generateUniquePendantReviews } from '../../services/geminiService';
import { uploadFile } from '../../utils/supabaseClient';
import { handleImageError } from '../../utils/imageUtils';

// Chain Length Descriptions from Firestore
const CHAIN_OPTIONS = {
  "Choker – 35 cm": "Fits snugly around the base of the neck, sitting just above the collarbone.",
  "Collar – 40 cm": "Lies on the collarbone for a clean line that complements almost any neckline.",
  "Princess – 45 cm": "Falls just below the collarbone, perfectly framing a pendant.",
  "Matinee – 50 cm": "Drops a few centimetres beneath the collarbone for a subtle, elongating effect.",
  "Matinee Long – 60 cm": "Reaches the upper bust, offering a graceful drape over sweaters or dresses."
};

const DEFAULT_EARRING_PRESETS = [
  { name: 'Sterling Silver', modifier: 30, description: 'Durable, premium metal suitable for long-term wear.' },
  { name: 'Stainless Steel Black', modifier: 0, description: 'Durable, premium metal suitable for long-term wear.' },
  { name: 'Stainless Steel Silver', modifier: 0, description: 'Durable, premium metal suitable for long-term wear.' },
  { name: 'Hypo-Allergic Plastic', modifier: 0, description: 'Plastic state bends easily' },
];

const DEFAULT_BASE_MATERIALS = [
   'Epoxy Resin',
   'Copper',
   'Aluminium',
   'Sterling Silver',
   'Glass Beads',
   'Beads',
   'Wood',
   'Oxidized',
];

const BASE_MATERIALS_STORAGE_KEY = 'spv_base_materials';

const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, categories, packagingPresets, materialPresets, savePackagingPreset, saveMaterialPreset, deleteMaterialPreset, dbConnectionError, login, manualWinner, setManualWinner, isLoading } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isGeneratingReviews, setIsGeneratingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'inventory' | 'media' | 'marketing' | 'reviews' | 'promotions' | 'gifts'>('general');

   // Base Material (multi-select) presets
   const [baseMaterialOptions, setBaseMaterialOptions] = useState<string[]>(() => {
      try {
         const raw = localStorage.getItem(BASE_MATERIALS_STORAGE_KEY);
         const parsed = raw ? JSON.parse(raw) : null;
         const fromStorage = Array.isArray(parsed) ? parsed.map((s: any) => String(s)).filter(Boolean) : [];
         return Array.from(new Set([...DEFAULT_BASE_MATERIALS, ...fromStorage]));
      } catch {
         return DEFAULT_BASE_MATERIALS;
      }
   });
   const [newBaseMaterial, setNewBaseMaterial] = useState('');

   useEffect(() => {
      try {
         localStorage.setItem(BASE_MATERIALS_STORAGE_KEY, JSON.stringify(baseMaterialOptions));
      } catch {
         // ignore
      }
   }, [baseMaterialOptions]);

   const parseBaseMaterials = (raw?: string) => {
      if (!raw) return [];
      return raw
         .split(/[,|;]/)
         .map(s => s.trim())
         .filter(Boolean);
   };

   const getSelectedBaseMaterials = () => Array.from(new Set(parseBaseMaterials(formData.material)));

   const setSelectedBaseMaterials = (materials: string[]) => {
      const next = Array.from(new Set(materials.map(s => s.trim()).filter(Boolean)));
      setFormData(prev => ({ ...prev, material: next.join(', ') }));
   };

   const toggleBaseMaterial = (materialName: string) => {
      const normalized = materialName.trim();
      if (!normalized) return;

      const selected = getSelectedBaseMaterials();
      const exists = selected.some(m => m.toLowerCase() === normalized.toLowerCase());
      const next = exists
         ? selected.filter(m => m.toLowerCase() !== normalized.toLowerCase())
         : [...selected, normalized];

      setSelectedBaseMaterials(next);
   };

   const addBaseMaterialPreset = () => {
      const value = newBaseMaterial.trim();
      if (!value) return;

      setBaseMaterialOptions(prev => {
         const exists = prev.some(m => m.toLowerCase() === value.toLowerCase());
         return exists ? prev : [...prev, value];
      });
      setNewBaseMaterial('');
      toggleBaseMaterial(value);
   };
  
  // Review Editing State
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewData, setEditReviewData] = useState<{userName: string, location: string, content: string, rating: number, date: string} | null>(null);

  // --- FILTER STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterPromo, setFilterPromo] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Helper function for user-friendly type labels
  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'Ring': 'Rings',
      'Rings': 'Rings',
      'Stud': 'Stud Earrings',
      'Stud Earrings': 'Stud Earrings',
      'Dangle': 'Dangle Earrings',
      'Dangle Earrings': 'Dangle Earrings',
      'Pendant': 'Pendants',
      'Pendants': 'Pendants',
      'Bracelet': 'Bracelets',
      'Bracelets': 'Bracelets',
      'Watch': 'Watches',
      'Watches': 'Watches',
      'Jewelry Box': 'Jewelry Boxes',
      'Jewelry Boxes': 'Jewelry Boxes',
      'Perfume Holder': 'Perfume Holders',
      'Perfume Holders': 'Perfume Holders',
      'Other': 'Other'
    };
    return typeLabels[type] || type;
  };

   // Some older product rows may not have `type` populated (or may use `productType`).
   // Resolve the effective type for filtering and display.
   const getProductType = (p: any): string => {
      const direct = (p?.type ?? '').toString().trim();
      if (direct) return direct;

      const alt = (p?.productType ?? '').toString().trim();
      if (alt) return alt;

      const name = (p?.name ?? '').toString().toLowerCase();
      if (!name) return 'Other';

      if (name.includes('perfume')) return 'Perfume Holder';
      if (name.includes('jewelry box') || name.includes('jewellery box')) return 'Jewelry Box';
      if (name.includes('watch')) return 'Watch';
      if (name.includes('bracelet')) return 'Bracelet';
      if (name.includes('pendant') || name.includes('necklace')) return 'Pendant';
      if (name.includes('ring')) return 'Ring';
      if (name.includes('dangle')) return 'Dangle';
      if (name.includes('stud')) return 'Stud';

      return 'Other';
   };

  // Helper function for user-friendly tab labels
  const getTabLabel = (tab: string) => {
    const tabLabels: Record<string, string> = {
      'general': 'General',
      'pricing': 'Pricing',
      'media': 'Media',
      'inventory': 'Inventory',
      'marketing': 'Marketing',
      'reviews': 'Reviews',
      'promotions': 'Promotions',
         'gifts': 'Gifts'
    };
    return tabLabels[tab] || tab;
  };

  const initialFormState: Product = {
    id: '',
    code: '',
    name: '',
    slug: '',
    description: '',
    whenAndHowToWear: '',
    price: 0,
    priceUSD: 0,
    compareAtPrice: 0,
    compareAtPriceUSD: 0,
    memberPrice: 0,
    memberPriceUSD: 0,
    costPrice: 0,
    shippingCost: 0,
    packaging: [],
    backOfficeLink: '',
    madeBy: 'Spoil Me Vintage',
    category: categories[0]?.name || '',
    type: 'Stud',
    status: 'draft',
    images: [''],
    stock: 0,
    soldCount: 0,
    tags: [],
    seoKeywords: [],
    colors: [],
    isNewArrival: false,
    isBestSeller: false,
    isFeaturedRing: false,
    isFeaturedBracelet: false,
    isFeaturedWatch: false,
    isUniquePendant: false,
    isFeaturedStud: false,
    isFeaturedDangle: false,
    isFeaturedJewelryBox: false,
    isFeaturedPerfumeHolder: false,
    isJewelrySet: false,
    createdAt: new Date().toISOString(),
    ringStock: { "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 0 },
    earringMaterials: [],
    showEarringOptions: false,
    pendantChainLengths: {},
    pendantWireWrapped: false,
    chainStyles: [],
    material: '',
    reviews: [],
    giftProductId: '',
    giftValue: 0,
    promoPrice: 0,
    promoStartsAt: '',
    promoExpiresAt: '',
    promoBasicMemberPrice: 0,
    promoPremiumMemberPrice: 0,
    promoDeluxeMemberPrice: 0,
    isSoldOut: false
  };

  const [formData, setFormData] = useState<Product>(initialFormState);
  
  // Temp states
  const [tempTag, setTempTag] = useState('');
  const [tempKeyword, setTempKeyword] = useState('');
  
  // Custom Earring Material State
  const [customMatName, setCustomMatName] = useState('');
  const [customMatMod, setCustomMatMod] = useState(0);
  const [customMatDesc, setCustomMatDesc] = useState('');

  // Reviews Parser State
  const [rawReviews, setRawReviews] = useState('');
  const [reviewGenCount, setReviewGenCount] = useState(5);

  // COMBINED PRESETS FOR EARRINGS
  const allEarringPresets = [...DEFAULT_EARRING_PRESETS, ...materialPresets];

  // Auto-calculate member prices when retail price changes
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      memberPrice: parseFloat((prev.price * 0.8).toFixed(2)),
      memberPriceUSD: parseFloat((prev.priceUSD * 0.8).toFixed(2))
    }));
  }, [formData.price, formData.priceUSD]);

  const handleAddNew = () => {
    setFormData({
      ...initialFormState,
      id: `SPV-${Date.now()}`,
      createdAt: new Date().toISOString(),
      category: categories[0]?.name || ''
    });
    setIsEditing(true);
    setActiveTab('general');
    setRawReviews('');
  };

  const handleEdit = (product: Product) => {
    const updatedProduct = {
      ...initialFormState,
      ...product,
      // Ensure fallbacks for robust editing
      compareAtPrice: product.compareAtPrice || 0,
      compareAtPriceUSD: product.compareAtPriceUSD || 0,
      priceUSD: product.priceUSD || 0,
      memberPrice: product.price ? parseFloat((product.price * 0.8).toFixed(2)) : (product.memberPrice || 0),
      memberPriceUSD: product.priceUSD ? parseFloat((product.priceUSD * 0.8).toFixed(2)) : (product.memberPriceUSD || 0),
      costPrice: product.costPrice || 0,
      shippingCost: product.shippingCost || 0,
      soldCount: product.soldCount || 0,
      packaging: product.packaging || [],
      ringStock: product.ringStock || initialFormState.ringStock,
      pendantChainLengths: product.pendantChainLengths || {},
      showEarringOptions: product.showEarringOptions ?? false,
      chainStyles: product.chainStyles || [],
      reviews: product.reviews || [],
      giftProductId: product.giftProductId || '',
      giftValue: product.giftValue || 0,
      promoPrice: product.promoPrice || 0,
      promoStartsAt: product.promoStartsAt || '',
      promoExpiresAt: product.promoExpiresAt || '',
      promoBasicMemberPrice: product.promoBasicMemberPrice || 0,
      promoPremiumMemberPrice: product.promoPremiumMemberPrice || 0,
      promoDeluxeMemberPrice: product.promoDeluxeMemberPrice || 0,
      tags: product.tags || [],
      seoKeywords: product.seoKeywords || [],
      colors: product.colors || [],
      isFeaturedJewelryBox: product.isFeaturedJewelryBox || false,
      isFeaturedPerfumeHolder: product.isFeaturedPerfumeHolder || false
    };
    setFormData(updatedProduct);
    setIsEditing(true);
    setActiveTab('general');
    setRawReviews('');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      alert("Name and Price are required");
      return;
    }
    
    setIsSaving(true);
    
    try {
        let processedImages: string[] = [];
        
      const uploadPromises = formData.images.map(async (img, idx) => {
         if (typeof img === 'string' && img.startsWith('data:')) {
            try {
               // Convert base64 data URL to Blob
               const blob = await (await fetch(img)).blob();
               const ext = blob.type.split('/')?.[1] || 'jpg';
               const path = `products/${formData.id}/img_${Date.now()}_${idx}.${ext}`;
               try {
                  const url = await uploadFile('products', path, blob as any);
                  return url || '';
               } catch (uplErr) {
                  console.warn('Supabase upload failed, falling back to base64:', uplErr);
                  return img; // fallback to base64 so UI still works
               }
            } catch (err) {
               console.error('Failed to process base64 image:', err);
               return '';
            }
         }
         return img;
      });

      const results = await Promise.all(uploadPromises);
      processedImages = results.filter((i: string) => i && i.trim() !== '');

        const productToSave: Product = { 
            ...formData,
            images: processedImages,
            price: Number(formData.price),
            priceUSD: Number(formData.priceUSD),
            stock: Number(formData.stock),
            soldCount: Number(formData.soldCount),
            compareAtPrice: Number(formData.compareAtPrice || 0),
            memberPrice: Number(formData.memberPrice || 0),
            memberPriceUSD: Number(formData.memberPriceUSD || 0),
            costPrice: Number(formData.costPrice || 0),
            shippingCost: Number(formData.shippingCost || 0),
            giftValue: Number(formData.giftValue || 0),
            promoPrice: Number(formData.promoPrice || 0),
            promoBasicMemberPrice: Number(formData.promoBasicMemberPrice || 0),
            promoPremiumMemberPrice: Number(formData.promoPremiumMemberPrice || 0),
            promoDeluxeMemberPrice: Number(formData.promoDeluxeMemberPrice || 0),
        };
        
        if (productToSave.type === 'Ring' && productToSave.ringStock) {
           productToSave.stock = Object.values(productToSave.ringStock).reduce((a: number, b: number) => a + b, 0);
        }

        if (products.some(p => p.id === productToSave.id)) {
          await updateProduct(productToSave);
        } else {
          await addProduct(productToSave);
        }
        
        setIsEditing(false);
    } catch (error: any) {
        console.error("Failed to save product:", error);
        alert("Failed to save product. Please check console.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm("Are you sure?")) {
        try {
            await deleteProduct(id);
        } catch (error) {
            alert("Failed to delete product.");
        }
    }
  };

  const handleMarkAsSold = async (product: Product) => {
    if(window.confirm(`Mark "${product.name}" as sold? This will set stock to 0.`)) {
        try {
            const updatedProduct = { ...product, stock: 0 };
            await updateProduct(updatedProduct);
        } catch (error) {
            alert("Failed to mark product as sold.");
        }
    }
  };

  const handleTextAIGenerate = async () => {
    if (!formData.name || !formData.category) { alert("Please enter a name and category first."); return; }
    setIsGeneratingAI(true);
    const desc = await generateProductDescription(formData.name, formData.category, "Handmade, Unique, Vintage");
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGeneratingAI(false);
  };

  const handleImageUploadAndAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsAnalyzingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64String = reader.result as string;
          const updatedImages = [base64String, ...formData.images.filter(i => i !== '')];
          setFormData(prev => ({ ...prev, images: updatedImages }));
          console.log('AdminProducts: Added base64 image for analysis (preview length):', (base64String as string).slice(0, 80));
          const metadata = await generateProductMetadataFromImage(base64String, formData.category);
          if (metadata) {
              setFormData(prev => ({
                  ...prev,
                  name: metadata.name,
                  description: metadata.description,
                  whenAndHowToWear: metadata.whenAndHowToWear,
                  tags: [...new Set([...prev.tags, ...metadata.tags])],
                  seoKeywords: [...new Set([...(prev.seoKeywords || []), ...metadata.seoKeywords])],
                  colors: [...new Set([...(prev.colors || []), ...metadata.colors])],
                  slug: metadata.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')
              }));
          }
          setIsAnalyzingImage(false);
      };
      reader.readAsDataURL(file);
  };
  
  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const promises = Array.from(files).map((file: File) => {
          return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
          });
      });
      const base64Images = await Promise.all(promises);
      setFormData(prev => ({ ...prev, images: [...prev.images.filter(img => img.trim() !== ''), ...base64Images] }));
      e.target.value = '';
  };

  const handleGenerateReviews = async () => {
     if (!formData.name) { alert("Please enter a product name first."); return; }
     setIsGeneratingReviews(true);
     const newReviews = await generateSouthAfricanReviews(formData.name, reviewGenCount);
     if (newReviews.length > 0) {
       setFormData(prev => ({ ...prev, reviews: [...(prev.reviews || []), ...newReviews] }));
     }
     setIsGeneratingReviews(false);
  };
  
  const handleGenerateUniqueReviews = async () => {
    setIsGeneratingReviews(true);
    const newReviews = await generateUniquePendantReviews(25);
    if (newReviews.length > 0) {
      setFormData(prev => ({ ...prev, reviews: [...(prev.reviews || []), ...newReviews] }));
    }
    setIsGeneratingReviews(false);
  };

  const generateSKU = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    setFormData(prev => ({ ...prev, code: `SPV-${random}` }));
  };

  const generateSlug = () => {
    if (!formData.name) return;
    const slug = formData.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleParseReviews = () => { /* Same as before */ };
  const handleRemoveReview = (reviewId: string) => { setFormData(prev => ({ ...prev, reviews: prev.reviews?.filter(r => r.id !== reviewId) })); };

  const handleAddArrayItem = (field: 'tags' | 'seoKeywords' | 'colors', value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    const newItems = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    setFormData(prev => ({ ...prev, [field]: Array.from(new Set([...(prev[field] || []), ...newItems])) }));
    setter('');
  };

  const handleRemoveArrayItem = (field: 'tags' | 'seoKeywords' | 'colors', index: number) => {
    setFormData(prev => ({ ...prev, [field]: prev[field]?.filter((_, i) => i !== index) }));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images]; newImages[index] = value; setFormData({ ...formData, images: newImages });
  };
  
  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index); if(newImages.length === 0) newImages.push(''); setFormData({ ...formData, images: newImages });
  };

  const addImageField = () => { setFormData({ ...formData, images: [...formData.images, ''] }); };

  // --- REVIEW EDIT HANDLERS ---
  const startEditingReview = (review: Review) => {
      setEditingReviewId(review.id);
      setEditReviewData({ 
          userName: review.userName, 
          location: review.location, 
          content: review.content, 
          rating: review.rating,
          date: review.date || new Date().toLocaleDateString()
      });
  };

  const saveEditedReview = () => {
      if (!editingReviewId || !editReviewData) return;
      setFormData(prev => ({
          ...prev,
          reviews: prev.reviews?.map(r => r.id === editingReviewId ? { ...r, ...editReviewData } : r)
      }));
      setEditingReviewId(null);
      setEditReviewData(null);
  };

  // --- EARRING PRESETS LOGIC ---
  const addEarringMaterial = (name: string, modifier: number, description: string) => {
    if (formData.earringMaterials?.some(m => m.name === name)) return;
    setFormData(prev => ({
      ...prev,
      earringMaterials: [...(prev.earringMaterials || []), { name, modifier, description }]
    }));
  };

  const removeEarringMaterial = (idx: number) => {
     const newMats = [...(formData.earringMaterials || [])]; newMats.splice(idx, 1); setFormData({...formData, earringMaterials: newMats});
  };

  const handleAddCustomMaterial = (saveToPresets: boolean) => {
    if (!customMatName) return;
    addEarringMaterial(customMatName, customMatMod, customMatDesc);
    if (saveToPresets) {
        saveMaterialPreset({ name: customMatName, modifier: customMatMod, description: customMatDesc });
        alert("Material saved to presets!");
    }
    setCustomMatName(''); setCustomMatMod(0); setCustomMatDesc('');
  };

  const handleDeleteMaterialPreset = (e: React.MouseEvent, name: string) => {
      e.stopPropagation();
      if(window.confirm(`Remove "${name}" from presets?`)) {
          deleteMaterialPreset(name);
      }
  };

  // --- PACKAGING LOGIC ---
  const addPackagingItem = () => {
     if ((formData.packaging || []).length >= 3) return;
     setFormData({
        ...formData,
        packaging: [...(formData.packaging || []), { id: `pack_${Date.now()}`, name: '', bulkCost: 0, bulkQuantity: 1, unitCost: 0 }]
     });
  };

  const loadPackagingPreset = (presetName: string) => {
      if (!presetName) return;
      const preset = packagingPresets.find(p => p.name === presetName);
      if (preset && (formData.packaging || []).length < 3) {
          setFormData({
              ...formData,
              packaging: [...(formData.packaging || []), { ...preset, id: `pack_${Date.now()}` }]
          });
      }
  };

  const handleSavePackagingRow = (idx: number) => {
      const item = formData.packaging?.[idx];
      if (item && item.name) {
          savePackagingPreset(item);
          alert(`Saved "${item.name}" to packaging presets!`);
      }
  };

  const updatePackagingItem = (index: number, field: keyof PackagingItem, value: any) => {
     const newPackaging = [...(formData.packaging || [])];
     const item = { ...newPackaging[index], [field]: value };
     if (field === 'bulkCost' || field === 'bulkQuantity') {
        const cost = field === 'bulkCost' ? parseFloat(value) : item.bulkCost;
        const qty = field === 'bulkQuantity' ? parseFloat(value) : item.bulkQuantity;
        item.unitCost = qty > 0 ? cost / qty : 0;
     }
     newPackaging[index] = item;
     setFormData({ ...formData, packaging: newPackaging });
  };

  const removePackagingItem = (index: number) => {
     const newPackaging = [...(formData.packaging || [])]; newPackaging.splice(index, 1); setFormData({ ...formData, packaging: newPackaging });
  };

  const updateRetailPrice = (price: number) => {
    setFormData(prev => ({ ...prev, price: price, memberPrice: parseFloat((price * 0.8).toFixed(2)) }));
  };

  const totalPackagingCost = formData.packaging?.reduce((acc, item) => acc + item.unitCost, 0) || 0;
  const totalDeductions = (formData.costPrice || 0) + (formData.shippingCost || 0) + totalPackagingCost;
  const retailProfit = formData.price - totalDeductions;
  const memberProfit = (formData.memberPrice || 0) - totalDeductions;
  
  // Compute unique categories from products
  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
   const uniqueTypes = Array.from(new Set(products.map(p => getProductType(p)).filter(Boolean)));

  const filteredProducts = products.filter(p => {
     const searchLower = searchTerm.toLowerCase();
     return (p.name.toLowerCase().includes(searchLower) || p.code.toLowerCase().includes(searchLower)) &&
            (filterType ? getProductType(p) === filterType : true) &&
            (filterCategory ? p.category === filterCategory : true) &&
            (filterColor ? p.colors?.includes(filterColor) : true) &&
            (filterPromo ? (p.promoPrice && p.promoPrice > 0) : true) &&
            (filterStatus ? p.status === filterStatus : true);
  });

  // Debug logging
  console.log('AdminProducts Debug:', {
    isLoading,
    productsCount: products.length,
    filteredProductsCount: filteredProducts.length,
    dbConnectionError,
    firstProduct: products[0] ? { id: products[0].id, name: products[0].name, images: products[0].images } : null
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Product Management</h1>
            {!isEditing && (
               <div className="flex items-center gap-3">
                  <button onClick={handleAddNew} className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-500 shadow-lg transition-colors text-sm">
                     <Plus size={18} /> Add Product
                  </button>
               </div>
            )}
      </div>

      {/* Show DB connection error banner to admins when relevant */}
      {dbConnectionError && (
        <div className="bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-300 p-3 rounded mb-4">
          <div className="font-bold">Supabase Warning</div>
          <div className="text-xs mt-1">{dbConnectionError}</div>
          <div className="text-xs mt-1">Changes may be saved locally only. Fix Supabase auth/permissions to persist remotely.</div>
        </div>
      )}

      {!isEditing && (
         <div className="bg-zinc-900 p-4 rounded-xl border border-gray-800 flex flex-wrap gap-4 items-center">
             <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input type="text" placeholder="Search by Name or SKU..." className="w-full pl-10 pr-4 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm focus:border-pink-500 outline-none"
                   value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <select className="pl-10 pr-8 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm outline-none"
                   value={filterType} onChange={e => setFilterType(e.target.value)}>
                   <option value="">All Types</option>
                   {uniqueTypes.map(type => <option key={type} value={type}>{getTypeLabel(type)}</option>)}
                </select>
             </div>
             <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <select className="pl-10 pr-8 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm outline-none"
                   value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                   <option value="">All Collections</option>
                   {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
             </div>
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <select className="pl-10 pr-8 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm outline-none"
                   value={filterColor} onChange={e => setFilterColor(e.target.value)}>
                   <option value="">All Colors</option>
                   {Array.from(new Set(products.flatMap(p => p.colors || []))).map(color => <option key={color} value={color}>{color}</option>)}
                </select>
             </div>
             <button onClick={() => setFilterPromo(!filterPromo)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${filterPromo ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-black border-gray-700 text-gray-400 hover:bg-zinc-800'}`}>
                <Tag size={16} /> {filterPromo ? 'Promotions Active' : 'Show Promotions'}
             </button>
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <select className="pl-10 pr-8 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm outline-none"
                   value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                   <option value="">All Statuses</option>
                   <option value="draft">Draft</option>
                   <option value="published">Published</option>
                </select>
             </div>
             {(searchTerm || filterType || filterCategory || filterColor || filterPromo || filterStatus) && (
                <button onClick={() => { setSearchTerm(''); setFilterType(''); setFilterCategory(''); setFilterColor(''); setFilterPromo(false); setFilterStatus(''); }} className="px-3 py-2 text-xs text-gray-500 hover:text-white underline decoration-dotted">Reset Filters</button>
             )}
         </div>
      )}

      {isEditing ? (
        <div className="bg-zinc-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-800 bg-zinc-950/50 overflow-x-auto no-scrollbar">
             {['general', 'pricing', 'media', 'inventory', 'marketing', 'reviews', 'promotions', 'gifts'].map((tab) => (
               <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab ? 'text-pink-500 border-b-2 border-pink-500 bg-pink-500/5' : 'text-gray-400 hover:text-white'}`}>
                 {getTabLabel(tab)}
               </button>
             ))}
          </div>

          <div className="p-6">
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-1">Product Name *</label>
                     <input type="text" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm focus:border-pink-500" 
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-1">URL Slug</label>
                     <div className="flex gap-2">
                        <input type="text" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm" 
                            value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="product-name-url" />
                        <button onClick={generateSlug} className="px-3 bg-zinc-800 border border-gray-700 rounded-md text-gray-400 hover:text-white hover:bg-zinc-700 transition-colors"><RefreshCw size={16} /></button>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">SKU / Code</label>
                         <div className="flex gap-2">
                             <input type="text" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm" 
                                value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="SPV-001" />
                             <button onClick={generateSKU} className="px-3 bg-zinc-800 border border-gray-700 rounded-md text-gray-400 hover:text-white hover:bg-zinc-700 transition-colors"><RefreshCw size={16} /></button>
                         </div>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                         <select className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm"
                            value={formData.status} onChange={(e: any) => setFormData({...formData, status: e.target.value})}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                         </select>
                      </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                     <select className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm"
                        value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="">Select Category</option>
                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                     </select>
                   </div>
                </div>
                <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Product Type</label>
                      <select className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm"
                         value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})}>
                         <option value="Ring">Rings</option>
                         <option value="Stud">Stud Earrings</option>
                         <option value="Dangle">Dangle Earrings</option>
                         <option value="Pendant">Pendants</option>
                         <option value="Bracelet">Bracelets</option>
                         <option value="Watch">Watches</option>
                         <option value="Jewelry Box">Jewelry Boxes</option>
                         <option value="Perfume Holder">Perfume Holders</option>
                         <option value="Other">Other</option>
                      </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-1">Made By</label>
                     <select className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm"
                        value={formData.madeBy} onChange={e => setFormData({...formData, madeBy: e.target.value})}>
                         <option value="Spoil Me Vintage">Spoil Me Vintage (Handmade)</option>
                         <option value="Outsourced">Outsourced</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Base Material</label>
                                 <div className="bg-black/40 border border-gray-800 rounded-lg p-3">
                                    <div className="flex flex-wrap gap-2">
                                       {baseMaterialOptions.map(option => {
                                          const selected = getSelectedBaseMaterials().some(m => m.toLowerCase() === option.toLowerCase());
                                          return (
                                             <button
                                                key={option}
                                                type="button"
                                                onClick={() => toggleBaseMaterial(option)}
                                                className={
                                                   selected
                                                      ? 'px-3 py-1.5 rounded-full text-xs font-bold border bg-cyan-600/20 border-cyan-500 text-cyan-200'
                                                      : 'px-3 py-1.5 rounded-full text-xs font-medium border bg-zinc-900 border-gray-700 text-gray-300 hover:text-white hover:border-gray-500'
                                                }
                                                title={selected ? 'Remove' : 'Add'}
                                             >
                                                <span className="inline-flex items-center gap-1">
                                                   {selected && <Check size={14} />}
                                                   {option}
                                                </span>
                                             </button>
                                          );
                                       })}
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                       <input
                                          type="text"
                                          className="flex-1 p-2 bg-black border border-gray-700 rounded-md text-white text-sm"
                                          value={newBaseMaterial}
                                          onChange={e => setNewBaseMaterial(e.target.value)}
                                          placeholder="Add new material (saved)"
                                          onKeyDown={e => {
                                             if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addBaseMaterialPreset();
                                             }
                                          }}
                                       />
                                       <button
                                          type="button"
                                          onClick={addBaseMaterialPreset}
                                          className="px-3 bg-zinc-800 border border-gray-700 rounded-md text-gray-200 hover:text-white hover:bg-zinc-700 transition-colors"
                                       >
                                          Save
                                       </button>
                                    </div>

                                    <div className="mt-2 text-xs text-gray-500">
                                       Selected: {getSelectedBaseMaterials().length ? getSelectedBaseMaterials().join(', ') : 'None'}
                                    </div>
                                 </div>
                   </div>
                </div>
              </div>
            )}

            {/* PRICING TAB */}
            {activeTab === 'pricing' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <h3 className="text-white font-bold flex items-center gap-2 border-b border-gray-800 pb-2"><DollarSign size={18} className="text-green-400" /> South African Rand (ZAR)</h3>
                      <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">Retail Price (R) *</label>
                         <input type="number" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm font-bold text-green-400"
                            value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => setFormData({...formData, priceUSD: parseFloat((formData.price / 29).toFixed(2))})} className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg">Convert to USD</button>
                         <button onClick={() => setFormData({...formData, priceUSD: 0})} className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold rounded-lg">Reset USD</button>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">Member Price (R)</label>
                         <input type="number" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm font-bold text-purple-400"
                            value={formData.memberPrice || ''} readOnly />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">RRP (R)</label>
                         <input type="number" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm"
                            value={formData.compareAtPrice || ''} onChange={e => setFormData({...formData, compareAtPrice: parseFloat(e.target.value) || 0})} />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-white font-bold flex items-center gap-2 border-b border-gray-800 pb-2"><DollarSign size={18} className="text-yellow-400" /> United States Dollar (USD)</h3>
                      <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">Retail Price (USD) *</label>
                         <input type="number" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm font-bold text-yellow-400"
                            value={formData.priceUSD} onChange={e => setFormData({...formData, priceUSD: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => setFormData({...formData, price: parseFloat((formData.priceUSD * 29).toFixed(2))})} className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg">Convert to R</button>
                         <button onClick={() => setFormData({...formData, price: 0})} className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold rounded-lg">Reset R</button>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">Member Price (USD)</label>
                         <input type="number" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm font-bold text-purple-400"
                            value={formData.memberPriceUSD || ''} readOnly />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">RRP (USD)</label>
                         <input type="number" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm"
                            value={formData.compareAtPriceUSD || ''} onChange={e => setFormData({...formData, compareAtPriceUSD: parseFloat(e.target.value) || 0})} />
                      </div>
                   </div>
                </div>

                {/* PROFITABILITY CARD */}
                <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800 shadow-lg">
                    <h3 className="text-white font-bold flex items-center gap-2 mb-4"><BarChart3 size={18} className="text-cyan-400" /> Profit & Margins</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                       <div className="bg-black/50 p-4 rounded-lg border border-red-900/30">
                          <span className="text-gray-400 block mb-1">Total Unit Cost</span>
                          <div className="text-2xl font-bold text-red-400">R{totalDeductions.toFixed(2)}</div>
                          <div className="text-xs text-gray-500 mt-2 space-y-1">
                             <div className="flex justify-between"><span>Product:</span> <span>R{(formData.costPrice || 0).toFixed(2)}</span></div>
                             <div className="flex justify-between"><span>Shipping:</span> <span>R{(formData.shippingCost || 0).toFixed(2)}</span></div>
                             <div className="flex justify-between"><span>Packaging:</span> <span>R{totalPackagingCost.toFixed(2)}</span></div>
                          </div>
                       </div>
                       <div className="bg-black/50 p-4 rounded-lg border border-green-900/30">
                          <span className="text-gray-400 block mb-1">Retail Profit</span>
                          <div className={`text-2xl font-bold ${retailProfit > 0 ? 'text-green-400' : 'text-red-500'}`}>R{retailProfit.toFixed(2)}</div>
                       </div>
                       <div className="bg-black/50 p-4 rounded-lg border border-purple-900/30">
                          <span className="text-gray-400 block mb-1">Member Profit</span>
                          <div className={`text-2xl font-bold ${memberProfit > 0 ? 'text-purple-400' : 'text-red-500'}`}>R{memberProfit.toFixed(2)}</div>
                       </div>
                    </div>
                </div>

                {/* PACKAGING SECTION */}
                <div className="border-t border-gray-800 pt-6">
                   <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Package size={16} className="text-pink-500" /> Packaging Breakdown</h3>
                          {/* Preset Dropdown */}
                          <select 
                             className="bg-zinc-800 text-xs text-gray-300 border border-gray-700 rounded px-2 py-1"
                             onChange={(e) => loadPackagingPreset(e.target.value)}
                             value=""
                          >
                              <option value="">Load Preset...</option>
                              {packagingPresets.map((p, i) => (
                                  <option key={i} value={p.name}>{p.name} (R{p.unitCost.toFixed(2)})</option>
                              ))}
                          </select>
                      </div>
                      {(formData.packaging?.length || 0) < 3 && (
                         <button onClick={addPackagingItem} className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300"><Plus size={12} /> Add Item</button>
                      )}
                   </div>
                   <div className="space-y-3">
                      {formData.packaging?.map((item, idx) => (
                         <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-zinc-900 p-3 rounded border border-gray-800">
                            <div className="md:col-span-3">
                               <label className="block text-[10px] text-gray-500 uppercase mb-1">Item Name</label>
                               <input type="text" className="w-full p-1.5 bg-black border border-gray-700 rounded text-xs text-white"
                                  value={item.name} onChange={e => updatePackagingItem(idx, 'name', e.target.value)} />
                            </div>
                            <div className="md:col-span-2">
                               <label className="block text-[10px] text-gray-500 uppercase mb-1">Bulk Cost (R)</label>
                               <input type="number" className="w-full p-1.5 bg-black border border-gray-700 rounded text-xs text-white"
                                  value={item.bulkCost} onChange={e => updatePackagingItem(idx, 'bulkCost', parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="md:col-span-2">
                               <label className="block text-[10px] text-gray-500 uppercase mb-1">Bulk Qty</label>
                               <input type="number" className="w-full p-1.5 bg-black border border-gray-700 rounded text-xs text-white"
                                  value={item.bulkQuantity} onChange={e => updatePackagingItem(idx, 'bulkQuantity', parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="md:col-span-2">
                               <label className="block text-[10px] text-gray-500 uppercase mb-1">Unit Cost</label>
                               <div className="w-full p-1.5 bg-zinc-800 border border-gray-700 rounded text-xs text-red-300 font-mono">R{item.unitCost.toFixed(2)}</div>
                            </div>
                            <div className="md:col-span-3 flex justify-end pb-1 gap-2">
                               <button 
                                 onClick={() => handleSavePackagingRow(idx)}
                                 className="text-blue-400 hover:text-blue-300 bg-blue-900/20 p-1 rounded hover:bg-blue-900/40 transition-colors"
                                 title="Save as Preset"
                               >
                                  <Save size={16} />
                               </button>
                               <button onClick={() => removePackagingItem(idx)} className="text-gray-600 hover:text-red-400 p-1">
                                  <Trash2 size={16} />
                                </button>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-3 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-1">Current Stock</label>
                     <input type="number" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm" 
                        value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})} />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-1">Sold Count</label>
                     <input type="number" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm" 
                        value={formData.soldCount} onChange={e => setFormData({...formData, soldCount: parseInt(e.target.value) || 0})} />
                   </div>
                   <div className="col-span-3">
                     <label className="inline-flex items-center gap-2 mt-2">
                         <input
                           type="checkbox"
                           checked={!!formData.isSoldOut}
                           onChange={e => {
                             const checked = e.target.checked;
                             // If admin marks as sold, set stock to 0 immediately so UI and persistence reflect sold state
                             setFormData(prev => ({ ...prev, isSoldOut: checked, stock: checked ? 0 : prev.stock }));
                           }}
                           className="form-checkbox h-4 w-4 text-red-600 bg-black border-gray-600"
                         />
                         <span className="text-sm text-white font-bold">Mark as "Sorry Just SOLD out!" (Persistent)</span>
                     </label>
                     <p className="text-xs text-gray-400 mt-1">When checked, this product will display a "Sorry Just SOLD out!" badge to customers regardless of stock. Only uncheck to make it available again.</p>
                   </div>
                </div>

                {formData.type === 'Ring' && (
                  <div className="bg-zinc-800/50 p-4 rounded-xl border border-gray-700">
                    <h3 className="text-sm font-bold text-white mb-3">Ring Sizes</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.keys(initialFormState.ringStock || {}).map(size => (
                        <div key={size}>
                           <label className="block text-xs text-gray-500 mb-1">Size {size}</label>
                           <input type="number" className="w-full p-2 bg-black border border-gray-700 rounded text-white text-sm"
                              value={formData.ringStock?.[size] || 0} 
                              onChange={e => setFormData({ ...formData, ringStock: { ...formData.ringStock, [size]: parseInt(e.target.value) || 0 }})} 
                           />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {(formData.type === 'Stud' || formData.type === 'Dangle') && (
                   <div className="bg-zinc-800/50 p-4 rounded-xl border border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                         <input type="checkbox" id="showEarringOptions" checked={formData.showEarringOptions}
                           onChange={e => setFormData({...formData, showEarringOptions: e.target.checked})} className="rounded bg-black border-gray-600 text-pink-600 focus:ring-pink-500" />
                         <label htmlFor="showEarringOptions" className="text-sm font-bold text-white">Enable Material Customization</label>
                      </div>
                      
                      {formData.showEarringOptions && (
                        <div className="space-y-4">
                           <div className="flex gap-2 flex-wrap">
                              {allEarringPresets.map(preset => (
                                 <div key={preset.name} className="group relative inline-flex">
                                     <button 
                                       onClick={() => addEarringMaterial(preset.name, preset.modifier, preset.description)}
                                       className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-600"
                                     >
                                        + {preset.name}
                                     </button>
                                     {/* Delete button for saved custom presets only */}
                                     {materialPresets.some(m => m.name === preset.name) && (
                                         <button 
                                            onClick={(e) => handleDeleteMaterialPreset(e, preset.name)}
                                            className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 w-3 h-3 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                                         >
                                             X
                                         </button>
                                     )}
                                 </div>
                              ))}
                           </div>
                           
                           <div className="space-y-2">
                              {formData.earringMaterials?.map((mat, idx) => (
                                 <div key={idx} className="flex items-center gap-2 bg-black p-2 rounded border border-gray-800">
                                    <div className="flex-1">
                                       <div className="flex justify-between"><span className="text-sm font-medium text-white">{mat.name}</span><span className="text-xs text-pink-400">+R{mat.modifier}</span></div>
                                       <p className="text-xs text-gray-500">{mat.description}</p>
                                    </div>
                                    <button onClick={() => removeEarringMaterial(idx)} className="text-gray-600 hover:text-red-400"><Trash2 size={14} /></button>
                                 </div>
                              ))}
                           </div>
                           
                           <div className="grid grid-cols-12 gap-2 items-end pt-2 border-t border-gray-700">
                              <div className="col-span-3"><input type="text" placeholder="Custom Material" className="w-full p-1.5 bg-black border border-gray-600 rounded text-xs text-white" value={customMatName} onChange={e => setCustomMatName(e.target.value)} /></div>
                              <div className="col-span-2"><input type="number" placeholder="Price Mod" className="w-full p-1.5 bg-black border border-gray-600 rounded text-xs text-white" value={customMatMod} onChange={e => setCustomMatMod(parseFloat(e.target.value) || 0)} /></div>
                              <div className="col-span-4"><input type="text" placeholder="Description" className="w-full p-1.5 bg-black border border-gray-600 rounded text-xs text-white" value={customMatDesc} onChange={e => setCustomMatDesc(e.target.value)} /></div>
                              <div className="col-span-3 flex gap-1">
                                 <button onClick={() => handleAddCustomMaterial(false)} className="flex-1 p-1.5 bg-pink-600 text-white rounded text-xs flex items-center justify-center" title="Add to Product"><Plus size={14} /></button>
                                 <button onClick={() => handleAddCustomMaterial(true)} className="flex-1 p-1.5 bg-cyan-600 text-white rounded text-xs flex items-center justify-center" title="Add & Save Preset"><Save size={14} /></button>
                              </div>
                           </div>
                        </div>
                      )}
                   </div>
                )}
                
                {formData.type === 'Pendant' && (
                   <div className="bg-zinc-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
                      <div>
                         <label className="block text-sm font-bold text-white mb-2">Chain Styles</label>
                         <div className="flex gap-2">
                            {['Metal Chain', 'Leather Cord', 'Ribbon'].map(style => (
                               <button key={style} onClick={() => {
                                    const has = formData.chainStyles?.includes(style);
                                    const newStyles = has ? formData.chainStyles?.filter(s => s !== style) : [...(formData.chainStyles || []), style];
                                    setFormData({...formData, chainStyles: newStyles});
                                 }} className={`px-3 py-1 rounded text-xs border ${formData.chainStyles?.includes(style) ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400' : 'bg-black border-gray-700 text-gray-400'}`}>{style}</button>
                            ))}
                         </div>
                      </div>
                      {formData.chainStyles?.includes('Metal Chain') && (
                         <div>
                            <label className="block text-sm font-bold text-white mb-2">Available Lengths</label>
                            <div className="grid grid-cols-2 gap-2">
                               {Object.keys(CHAIN_OPTIONS).map(opt => (
                                  <div key={opt} onClick={() => { const current = formData.pendantChainLengths || {}; setFormData({ ...formData, pendantChainLengths: { ...current, [opt]: !current[opt] } }); }} className={`p-2 rounded border cursor-pointer text-xs flex items-center justify-between ${formData.pendantChainLengths?.[opt] ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-black border-gray-700 text-gray-500'}`}>
                                     <span>{opt}</span>{formData.pendantChainLengths?.[opt] && <Check size={12} />}
                                  </div>
                               ))}
                            </div>
                         </div>
                      )}
                   </div>
                )}
              </div>
            )}
            
            {/* MARKETING TAB */}
            {activeTab === 'marketing' && (
                <div className="space-y-8 animate-in fade-in">
                    <div className="bg-zinc-900 border border-gray-800 p-6 rounded-xl">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Tag size={18} className="text-cyan-400" /> Product Visibility & Features
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* STANDARD FLAGS */}
                            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${formData.isNewArrival ? 'bg-cyan-900/20 border-cyan-500' : 'bg-black border-gray-700 hover:bg-zinc-800'}`}>
                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.isNewArrival ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'}`}>
                                    {formData.isNewArrival && <Check size={14} className="text-black" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={formData.isNewArrival} onChange={e => setFormData({...formData, isNewArrival: e.target.checked})} />
                                <span className="text-sm font-bold text-white">New Arrival</span>
                            </label>

                            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${formData.isBestSeller ? 'bg-yellow-900/20 border-yellow-500' : 'bg-black border-gray-700 hover:bg-zinc-800'}`}>
                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.isBestSeller ? 'bg-yellow-500 border-yellow-500' : 'border-gray-600'}`}>
                                    {formData.isBestSeller && <Check size={14} className="text-black" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={formData.isBestSeller} onChange={e => setFormData({...formData, isBestSeller: e.target.checked})} />
                                <span className="text-sm font-bold text-white">Best Seller</span>
                            </label>

                            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${formData.isJewelrySet ? 'bg-purple-900/20 border-purple-500' : 'bg-black border-gray-700 hover:bg-zinc-800'}`}>
                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.isJewelrySet ? 'bg-purple-500 border-purple-500' : 'border-gray-600'}`}>
                                    {formData.isJewelrySet && <Check size={14} className="text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={formData.isJewelrySet} onChange={e => setFormData({...formData, isJewelrySet: e.target.checked})} />
                                <span className="text-sm font-bold text-white">Jewelry Set</span>
                            </label>
                        </div>

                        <h4 className="text-sm text-gray-400 font-bold mt-6 mb-3 uppercase tracking-wider">Category Features</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <label className="flex items-center gap-2 p-3 border border-gray-700 rounded bg-black hover:bg-zinc-800 cursor-pointer">
                                <input type="checkbox" checked={formData.isFeaturedRing} onChange={e => setFormData({...formData, isFeaturedRing: e.target.checked})} />
                                <span className="text-xs text-white">Featured Ring</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border border-gray-700 rounded bg-black hover:bg-zinc-800 cursor-pointer">
                                <input type="checkbox" checked={formData.isFeaturedBracelet} onChange={e => setFormData({...formData, isFeaturedBracelet: e.target.checked})} />
                                <span className="text-xs text-white">Featured Bracelet</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border border-gray-700 rounded bg-black hover:bg-zinc-800 cursor-pointer">
                                <input type="checkbox" checked={formData.isUniquePendant} onChange={e => setFormData({...formData, isUniquePendant: e.target.checked})} />
                                <span className="text-xs text-white">Unique Pendant</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border border-gray-700 rounded bg-black hover:bg-zinc-800 cursor-pointer">
                                <input type="checkbox" checked={formData.isFeaturedStud} onChange={e => setFormData({...formData, isFeaturedStud: e.target.checked})} />
                                <span className="text-xs text-white">Featured Studs</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border border-gray-700 rounded bg-black hover:bg-zinc-800 cursor-pointer">
                                <input type="checkbox" checked={formData.isFeaturedDangle} onChange={e => setFormData({...formData, isFeaturedDangle: e.target.checked})} />
                                <span className="text-xs text-white">Featured Dangles</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border border-gray-700 rounded bg-black hover:bg-zinc-800 cursor-pointer">
                                <input type="checkbox" checked={formData.isFeaturedWatch} onChange={e => setFormData({...formData, isFeaturedWatch: e.target.checked})} />
                                <span className="text-xs text-white">Featured Watch</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border border-gray-700 rounded bg-black hover:bg-zinc-800 cursor-pointer">
                                <input type="checkbox" checked={formData.isFeaturedJewelryBox} onChange={e => setFormData({...formData, isFeaturedJewelryBox: e.target.checked})} />
                                <span className="text-xs text-white">Featured Jewelry Box</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border border-gray-700 rounded bg-black hover:bg-zinc-800 cursor-pointer">
                                <input type="checkbox" checked={formData.isFeaturedPerfumeHolder} onChange={e => setFormData({...formData, isFeaturedPerfumeHolder: e.target.checked})} />
                                <span className="text-xs text-white">Featured Perfume Holder</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tags & SEO</label>
                        <div className="flex gap-2 mb-2 flex-wrap">{formData.tags.map((tag, i) => <span key={i} className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded flex items-center gap-1">{tag}<X size={12} className="cursor-pointer" onClick={() => handleRemoveArrayItem('tags', i)} /></span>)}</div>
                        <div className="flex gap-2"><input type="text" className="flex-1 p-2 bg-black border border-gray-700 rounded-md text-white text-sm" value={tempTag} onChange={e => setTempTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddArrayItem('tags', tempTag, setTempTag)} placeholder="Add tag..." /><button onClick={() => handleAddArrayItem('tags', tempTag, setTempTag)} className="bg-gray-800 p-2 rounded text-white"><Plus size={18}/></button></div>
                    </div>
                </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-cyan-500/30 p-5 rounded-xl shadow-lg">
                            <div className="flex items-center gap-2 mb-3 text-cyan-400 font-bold text-lg"><Bot size={24} /><h3>AI South African Reviewer</h3></div>
                            <button onClick={handleGenerateReviews} disabled={isGeneratingReviews} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow flex items-center justify-center gap-2">{isGeneratingReviews ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} Generate Standard Reviews</button>
                        </div>
                        {/* RESTORED CONDITIONAL BUTTON FOR UNIQUE PENDANTS */}
                        {(formData.isUniquePendant || formData.type === 'Pendant') && (
                            <div className="flex-1 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 p-5 rounded-xl shadow-lg">
                                <div className="flex items-center gap-2 mb-3 text-purple-400 font-bold text-lg"><Gem size={24} /><h3>Unique Piece Reviewer</h3></div>
                                <button onClick={handleGenerateUniqueReviews} disabled={isGeneratingReviews} className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow flex items-center justify-center gap-2">{isGeneratingReviews ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} Generate Unique Reviews</button>
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        {formData.reviews?.map(review => (
                            <div key={review.id} className="bg-black p-3 rounded border border-gray-800">
                                {editingReviewId === review.id && editReviewData ? (
                                    <div className="space-y-3 animate-in fade-in">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input 
                                                type="text" 
                                                className="bg-zinc-900 border border-gray-700 rounded p-2 text-xs text-white" 
                                                value={editReviewData.userName} 
                                                onChange={e => setEditReviewData({...editReviewData, userName: e.target.value})}
                                                placeholder="Name"
                                            />
                                            <input 
                                                type="text" 
                                                className="bg-zinc-900 border border-gray-700 rounded p-2 text-xs text-white" 
                                                value={editReviewData.location} 
                                                onChange={e => setEditReviewData({...editReviewData, location: e.target.value})}
                                                placeholder="Location"
                                            />
                                            {/* Date Input */}
                                            <input 
                                                type="text" 
                                                className="bg-zinc-900 border border-gray-700 rounded p-2 text-xs text-white col-span-2" 
                                                value={editReviewData.date} 
                                                onChange={e => setEditReviewData({...editReviewData, date: e.target.value})}
                                                placeholder="Date (YYYY-MM-DD or Text)"
                                            />
                                        </div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star 
                                                    key={star} 
                                                    size={16} 
                                                    className="cursor-pointer"
                                                    fill={star <= editReviewData.rating ? "orange" : "none"} 
                                                    stroke={star <= editReviewData.rating ? "orange" : "gray"}
                                                    onClick={() => setEditReviewData({...editReviewData, rating: star})}
                                                />
                                            ))}
                                        </div>
                                        <textarea 
                                            className="w-full bg-zinc-900 border border-gray-700 rounded p-2 text-xs text-white"
                                            rows={3}
                                            value={editReviewData.content}
                                            onChange={e => setEditReviewData({...editReviewData, content: e.target.value})}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingReviewId(null)} className="px-3 py-1 bg-zinc-800 text-white text-xs rounded hover:bg-zinc-700">Cancel</button>
                                            <button onClick={saveEditedReview} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                                                {review.userName} <span className="text-gray-600 font-normal">from {review.location}</span>
                                                <span className="text-gray-500 font-normal ml-2">{review.date}</span>
                                            </div>
                                            <div className="flex text-yellow-400 gap-0.5 my-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star key={star} size={10} fill={star <= review.rating ? "currentColor" : "none"} />
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400 italic">"{review.content}"</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => startEditingReview(review)} className="p-2 text-gray-400 hover:text-cyan-400"><Edit2 size={16} /></button>
                                            <button onClick={() => handleRemoveReview(review.id)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PROMOTIONS TAB */}
            {activeTab === 'promotions' && (
                <div className="space-y-8 animate-in fade-in">
                    <div className="bg-zinc-800/50 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3"><Truck className="text-green-400" /><div><h3 className="text-lg font-bold text-white">Retail Base Price</h3></div></div>
                        <div className="text-2xl font-bold text-green-400">R{formData.price.toFixed(2)}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                                <h3 className="font-bold text-white flex items-center gap-2 mb-4"><Tag size={18} className="text-cyan-400" /> Non-Member Promo</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs text-gray-500 uppercase mb-1">Promotional Price (R)</label><input type="number" className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white text-sm font-bold" value={formData.promoPrice || ''} onChange={e => setFormData({...formData, promoPrice: parseFloat(e.target.value) || 0})} /></div>
                                    <div><label className="block text-xs text-gray-500 uppercase mb-1">Discount (%)</label><div className="relative"><input type="number" className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white" value={((formData.price - (formData.promoPrice || 0))/formData.price * 100).toFixed(0)} readOnly /><Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" /></div></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div><label className="block text-xs text-gray-500 uppercase mb-1"><Clock size={12} /> Start</label><input type="datetime-local" className="w-full p-2 bg-zinc-800 border border-gray-700 rounded text-white text-sm" value={formData.promoStartsAt?.slice(0, 16) || ''} onChange={e => setFormData({...formData, promoStartsAt: e.target.value})} /></div>
                                    <div><label className="block text-xs text-gray-500 uppercase mb-1"><Clock size={12} /> End</label><input type="datetime-local" className="w-full p-2 bg-zinc-800 border border-gray-700 rounded text-white text-sm" value={formData.promoExpiresAt?.slice(0, 16) || ''} onChange={e => setFormData({...formData, promoExpiresAt: e.target.value})} /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* GIFTS TAB */}
            {activeTab === 'gifts' && (
               <div className="space-y-6 animate-in fade-in">
                   <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                       <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Gift size={18} className="text-pink-500" /> Promotional Gift</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div><label className="block text-xs text-gray-500 uppercase mb-1">Select Gift Product</label><select className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white text-sm" value={formData.giftProductId || ''} onChange={e => setFormData({...formData, giftProductId: e.target.value})}><option value="">-- No Gift --</option>{products.filter(p => p.id !== formData.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                           {formData.giftProductId && <div><label className="block text-xs text-gray-500 uppercase mb-1">Gift Value (R)</label><input type="number" className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white text-sm font-bold" value={formData.giftValue || ''} onChange={e => setFormData({...formData, giftValue: parseFloat(e.target.value) || 0})} /></div>}
                       </div>
                   </div>
               </div>
            )}

            {/* MEDIA TAB */}
            {activeTab === 'media' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-pink-500/30 p-5 rounded-xl shadow-lg">
                     <div className="flex items-center gap-2 mb-3 text-pink-400 font-bold text-lg"><Sparkles size={20} /><h3>AI Product Analyst</h3></div>
                     <div className="flex gap-3">
                         <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUploadAndAnalyze} />
                         <button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzingImage} className="flex-1 py-3 bg-zinc-800 hover:bg-pink-600 text-white rounded-lg border border-gray-600 hover:border-pink-400 transition-all flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50 shadow-lg">
                            {isAnalyzingImage ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}{isAnalyzingImage ? "Analyzing Image..." : "Upload & Analyze with AI"}
                         </button>
                     </div>
                  </div>
                  <div className="flex justify-between items-center"><label className="block text-sm font-medium text-gray-400">Description</label><button onClick={handleTextAIGenerate} disabled={isGeneratingAI} className="text-xs text-cyan-400 flex items-center gap-1 hover:text-cyan-300"><Bot size={12} /> {isGeneratingAI ? 'Writing...' : 'Generate from Text'}</button></div>
                  <textarea className="w-full p-2 bg-black border border-gray-700 rounded-md h-32 text-white text-sm" value={formData.description} onChange={e => setFormData({...formData,description: e.target.value})} />
                  <div><label className="block text-sm font-medium text-gray-400 mb-1">When & How to Wear</label><textarea className="w-full p-2 bg-black border border-gray-700 rounded-md h-24 text-white text-sm" value={formData.whenAndHowToWear} onChange={e => setFormData({...formData, whenAndHowToWear: e.target.value})} placeholder="Styling advice..." /></div>
                </div>
                <div className="space-y-4">
                   <label className="block text-sm font-medium text-gray-400">Images</label>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                       {formData.images.filter(img => img !== '').map((img, idx) => (
                           <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-800 bg-black">
                               <img src={img} alt="" className="w-full h-full object-cover" onError={handleImageError} />
                               <button onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
                           </div>
                       ))}
                       <div onClick={() => uploadInputRef.current?.click()} className="aspect-square rounded-lg border border-dashed border-gray-700 bg-zinc-900/30 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-zinc-800 hover:border-gray-500 transition-all">
                           <Plus size={24} />
                           <span className="text-[10px] mt-1">Add Image</span>
                       </div>
                   </div>
                   <div className="flex gap-2">
                      <input type="file" accept="image/*" multiple ref={uploadInputRef} className="hidden" onChange={handleAdditionalImageUpload} />
                      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleAdditionalImageUpload} />
                      <button onClick={() => uploadInputRef.current?.click()} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-gray-700 flex items-center justify-center gap-2"><ImagePlus size={16} className="text-cyan-400" /> Upload</button>
                      <button onClick={() => cameraInputRef.current?.click()} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-gray-700 flex items-center justify-center gap-2"><Smartphone size={16} className="text-pink-500" /> Camera</button>
                   </div>
                </div>
              </div>
            )}

          </div>

          <div className="p-4 border-t border-gray-800 bg-zinc-950 flex justify-end gap-3">
             <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors text-sm">Cancel</button>
             <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-500 flex items-center gap-2 shadow transition-colors text-sm font-semibold disabled:opacity-50">{isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {isSaving ? 'Saving...' : 'Save Product'}</button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="bg-zinc-900 rounded-xl border border-gray-800 shadow-sm p-8 text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={32} />
          <p className="text-gray-400">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-zinc-900 rounded-xl border border-gray-800 shadow-sm p-8 text-center">
          <Package className="mx-auto mb-4 text-gray-500" size={48} />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            {products.length === 0 
              ? "No products have been loaded from the database yet." 
              : "No products match your current filters."
            }
          </p>
          {products.length === 0 && (
            <p className="text-xs text-gray-600 mb-4">
              Check the browser console for any Supabase connection errors.
            </p>
          )}
          <button onClick={handleAddNew} className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-500 shadow-lg transition-colors mx-auto">
            <Plus size={18} /> Add First Product
          </button>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 border-b border-gray-800 text-gray-400 font-medium">
                     <tr><th className="p-4">Product</th><th className="p-4">Type</th><th className="p-4">SKU</th><th className="p-4">Price (R)</th><th className="p-4">Price (USD)</th><th className="p-4">Stock</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-zinc-800/50 group transition-colors">
                  <td className="p-4 flex items-center gap-3"><img src={product.images[0] || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded bg-black object-cover border border-gray-800" alt="" onError={handleImageError} />
                  <div><span className="font-medium text-gray-200 block">{product.name}</span><span className="text-xs text-gray-500">{product.category}</span></div></td>
                  <td className="p-4 text-gray-400">{getTypeLabel(getProductType(product))}</td>
                  <td className="p-4 text-gray-500 font-mono text-xs">{product.code}</td>
                  <td className="p-4 font-medium text-green-400">R{(product.price ? product.price.toFixed(2) : '0.00')}</td>
                  <td className="p-4 font-medium text-yellow-400">$ {(product.priceUSD ? product.priceUSD.toFixed(2) : '0.00')}</td>
                  <td className="p-4 text-gray-300">{product.stock}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-medium ${product.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>{product.status}</span></td>
                  <td className="p-4 text-right"><div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEdit(product)} className="p-2 text-gray-400 hover:text-cyan-400"><Edit2 size={16} /></button><button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating quick action so admins can always open the editor and access tabs */}
      {!isEditing && (
        <div className="fixed right-6 bottom-6 z-50">
          <button onClick={handleAddNew} title="Add Product" className="w-14 h-14 flex items-center justify-center rounded-full bg-pink-600 hover:bg-pink-500 text-white shadow-lg">
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* MANUAL WINNER OVERRIDE SECTION */}
      <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 p-6 rounded-xl mt-6">
         <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Crown size={18} className="text-yellow-400" /> Manual Winner Override</h3>
         <p className="text-gray-400 text-sm mb-4">Override the current week's winner for social proof notifications. Leave empty to use auto-generated winners.</p>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-400 mb-1">Winner Name</label>
               <input type="text" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm"
                  value={manualWinner?.name || ''} onChange={e => setManualWinner(manualWinner ? { ...manualWinner, name: e.target.value } : { name: e.target.value, prize: 500, currency: 'ZAR' as const, rank: 1 })} placeholder="e.g. John Doe" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-400 mb-1">Prize Amount</label>
               <input type="number" className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm"
                  value={manualWinner?.prize || ''} onChange={e => setManualWinner(manualWinner ? { ...manualWinner, prize: parseFloat(e.target.value) || 0 } : { name: '', prize: parseFloat(e.target.value) || 0, currency: 'ZAR' as const, rank: 1 })} placeholder="500" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-400 mb-1">Currency</label>
               <select className="w-full p-2 bg-black border border-gray-700 rounded-md text-white text-sm"
                  value={manualWinner?.currency || 'ZAR'} onChange={e => setManualWinner(manualWinner ? { ...manualWinner, currency: e.target.value as 'ZAR' | 'USD' } : { name: '', prize: 500, currency: e.target.value as 'ZAR' | 'USD', rank: 1 })}>
                  <option value="ZAR">ZAR (R)</option>
                  <option value="USD">USD ($)</option>
               </select>
            </div>
         </div>
         <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setManualWinner(null)} className="px-4 py-2 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors text-sm">Clear Override</button>
            <button onClick={() => alert('Manual winner set!')} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors text-sm">Set Winner</button>
         </div>
      </div>
    </div>
  );
};

export default AdminProducts;
