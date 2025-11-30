
import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { User } from '../../types';
import { Check, X, Search, ChevronRight, Shield, Network, Plus, Link as LinkIcon, DollarSign, Users, Star, TrendingUp } from 'lucide-react';

const AdminAffiliates: React.FC = () => {
  const { getAllUsers, approveAffiliate, rejectAffiliate, updateAffiliateTier, assignAffiliateParent } = useStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applicants' | 'active'>('applicants');
  
  // Detailed Profile Modal State
  const [selectedAffiliate, setSelectedAffiliate] = useState<User | null>(null);
  const [manualTier, setManualTier] = useState(10);
  const [recruitSelect, setRecruitSelect] = useState('');

  // Processing Modal State
  const [processModal, setProcessModal] = useState<{ userId: string, name: string, action: 'approve' | 'reject' } | null>(null);
  const [processNote, setProcessNote] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
      setLoading(true);
      const fetched = await getAllUsers();
      setUsers(fetched);
      setLoading(false);
  };

  const applicants = users.filter(u => u.affiliateStats?.status === 'pending');
  const affiliates = users.filter(u => u.affiliateStats?.status === 'approved');

  const openProcessModal = (user: User, action: 'approve' | 'reject') => {
      setProcessModal({ userId: user.id, name: user.name, action });
      setProcessNote('');
  };

  const confirmProcess = async () => {
      if (!processModal) return;
      
      if (processModal.action === 'approve') {
          await approveAffiliate(processModal.userId, processNote);
      } else {
          await rejectAffiliate(processModal.userId, processNote);
      }
      
      setProcessModal(null);
      setProcessNote('');
      loadUsers();
  };

  const handleOpenProfile = (user: User) => {
      setSelectedAffiliate(user);
      setManualTier(user.affiliateStats?.commissionRate || 10);
      setRecruitSelect('');
  };

  const handleSaveTier = async () => {
      if (!selectedAffiliate) return;
      await updateAffiliateTier(selectedAffiliate.id, manualTier);
      
      // Update local state immediately for UI feedback
      const updatedUser = {
          ...selectedAffiliate, 
          affiliateStats: { ...selectedAffiliate.affiliateStats!, commissionRate: manualTier } 
      } as User;
      
      setSelectedAffiliate(updatedUser);
      setUsers(prev => prev.map(u => u.id === selectedAffiliate.id ? updatedUser : u));
      alert("Commission Tier Updated!");
  };

  const handleAddRecruit = async () => {
      if (!selectedAffiliate || !recruitSelect) return;
      
      // assignAffiliateParent(childId, parentId)
      await assignAffiliateParent(recruitSelect, selectedAffiliate.id);
      
      alert("Recruit Added! This affiliate will now earn 1% commission from their sales.");
      
      // Refresh data to show new downline
      const all = await getAllUsers();
      setUsers(all);
      const updatedSelf = all.find(u => u.id === selectedAffiliate.id);
      if (updatedSelf) setSelectedAffiliate(updatedSelf);
      setRecruitSelect('');
  };

  // Get sub-affiliates for the currently selected user
  const subAffiliates = selectedAffiliate 
      ? users.filter(u => u.affiliateStats?.parentId === selectedAffiliate.id)
      : [];

  // Get parent if exists
  const parentAffiliate = selectedAffiliate?.affiliateStats?.parentId 
      ? users.find(u => u.id === selectedAffiliate.affiliateStats?.parentId)
      : null;

  // Calculate passive income stats
  const totalDownlineSales = subAffiliates.reduce((sum, sub) => sum + (sub.affiliateStats?.totalSalesValue || 0), 0);
  const estimatedPassiveIncome = totalDownlineSales * 0.01; // 1%

  return (
    <div className="space-y-8 relative">
       <div className="flex justify-between items-center">
           <h1 className="text-[22px] font-bold text-white">Affiliate Management</h1>
           <button onClick={loadUsers} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
               <Search size={14} /> Refresh Data
           </button>
       </div>

       {/* Tabs */}
       <div className="flex gap-4 border-b border-gray-800 pb-1">
           <button 
             onClick={() => setActiveTab('applicants')}
             className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'applicants' ? 'border-pink-500 text-pink-500' : 'border-transparent text-gray-400 hover:text-white'}`}
           >
               Applicants ({applicants.length})
           </button>
           <button 
             onClick={() => setActiveTab('active')}
             className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'active' ? 'border-cyan-500 text-cyan-500' : 'border-transparent text-gray-400 hover:text-white'}`}
           >
               Active Partners ({affiliates.length})
           </button>
       </div>

       {loading ? (
           <div className="text-center py-12 text-gray-500">Loading data...</div>
       ) : (
           <div className="bg-zinc-900 rounded-xl border border-gray-800 overflow-hidden min-h-[400px]">
               {activeTab === 'applicants' && (
                   <div className="divide-y divide-gray-800">
                       {applicants.length === 0 ? (
                           <div className="p-8 text-center text-gray-500">No pending applications.</div>
                       ) : (
                           applicants.map(u => (
                               <div key={u.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-black/20 gap-4">
                                   <div>
                                       <h3 className="text-white font-bold">{u.name}</h3>
                                       <p className="text-sm text-gray-400">{u.email}</p>
                                       <div className="mt-3 p-3 bg-black/50 border border-gray-700 rounded-lg max-w-xl">
                                           <p className="text-xs text-gray-300 italic">"{u.affiliateStats?.joinReason}"</p>
                                           {u.affiliateStats?.gender && <span className="text-[10px] text-gray-500 mt-1 block">Gender: {u.affiliateStats.gender}</span>}
                                       </div>
                                   </div>
                                   <div className="flex gap-2 shrink-0">
                                       <button 
                                         onClick={() => openProcessModal(u, 'approve')}
                                         className="px-4 py-2 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50 border border-green-500/30 flex items-center gap-2 text-sm font-bold"
                                       >
                                           <Check size={16} /> Approve
                                       </button>
                                       <button 
                                         onClick={() => openProcessModal(u, 'reject')}
                                         className="px-4 py-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 border border-red-500/30 flex items-center gap-2 text-sm font-bold"
                                       >
                                           <X size={16} /> Reject
                                       </button>
                                   </div>
                               </div>
                           ))
                       )}
                   </div>
               )}

               {activeTab === 'active' && (
                   <div className="divide-y divide-gray-800">
                       {affiliates.length === 0 ? (
                           <div className="p-8 text-center text-gray-500">No active affiliates yet.</div>
                       ) : (
                           affiliates.map(u => (
                               <div key={u.id} onClick={() => handleOpenProfile(u)} className="p-6 flex items-center justify-between hover:bg-zinc-800 cursor-pointer transition-colors group">
                                   <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-cyan-400 font-bold border border-gray-700">
                                           {u.name.charAt(0)}
                                       </div>
                                       <div>
                                           <h3 className="text-white font-bold flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                                               {u.name} <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                           </h3>
                                           <p className="text-xs text-gray-500">{u.affiliateCode}</p>
                                       </div>
                                   </div>
                                   <div className="text-right flex items-center gap-8">
                                       <div className="hidden sm:block">
                                           <p className="text-xs text-gray-500 uppercase">Recruits</p>
                                           <p className="text-white font-bold text-center">{users.filter(sub => sub.affiliateStats?.parentId === u.id).length}</p>
                                       </div>
                                       <div>
                                           <p className="text-xs text-gray-500 uppercase">Sales</p>
                                           <p className="text-white font-bold">R{u.affiliateStats?.totalSalesValue.toFixed(0)}</p>
                                       </div>
                                       <div>
                                           <p className="text-xs text-gray-500 uppercase">Rate</p>
                                           <p className="text-pink-400 font-bold">{u.affiliateStats?.commissionRate}%</p>
                                       </div>
                                   </div>
                               </div>
                           ))
                       )}
                   </div>
               )}
           </div>
       )}

       {/* PROCESS MODAL */}
       {processModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setProcessModal(null)} />
               <div className="bg-zinc-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full relative z-10 shadow-2xl">
                   <h3 className="text-lg font-bold text-white mb-2 capitalize">{processModal.action} Application</h3>
                   <p className="text-sm text-gray-400 mb-4">For {processModal.name}</p>
                   <textarea 
                       className="w-full bg-black border border-gray-700 rounded p-3 text-white text-sm mb-4"
                       placeholder="Add a note (optional)..."
                       rows={3}
                       value={processNote}
                       onChange={e => setProcessNote(e.target.value)}
                   />
                   <div className="flex gap-3">
                       <button onClick={() => setProcessModal(null)} className="flex-1 py-2 bg-zinc-800 text-gray-300 rounded hover:bg-zinc-700">Cancel</button>
                       <button 
                           onClick={confirmProcess}
                           className={`flex-1 py-2 text-white font-bold rounded ${processModal.action === 'approve' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
                       >
                           Confirm
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* DETAILED PROFILE MODAL */}
       {selectedAffiliate && (
           <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4">
               <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedAffiliate(null)} />
               <div className="bg-zinc-900 border border-gray-800 rounded-2xl w-full max-w-4xl relative z-10 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                   
                   {/* Header */}
                   <div className="flex justify-between items-center p-6 border-b border-gray-800">
                       <div className="flex items-center gap-4">
                           <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg border-2 border-white/10">
                               {selectedAffiliate.name.charAt(0)}
                           </div>
                           <div>
                               <h2 className="text-2xl font-bold text-white">{selectedAffiliate.name}</h2>
                               <div className="flex items-center gap-2 text-sm">
                                   <span className="text-gray-400">{selectedAffiliate.email}</span>
                                   <span className="text-gray-600">•</span>
                                   <span className="font-mono text-cyan-400 bg-cyan-900/20 px-2 py-0.5 rounded text-xs border border-cyan-500/30">
                                       {selectedAffiliate.affiliateCode}
                                   </span>
                               </div>
                           </div>
                       </div>
                       <button onClick={() => setSelectedAffiliate(null)} className="p-2 bg-zinc-800 rounded-full text-gray-400 hover:text-white transition-colors">
                           <X size={20} />
                       </button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-6 space-y-8">
                       
                       {/* Stats Grid */}
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="bg-black/50 p-4 rounded-xl border border-gray-800 flex flex-col">
                               <div className="flex items-center gap-2 text-gray-500 mb-1">
                                   <DollarSign size={16} className="text-green-500" />
                                   <span className="text-xs uppercase">Direct Sales</span>
                               </div>
                               <p className="text-2xl font-bold text-white">R{selectedAffiliate.affiliateStats?.totalSalesValue.toFixed(2)}</p>
                           </div>
                           <div className="bg-black/50 p-4 rounded-xl border border-gray-800 flex flex-col">
                               <div className="flex items-center gap-2 text-gray-500 mb-1">
                                   <TrendingUp size={16} className="text-purple-500" />
                                   <span className="text-xs uppercase">Total Earned</span>
                               </div>
                               <p className="text-2xl font-bold text-green-400">R{selectedAffiliate.affiliateStats?.balance.toFixed(2)}</p>
                           </div>
                           <div className="bg-black/50 p-4 rounded-xl border border-gray-800 flex flex-col">
                               <div className="flex items-center gap-2 text-gray-500 mb-1">
                                   <Users size={16} className="text-cyan-500" />
                                   <span className="text-xs uppercase">Network</span>
                               </div>
                               <p className="text-2xl font-bold text-white">{subAffiliates.length} <span className="text-sm font-normal text-gray-500">Recruits</span></p>
                           </div>
                       </div>

                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                           
                           {/* Left Column: Settings */}
                           <div className="space-y-6">
                               <div className="bg-zinc-800/30 p-5 rounded-xl border border-gray-700">
                                   <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                       <Shield size={18} className="text-yellow-400" /> Commission Settings
                                   </h3>
                                   <div className="space-y-4">
                                       <div>
                                           <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Direct Commission Tier (%)</label>
                                           <div className="flex gap-2">
                                               <div className="relative flex-1">
                                                   <input 
                                                       type="number" 
                                                       value={manualTier}
                                                       onChange={(e) => setManualTier(parseFloat(e.target.value))}
                                                       className="w-full bg-black border border-gray-600 rounded-lg p-3 text-white text-sm font-bold focus:border-pink-500 outline-none"
                                                   />
                                                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                               </div>
                                               <button 
                                                   onClick={handleSaveTier}
                                                   className="bg-pink-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-pink-500 shadow-lg"
                                               >
                                                   Update
                                               </button>
                                           </div>
                                           <p className="text-[10px] text-gray-500 mt-2">
                                               Standard Tiers: <span className="text-gray-300">10%, 11%, 15%, 20%</span>. This setting overrides automatic tier progression.
                                           </p>
                                       </div>
                                   </div>
                               </div>

                               {parentAffiliate && (
                                   <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-500/30 flex items-center gap-3">
                                       <div className="p-2 bg-blue-500/20 rounded-full text-blue-400">
                                           <LinkIcon size={20} />
                                       </div>
                                       <div>
                                           <p className="text-xs text-blue-300 uppercase font-bold mb-1">Recruited By (Upline)</p>
                                           <p className="text-white font-bold text-sm">{parentAffiliate.name}</p>
                                           <p className="text-[10px] text-gray-400">{parentAffiliate.affiliateCode}</p>
                                       </div>
                                   </div>
                               )}
                           </div>

                           {/* Right Column: Network / Downline */}
                           <div className="bg-zinc-800/30 p-5 rounded-xl border border-gray-700 h-full flex flex-col">
                               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                   <Network size={18} className="text-cyan-400" /> Network & Downline
                               </h3>
                               
                               {/* Add Recruit */}
                               <div className="mb-4 p-4 bg-black/40 rounded-xl border border-gray-700">
                                   <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Add Recruit to Downline</label>
                                   <div className="flex gap-2">
                                       <select 
                                           className="flex-1 bg-zinc-900 border border-gray-600 rounded-lg p-2 text-xs text-white focus:border-cyan-500 outline-none"
                                           value={recruitSelect}
                                           onChange={(e) => setRecruitSelect(e.target.value)}
                                       >
                                           <option value="">Select User to Link...</option>
                                           {users
                                               .filter(u => u.id !== selectedAffiliate.id && u.affiliateStats?.parentId !== selectedAffiliate.id && u.affiliateStats?.status === 'approved')
                                               .sort((a,b) => a.name.localeCompare(b.name))
                                               .map(u => (
                                                   <option key={u.id} value={u.id}>{u.name} ({u.affiliateCode})</option>
                                               ))
                                           }
                                       </select>
                                       <button 
                                           onClick={handleAddRecruit}
                                           disabled={!recruitSelect}
                                           className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-1"
                                       >
                                           <Plus size={14} /> Add
                                       </button>
                                   </div>
                                   <p className="text-[10px] text-gray-500 mt-2">
                                       {selectedAffiliate.name} will earn <strong>1%</strong> from sales made by users added here.
                                   </p>
                               </div>

                               {/* List */}
                               <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[300px] custom-scrollbar">
                                   {subAffiliates.length === 0 ? (
                                       <div className="text-center py-8 border border-dashed border-gray-800 rounded-xl">
                                           <p className="text-gray-500 text-xs">No recruits in downline yet.</p>
                                       </div>
                                   ) : (
                                       subAffiliates.map(sub => (
                                           <div key={sub.id} className="flex items-center justify-between bg-black p-3 rounded-lg border border-gray-800 hover:border-cyan-500/30 transition-colors">
                                               <div className="flex items-center gap-3">
                                                   <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-700">
                                                       {sub.name.charAt(0)}
                                                   </div>
                                                   <div>
                                                       <p className="text-sm text-white font-bold">{sub.name}</p>
                                                       <p className="text-[10px] text-gray-500">{sub.affiliateCode}</p>
                                                   </div>
                                               </div>
                                               <div className="text-right">
                                                   <p className="text-[10px] text-gray-500">Sales: R{sub.affiliateStats?.totalSalesValue.toFixed(0)}</p>
                                                   <p className="text-xs text-green-400 font-bold">+R{(sub.affiliateStats?.totalSalesValue || 0 * 0.01).toFixed(2)}</p>
                                               </div>
                                           </div>
                                       ))
                                   )}
                               </div>
                               
                               {subAffiliates.length > 0 && (
                                   <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                                       <span className="text-xs text-gray-400 uppercase font-bold">Passive Income Generated</span>
                                       <span className="text-lg font-bold text-green-400">R{estimatedPassiveIncome.toFixed(2)}</span>
                                   </div>
                               )}
                           </div>
                       </div>

                   </div>
               </div>
           </div>
       )}

    </div>
  );
};

export default AdminAffiliates;
