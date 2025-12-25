import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Gift, CreditCard, Plus, Trash2, Copy, Check, RefreshCw, PenTool, ShoppingBag, Send, UserCheck, AlertTriangle } from 'lucide-react';
import { Voucher, Notification } from '../../types';
import { queryDocuments, createDocument } from '@repo/utils/supabaseClient';

const AdminGiftCards: React.FC = () => {
  const { vouchers, addVoucher, deleteVoucher, cart, currency } = useStore();

  const [amount, setAmount] = useState(10);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  
  const [generatedCode, setGeneratedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Mock incoming orders based on cart items that are vouchers
  const pendingVoucherOrders = cart.filter(item => item.code === 'GV-DIGITAL');

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) result += '-';
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(result);
  };

  const handleCreateVoucher = async () => {
    if (!amount || !generatedCode) return;
    
    setIsSending(true);

    const voucherValue = amount * 29; // Always store in ZAR

    // 1. Create the Voucher in Global Store (so it can be redeemed)
    const newVoucher: Voucher = {
        code: generatedCode,
        discountType: 'fixed',
        value: voucherValue,
        minSpend: voucherValue,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 3).toISOString() // 3 Years
    };
    addVoucher(newVoucher);

    // 2. If Email is provided, try to send to user (via Supabase)
    if (recipientEmail) {
        try {
            const users = await queryDocuments<any>('users', { filters: { email: recipientEmail }, limit: 1 });
            if (users && users.length > 0) {
                const targetUser = users[0];
                const notification: Notification = {
                    id: `gift_recv_${Date.now()}`,
                    type: 'gift_received',
                    title: 'You received a Gift Voucher!',
                    message: `Spoil Me Vintage sent you a voucher worth ${currency === 'ZAR' ? 'R' : '$'}${currency === 'ZAR' ? voucherValue : amount}.`,
                    date: new Date().toISOString(),
                    isRead: false,
                    voucherData: {
                        code: generatedCode,
                        amount: voucherValue,
                        meta: {
                            recipientName: recipientName || targetUser.name || 'Valued Customer',
                            senderName: 'Spoil Me Vintage Team',
                            message: customMessage || "Enjoy a little something special from us!",
                            deliveryMethod: 'recipient'
                        }
                    }
                };

                await createDocument('notifications', {
                    user_id: targetUser.id || (targetUser as any).uid,
                    ...notification,
                } as any);

                alert(`Voucher created AND sent to ${recipientEmail}!`);
            } else {
                alert(`Voucher created, but user with email ${recipientEmail} was not found. Please send the code manually.`);
            }
        } catch (error) {
            console.error("Error sending voucher:", error);
            alert("Voucher created, but failed to send to user due to an error.");
        }
    } else {
        // No email provided, just create
        // alert("Voucher created successfully!");
    }
    
    // Reset Form
    setGeneratedCode('');
    setRecipientName('');
    setRecipientEmail('');
    setCustomMessage('');
    setIsSending(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-[22px] font-bold text-white">Gift Card Management</h1>
             <p className="text-gray-400 text-sm">Generate valid codes and manage active vouchers.</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Voucher Generator */}
          <div className="lg:col-span-2 space-y-6">
             
             {/* Pending Orders Simulation */}
             {pendingVoucherOrders.length > 0 && (
                <div className="bg-pink-900/10 border border-pink-500/30 p-4 rounded-xl mb-6">
                    <h3 className="text-pink-400 font-bold flex items-center gap-2 mb-3">
                        <ShoppingBag size={18} /> Pending Requests ({pendingVoucherOrders.length})
                    </h3>
                    <div className="space-y-2">
                        {pendingVoucherOrders.map((order, idx) => (
                            <div key={idx} className="bg-zinc-900 p-3 rounded-lg border border-pink-500/20 flex justify-between items-center">
                                <div>
                                    <p className="text-white text-sm font-medium">{order.name}</p>
                                    <p className="text-xs text-gray-500">Value: {currency === 'ZAR' ? 'R' : '$'}{currency === 'ZAR' ? order.price : (order.price / 29).toFixed(0)}</p>
                                </div>
                                <button 
                                  onClick={() => {
                                      setAmount(currency === 'ZAR' ? order.price : order.price / 29);
                                      setRecipientName('Customer');
                                      generateCode();
                                  }}
                                  className="px-3 py-1.5 bg-pink-600 text-white text-xs rounded hover:bg-pink-500"
                                >
                                    Process
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
             )}

             <div className="bg-zinc-900 border border-gray-800 p-6 rounded-xl shadow-sm">
                <h2 className="font-bold text-white mb-6 flex items-center gap-2">
                    <Plus size={20} className="text-cyan-400" /> Issue New Voucher
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Voucher Value (USD)</label>
                        <input
                            type="number" 
                            min="10"
                            max="100"
                            value={amount}
                            onChange={e => setAmount(parseFloat(e.target.value))}
                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white font-bold focus:border-cyan-400 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Recipient Name</label>
                        <input 
                            type="text" 
                            value={recipientName}
                            onChange={e => setRecipientName(e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-400 outline-none"
                            placeholder="e.g. Sarah"
                        />
                    </div>
                </div>

                {/* Direct Send Section */}
                <div className="bg-black/30 border border-gray-700 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                        <Send size={14} /> Send Directly to User (Optional)
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">User Email Address</label>
                            <input 
                                type="email" 
                                value={recipientEmail}
                                onChange={e => setRecipientEmail(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-pink-500 outline-none"
                                placeholder="user@example.com (Must be registered)"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Custom Message</label>
                            <textarea 
                                rows={2}
                                value={customMessage}
                                onChange={e => setCustomMessage(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-pink-500 outline-none"
                                placeholder="Enjoy your gift!"
                            />
                        </div>
                    </div>
                </div>

                {/* Code Generation Area */}
                <div className="bg-black p-4 rounded-xl border border-gray-800 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-gray-500 uppercase mb-1">Unique Voucher Code</label>
                        <div className="font-mono text-2xl text-cyan-400 tracking-widest break-all">
                            {generatedCode || 'XXXX-XXXX-XXXX'}
                        </div>
                    </div>
                    <button 
                        onClick={generateCode}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors whitespace-nowrap"
                    >
                        <RefreshCw size={16} /> Generate Number
                    </button>
                </div>

                <button 
                    onClick={handleCreateVoucher}
                    disabled={!generatedCode || isSending}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                >
                    {isSending ? 'Processing...' : recipientEmail ? 'Create & Send to User' : 'Activate Voucher Only'}
                </button>
             </div>

             {/* Active Vouchers List */}
             <div className="bg-zinc-900 border border-gray-800 p-6 rounded-xl">
                 <h2 className="font-bold text-white mb-4">Active Vouchers</h2>
                 {vouchers.length === 0 ? (
                     <p className="text-gray-500 text-sm">No active vouchers.</p>
                 ) : (
                     <div className="space-y-3">
                         {vouchers.map((v, i) => (
                             <div key={i} className="flex items-center justify-between bg-black p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors">
                                 <div>
                                     <p className="font-mono text-cyan-400 font-bold">{v.code}</p>
                                     <p className="text-xs text-gray-500">Value: {currency === 'ZAR' ? 'R' : '$'}{currency === 'ZAR' ? v.value : (v.value / 29).toFixed(0)} • Expires: {new Date(v.expiresAt).toLocaleDateString()}</p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <button onClick={() => copyToClipboard(v.code)} className="p-2 text-gray-500 hover:text-white">
                                         {copiedCode === v.code ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                     </button>
                                     <button onClick={() => deleteVoucher(v.code)} className="p-2 text-gray-500 hover:text-red-400">
                                         <Trash2 size={16} />
                                     </button>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
          </div>

          {/* RIGHT: Admin Visual Preview */}
          <div className="space-y-6">
              <div className="sticky top-6">
                  <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <CreditCard size={16} /> Card Preview
                  </h3>
                  
                  {/* ADMIN VERSION OF CARD - HERO THEME */}
                  <div 
                      className="relative aspect-[1.586/1] rounded-2xl overflow-hidden text-white border-4 border-black transition-transform hover:scale-[1.02] duration-500 bg-zinc-900"
                      style={{ boxShadow: '0 0 25px 5px rgba(34, 211, 238, 0.5)' }}
                  >
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900"></div>
                      <div className="relative h-full p-6 flex flex-col justify-between z-10">
                          <div className="flex justify-between items-start">
                              <div className="font-cherry text-xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400">
                                  Spoil Me Vintage
                              </div>
                              <div className="text-3xl font-bold text-white font-architects">{currency === 'ZAR' ? 'R' : '$'}{currency === 'ZAR' ? (amount * 29).toFixed(0) : amount}</div>
                          </div>
                          
                          <div className="text-center my-auto">
                              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mb-2">VOUCHER CODE</p>
                              <div className="bg-white/5 border border-white/10 rounded px-4 py-2 inline-block backdrop-blur-sm">
                                  <span className="font-mono text-xl md:text-2xl font-bold text-cyan-400 tracking-wider">
                                      {generatedCode || '••••-••••-••••'}
                                  </span>
                              </div>
                          </div>

                          <div className="flex justify-between items-end text-[10px] text-gray-500 uppercase tracking-wider">
                              <div>
                                  To: {recipientName || 'Valued Customer'}
                                  <div className="font-handwriting text-lg text-gray-300 normal-case mt-1">Admin Team</div>
                              </div>
                              <div className="text-right">
                                  Valid for 3 Years
                                  <div className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString()}</div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="mt-6 bg-zinc-900/50 p-4 rounded-xl border border-gray-800 text-sm text-gray-400">
                      <p className="mb-2 font-bold text-white">Sending Instructions:</p>
                      <ul className="list-disc pl-4 space-y-2 text-xs">
                          <li>Set the Value and generate a unique code.</li>
                          <li><strong>Option A (Manual):</strong> Click "Activate Voucher Only", then send the code via WhatsApp/Email manually.</li>
                          <li><strong>Option B (Direct):</strong> Enter the user's Registered Email. The voucher will appear in their App Profile under "My Gifts".</li>
                      </ul>
                  </div>
              </div>
          </div>
       </div>
    </div>
  );
};

export default AdminGiftCards;
