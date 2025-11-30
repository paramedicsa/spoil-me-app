
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Gift, Smartphone, Twitter, MessageCircle, Check, ExternalLink, HelpCircle, X, Award, ShoppingCart, Star, Facebook, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const EarnRewards: React.FC = () => {
  const { user, claimSocialReward } = useStore();
  const [showHelp, setShowHelp] = useState(false);
  const [verifyModal, setVerifyModal] = useState<{ platform: 'tiktok' | 'twitter' | 'facebook' | 'whatsapp', name: string } | null>(null);
  const [handleInput, setHandleInput] = useState('');

  const openVerify = (platform: 'tiktok' | 'twitter' | 'facebook' | 'whatsapp', name: string) => {
      setVerifyModal({ platform, name });
      setHandleInput('');
  };

  const handleClaim = () => {
      if (!verifyModal) return;
      // For WhatsApp we might not need a handle, but for consistency we can ask for name/number
      if (verifyModal.platform !== 'whatsapp' && !handleInput.trim()) {
          alert(`Please enter your ${verifyModal.name} username to verify.`);
          return;
      }
      claimSocialReward(verifyModal.platform, handleInput);
      setVerifyModal(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12 relative">
        
        {/* Verification Modal (Anti-Fraud/Record Keeping) */}
        {verifyModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setVerifyModal(null)} />
                <div className="bg-zinc-900 border border-pink-500 rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                    <h3 className="text-xl font-bold text-white mb-2">One Last Step!</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        To prevent fraud and secure your points, please enter your username. This allows us to verify your follow.
                    </p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Your {verifyModal.name} Username</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="text" 
                                    value={handleInput}
                                    onChange={e => setHandleInput(e.target.value)}
                                    className="w-full pl-10 p-3 bg-black border border-gray-700 rounded-xl text-white text-sm focus:border-pink-500 outline-none"
                                    placeholder="@username"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleClaim}
                            className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all"
                        >
                            Verify & Claim Points
                        </button>
                    </div>
                    <button onClick={() => setVerifyModal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                </div>
            </div>
        )}

        {/* Header & Balance */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-800 pb-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-cherry text-4xl text-white">Loyalty Rewards</h1>
                    <button 
                        onClick={() => setShowHelp(true)} 
                        className="text-gray-500 hover:text-cyan-400 transition-colors"
                        title="How it works"
                    >
                        <HelpCircle size={24} />
                    </button>
                </div>
                <p className="text-gray-400 text-lg max-w-xl">
                    Complete simple tasks to earn points and unlock discounts on your next vintage treasure.
                </p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-black p-6 rounded-2xl border border-purple-500/30 min-w-[250px] text-center shadow-[0_0_20px_rgba(168,85,247,0.15)] relative group">
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                <div className="relative z-10">
                    <div className="text-sm text-gray-400 uppercase tracking-wider mb-1 font-semibold">Your Balance</div>
                    <div className="text-5xl font-bold text-white mb-2 font-mono tracking-tight">{user.loyaltyPoints}</div>
                    <div className="text-xs text-purple-400 font-bold bg-purple-900/20 py-1 px-3 rounded-full w-fit mx-auto">Points Available</div>
                </div>
            </div>
        </div>

        {/* Help Modal */}
        {showHelp && (
             <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                 <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
                 <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-6 max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-in zoom-in-95 duration-200">
                     <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                        <X size={20} />
                     </button>
                     
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-900/50 rounded-full border border-purple-500 text-purple-300">
                           <Award size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">How Rewards Work</h3>
                     </div>

                     <div className="space-y-4 text-sm text-gray-300">
                        <div className="flex gap-3">
                            <div className="shrink-0 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-green-400 font-bold">1</div>
                            <div>
                               <h4 className="font-bold text-white">Earn Points</h4>
                               <p className="text-xs text-gray-400 mt-1">
                                  Get <span className="text-green-400">1 Point for every R10</span> spent.
                               </p>
                               <p className="text-xs text-gray-400 mt-1">
                                  Get <span className="text-green-400">100 Points</span> for verified reviews.
                               </p>
                               <p className="text-xs text-gray-400 mt-1">
                                  Get <span className="text-green-400">50 Points</span> for sharing.
                               </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="shrink-0 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-pink-500 font-bold">2</div>
                            <div>
                               <h4 className="font-bold text-white">Redeem for Discounts</h4>
                               <p className="text-xs text-gray-400 mt-1">
                                  100 Points = <span className="text-white font-bold">R1.00 Discount</span>.
                               </p>
                               <p className="text-xs text-gray-400 mt-1">
                                  Minimum redemption is 1000 Points (R10).
                               </p>
                            </div>
                        </div>

                        <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded-lg mt-2">
                            <h4 className="font-bold text-purple-300 flex items-center gap-2 text-xs uppercase tracking-wide">
                               <Award size={14} /> Membership Rule
                            </h4>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                               Non-members can redeem up to <strong>R100 (10,000 pts)</strong> per order. 
                               To redeem more, you must be a <Link to="/membership" className="text-purple-400 underline">Basic Member</Link> or higher.
                            </p>
                        </div>
                     </div>

                     <button 
                       onClick={() => setShowHelp(false)}
                       className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl mt-6 transition-colors"
                     >
                        Got it!
                     </button>
                 </div>
             </div>
        )}

        {/* Social Rewards Grid */}
        <div>
             <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Gift className="text-yellow-400" /> Quick Earn: Social Media
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* TikTok Reward (Pink) */}
                <div className="bg-zinc-900 border border-gray-800 p-6 rounded-2xl flex flex-col items-center text-center relative group overflow-hidden hover:border-pink-500 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-b from-pink-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-16 h-16 bg-black border border-pink-500/50 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(236,72,153,0.4)] relative z-10">
                        <Smartphone size={32} className="text-pink-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 relative z-10">TikTok</h3>
                    <p className="text-sm text-gray-400 mb-4 relative z-10">Get exclusive clips & flash sales.</p>
                    
                    {user.socialRewards?.tiktok ? (
                        <button disabled className="mt-auto w-full py-3 bg-zinc-800 border border-zinc-700 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                            <Check size={18} /> 100 Pts Claimed
                        </button>
                    ) : (
                        <button 
                            onClick={() => openVerify('tiktok', 'TikTok')}
                            className="mt-auto w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all flex items-center justify-center gap-2 relative z-10 text-sm"
                        >
                            <ExternalLink size={16} /> Join & Earn 100
                        </button>
                    )}
                </div>

                {/* Facebook Reward (Blue) */}
                <div className="bg-zinc-900 border border-gray-800 p-6 rounded-2xl flex flex-col items-center text-center relative group overflow-hidden hover:border-blue-500 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-16 h-16 bg-black border border-blue-500/50 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(59,130,246,0.4)] relative z-10">
                        <Facebook size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 relative z-10">Facebook</h3>
                    <p className="text-sm text-gray-400 mb-4 relative z-10">Join our community group.</p>
                    
                    {user.socialRewards?.facebook ? (
                        <button disabled className="mt-auto w-full py-3 bg-zinc-800 border border-zinc-700 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                            <Check size={18} /> 100 Pts Claimed
                        </button>
                    ) : (
                        <button 
                            onClick={() => openVerify('facebook', 'Facebook')}
                            className="mt-auto w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-2 relative z-10 text-sm"
                        >
                            <ExternalLink size={16} /> Join & Earn 100
                        </button>
                    )}
                </div>

                {/* Twitter Reward */}
                <div className="bg-zinc-900 border border-gray-800 p-6 rounded-2xl flex flex-col items-center text-center relative group overflow-hidden hover:border-white/20 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-16 h-16 bg-black border border-gray-700 rounded-full flex items-center justify-center mb-4 shadow-lg relative z-10">
                        <Twitter size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 relative z-10">Twitter</h3>
                    <p className="text-sm text-gray-400 mb-4 relative z-10">News and polls.</p>
                    
                    {user.socialRewards?.twitter ? (
                        <button disabled className="mt-auto w-full py-3 bg-zinc-800 border border-zinc-700 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                            <Check size={18} /> 100 Pts Claimed
                        </button>
                    ) : (
                        <button 
                            onClick={() => openVerify('twitter', 'Twitter')}
                            className="mt-auto w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2 relative z-10 text-sm"
                        >
                            <ExternalLink size={16} /> Join & Earn 100
                        </button>
                    )}
                </div>

                {/* WhatsApp Group Reward */}
                <div className="bg-zinc-900 border border-gray-800 p-6 rounded-2xl flex flex-col items-center text-center relative group overflow-hidden hover:border-green-500/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-b from-green-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-16 h-16 bg-black border border-gray-700 rounded-full flex items-center justify-center mb-4 shadow-lg relative z-10">
                        <MessageCircle size={32} className="text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 relative z-10">WhatsApp</h3>
                    <p className="text-sm text-gray-400 mb-4 relative z-10">Instant drop notifications.</p>
                    
                    {user.socialRewards?.whatsapp ? (
                        <button disabled className="mt-auto w-full py-3 bg-zinc-800 border border-zinc-700 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                            <Check size={18} /> 100 Pts Claimed
                        </button>
                    ) : (
                        <button 
                            onClick={() => claimSocialReward('whatsapp')}
                            className="mt-auto w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center gap-2 relative z-10 text-sm"
                        >
                            <ExternalLink size={16} /> Join & Earn 100
                        </button>
                    )}
                </div>

             </div>
        </div>

        {/* Other Ways to Earn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-gray-800">
            <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800 hover:border-cyan-500/30 transition-colors">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4 border border-gray-700">
                    <ShoppingCart className="text-cyan-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Shop & Earn</h3>
                <p className="text-sm text-gray-400 mt-2">Earn 1 point for every R10 you spend on any purchase automatically.</p>
                <Link to="/" className="text-cyan-400 text-sm font-bold mt-4 inline-block hover:underline">Start Shopping</Link>
            </div>
            <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800 hover:border-yellow-500/30 transition-colors">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4 border border-gray-700">
                    <Star className="text-yellow-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Review Products</h3>
                <p className="text-sm text-gray-400 mt-2">Earn 100 points for every verified review you leave on items you've bought.</p>
                <Link to="/profile" className="text-yellow-400 text-sm font-bold mt-4 inline-block hover:underline">Check Pending Reviews</Link>
            </div>
        </div>
    </div>
  );
}

export default EarnRewards;