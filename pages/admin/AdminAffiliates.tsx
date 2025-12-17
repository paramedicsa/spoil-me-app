import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { User } from '../../types';
import { Check, X, Search, ChevronRight, Shield, Network, Plus, Link as LinkIcon, DollarSign, Users, Star, TrendingUp, Download, FileText, Settings, AlertTriangle, Lock, Eye, EyeOff, Trophy } from 'lucide-react';

const AdminAffiliates: React.FC = () => {
  const { getAllUsers, approveAffiliate, rejectAffiliate, updateAffiliateTier, assignAffiliateParent } = useStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applicants' | 'active'>('applicants');
  
  // New state for expanded Affiliate Manager
  const [managerTab, setManagerTab] = useState<'overview' | 'payouts' | 'partners' | 'settings' | 'validator'>('overview');
  const [payoutTab, setPayoutTab] = useState<'domestic' | 'international'>('domestic');
  const [usdToZarRate, setUsdToZarRate] = useState(18.20);
  const [zarToUsdRate, setZarToUsdRate] = useState(0.055);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Commission rates state
  const [commissionRates, setCommissionRates] = useState({
    bronze: 10,
    silver: 11,
    gold: 15,
    platinum: 20,
    vault: 1 // locked
  });

  // Membership fees state
  const [membershipFees, setMembershipFees] = useState({
    zar: { spoilMe: 2, basic: 5, premium: 10, deluxe: 15 },
    usd: { insider: 1, gold: 2, deluxe: 3 }
  });

  // Bonuses state
  const [bonuses, setBonuses] = useState({
    sprinter: { zar: 50, usd: 5 },
    bigSpender: { zar: 200, usd: 15 }
  });

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
           <h1 className="text-[22px] font-bold text-white">Affiliate Manager</h1>
           <button onClick={loadUsers} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
               <Search size={14} /> Refresh Data
           </button>
       </div>

       {/* Main Manager Tabs */}
       <div className="flex gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
           {[
               { key: 'overview', label: 'Dashboard Overview', icon: TrendingUp },
               { key: 'payouts', label: 'Payout Manager', icon: DollarSign },
               { key: 'partners', label: 'Partner List', icon: Users },
               { key: 'settings', label: 'Settings & Variables', icon: Settings },
               { key: 'validator', label: 'Commission Validator', icon: AlertTriangle }
           ].map(({ key, label, icon: Icon }) => (
               <button
                 key={key}
                 onClick={() => setManagerTab(key as any)}
                 className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                     managerTab === key ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-gray-400 hover:text-white'
                 }`}
               >
                   <Icon size={16} /> {label}
               </button>
           ))}
       </div>

       {/* SECTION 1: DASHBOARD OVERVIEW */}
       {managerTab === 'overview' && (
           <div className="space-y-6">
               {/* Top Cards */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                       <div className="flex items-center gap-3 mb-4">
                           <div className="p-3 bg-green-900/20 rounded-lg text-green-400">
                               <DollarSign size={24} />
                           </div>
                           <div>
                               <h3 className="text-lg font-bold text-white">Pending Payouts (ZAR)</h3>
                               <p className="text-sm text-gray-400">Ready for EFT</p>
                           </div>
                       </div>
                       <p className="text-3xl font-bold text-green-400">
                           R{affiliates.filter(a => (a.affiliateStats?.balance || 0) > 200).reduce((sum, a) => sum + (a.affiliateStats?.balance || 0), 0).toFixed(0)}
                       </p>
                   </div>

                   <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                       <div className="flex items-center gap-3 mb-4">
                           <div className="p-3 bg-blue-900/20 rounded-lg text-blue-400">
                               <DollarSign size={24} />
                           </div>
                           <div>
                               <h3 className="text-lg font-bold text-white">Pending Payouts (USD)</h3>
                               <p className="text-sm text-gray-400">Ready for PayPal</p>
                           </div>
                       </div>
                       <p className="text-3xl font-bold text-blue-400">
                           ${affiliates.filter(a => (a.affiliateStats?.balance || 0) > 50).reduce((sum, a) => sum + (a.affiliateStats?.balance || 0), 0).toFixed(0)}
                       </p>
                   </div>

                   <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                       <div className="flex items-center gap-3 mb-4">
                           <div className="p-3 bg-purple-900/20 rounded-lg text-purple-400">
                               <Star size={24} />
                           </div>
                           <div>
                               <h3 className="text-lg font-bold text-white">Top Vault Movers</h3>
                               <p className="text-sm text-gray-400">Most vault sales</p>
                           </div>
                       </div>
                       <p className="text-3xl font-bold text-purple-400">
                           {affiliates.reduce((max, a) => Math.max(max, a.affiliateStats?.totalSalesCount || 0), 0)}
                       </p>
                       <p className="text-xs text-gray-500 mt-1">Items sold</p>
                   </div>

                   <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                       <div className="flex items-center gap-3 mb-4">
                           <div className="p-3 bg-cyan-900/20 rounded-lg text-cyan-400">
                               <Users size={24} />
                           </div>
                           <div>
                               <h3 className="text-lg font-bold text-white">Total Partners</h3>
                               <p className="text-sm text-gray-400">Active affiliates</p>
                           </div>
                       </div>
                       <p className="text-3xl font-bold text-cyan-400">{affiliates.length}</p>
                   </div>
               </div>

               {/* Quick Actions */}
               <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                   <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <button
                         onClick={() => setManagerTab('payouts')}
                         className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg hover:bg-green-900/30 transition-colors text-left"
                       >
                           <div className="flex items-center gap-3 mb-2">
                               <DollarSign size={20} className="text-green-400" />
                               <span className="text-green-400 font-bold">Process Payouts</span>
                           </div>
                           <p className="text-sm text-gray-400">Manage EFT and PayPal payments</p>
                       </button>
                       <button
                         onClick={() => setManagerTab('partners')}
                         className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg hover:bg-blue-900/30 transition-colors text-left"
                       >
                           <div className="flex items-center gap-3 mb-2">
                               <Users size={20} className="text-blue-400" />
                               <span className="text-blue-400 font-bold">Manage Partners</span>
                           </div>
                           <p className="text-sm text-gray-400">Review applications and tiers</p>
                       </button>
                       <button
                         onClick={() => setManagerTab('validator')}
                         className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg hover:bg-red-900/30 transition-colors text-left"
                       >
                           <div className="flex items-center gap-3 mb-2">
                               <AlertTriangle size={20} className="text-red-400" />
                               <span className="text-red-400 font-bold">Validate Commissions</span>
                           </div>
                           <p className="text-sm text-gray-400">Check for errors and anomalies</p>
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* SECTION 2: PAYOUT MANAGER */}
       {managerTab === 'payouts' && (
           <div className="space-y-6">
               {/* Payout Tabs */}
               <div className="flex gap-4 border-b border-gray-800 pb-2">
                   <button
                     onClick={() => setPayoutTab('domestic')}
                     className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                         payoutTab === 'domestic' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-white'
                     }`}
                   >
                       <FileText size={16} /> Domestic EFT (ZAR)
                   </button>
                   <button
                     onClick={() => setPayoutTab('international')}
                     className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                         payoutTab === 'international' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-white'
                     }`}
                   >
                       <DollarSign size={16} /> International PayPal (USD)
                   </button>
               </div>

               {payoutTab === 'domestic' && (
                   <div className="space-y-6">
                       {/* Exchange Rate Input */}
                       <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                           <h3 className="text-lg font-bold text-white mb-4">Exchange Rate Settings</h3>
                           <div className="flex items-center gap-4">
                               <label className="text-sm text-gray-400">USD to ZAR Rate:</label>
                               <input
                                   type="number"
                                   step="0.01"
                                   value={usdToZarRate}
                                   onChange={(e) => setUsdToZarRate(parseFloat(e.target.value))}
                                   className="bg-black border border-gray-600 rounded p-2 text-white text-sm w-24"
                               />
                               <span className="text-gray-500">(Today's rate for conversion)</span>
                           </div>
                       </div>

                       {/* Payout Table */}
                       <div className="bg-zinc-900 rounded-xl border border-gray-800 overflow-hidden">
                           <div className="p-6 border-b border-gray-800">
                               <h3 className="text-lg font-bold text-white">Domestic Payout Queue</h3>
                               <p className="text-sm text-gray-400">South African affiliates with balances &gt; R200</p>
                           </div>
                           <div className="overflow-x-auto">
                               <table className="w-full">
                                   <thead className="bg-black/50">
                                       <tr>
                                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Partner</th>
                                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Bank</th>
                                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">ZAR Earned</th>
                                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">USD Earned</th>
                                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Final Payout (ZAR)</th>
                                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Action</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-800">
                                       {affiliates
                                           .filter(a => (a.affiliateStats?.balance || 0) > 200)
                                           .map(a => {
                                               const zarEarned = a.affiliateStats?.balance || 0;
                                               const usdEarned = 0; // Mock - would come from actual data
                                               const finalPayout = zarEarned + (usdEarned * usdToZarRate);
                                               return (
                                                   <tr key={a.id} className="hover:bg-zinc-800/50">
                                                       <td className="px-6 py-4">
                                                           <div>
                                                               <p className="text-white font-bold">{a.name}</p>
                                                               <p className="text-gray-400 text-sm">{a.email}</p>
                                                           </div>
                                                       </td>
                                                       <td className="px-6 py-4 text-gray-300">FNB</td>
                                                       <td className="px-6 py-4 text-green-400 font-bold">R{zarEarned.toFixed(2)}</td>
                                                       <td className="px-6 py-4 text-blue-400">${usdEarned.toFixed(2)}</td>
                                                       <td className="px-6 py-4 text-yellow-400 font-bold">R{finalPayout.toFixed(2)}</td>
                                                       <td className="px-6 py-4">
                                                           <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500">
                                                               Mark Paid
                                                           </button>
                                                       </td>
                                                   </tr>
                                               );
                                           })}
                                   </tbody>
                               </table>
                           </div>
                           <div className="p-6 border-t border-gray-800 flex justify-between items-center">
                               <div className="text-sm text-gray-400">
                                   {affiliates.filter(a => (a.affiliateStats?.balance || 0) > 200).length} partners ready for payout
                               </div>
                               <button className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 flex items-center gap-2">
                                   <Download size={18} /> Download FNB/STD Bank Batch File
                               </button>
                           </div>
                       </div>
                   </div>
               )}

               {payoutTab === 'international' && (
                   <div className="space-y-6">
                       {/* Exchange Rate Input */}
                       <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                           <h3 className="text-lg font-bold text-white mb-4">Exchange Rate Settings</h3>
                           <div className="flex items-center gap-4">
                               <label className="text-sm text-gray-400">ZAR to USD Rate:</label>
                               <input
                                   type="number"
                                   step="0.0001"
                                   value={zarToUsdRate}
                                   onChange={(e) => setZarToUsdRate(parseFloat(e.target.value))}
                                   className="bg-black border border-gray-600 rounded p-2 text-white text-sm w-24"
                               />
                               <span className="text-gray-500">(Today's rate for conversion)</span>
                           </div>
                       </div>

                       {/* Payout Table */}
                       <div className="bg-zinc-900 rounded-xl border border-gray-800 overflow-hidden">
                           <div className="p-6 border-b border-gray-800">
                               <h3 className="text-lg font-bold text-white">International Payout Queue</h3>
                               <p className="text-sm text-gray-400">Non-SA affiliates with balances &gt; $50</p>
                           </div>
                           <div className="overflow-x-auto">
                               <table className="w-full">
                                   <thead className="bg-black/50">
                                       <tr>
                                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Partner</th>
                                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">PayPal Email</th>
                                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">USD Earned</th>
                                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">ZAR Earned</th>
                                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Final Payout (USD)</th>
                                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Action</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-800">
                                       {affiliates
                                           .filter(a => (a.affiliateStats?.balance || 0) > 50)
                                           .map(a => {
                                               const usdEarned = a.affiliateStats?.balance || 0;
                                               const zarEarned = 0; // Mock - would come from actual data
                                               const finalPayout = usdEarned + (zarEarned * zarToUsdRate);
                                               return (
                                                   <tr key={a.id} className="hover:bg-zinc-800/50">
                                                       <td className="px-6 py-4">
                                                           <div>
                                                               <p className="text-white font-bold">{a.name}</p>
                                                               <p className="text-gray-400 text-sm">{a.email}</p>
                                                           </div>
                                                       </td>
                                                       <td className="px-6 py-4 text-gray-300">{a.email}</td>
                                                       <td className="px-6 py-4 text-blue-400 font-bold">${usdEarned.toFixed(2)}</td>
                                                       <td className="px-6 py-4 text-green-400">R{zarEarned.toFixed(2)}</td>
                                                       <td className="px-6 py-4 text-yellow-400 font-bold">${finalPayout.toFixed(2)}</td>
                                                       <td className="px-6 py-4">
                                                           <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">
                                                               Mark Paid
                                                           </button>
                                                       </td>
                                                   </tr>
                                               );
                                           })}
                                   </tbody>
                               </table>
                           </div>
                           <div className="p-6 border-t border-gray-800 flex justify-between items-center">
                               <div className="text-sm text-gray-400">
                                   {affiliates.filter(a => (a.affiliateStats?.balance || 0) > 50).length} partners ready for payout
                               </div>
                               <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 flex items-center gap-2">
                                   <Download size={18} /> Export PayPal Mass Pay CSV
                               </button>
                           </div>
                       </div>
                   </div>
               )}
           </div>
       )}

       {/* SECTION 3: AFFILIATE LIST & TIERS */}
       {managerTab === 'partners' && (
           <div className="space-y-6">
               {/* Search & Filter */}
               <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                   <div className="flex flex-col md:flex-row gap-4">
                       <div className="flex-1">
                           <label className="block text-sm text-gray-400 mb-2">Search Partners</label>
                           <input
                               type="text"
                               placeholder="Name, email, or code..."
                               value={searchQuery}
                               onChange={(e) => setSearchQuery(e.target.value)}
                               className="w-full bg-black border border-gray-600 rounded p-3 text-white"
                           />
                       </div>
                       <div>
                           <label className="block text-sm text-gray-400 mb-2">Filter by Tier</label>
                           <select
                               value={tierFilter}
                               onChange={(e) => setTierFilter(e.target.value)}
                               className="bg-black border border-gray-600 rounded p-3 text-white min-w-[150px]"
                           >
                               <option value="all">All Tiers</option>
                               <option value="bronze">Bronze (10%)</option>
                               <option value="silver">Silver (11%)</option>
                               <option value="gold">Gold (15%)</option>
                               <option value="platinum">Platinum (20%)</option>
                           </select>
                       </div>
                   </div>
               </div>

               {/* Partners Table */}
               <div className="bg-zinc-900 rounded-xl border border-gray-800 overflow-hidden">
                   <div className="overflow-x-auto">
                       <table className="w-full">
                           <thead className="bg-black/50">
                               <tr>
                                   <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Partner</th>
                                   <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Current Tier</th>
                                   <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Sales (This Month)</th>
                                   <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Vault Sales</th>
                                   <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                                   <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-800">
                               {affiliates
                                   .filter(a =>
                                       (searchQuery === '' ||
                                        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        a.affiliateCode.toLowerCase().includes(searchQuery.toLowerCase())) &&
                                       (tierFilter === 'all' ||
                                        (tierFilter === 'bronze' && a.affiliateStats?.commissionRate === 10) ||
                                        (tierFilter === 'silver' && a.affiliateStats?.commissionRate === 11) ||
                                        (tierFilter === 'gold' && a.affiliateStats?.commissionRate === 15) ||
                                        (tierFilter === 'platinum' && a.affiliateStats?.commissionRate === 20))
                                   )
                                   .map(a => (
                                       <tr key={a.id} className="hover:bg-zinc-800/50">
                                           <td className="px-6 py-4">
                                               <div className="flex items-center gap-3">
                                                   <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-cyan-400 font-bold">
                                                       {a.name.charAt(0)}
                                                   </div>
                                                   <div>
                                                       <p className="text-white font-bold">{a.name}</p>
                                                       <p className="text-gray-400 text-sm">{a.email}</p>
                                                   </div>
                                               </div>
                                           </td>
                                           <td className="px-6 py-4">
                                               <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                   a.affiliateStats?.commissionRate === 20 ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' :
                                                   a.affiliateStats?.commissionRate === 15 ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' :
                                                   a.affiliateStats?.commissionRate === 11 ? 'bg-gray-900/30 text-gray-400 border border-gray-500/30' :
                                                   'bg-orange-900/30 text-orange-400 border border-orange-500/30'
                                               }`}>
                                                   {a.affiliateStats?.commissionRate === 20 ? '🥇 Gold' :
                                                    a.affiliateStats?.commissionRate === 15 ? '🥈 Silver' :
                                                    a.affiliateStats?.commissionRate === 11 ? '🥉 Bronze' : 'Starter'} - {a.affiliateStats?.commissionRate}%
                                               </span>
                                           </td>
                                           <td className="px-6 py-4 text-white font-bold">
                                               R{a.affiliateStats?.totalSalesValue.toFixed(0)}
                                           </td>
                                           <td className="px-6 py-4 text-purple-400">
                                               {Math.floor(Math.random() * 50)} items
                                           </td>
                                           <td className="px-6 py-4">
                                               <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs border border-green-500/30">
                                                   Active
                                               </span>
                                           </td>
                                           <td className="px-6 py-4">
                                               <div className="flex gap-2">
                                                   <button
                                                     onClick={() => handleOpenProfile(a)}
                                                     className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
                                                   >
                                                       Edit
                                                   </button>
                                                   <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500">
                                                       History
                                                   </button>
                                               </div>
                                           </td>
                                       </tr>
                                   ))}
                           </tbody>
                       </table>
                   </div>
               </div>
           </div>
       )}

       {/* SECTION 4: SETTINGS & VARIABLES */}
       {managerTab === 'settings' && (
           <div className="space-y-6">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* Commission Rates */}
                   <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                       <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                           <Settings size={18} className="text-yellow-400" /> Commission Rates
                       </h3>
                       <div className="space-y-4">
                           <div>
                               <label className="block text-sm text-gray-400 mb-1">Standard Products</label>
                               <div className="grid grid-cols-2 gap-2">
                                   <div className="text-center p-2 bg-orange-900/20 border border-orange-500/30 rounded">
                                       <p className="text-xs text-orange-400">Bronze</p>
                                       <p className="text-lg font-bold text-white">{commissionRates.bronze}%</p>
                                   </div>
                                   <div className="text-center p-2 bg-gray-900/20 border border-gray-500/30 rounded">
                                       <p className="text-xs text-gray-400">Silver</p>
                                       <p className="text-lg font-bold text-white">{commissionRates.silver}%</p>
                                   </div>
                                   <div className="text-center p-2 bg-purple-900/20 border border-purple-500/30 rounded">
                                       <p className="text-xs text-purple-400">Gold</p>
                                       <p className="text-lg font-bold text-white">{commissionRates.gold}%</p>
                                   </div>
                                   <div className="text-center p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
                                       <p className="text-xs text-yellow-400">Platinum</p>
                                       <p className="text-lg font-bold text-white">{commissionRates.platinum}%</p>
                                   </div>
                               </div>
                           </div>
                           <div className="pt-4 border-t border-gray-700">
                               <div className="flex items-center gap-2 mb-2">
                                   <Lock size={16} className="text-red-400" />
                                   <label className="text-sm text-gray-400">Secret Vault Items</label>
                               </div>
                               <div className="text-center p-3 bg-red-900/20 border border-red-500/30 rounded">
                                   <p className="text-lg font-bold text-red-400">{commissionRates.vault}%</p>
                                   <p className="text-xs text-red-300">LOCKED AT 1%</p>
                               </div>
                               <p className="text-xs text-gray-500 mt-2">This ensures we do not lose money on clearance stock.</p>
                           </div>
                       </div>
                   </div>

                   {/* Membership Fees */}
                   <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                       <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                           <DollarSign size={18} className="text-green-400" /> Membership Fees
                       </h3>
                       <div className="space-y-4">
                           <div>
                               <label className="block text-sm text-gray-400 mb-2">South African (ZAR)</label>
                               <div className="space-y-2">
                                   <div className="flex justify-between p-2 bg-black/50 rounded">
                                       <span className="text-sm text-gray-300">Spoil Me</span>
                                       <span className="text-green-400 font-bold">R{membershipFees.zar.spoilMe}</span>
                                   </div>
                                   <div className="flex justify-between p-2 bg-black/50 rounded">
                                       <span className="text-sm text-gray-300">Basic</span>
                                       <span className="text-green-400 font-bold">R{membershipFees.zar.basic}</span>
                                   </div>
                                   <div className="flex justify-between p-2 bg-black/50 rounded">
                                       <span className="text-sm text-gray-300">Premium</span>
                                       <span className="text-green-400 font-bold">R{membershipFees.zar.premium}</span>
                                   </div>
                                   <div className="flex justify-between p-2 bg-black/50 rounded">
                                       <span className="text-sm text-gray-300">Deluxe</span>
                                       <span className="text-green-400 font-bold">R{membershipFees.zar.deluxe}</span>
                                   </div>
                               </div>
                           </div>
                           <div className="pt-4 border-t border-gray-700">
                               <label className="block text-sm text-gray-400 mb-2">International (USD)</label>
                               <div className="space-y-2">
                                   <div className="flex justify-between p-2 bg-black/50 rounded">
                                       <span className="text-sm text-gray-300">Insider</span>
                                       <span className="text-blue-400 font-bold">${membershipFees.usd.insider}</span>
                                   </div>
                                   <div className="flex justify-between p-2 bg-black/50 rounded">
                                       <span className="text-sm text-gray-300">Gold</span>
                                       <span className="text-blue-400 font-bold">${membershipFees.usd.gold}</span>
                                   </div>
                                   <div className="flex justify-between p-2 bg-black/50 rounded">
                                       <span className="text-sm text-gray-300">Deluxe</span>
                                       <span className="text-blue-400 font-bold">${membershipFees.usd.deluxe}</span>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>

                   {/* Gamification Bonuses */}
                   <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                       <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                           <Trophy size={18} className="text-orange-400" /> Gamification Bonuses
                       </h3>
                       <div className="space-y-4">
                           <div>
                               <label className="block text-sm text-gray-400 mb-2">Weekly Achievements</label>
                               <div className="space-y-2">
                                   <div className="p-3 bg-black/50 rounded border border-gray-700">
                                       <div className="flex justify-between items-center mb-1">
                                           <span className="text-sm text-gray-300">Sprinter Bonus</span>
                                           <span className="text-orange-400 font-bold">R{bonuses.sprinter.zar} / ${bonuses.sprinter.usd}</span>
                                       </div>
                                       <p className="text-xs text-gray-500">5 memberships in a week</p>
                                   </div>
                                   <div className="p-3 bg-black/50 rounded border border-gray-700">
                                       <div className="flex justify-between items-center mb-1">
                                           <span className="text-sm text-gray-300">Big Spender Bonus</span>
                                           <span className="text-orange-400 font-bold">R{bonuses.bigSpender.zar} / ${bonuses.bigSpender.usd}</span>
                                       </div>
                                       <p className="text-xs text-gray-500">R5,000 / $300 sales volume</p>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* SECTION 5: COMMISSION VALIDATOR */}
       {managerTab === 'validator' && (
           <div className="space-y-6">
               <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                   <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                       <AlertTriangle size={18} className="text-red-400" /> Commission Validator
                   </h3>
                   <p className="text-sm text-gray-400 mb-6">Monitor recent commissions for errors and anomalies. Green = Standard, Yellow = Vault, Red = Error.</p>

                   <div className="space-y-2">
                       {/* Mock commission entries */}
                       {[
                           { id: 1, type: 'standard', partner: 'Sarah J.', amount: 450, product: 'Gold Hoops', status: 'approved' },
                           { id: 2, type: 'vault', partner: 'Mike T.', amount: 10, product: 'Clearance Studs', status: 'approved' },
                           { id: 3, type: 'standard', partner: 'Lerato K.', amount: 1200, product: 'Necklace Set', status: 'approved' },
                           { id: 4, type: 'error', partner: 'Jessica L.', amount: 5000, product: 'Diamond Ring', status: 'flagged' }
                       ].map(entry => (
                           <div key={entry.id} className={`p-4 rounded-lg border ${
                               entry.type === 'standard' ? 'bg-green-900/10 border-green-500/30' :
                               entry.type === 'vault' ? 'bg-yellow-900/10 border-yellow-500/30' :
                               'bg-red-900/10 border-red-500/30'
                           }`}>
                               <div className="flex justify-between items-center">
                                   <div>
                                       <p className="text-white font-bold">{entry.partner} - {entry.product}</p>
                                       <p className="text-sm text-gray-400">Commission: R{entry.amount}</p>
                                   </div>
                                   <div className="flex items-center gap-3">
                                       <span className={`px-2 py-1 rounded text-xs font-bold ${
                                           entry.type === 'standard' ? 'bg-green-900/50 text-green-400' :
                                           entry.type === 'vault' ? 'bg-yellow-900/50 text-yellow-400' :
                                           'bg-red-900/50 text-red-400'
                                       }`}>
                                           {entry.type === 'standard' ? 'Standard' : entry.type === 'vault' ? 'Vault (1%)' : 'ERROR'}
                                       </span>
                                       {entry.status === 'flagged' && (
                                           <div className="flex gap-2">
                                               <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500">
                                                   Void
                                               </button>
                                               <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500">
                                                   Approve
                                               </button>
                                           </div>
                                       )}
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
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
