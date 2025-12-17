import React, { useState, useEffect, useRef } from 'react';
import { Users, Trash2, AlertTriangle, Search, User, Mail, Calendar, MapPin, Crown, Download, Filter, Globe, UserCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { db, app, auth } from '../../firebaseConfig';
import { collection, query, getDocs, deleteDoc, doc, updateDoc, getDoc, where, orderBy, limit, startAfter } from 'firebase/firestore';

// Initialize Firebase Functions
const functions = app ? getFunctions(app) : null;

// Simple Switch Component
const Switch: React.FC<{
  checked: boolean;
  onChange: () => void;
  className?: string;
  children?: React.ReactNode;
}> = ({ checked, onChange, className, children }) => (
  <button
    type="button"
    onClick={onChange}
    className={`${className} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
  >
    {children}
  </button>
);

const UsersManagement: React.FC = () => {
  const { user } = useStore();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const searchTimeout = useRef<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedUserForAdmin, setSelectedUserForAdmin] = useState<any>(null);
  const [adminPermissions, setAdminPermissions] = useState({
    dashboard: true,
    products: false,
    orders: false,
    categories: false,
    members: false,
    users: false,
    giftCards: false,
    social: false,
    affiliates: false,
    winners: false,
    expenses: false,
    vault: false,
    artists: false
  });
    const [filterRegion, setFilterRegion] = useState<'all' | 'ZA' | 'other'>('all');
    const [filterType, setFilterType] = useState<'all' | 'buyers'>('all');
    const [trialFilter, setTrialFilter] = useState('');
    const [showTrialModal, setShowTrialModal] = useState(false);
    const [selectedUserForTrial, setSelectedUserForTrial] = useState<any>(null);
    const [trialPlan, setTrialPlan] = useState('basic');
    const [trialDays, setTrialDays] = useState(7);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const usersPerPage = 10;
    const [showArtistModal, setShowArtistModal] = useState(false);
    const [selectedUserForArtist, setSelectedUserForArtist] = useState<any>(null);
    const [artistStatus, setArtistStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [showMembershipModal, setShowMembershipModal] = useState(false);
    const [selectedUserForMembership, setSelectedUserForMembership] = useState<any>(null);
    const [membershipTier, setMembershipTier] = useState<'basic' | 'premium' | 'deluxe'>('basic');

  // Load all users
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        // Get current user's ID token
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error('No authenticated user');
          setIsLoading(false);
          return;
        }

        const idToken = await currentUser.getIdToken();

        // Fetch Firebase Auth users
        const response = await fetch('https://us-central1-spoilme-edee0.cloudfunctions.net/api/users', {
          headers:
          {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const authUsers = data.users;

        // Fetch additional user data from Firestore
        const firestoreUsers = [];
        for (const authUser of authUsers) {
          try {
            const userDoc = await getDoc(doc(db, 'users', authUser.uid));
            if (userDoc.exists()) {
              firestoreUsers.push({
                id: authUser.uid,
                ...authUser,
                ...userDoc.data(),
                // Override with Auth data if needed
                email: authUser.email,
                displayName: authUser.displayName,
                emailVerified: authUser.emailVerified,
                createdAt: authUser.metadata.creationTime ? new Date(authUser.metadata.creationTime) : null,
                lastSignInAt: authUser.metadata.lastSignInTime ? new Date(authUser.metadata.lastSignInTime) : null
              });
            } else {
              firestoreUsers.push({
                id: authUser.uid,
                ...authUser,
                createdAt: authUser.metadata.creationTime ? new Date(authUser.metadata.creationTime) : null,
                lastSignInAt: authUser.metadata.lastSignInTime ? new Date(authUser.metadata.lastSignInTime) : null
              });
            }
          } catch (error) {
            console.error(`Error fetching Firestore data for user ${authUser.uid}:`, error);
            // Still include the user without Firestore data
            firestoreUsers.push({
              id: authUser.uid,
              ...authUser,
              createdAt: authUser.metadata.creationTime ? new Date(authUser.metadata.creationTime) : null,
              lastSignInAt: authUser.metadata.lastSignInTime ? new Date(authUser.metadata.lastSignInTime) : null
            });
          }
        }

        setAllUsers(firestoreUsers);
        setFilteredUsers(firestoreUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Filter users based on search term and filters
  useEffect(() => {
    let filtered = allUsers;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Region filter
    if (filterRegion === 'ZA') {
      filtered = filtered.filter(user => user.country === 'South Africa');
    } else if (filterRegion === 'other') {
      filtered = filtered.filter(user => user.country !== 'South Africa');
    }

    // Type filter (Buyers only)
    if (filterType === 'buyers') {
      filtered = filtered.filter(user => (user.totalOrders || 0) > 0);
    }

    // Trial filter
    if (trialFilter) {
      filtered = filtered.filter(user => user.membershipStatus === trialFilter);
    }

    // Sort: Inactive users (pending deletion) first, then by creation date
    filtered.sort((a, b) => {
      // Inactive users first
      if (a.isActive === false && b.isActive !== false) return -1;
      if (b.isActive === false && a.isActive !== false) return 1;

      // Then sort by creation date (newest first)
      const aDate = a.createdAt?.seconds || 0;
      const bDate = b.createdAt?.seconds || 0;
      return bDate - aDate;
    });

    // Pagination: Slice the filtered users array
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const paginatedUsers = filtered.slice(startIndex, endIndex);

    setFilteredUsers(paginatedUsers);
    setTotalPages(Math.ceil(filtered.length / usersPerPage));
  }, [searchTerm, filterRegion, filterType, trialFilter, allUsers, currentPage]);

  // Delete user function
  const deleteUser = async (userId: string) => {
    try {
      // Call Cloud Function to delete user from Firebase Auth and Firestore
      if (!functions) {
        alert('Firebase functions not available');
        return;
      }

      const deleteUserFn = httpsCallable(functions, 'deleteUser');
      await deleteUserFn({ userId });

      // Update local state
      const updatedUsers = allUsers.filter(user => user.id !== userId);
      setAllUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter(user =>
        !searchTerm.trim() ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      ));

      alert('User permanently deleted successfully!');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
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
      case 'active': return '🟢';
      case 'trial': return '🔵';
      case 'expired': return '🔴';
      case 'cancelled': return '⚫';
      default: return '⚪';
    }
  };

  const handleAdminToggle = (permission: string) => {
    setAdminPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const openAdminModal = (user: any) => {
    setSelectedUserForAdmin(user);
    // Load existing permissions or set defaults
    const existingPermissions = user.adminPermissions || {
      dashboard: true,
      products: false,
      orders: false,
      categories: false,
      members: false,
      users: false,
      giftCards: false,
      social: false,
      affiliates: false,
      winners: false,
      expenses: false,
      vault: false,
      artists: false
    };
    setAdminPermissions(existingPermissions);
    setShowAdminModal(true);
  };

  const saveAdminPermissions = async () => {
    if (!selectedUserForAdmin) return;

    try {
      // Update user permissions in Firestore
      const userRef = doc(db, 'users', selectedUserForAdmin.id);
      await updateDoc(userRef, {
        adminPermissions
      });

      alert('Admin permissions updated successfully!');
      setShowAdminModal(false);
      setSelectedUserForAdmin(null);
    } catch (error) {
      console.error('Error updating admin permissions:', error);
      alert('Failed to update permissions. Please try again.');
    }
  };

  // Handle search term change with debounce and autocomplete
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for debounced search
    searchTimeout.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on new search
    }, 300);

    // For autocomplete, we could fetch suggestions here if needed
    // But for now, we'll keep it simple with client-side filtering
  };

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Users Management</h1>
        <p className="text-gray-400">Manage all registered users and their accounts</p>
        {user?.email === 'spoilmevintagediy@gmail.com' && (
          <button
            onClick={() => window.location.href = '/#/artist-partnership'}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <UserCheck size={16} />
            Apply as Artist (Test Flow)
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value as 'all' | 'ZA' | 'other')}
              className="w-full pl-8 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Regions</option>
              <option value="ZA">South Africa</option>
              <option value="other">Other Regions</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'buyers')}
              className="w-full pl-8 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Users</option>
              <option value="buyers">Buyers</option>
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={trialFilter}
              onChange={(e) => setTrialFilter(e.target.value)}
              className="w-full pl-8 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        {(searchTerm || filterRegion !== 'all' || filterType !== 'all' || trialFilter) && (
          <div className="mt-2 text-center">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRegion('all');
                setFilterType('all');
                setTrialFilter('');
              }}
              className="text-xs text-gray-500 hover:text-white underline decoration-dotted"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg border bg-blue-900/30 text-blue-400 border-blue-500/20">
              <Users size={20} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Total Users</h3>
          <p className="text-[22px] font-bold text-white mt-1">{allUsers.length}</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg border bg-green-900/30 text-green-400 border-green-500/20">
              <Crown size={20} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Active Members</h3>
          <p className="text-[22px] font-bold text-white mt-1">
            {allUsers.filter(u => u.membershipStatus === 'active').length}
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg border bg-blue-900/30 text-blue-400 border-blue-500/20">
              <Calendar size={20} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Trial Users</h3>
          <p className="text-[22px] font-bold text-white mt-1">
            {allUsers.filter(u => u.membershipStatus === 'trial').length}
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg border bg-gray-900/30 text-gray-400 border-gray-500/20">
              <User size={20} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Free Users</h3>
          <p className="text-[22px] font-bold text-white mt-1">
            {allUsers.filter(u => !u.membershipTier).length}
          </p>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-zinc-900 border border-gray-700 p-6 rounded-xl shadow-lg">
        <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-3">
          <Users size={20} className="text-blue-400" />
          All Users ({filteredUsers.length})
        </h3>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <p className="text-gray-400 mt-2">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-cyan-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.firstName && user.lastName
                          ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
                          : user.displayName
                            ? user.displayName.charAt(0).toUpperCase()
                            : user.email.charAt(0).toUpperCase()
                        }
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.displayName || 'No Name'
                          }
                          {user.isActive === false && (
                            <AlertTriangle size={16} className="text-red-500" title="Account pending deletion" />
                          )}
                          {user.membershipTier && (
                            <span className="text-xs px-2 py-1 rounded bg-yellow-900/30 text-yellow-400">
                              {user.membershipTier}
                            </span>
                          )}
                          {user.email === 'spoilmevintagediy@gmail.com' && (
                            <span className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400 font-bold">
                              OWNER
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <Mail size={12} />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          {user.country && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin size={10} />
                              {user.country}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs">
                            <span>{getStatusIcon(user.membershipStatus || 'none')}</span>
                            <span className={getStatusColor(user.membershipStatus || 'none')}>
                              {user.membershipStatus || 'Free User'}
                            </span>
                          </div>
                          {user.createdAt && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar size={10} />
                              {new Date(user.createdAt.seconds * 1000).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.email === 'spoilmevintagediy@gmail.com' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedUserForArtist(user);
                              setArtistStatus(user.artistStatus || 'none');
                              setShowArtistModal(true);
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
                          >
                            <UserCheck size={12} />
                            Artist
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserForMembership(user);
                              setMembershipTier(user.membershipTier || 'basic');
                              setShowMembershipModal(true);
                            }}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
                          >
                            <Crown size={12} />
                            Membership
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedUserForTrial(user);
                          setTrialPlan('basic');
                          setTrialDays(7);
                          setShowTrialModal(true);
                        }}
                        className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
                      >
                        <Calendar size={12} />
                        Grant Trial
                      </button>
                      <button
                        onClick={() => openAdminModal(user)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
                      >
                        <Crown size={12} />
                        Admin
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-black/40 p-2 rounded">
                      <div className="text-gray-400">Store Credit</div>
                      <div className="text-white font-bold">
                        {user.creditCurrency === 'USD' ? '$' : 'R'}{user.storeCredit || 0}
                      </div>
                    </div>
                    <div className="bg-black/40 p-2 rounded">
                      <div className="text-gray-400">Loyalty Points</div>
                      <div className="text-white font-bold">{user.loyaltyPoints || 0}</div>
                    </div>
                    <div className="bg-black/40 p-2 rounded">
                      <div className="text-gray-400">Orders</div>
                      <div className="text-white font-bold">{user.totalOrders || 0}</div>
                    </div>
                    <div className="bg-black/40 p-2 rounded">
                      <div className="text-gray-400">Gender</div>
                      <div className="text-white font-bold">{user.gender || 'Not set'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-400">
                {searchTerm ? 'No users found matching your search.' : 'No users found in the system.'}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-l-lg"
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="px-4 py-2 bg-gray-800 text-white">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-r-lg"
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-900/50 text-red-500 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete User</h3>
                <p className="text-gray-400 text-sm">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this user? This will permanently remove their account and all associated data.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => deleteUser(deleteConfirm)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
              >
                Delete User
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Permissions Modal */}
      {showAdminModal && selectedUserForAdmin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-900/50 text-blue-500 rounded-lg">
                <Crown size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Admin Permissions</h3>
                <p className="text-gray-400 text-sm">Manage user permissions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Dashboard Access</span>
                <Switch
                  checked={adminPermissions.dashboard}
                  onChange={() => handleAdminToggle('dashboard')}
                  className={`${
                    adminPermissions.dashboard ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable dashboard access</span>
                  <span
                    className={`${
                      adminPermissions.dashboard ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Products Management</span>
                <Switch
                  checked={adminPermissions.products}
                  onChange={() => handleAdminToggle('products')}
                  className={`${
                    adminPermissions.products ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable products management</span>
                  <span
                    className={`${
                      adminPermissions.products ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Orders Management</span>
                <Switch
                  checked={adminPermissions.orders}
                  onChange={() => handleAdminToggle('orders')}
                  className={`${
                    adminPermissions.orders ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable orders management</span>
                  <span
                    className={`${
                      adminPermissions.orders ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Categories Management</span>
                <Switch
                  checked={adminPermissions.categories}
                  onChange={() => handleAdminToggle('categories')}
                  className={`${
                    adminPermissions.categories ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable categories management</span>
                  <span
                    className={`${
                      adminPermissions.categories ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Members Management</span>
                <Switch
                  checked={adminPermissions.members}
                  onChange={() => handleAdminToggle('members')}
                  className={`${
                    adminPermissions.members ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable members management</span>
                  <span
                    className={`${
                      adminPermissions.members ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Users Management</span>
                <Switch
                  checked={adminPermissions.users}
                  onChange={() => handleAdminToggle('users')}
                  className={`${
                    adminPermissions.users ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable users management</span>
                  <span
                    className={`${
                      adminPermissions.users ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Gift Cards Management</span>
                <Switch
                  checked={adminPermissions.giftCards}
                  onChange={() => handleAdminToggle('giftCards')}
                  className={`${
                    adminPermissions.giftCards ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable gift cards management</span>
                  <span
                    className={`${
                      adminPermissions.giftCards ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Social Media Management</span>
                <Switch
                  checked={adminPermissions.social}
                  onChange={() => handleAdminToggle('social')}
                  className={`${
                    adminPermissions.social ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable social media management</span>
                  <span
                    className={`${
                      adminPermissions.social ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Affiliates Management</span>
                <Switch
                  checked={adminPermissions.affiliates}
                  onChange={() => handleAdminToggle('affiliates')}
                  className={`${
                    adminPermissions.affiliates ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable affiliates management</span>
                  <span
                    className={`${
                      adminPermissions.affiliates ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Winners Management</span>
                <Switch
                  checked={adminPermissions.winners}
                  onChange={() => handleAdminToggle('winners')}
                  className={`${
                    adminPermissions.winners ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable winners management</span>
                  <span
                    className={`${
                      adminPermissions.winners ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Expenses Management</span>
                <Switch
                  checked={adminPermissions.expenses}
                  onChange={() => handleAdminToggle('expenses')}
                  className={`${
                    adminPermissions.expenses ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable expenses management</span>
                  <span
                    className={`${
                      adminPermissions.expenses ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Vault Access</span>
                <Switch
                  checked={adminPermissions.vault}
                  onChange={() => handleAdminToggle('vault')}
                  className={`${
                    adminPermissions.vault ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable vault access</span>
                  <span
                    className={`${
                      adminPermissions.vault ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Artists Management</span>
                <Switch
                  checked={adminPermissions.artists}
                  onChange={() => handleAdminToggle('artists')}
                  className={`${
                    adminPermissions.artists ? 'bg-green-600' : 'bg-gray-400'
                  } relative inline-flex items-center h-6 rounded-full w-11`}
                >
                  <span className="sr-only">Enable artists management</span>
                  <span
                    className={`${
                      adminPermissions.artists ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={saveAdminPermissions}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
              >
                Save Permissions
              </button>
              <button
                onClick={() => setShowAdminModal(false)}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trial User Modal */}
      {showTrialModal && selectedUserForTrial && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-900/50 text-green-500 rounded-lg">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Trial User Settings</h3>
                <p className="text-gray-400 text-sm">Manage trial user details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Trial Plan</span>
                <select
                  value={trialPlan}
                  onChange={(e) => setTrialPlan(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg text-white py-2 px-3 focus:outline-none focus:border-cyan-500"
                >
                  <option value="basic">Basic Plan</option>
                  <option value="premium">Premium Plan</option>
                  <option value="deluxe">Deluxe Plan</option>
                  <option value="insider">Insider Club</option>
                  <option value="gold">Gold Member</option>
                  <option value="spoilme">Spoil Me</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Trial Duration (days)</span>
                <input
                  type="number"
                  min="1"
                  value={trialDays}
                  onChange={(e) => setTrialDays(Number(e.target.value))}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg text-white py-2 px-3 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={async () => {
                  if (!functions) {
                    alert('Firebase functions not available');
                    return;
                  }
                  try {
                    const grantTrialFn = httpsCallable(functions, 'grantTrial');
                    const result = await grantTrialFn({
                      userId: selectedUserForTrial.id,
                      plan: trialPlan,
                      days: trialDays
                    });
                    alert('Trial granted successfully!');
                    setShowTrialModal(false);
                    setSelectedUserForTrial(null);
                    // Reload users to reflect changes
                    window.location.reload();
                  } catch (error) {
                    console.error('Error granting trial:', error);
                    alert('Failed to grant trial. Please try again.');
                  }
                }}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
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

      {/* Artist Status Modal */}
      {showArtistModal && selectedUserForArtist && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-900/50 text-purple-500 rounded-lg">
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Artist Status</h3>
                <p className="text-gray-400 text-sm">Manage artist approval status</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Status</span>
                <span className={`text-sm font-medium ${artistStatus === 'approved' ? 'text-green-400' : artistStatus === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {artistStatus.charAt(0).toUpperCase() + artistStatus.slice(1)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setArtistStatus('approved')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    artistStatus === 'approved' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <UserCheck size={16} />
                  Approve Artist
                </button>
                <button
                  onClick={() => setArtistStatus('rejected')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    artistStatus === 'rejected' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  <Trash2 size={16} />
                  Reject Artist
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={async () => {
                  if (!functions) {
                    alert('Firebase functions not available');
                    return;
                  }
                  try {
                    const updateArtistStatusFn = httpsCallable(functions, 'updateArtistStatus');
                    await updateArtistStatusFn({
                      userId: selectedUserForArtist.id,
                      status: artistStatus
                    });
                    alert('Artist status updated successfully!');
                    setShowArtistModal(false);
                    setSelectedUserForArtist(null);
                    // Reload users to reflect changes
                    window.location.reload();
                  } catch (error) {
                    console.error('Error updating artist status:', error);
                    alert('Failed to update artist status. Please try again.');
                  }
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowArtistModal(false)}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Membership Modal */}
      {showMembershipModal && selectedUserForMembership && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-900/50 text-yellow-500 rounded-lg">
                <Crown size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Membership Tier</h3>
                <p className="text-gray-400 text-sm">Manage user membership tier</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Tier</span>
                <span className="text-sm font-medium text-yellow-400">
                  {membershipTier.charAt(0).toUpperCase() + membershipTier.slice(1)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Change to</span>
                <select
                  value={membershipTier}
                  onChange={(e) => setMembershipTier(e.target.value as 'basic' | 'premium' | 'deluxe')}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg text-white py-2 px-3 focus:outline-none focus:border-cyan-500"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="deluxe">Deluxe</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={async () => {
                  if (!functions) {
                    alert('Firebase functions not available');
                    return;
                  }
                  try {
                    const updateMembershipTierFn = httpsCallable(functions, 'updateMembershipTier');
                    await updateMembershipTierFn({
                      userId: selectedUserForMembership.id,
                      tier: membershipTier
                    });
                    alert('Membership tier updated successfully!');
                    setShowMembershipModal(false);
                    setSelectedUserForMembership(null);
                    // Reload users to reflect changes
                    window.location.reload();
                  } catch (error) {
                    console.error('Error updating membership tier:', error);
                    alert('Failed to update membership tier. Please try again.');
                  }
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowMembershipModal(false)}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
