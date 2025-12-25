import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Crown, CreditCard, Clock, CheckCircle, XCircle, Users as UsersIcon, Download, Filter } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { callServerFunction } from '@repo/utils/supabaseClient';
import { queryDocuments } from '@repo/utils/supabaseClient';

// Use server-side functions via HTTP proxy

const MemberManagement: React.FC = () => {
  const { user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Trial modal state
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialPlan, setTrialPlan] = useState('');
  const [trialDays, setTrialDays] = useState(7);
  const [trialEmail, setTrialEmail] = useState('');

  // Credit adjustment modal state
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0);


  // Pagination state
  const [users, setUsers] = useState<any[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Search / Autocomplete State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const searchTimeout = useRef<any>(null);

  // Filter State
  const [fetchLimit, setFetchLimit] = useState(20);
  const [filterRegion, setFilterRegion] = useState<'all' | 'ZA' | 'other'>('all');
  const [filterType, setFilterType] = useState<'all' | 'buyers'>('all');

  const membershipPlans = [
    'Spoil Me', 'Basic', 'Premium', 'Deluxe Boss',
    'Insider Club', 'Gold Member', 'Deluxe Vault'
  ];

  // Search users
  const searchUsers = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      // This would typically call a cloud function to search users
      // For now, we'll simulate with a direct Firestore query
      // Supabase search: use exact or prefix matching via a helper or server-side search.
      // For now, perform an exact email lookup which is strict but reliable.
      const users = await queryDocuments<any>('users', { filters: { email: searchTerm }, limit: 10 });
      setSearchResults(users || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Grant trial
  const grantTrial = async () => {
    if ((!selectedUser && !trialEmail) || !trialPlan || !trialDays || !functions) return;

    let userId = selectedUser?.id;
    if (!userId && trialEmail) {
      // Find user by email
      try {
        const users = await queryDocuments<any>('users', { filters: { email: trialEmail }, limit: 1 });
        if (!users || users.length === 0) {
          alert('User not found with that email.');
          return;
        }
        userId = users[0].id;
      } catch (error) {
        console.error('Error finding user:', error);
        alert('Error finding user.');
        return;
      }
    }

    try {
      await callServerFunction('grantTrial', {
        userId: userId,
        plan: trialPlan,
        days: trialDays
      });

      alert('Trial granted successfully!');
      setShowTrialModal(false);
      setSelectedUser(null);
      setTrialPlan('');
      setTrialDays(7);
      setTrialEmail('');
    } catch (error) {
      console.error('Error granting trial:', error);
      alert('Failed to grant trial');
    }
  };

  // Adjust store credit
  const adjustCredit = async () => {
    if (!selectedUser || !functions) return;

    try {
      await callServerFunction('adjustStoreCredit', {
        userId: selectedUser.id,
        amount: creditAmount
      });

      alert('Store credit adjusted successfully!');
      setShowCreditModal(false);
      setSelectedUser(null);
      setCreditAmount(0);
    } catch (error) {
      console.error('Error adjusting credit:', error);
      alert('Failed to adjust credit');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'trial': return 'text-blue-400';
      case 'expired': return 'text-red-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'trial': return <Clock className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  // 1. FETCH FIRST BATCH (Runs on Load)
  const fetchInitialUsers = async () => {
    setLoading(true);
    try {
      const newUsers = await queryDocuments<any>('users', { orderBy: { column: 'created_at', ascending: false }, limit: 20 });
      setUsers(newUsers || []);
      setHasMore((newUsers?.length || 0) === 20);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. FETCH NEXT BATCH (Load More)
  const fetchMoreUsers = async () => {
    if (!lastVisible || loading) return;
    setLoading(true);
    try {
      // Supabase pagination via offset (current length)
      const offset = users.length;
      const newUsers = await queryDocuments<any>('users', { orderBy: { column: 'created_at', ascending: false }, limit: 20, offset });
      setUsers(prev => [...prev, ...(newUsers || [])]);
      setHasMore((newUsers?.length || 0) === 20);
    } catch (error) {
      console.error("Error loading more:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. HANDLE SEARCH (Must be a specific query, not client-side filter)
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term) {
      fetchInitialUsers(); // Reset if empty
      return;
    }
    // Use an exact email lookup for search for now
    const results = await queryDocuments<any>('users', { filters: { email: term }, limit: 20 });
    setUsers(results || []);
    setHasMore(false);
  };

  // Autocomplete handler
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);

    if (!term.trim()) {
      setSuggestions([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout
    searchTimeout.current = setTimeout(() => {
      const fetchSuggestions = async () => {
        try {
          const users = await queryDocuments<any>('users', { orderBy: { column: 'created_at', ascending: false }, limit: 50 });
          const emails = (users || []).map(u => u.email).filter((e: string) => e && e.toLowerCase().includes(term.toLowerCase())).slice(0, 10);
          setSuggestions(emails);
        } catch (err) {
          console.error('Failed to fetch suggestions:', err);
          setSuggestions([]);
        }
      };

      fetchSuggestions();
    }, 300); // 300ms debounce
  };

  // Apply filters and fetch users
  const applyFilters = async () => {
    setLoading(true);
    setSuggestions([]); // Clear suggestions if any
    try {
      // Fetch a page of users from Supabase and apply simple filters client-side
      if (searchTerm) {
        const results = await queryDocuments<any>('users', { filters: { email: searchTerm }, limit: fetchLimit });
        const filtered = (results || []).filter((u: any) => {
          if (filterRegion === 'ZA' && (u.country || '').toLowerCase() !== 'south africa') return false;
          if (filterRegion === 'other' && (u.country || '').toLowerCase() === 'south africa') return false;
          if (filterType === 'buyers' && ((u.ordersCount || 0) <= 0)) return false;
          return true;
        });
        setUsers(filtered);
        setHasMore(false);
        if (filtered.length === 0) alert('No users found matching these filters.');
      } else {
        const results = await queryDocuments<any>('users', { orderBy: { column: 'created_at', ascending: false }, limit: fetchLimit });
        const filtered = (results || []).filter((u: any) => {
          if (filterRegion === 'ZA' && (u.country || '').toLowerCase() !== 'south africa') return false;
          if (filterRegion === 'other' && (u.country || '').toLowerCase() === 'south africa') return false;
          if (filterType === 'buyers' && ((u.ordersCount || 0) <= 0)) return false;
          return true;
        });
        setUsers(filtered);
        setHasMore((results?.length || 0) === fetchLimit);
        if (filtered.length === 0) alert('No users found matching these filters.');
      }
    } catch (error: any) {
      console.error("Error applying filters:", error);
      if (error.message.includes("requires an index")) {
        alert("System Warning: This specific filter combination requires a new Database Index. Open Console (F12) and click the Firebase link.");
      } else {
        alert("Failed to fetch. " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialUsers();
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Member Management</h1>
        <p className="text-gray-400">Search users and manage their membership benefits</p>
      </div>

      {/* CONTROL PANEL */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 mb-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* COL 1: SEARCH WITH AUTOCOMPLETE */}
          <div className="relative">
            <label className="text-xs text-gray-500 block mb-1">Search Email</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Start typing email..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-black border border-zinc-700 p-3 rounded text-white outline-none focus:border-gold"
              />
              {/* THE DROPDOWN LIST */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-zinc-800 border border-zinc-700 rounded-b shadow-xl z-50 max-h-40 overflow-y-auto">
                  {suggestions.map(email => (
                    <div
                      key={email}
                      onClick={() => {
                        setSearchTerm(email);
                        setSuggestions([]);
                        handleSearch(email);
                      }}
                      className="p-2 hover:bg-zinc-700 cursor-pointer text-sm text-gray-300 border-b border-zinc-700/50"
                    >
                      {email}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COL 2: FILTERS */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Region</label>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value as any)}
                className="w-full bg-black border border-zinc-700 p-3 rounded text-white"
              >
                <option value="all">🌍 All Regions</option>
                <option value="ZA">🇿🇦 South Africa</option>
                <option value="other">✈️ International</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Activity</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full bg-black border border-zinc-700 p-3 rounded text-white"
              >
                <option value="all">Everyone</option>
                <option value="buyers">🛍️ Buyers Only</option>
              </select>
            </div>
          </div>

          {/* COL 3: ACTION */}
          <div className="flex items-end">
            <button
              onClick={applyFilters}
              disabled={loading}
              className="w-full bg-gold hover:bg-yellow-600 text-black font-bold p-3 rounded flex items-center justify-center gap-2 transition-all"
            >
              {loading ? 'Processing...' : <><Search size={18} /> RUN SEARCH</>}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-white mb-4">Search Results</h2>
          <div className="space-y-3">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-cyan-500 transition-colors cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">{user.email}</p>
                      <p className="text-gray-400 text-sm">{user.displayName || 'No display name'}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 ${getStatusColor(user.membershipStatus || 'none')}`}>
                    {getStatusIcon(user.membershipStatus || 'none')}
                    <span className="text-sm capitalize">{user.membershipStatus || 'None'}</span>
                  </div>
                </div>
                {user.membershipTier && (
                  <div className="mt-2 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300 text-sm">{user.membershipTier}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected User Details */}
      {selectedUser && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-800 border border-cyan-500 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">User Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">User Information</h3>
                <div className="space-y-2">
                  <p className="text-gray-300"><span className="text-gray-400">Email:</span> {selectedUser.email}</p>
                  <p className="text-gray-300"><span className="text-gray-400">Name:</span> {selectedUser.displayName || 'N/A'}</p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">Status:</span>
                    <span className={`ml-2 ${getStatusColor(selectedUser.membershipStatus || 'none')}`}>
                      {selectedUser.membershipStatus || 'None'}
                    </span>
                  </p>
                  <p className="text-gray-300"><span className="text-gray-400">Plan:</span> {selectedUser.membershipTier || 'None'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-3">Store Credit</h3>
                <div className="space-y-2">
                  <p className="text-gray-300">
                    <span className="text-gray-400">Balance:</span>
                    {selectedUser.creditCurrency === 'USD' ? '$' : 'R'}{selectedUser.storeCredit || 0}
                  </p>
                  <p className="text-gray-300"><span className="text-gray-400">Currency:</span> {selectedUser.creditCurrency || 'ZAR'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowTrialModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
              >
                Grant Trial
              </button>
              <button
                onClick={() => setShowCreditModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
              >
                Adjust Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trial Modal */}
      {showTrialModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Grant Trial Membership</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Select Plan</label>
                <select
                  value={trialPlan}
                  onChange={(e) => setTrialPlan(e.target.value)}
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Choose a plan...</option>
                  {membershipPlans.map(plan => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Trial Duration (Days)</label>
                <input
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(parseInt(e.target.value))}
                  min="1"
                  max="365"
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">User Email</label>
                <input
                  type="email"
                  value={trialEmail}
                  onChange={(e) => setTrialEmail(e.target.value)}
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Enter user email"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={grantTrial}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
              >
                Grant Trial
              </button>
              <button
                onClick={() => setShowTrialModal(false)}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Adjustment Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Adjust Store Credit</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Amount (use negative for deduction)</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseFloat(e.target.value))}
                  step="0.01"
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={adjustCredit}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
              >
                Adjust Credit
              </button>
              <button
                onClick={() => setShowCreditModal(false)}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Membership Overview */}
      <div className="bg-zinc-900 border border-gray-700 p-6 rounded-xl shadow-lg">
        <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-3">
          <Crown size={20} className="text-purple-400" />
          Membership Tiers & Benefits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Spoil Me */}
          <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white text-sm">Spoil Me Package</h4>
              <span className="text-xs bg-pink-900/30 text-pink-400 border border-pink-500/30 px-2 py-1 rounded">Popular</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Ultimate luxury experience with exclusive perks</p>
            <div className="space-y-1 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly:</span>
                <span className="text-white">R19</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Store Credit:</span>
                <span className="text-white">R25/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discount:</span>
                <span className="text-white">5% OFF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Weekly Giveaway:</span>
                <span className="text-white">Win R500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Spots:</span>
                <span className="text-green-400">412/500 (88 left)</span>
              </div>
            </div>
            <button
              onClick={() => {
                setTrialPlan('Spoil Me');
                setShowTrialModal(true);
              }}
              className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded transition-colors"
            >
              Grant Trial
            </button>
          </div>

          {/* Basic */}
          <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white text-sm">Basic Package</h4>
              <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-1 rounded">Standard</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Essential benefits for regular shoppers</p>
            <div className="space-y-1 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly:</span>
                <span className="text-white">R49</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Store Credit:</span>
                <span className="text-white">R50/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discount:</span>
                <span className="text-white">20% OFF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Birthday Voucher:</span>
                <span className="text-white">R100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Weekly Drop:</span>
                <span className="text-white">2x Entries</span>
              </div>
            </div>
            <button
              onClick={() => {
                setTrialPlan('Basic');
                setShowTrialModal(true);
              }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors"
            >
              Grant Trial
            </button>
          </div>

          {/* Premium */}
          <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white text-sm">Premium Package</h4>
              <span className="text-xs bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-1 rounded">Popular</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Enhanced shopping experience</p>
            <div className="space-y-1 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly:</span>
                <span className="text-white">R99</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Store Credit:</span>
                <span className="text-white">R100/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discount:</span>
                <span className="text-white">20% OFF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Holiday Gifts:</span>
                <span className="text-white">Free small gift</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Birthday Voucher:</span>
                <span className="text-white">R150</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">WhatsApp Priority:</span>
                <span className="text-white">Yes</span>
              </div>
            </div>
            <button
              onClick={() => {
                setTrialPlan('Premium');
                setShowTrialModal(true);
              }}
              className="w-full py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded transition-colors"
            >
              Grant Trial
            </button>
          </div>

          {/* Deluxe Boss */}
          <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white text-sm">Deluxe "Boss" Package</h4>
              <span className="text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded">Elite</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">VIP treatment with maximum benefits</p>
            <div className="space-y-1 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly:</span>
                <span className="text-white">R199</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Store Credit:</span>
                <span className="text-white">R150/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discount:</span>
                <span className="text-white">20% OFF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Birthday Voucher:</span>
                <span className="text-white">R300</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">WhatsApp Priority:</span>
                <span className="text-white">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vault Access:</span>
                <span className="text-white">Limited</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Spots:</span>
                <span className="text-green-400">498/750 (252 left)</span>
              </div>
            </div>
            <button
              onClick={() => {
                setTrialPlan('Deluxe Boss');
                setShowTrialModal(true);
              }}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold rounded transition-colors"
            >
              Grant Trial
            </button>
          </div>

          {/* Insider Club */}
          <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white text-sm">Insider Club</h4>
              <span className="text-xs bg-purple-900/30 text-purple-400 border border-purple-500/30 px-2 py-1 rounded">High Demand</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Early access to new products and promotions</p>
            <div className="space-y-1 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly:</span>
                <span className="text-white">$5.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Store Credit:</span>
                <span className="text-white">$5.00/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discount:</span>
                <span className="text-white">5% OFF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Weekly Giveaway:</span>
                <span className="text-white">Win $50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Spots:</span>
                <span className="text-green-400">412/500 (88 left)</span>
              </div>
            </div>
            <button
              onClick={() => {
                setTrialPlan('Insider Club');
                setShowTrialModal(true);
              }}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded transition-colors"
            >
              Grant Trial
            </button>
          </div>

          {/* Gold Member */}
          <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white text-sm">Gold Member</h4>
              <span className="text-xs bg-orange-900/30 text-orange-400 border border-orange-500/30 px-2 py-1 rounded">Critical</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Gold standard benefits and rewards</p>
            <div className="space-y-1 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly:</span>
                <span className="text-white">$12.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Store Credit:</span>
                <span className="text-white">$12.00/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discount:</span>
                <span className="text-white">20% OFF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Birthday Voucher:</span>
                <span className="text-white">$20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">WhatsApp Priority:</span>
                <span className="text-white">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Spots:</span>
                <span className="text-green-400">485/500 (15 left)</span>
              </div>
            </div>
            <button
              onClick={() => {
                setTrialPlan('Gold Member');
                setShowTrialModal(true);
              }}
              className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded transition-colors"
            >
              Grant Trial
            </button>
          </div>

          {/* Deluxe Vault */}
          <div className="bg-black/40 p-4 rounded-lg border border-gray-700 col-span-full">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white text-sm">Deluxe "Vault" Access</h4>
              <span className="text-xs bg-red-900/30 text-red-400 border border-red-500/30 px-2 py-1 rounded">Ultimate</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Access to exclusive vault items with maximum benefits</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly:</span>
                  <span className="text-white">$25.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Store Credit:</span>
                  <span className="text-white">$15.00/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Discount:</span>
                  <span className="text-white">20% OFF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Birthday Voucher:</span>
                  <span className="text-white">$40</span>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">WhatsApp Priority:</span>
                  <span className="text-white">Yes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vault Access:</span>
                  <span className="text-white">24hrs Early</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Giveaways:</span>
                  <span className="text-white">Entry</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Weekly Winners:</span>
                  <span className="text-white">Eligible</span>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Loyalty Ladder:</span>
                  <span className="text-white">Month 1: 5 items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400"></span>
                  <span className="text-white">Month 2: 7 items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400"></span>
                  <span className="text-white">Month 3: 10 items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400"></span>
                  <span className="text-white">Month 4+: Unlimited</span>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Spots:</span>
                  <span className="text-green-400">498/750 (252 left)</span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Shop clearance, samples, and slight imperfections starting at R10. Sold as-is.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setTrialPlan('Deluxe Vault');
                setShowTrialModal(true);
              }}
              className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors"
            >
              Grant Trial
            </button>
          </div>
        </div>
      </div>

      {/* Users List with Pagination */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-white mb-4">All Members ({users.length})</h2>
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-cyan-500 transition-colors cursor-pointer"
              onClick={() => setSelectedUser(user)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white font-medium">{user.email}</p>
                    <p className="text-gray-400 text-sm">{user.displayName || user.name || 'No display name'}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${getStatusColor(user.membershipStatus || 'none')}`}>
                  {getStatusIcon(user.membershipStatus || 'none')}
                  <span className="text-sm capitalize">{user.membershipStatus || 'None'}</span>
                </div>
              </div>
              {user.membershipTier && (
                <div className="mt-2 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300 text-sm">{user.membershipTier}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="mt-6 flex justify-center">
          {loading ? (
            <div className="text-gold animate-pulse">Loading members...</div>
          ) : (
            hasMore && !searchTerm && (
              <button
                onClick={fetchMoreUsers}
                className="px-6 py-2 bg-zinc-800 border border-zinc-700 hover:border-gold text-white rounded-full text-sm transition-all"
              >
                Load More Members
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberManagement;
