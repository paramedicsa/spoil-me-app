import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { BarChart, DollarSign, ShoppingBag, Users, Database, RefreshCw, AlertTriangle, UserPlus, Stethoscope, Check, X, Activity, Award, Zap, TestTube, Truck, ExternalLink } from 'lucide-react';
import { User } from '../../types';

const AdminDashboard: React.FC = () => {
  const { products, isDemoMode, resetStore, dbConnectionError, seedTestUsers, runDataDiagnostics, simulateAffiliateSale, getAllUsers, adminAdjustPoints } = useStore();
  const [diagResult, setDiagResult] = useState<{ status: string, details: string } | null>(null);
  
  // Tester States
  const [testAffiliateCode, setTestAffiliateCode] = useState('');
  const [testSaleAmount, setTestSaleAmount] = useState(100);
  const [testResult, setTestResult] = useState<string | null>(null);
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedTestUser, setSelectedTestUser] = useState<string>('');
  const [testLoyaltyMsg, setTestLoyaltyMsg] = useState<string | null>(null);

  useEffect(() => {
      const load = async () => {
          const u = await getAllUsers();
          setAllUsers(u);
          if(u.length > 0) setSelectedTestUser(u[0].id);
      };
      load();
  }, [getAllUsers]);

  // Mock stats
  const stats = [
    { title: 'Total Revenue', value: 'R12,450', change: '+12%', icon: DollarSign, color: 'bg-green-900/30 text-green-400 border-green-500/20' },
    { title: 'Total Orders', value: '154', change: '+8%', icon: ShoppingBag, color: 'bg-cyan-900/30 text-cyan-400 border-cyan-500/20' },
    { title: 'Active Users', value: '1,203', change: '+24%', icon: Users, color: 'bg-purple-900/30 text-purple-400 border-purple-500/20' },
    { title: 'Products', value: products.length, change: '0%', icon: BarChart, color: 'bg-pink-900/30 text-pink-400 border-pink-500/20' },
  ];

  const handleRunTest = () => {
      const result = runDataDiagnostics();
      setDiagResult(result);
  };

  const handleAffiliateTest = async () => {
      if (!testAffiliateCode) return;
      setTestResult('Processing...');
      const res = await simulateAffiliateSale(testAffiliateCode, testSaleAmount);
      setTestResult(res.message);
  };

  const handleAddPoints = async () => {
      if(!selectedTestUser) return;
      await adminAdjustPoints(selectedTestUser, 1000);
      setTestLoyaltyMsg(`Added 1000 Points to user ID: ${selectedTestUser}`);
      setTimeout(() => setTestLoyaltyMsg(null), 3000);
  };

  const handleSimulateReview = async () => {
      if(!selectedTestUser) {
          alert("Please select a user");
          return;
      }
      // Manually add points and a notification to verify
      await adminAdjustPoints(selectedTestUser, 100);
      setTestLoyaltyMsg(`Simulated Review: Awarded 100 Points to ${selectedTestUser}`);
      setTimeout(() => setTestLoyaltyMsg(null), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-[22px] font-bold text-white">Dashboard Overview</h1>
        <div className="flex gap-2">
            {!isDemoMode && (
                <button 
                  onClick={seedTestUsers}
                  className="flex items-center gap-2 text-xs bg-purple-900/30 text-purple-400 border border-purple-500/30 px-3 py-2 rounded hover:bg-purple-900/50 transition-colors"
                >
                  <UserPlus size={14} /> Seed Test Users to DB
                </button>
            )}
            {isDemoMode && (
              <button 
                onClick={resetStore}
                className="flex items-center gap-2 text-xs bg-red-900/30 text-red-400 border border-red-500/30 px-3 py-2 rounded hover:bg-red-900/50 transition-colors"
              >
                <RefreshCw size={14} /> Reset Demo Data
              </button>
            )}
        </div>
      </div>
      
      {/* --- FEATURE SIMULATION LAB (NEW) --- */}
      <div className="bg-zinc-900/50 border-2 border-amber-500/30 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-400 px-3 py-1 text-xs font-bold rounded-bl-lg border-l border-b border-amber-500/30">
              TESTING LAB
          </div>
          <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-900/30 text-amber-400 rounded-lg border border-amber-500/30">
                  <TestTube size={24} />
              </div>
              <div>
                  <h3 className="font-bold text-white text-lg">Feature Verification Lab</h3>
                  <p className="text-gray-400 text-xs">Manually trigger logic to verify Affiliate & Loyalty systems.</p>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Affiliate Tester */}
              <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2 text-sm">
                      <DollarSign size={14} className="text-green-400" /> Affiliate Sale Simulator
                  </h4>
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs text-gray-500 block mb-1">Affiliate Code</label>
                          <input 
                             type="text" 
                             className="w-full bg-zinc-900 border border-gray-600 rounded p-2 text-white text-xs"
                             value={testAffiliateCode}
                             onChange={e => setTestAffiliateCode(e.target.value)}
                             placeholder="e.g. Spoilme-FAY003"
                          />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 block mb-1">Sale Amount (R)</label>
                          <input 
                             type="number" 
                             className="w-full bg-zinc-900 border border-gray-600 rounded p-2 text-white text-xs"
                             value={testSaleAmount}
                             onChange={e => setTestSaleAmount(parseFloat(e.target.value))}
                          />
                      </div>
                      <button 
                         onClick={handleAffiliateTest}
                         className="w-full py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded transition-colors"
                      >
                          Simulate Sale & Commission
                      </button>
                      {testResult && (
                          <div className="p-2 bg-zinc-800 rounded text-xs text-green-300 border border-green-500/30 mt-2">
                              {testResult}
                          </div>
                      )}
                  </div>
              </div>

              {/* Loyalty Tester */}
              <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2 text-sm">
                      <Award size={14} className="text-purple-400" /> Loyalty System Tester
                  </h4>
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs text-gray-500 block mb-1">Select User</label>
                          <select 
                             className="w-full bg-zinc-900 border border-gray-600 rounded p-2 text-white text-xs"
                             value={selectedTestUser}
                             onChange={e => setSelectedTestUser(e.target.value)}
                          >
                              <option value="">-- Select User --</option>
                              {allUsers.map(u => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                              ))}
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                          <button 
                             onClick={handleAddPoints}
                             className="py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded transition-colors"
                          >
                              +1000 Points
                          </button>
                          <button 
                             onClick={handleSimulateReview}
                             className="py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold rounded transition-colors"
                          >
                              Simulate Review
                          </button>
                      </div>
                      {testLoyaltyMsg && (
                          <div className="p-2 bg-zinc-800 rounded text-xs text-purple-300 border border-purple-500/30 mt-2 animate-pulse">
                              {testLoyaltyMsg}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* --- SHIPPING & LOGISTICS --- */}
      <div className="bg-zinc-900 border border-gray-700 p-6 rounded-xl shadow-lg">
          <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-3">
              <Truck size={20} className="text-cyan-400" />
              Shipping & Logistics
          </h3>
          <div className="flex flex-col md:flex-row gap-4 items-center bg-black/40 p-4 rounded-lg border border-gray-800">
              <div className="flex-1">
                  <h4 className="font-bold text-white">PUDO Locker Management</h4>
                  <p className="text-xs text-gray-400 mt-1">
                      Access your PUDO dashboard to manage locker shipments, track parcels, and view your account details.
                  </p>
              </div>
              <a 
                  href="https://customer.pudo.co.za/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                  Open PUDO Dashboard <ExternalLink size={16} />
              </a>
          </div>
      </div>

      {/* SYSTEM DOCTOR PANEL */}
      <div className="bg-zinc-900 border border-gray-700 p-6 rounded-xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-900/30 text-blue-400 rounded-lg border border-blue-500/30">
                      <Stethoscope size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-white text-lg">System Doctor</h3>
                      <p className="text-gray-400 text-xs">Verify database integrity and save functionality.</p>
                  </div>
              </div>
              <button 
                onClick={handleRunTest}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors"
              >
                  <Activity size={14} /> Run Integrity Check
              </button>
          </div>
          
          {diagResult && (
              <div className={`p-4 rounded-lg border flex items-start gap-3 animate-in slide-in-from-top-2 ${
                  diagResult.status === 'success' ? 'bg-green-900/20 border-green-500/30 text-green-300' : 'bg-red-900/20 border-red-500/30 text-red-300'
              }`}>
                  {diagResult.status === 'success' ? <Check size={18} className="shrink-0 mt-0.5" /> : <X size={18} className="shrink-0 mt-0.5" />}
                  <div>
                      <p className="font-bold text-sm">{diagResult.status === 'success' ? 'System Healthy' : 'Issue Detected'}</p>
                      <p className="text-xs opacity-80">{diagResult.details}</p>
                  </div>
              </div>
          )}
      </div>

      {dbConnectionError && (
        <div className="bg-red-900/20 border border-red-600/30 p-4 rounded-xl flex items-start gap-4">
          <div className="p-2 bg-red-900/50 text-red-500 rounded-lg">
            <AlertTriangle size={20} />
          </div>
          <div>
             <h3 className="text-sm font-bold text-red-500">Firestore Connection Failed</h3>
             <p className="text-xs text-red-200/70 mt-1">
               Error: {dbConnectionError}.
               <br/>
               Please ensure you have created the <strong>Firestore Database</strong> in your Firebase Console.
               Until then, the app is running in <strong>Demo Mode</strong>.
             </p>
          </div>
        </div>
      )}

      {isDemoMode && !dbConnectionError && (
        <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-xl flex items-start gap-4">
          <div className="p-2 bg-yellow-900/50 text-yellow-500 rounded-lg">
            <Database size={20} />
          </div>
          <div>
             <h3 className="text-sm font-bold text-yellow-500">Running in Demo Mode</h3>
             <p className="text-xs text-yellow-200/70 mt-1">
               Firebase is not configured or unavailable. All changes (Products, Categories) are saved to your browser's Local Storage. 
               Uploading large images might fill your storage limit.
             </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg border ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">{stat.title}</h3>
            <p className="text-[22px] font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-800">
           <h3 className="font-bold text-white mb-4 text-lg">Recent Activity</h3>
           <div className="space-y-4">
             {[1, 2, 3].map((_, i) => (
               <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-800 last:border-0">
                 <div className="w-10 h-10 bg-black border border-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">OR</div>
                 <div>
                   <p className="text-sm font-medium text-gray-200">Order #492{i} placed</p>
                   <p className="text-xs text-gray-500">2 minutes ago</p>
                 </div>
                 <div className="ml-auto font-bold text-green-400 text-sm">R129.00</div>
               </div>
             ))}
           </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-800">
           <h3 className="font-bold text-white mb-4 text-lg">Inventory Status</h3>
           <div className="space-y-4">
             {products.slice(0, 4).map(p => (
               <div key={p.id} className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <img src={p.images[0]} className="w-10 h-10 rounded bg-black object-cover border border-gray-800" alt="" />
                   <span className="text-sm text-gray-300 truncate w-40">{p.name}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                     <div className="h-full bg-pink-500" style={{ width: `${Math.min(p.stock, 100)}%` }}></div>
                   </div>
                   <span className="text-xs font-mono text-gray-500">{p.stock} left</span>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;