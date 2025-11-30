

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Gift, CreditCard, Sparkles, Check, MessageCircle, PenTool, User, Send, Smartphone, ArrowRight, Eye, EyeOff, Lock, Mail, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PayFastForm, { PayFastFormHandle } from '../components/PayFastForm';

const GiftCards: React.FC = () => {
  const { user, register, login, processGiftVoucherPurchase } = useStore();
  const navigate = useNavigate();
  
  // Voucher State
  const [amount, setAmount] = useState<number>(250);
  const [recipient, setRecipient] = useState('');
  const [sender, setSender] = useState('');
  const [message, setMessage] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'self' | 'recipient'>('self');
  const [bonus, setBonus] = useState(0);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [showPassword, setShowPassword] = useState(false);
  
  // Auth Form Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // PayFast Form Ref
  const payFastRef = useRef<PayFastFormHandle>(null);

  useEffect(() => {
    if (amount >= 250 && amount <= 500) {
        setBonus(100);
    } else {
        setBonus(0);
    }
  }, [amount]);

  const totalValue = amount + bonus;

  // Combined function to Create Voucher (Optimistically) and then Pay
  const processTransaction = async () => {
      // 1. Save the voucher to the user's account immediately.
      // This ensures it exists when they return from payment.
      await processGiftVoucherPurchase(totalValue, {
         recipientName: recipient,
         senderName: sender,
         message: message,
         whatsappNumber: whatsapp,
         deliveryMethod: deliveryMethod
      });

      // 2. Submit Payment
      if (payFastRef.current) {
         payFastRef.current.submit();
      }
  };

  const initiatePayment = () => {
     if (!recipient || !sender) {
         alert("Please fill in the 'To' and 'From' fields.");
         return;
     }
     if (!user.email) {
         setShowAuthModal(true);
     } else {
         // Logged in: Process & Pay
         processTransaction();
     }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (regPassword !== regConfirmPassword) {
          alert("Passwords do not match!");
          return;
      }
      const success = await register({
          name: regName,
          email: regEmail,
          birthday: regDob,
      });
      
      if (success) {
          setShowAuthModal(false);
          // User is now logged in via Context. 
          // Wait briefly for state to settle, then process.
          setTimeout(() => {
              processTransaction();
          }, 500);
      }
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      const success = await login(regEmail, regPassword);
      if (success) {
          setShowAuthModal(false);
          setTimeout(() => {
              processTransaction();
          }, 500);
      } else {
          alert("Invalid Credentials");
      }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-12 relative">
      
      {/* --- PAYFAST REUSABLE COMPONENT --- */}
      <PayFastForm 
          ref={payFastRef}
          amount={amount}
          itemName={`Gift Voucher for ${recipient}`}
          email={user.email || regEmail}
          // Pass custom details for the backend/webhook to process later if needed
          customStr1={recipient}
          customStr2={sender}
          customStr3={message}
          // Return to Profile where the voucher will be visible
          returnUrl={`${window.location.origin}/#/profile`}
          cancelUrl={`${window.location.origin}/#/gift-cards`}
      />


      {/* --- AUTH MODAL --- */}
      {showAuthModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
             <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
             <div className="bg-zinc-900 border border-pink-500 rounded-2xl p-8 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                
                <div className="text-center mb-6">
                   <h3 className="text-2xl font-bold text-white">
                       {authMode === 'register' ? 'Create Account to Pay' : 'Sign In to Pay'}
                   </h3>
                   <p className="text-xs text-gray-400 mt-2">
                       To secure your voucher and ensure delivery, please {authMode === 'register' ? 'create a profile' : 'sign in'}.
                   </p>
                </div>

                {authMode === 'register' ? (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input type="text" required value={regName} onChange={e => setRegName(e.target.value)}
                                    className="w-full pl-10 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" placeholder="Jane Doe" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)}
                                    className="w-full pl-10 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" placeholder="jane@example.com" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Birthday (For Birthday Vouchers)</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input type="date" required value={regDob} onChange={e => setRegDob(e.target.value)}
                                    className="w-full pl-10 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs text-gray-400 mb-1">Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input type={showPassword ? "text" : "password"} required value={regPassword} onChange={e => setRegPassword(e.target.value)}
                                        className="w-full pl-10 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" placeholder="••••••" />
                                </div>
                             </div>
                             <div>
                                <label className="block text-xs text-gray-400 mb-1">Confirm</label>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} required value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)}
                                        className="w-full p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" placeholder="••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                             </div>
                        </div>

                        <button type="submit" className="w-full py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-500 transition-colors">
                            Create Account & Pay
                        </button>
                        <p className="text-xs text-center text-gray-500">
                            Already have an account? <button type="button" onClick={() => setAuthMode('login')} className="text-cyan-400 underline">Login</button>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)}
                                    className="w-full pl-10 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" placeholder="jane@example.com" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input type={showPassword ? "text" : "password"} required value={regPassword} onChange={e => setRegPassword(e.target.value)}
                                    className="w-full pl-10 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" placeholder="••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors">
                            Sign In & Pay
                        </button>
                        <p className="text-xs text-center text-gray-500">
                            New here? <button type="button" onClick={() => setAuthMode('register')} className="text-pink-400 underline">Create Account</button>
                        </p>
                    </form>
                )}
             </div>
         </div>
      )}
      
      <div className="text-center space-y-4">
        <h1 className="font-cherry text-4xl md:text-5xl text-white drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
            Give the Gift of Vintage
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
            Create a personalized digital wish card. 
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
         
         {/* LEFT: Configuration */}
         <div className="bg-zinc-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-6">
             <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
                 <div className="p-2 bg-pink-900/30 text-pink-500 rounded-lg">
                    <Gift size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">Customize Voucher</h2>
                    <p className="text-xs text-gray-500">Enter details below</p>
                 </div>
             </div>

             {/* Amount Input */}
             <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Amount (R)</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R</span>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value))}
                        className="w-full bg-black border border-gray-700 rounded-xl py-4 pl-10 pr-4 text-white text-xl font-bold focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                        placeholder="250"
                        min="50"
                    />
                </div>
                {/* Bonus Indicator */}
                {amount >= 250 && amount <= 500 ? (
                    <div className="flex items-center gap-2 text-green-400 text-xs font-bold bg-green-900/20 p-2 rounded border border-green-500/30 animate-in fade-in slide-in-from-top-2">
                        <Sparkles size={14} />
                        Bonus R100 added to voucher value automatically!
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">
                        Tip: Spend between <strong>R250 - R500</strong> to get a <span className="text-pink-500 font-bold">FREE R100</span> bonus!
                    </p>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">To (Recipient Name)</label>
                    <input 
                        type="text" 
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-pink-500 outline-none"
                        placeholder="e.g. Sarah"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                       <PenTool size={14} /> From (Your Name)
                    </label>
                    <input 
                        type="text" 
                        value={sender}
                        onChange={(e) => setSender(e.target.value)}
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-pink-500 outline-none"
                        placeholder="e.g. John"
                    />
                 </div>
             </div>

             <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Personal Message</label>
                <textarea 
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-pink-500 outline-none resize-none"
                    placeholder="Write a sweet note..."
                    maxLength={150}
                />
                <div className="text-right text-[10px] text-gray-600">
                    {message.length}/150
                </div>
             </div>

             {/* Delivery Details */}
             <div className="space-y-4 pt-2 border-t border-gray-800">
                <label className="block text-sm font-bold text-gray-300">How should we deliver this?</label>
                
                <div className="grid grid-cols-1 gap-3">
                    {/* Option 1: Send to Me */}
                    <div 
                        onClick={() => setDeliveryMethod('self')}
                        className={`cursor-pointer p-4 rounded-xl border flex items-start gap-3 transition-all ${deliveryMethod === 'self' ? 'bg-purple-900/20 border-purple-500 ring-1 ring-purple-500' : 'bg-black border-gray-700 hover:border-gray-500'}`}
                    >
                        <div className={`mt-1 p-1 rounded-full ${deliveryMethod === 'self' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            <User size={16} />
                        </div>
                        <div className="flex-1">
                            <h4 className={`text-sm font-bold ${deliveryMethod === 'self' ? 'text-purple-400' : 'text-gray-300'}`}>Send to Me (Higher Success Rate)</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-green-900/40 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                    <Check size={10} /> Best Option
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 leading-snug">
                                We send the voucher code and link to YOU via notification. You can then forward it via WhatsApp personally.
                            </p>
                            
                            {deliveryMethod === 'self' && (
                                <div className="mt-3 animate-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                                    <label className="text-xs text-green-500 block mb-1 font-bold flex items-center gap-1"><Smartphone size={12} /> Your WhatsApp Number</label>
                                    <input 
                                        type="text" 
                                        value={whatsapp}
                                        onChange={e => setWhatsapp(e.target.value)}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs focus:outline-none focus:border-green-500"
                                        placeholder="+27 12 345 6789"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Option 2: Direct Send */}
                    <div 
                        onClick={() => setDeliveryMethod('recipient')}
                        className={`cursor-pointer p-4 rounded-xl border flex items-start gap-3 transition-all ${deliveryMethod === 'recipient' ? 'bg-pink-900/20 border-pink-500 ring-1 ring-pink-500' : 'bg-black border-gray-700 hover:border-gray-500'}`}
                    >
                        <div className={`mt-1 p-1 rounded-full ${deliveryMethod === 'recipient' ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            <Send size={16} />
                        </div>
                        <div className="flex-1">
                            <h4 className={`text-sm font-bold ${deliveryMethod === 'recipient' ? 'text-pink-400' : 'text-gray-300'}`}>Send directly to Recipient</h4>
                            <p className="text-xs text-gray-400 mt-1 leading-snug">
                                We will email or WhatsApp the recipient directly on your behalf.
                            </p>
                            
                            {deliveryMethod === 'recipient' && (
                                <div className="mt-3 animate-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                                    <label className="text-xs text-green-500 block mb-1 font-bold flex items-center gap-1"><MessageCircle size={12} /> Recipient WhatsApp (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={whatsapp}
                                        onChange={e => setWhatsapp(e.target.value)}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs focus:outline-none focus:border-green-500"
                                        placeholder="+27 12 345 6789"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
             </div>

             <button 
                onClick={initiatePayment}
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all flex items-center justify-center gap-2 text-lg"
             >
                <CreditCard size={20} /> Buy Now & Pay - R{amount.toFixed(2)}
             </button>
             <p className="text-center text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                 <Check size={12} className="text-green-500" /> Secure Payment via PayFast
             </p>
         </div>

         {/* RIGHT: Live Preview */}
         <div className="sticky top-24">
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={16} /> Example
            </h3>
            
            {/* HERO THEME CARD DESIGN */}
            <div 
                className="relative aspect-[1.586/1] rounded-2xl overflow-hidden text-white border-4 border-black transition-transform hover:scale-[1.02] duration-500 bg-zinc-900"
                style={{ boxShadow: '0 0 25px 5px rgba(34, 211, 238, 0.5)' }}
            >
                
                {/* Background Layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900"></div>
                
                {/* Decorative Text/Pattern */}
                <div className="absolute top-0 left-0 p-4 opacity-10 pointer-events-none">
                   <span className="font-cherry text-8xl text-white leading-none">SV</span>
                </div>

                {/* Card Content */}
                <div className="relative h-full p-6 md:p-8 flex flex-col justify-between z-20">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-cherry text-xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                                Spoil Me Vintage
                            </h3>
                            <div className="flex items-center gap-1 mt-1">
                                <Sparkles size={10} className="text-cyan-400" />
                                <p className="text-[10px] text-gray-300 tracking-[0.2em] uppercase">Exclusive Voucher</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-2xl md:text-5xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-architects">
                                R{totalValue}
                             </div>
                        </div>
                    </div>

                    {/* Message Area */}
                    <div className="flex-1 flex flex-col justify-center py-2 md:py-4 relative">
                         <p className="font-architects text-lg md:text-2xl text-gray-200 leading-relaxed text-center break-words relative drop-shadow-sm line-clamp-3">
                            "{message || 'Treat yourself to something timeless...'}"
                        </p>
                        
                        {/* REDEEM BUTTON */}
                        <div className="mx-auto mt-4 md:mt-6 cursor-pointer group w-full md:w-auto flex justify-center">
                            <div className="bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-full px-6 py-3 md:px-6 md:py-2 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-cyan-900/30 hover:border-cyan-400 transition-all w-full md:w-auto">
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                <span className="text-xs md:text-xs font-bold text-white uppercase tracking-widest group-hover:text-cyan-300 transition-colors">
                                    Redeem Now
                                </span>
                                <ArrowRight size={12} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-3 md:pt-4">
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">To</p>
                            <p className="text-sm font-bold text-white truncate">{recipient || 'Recipient Name'}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center justify-end gap-1">
                               From <PenTool size={10} />
                            </p>
                            <p className="text-lg font-architects text-cyan-400 truncate">{sender || 'Your Name'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-zinc-900/50 border border-gray-800 rounded-xl p-5 shadow-lg">
                <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2 border-b border-gray-800 pb-2">
                    <Check size={14} className="text-green-400" /> Verified Voucher Features
                </h4>
                <ul className="text-xs text-gray-400 space-y-2.5">
                    <li className="flex items-start gap-2"><Sparkles size={12} className="text-purple-400 mt-0.5"/> Valid for 3 years from date of purchase.</li>
                    <li className="flex items-start gap-2"><Smartphone size={12} className="text-cyan-400 mt-0.5"/> <span className="text-white font-bold">Smart Link:</span> Recipient taps "Redeem Now" to auto-apply discount in App.</li>
                    <li className="flex items-start gap-2"><MessageCircle size={12} className="text-green-400 mt-0.5"/> <span className="text-white font-bold">Instant Delivery</span> via Notification & WhatsApp.</li>
                </ul>
            </div>
         </div>

      </div>
    </div>
  );
};

export default GiftCards;