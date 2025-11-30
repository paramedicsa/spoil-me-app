
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Trash2, Plus, Minus, CreditCard, ArrowRight, ShieldCheck, Check, Mail, Lock, Eye, EyeOff, User, Calendar, Truck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import PayFastForm, { PayFastFormHandle } from '../components/PayFastForm';
import ShippingSelector from '../components/ShippingSelector';
import ShippingProgressBar from '../components/ShippingProgressBar';
import { Order } from '../types';

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateCartQuantity, getCartTotal, user, appliedVoucher, setAppliedVoucher, applyExternalVoucher, updateUserAddress, setIsStickyProgressBarVisible, checkout, clearCart, register, login } = useStore();
  const navigate = useNavigate();
  
  // State for shipping info from child component
  const [shippingInfo, setShippingInfo] = useState({
    method: 'pudo' as 'pudo' | 'paxi' | 'door',
    cost: 60, // Default cost
    details: ''
  });

  // Voucher Input
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherError, setVoucherError] = useState('');

  // Checkout & Auth
  const payFastRef = useRef<PayFastFormHandle>(null);
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [showPassword, setShowPassword] = useState(false);
  const [isAwaitingLogin, setIsAwaitingLogin] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Auth Form Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  

  // Hide the sticky progress bar when the user navigates to the cart
  useEffect(() => {
    setIsStickyProgressBarVisible(false);
  }, [setIsStickyProgressBarVisible]);
  
  // This effect handles the checkout process after a user logs in or registers.
  useEffect(() => {
    if (isAwaitingLogin && user.email) {
      processOrderCreation();
      setIsAwaitingLogin(false); // Reset flag
    }
  }, [isAwaitingLogin, user.email]);

  useEffect(() => {
    if (orderToPay && payFastRef.current) {
        payFastRef.current.submit();
        clearCart();
    }
  }, [orderToPay, clearCart]);


  const handleContinueShopping = () => {
    setIsStickyProgressBarVisible(true);
    navigate('/');
  };

  const cartTotal = getCartTotal();
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const isFreeShippingEligible = cartTotal >= 500 && (shippingInfo.method === 'pudo' || shippingInfo.method === 'paxi');
  const shippingCost = isFreeShippingEligible ? 0 : shippingInfo.cost;
  
  // Voucher Calculation
  let discountAmount = 0;
  if (appliedVoucher) {
      if (appliedVoucher.minSpend && cartTotal < appliedVoucher.minSpend) {
          // Voucher invalid due to min spend
      } else {
          if (appliedVoucher.discountType === 'percentage') {
              discountAmount = (cartTotal * appliedVoucher.value) / 100;
          } else {
              discountAmount = appliedVoucher.value;
          }
      }
  }
  
  if (discountAmount > cartTotal) discountAmount = cartTotal;

  const finalTotal = cartTotal + shippingCost - discountAmount;

  const handleApplyVoucher = () => {
      setVoucherError('');
      if (!voucherInput.trim()) return;
      const success = applyExternalVoucher(voucherInput.trim());
      if (success) {
          setVoucherInput('');
      } else {
          setVoucherError('Invalid or expired voucher code.');
      }
  };

  const handleCheckout = async () => {
      if (!shippingInfo.details) {
          alert('Please complete all shipping details.');
          return;
      }

      if (!user.email) {
          setShowAuthModal(true);
          return;
      }
      
      // User is logged in, proceed to create order
      await processOrderCreation();
  };
  
  const processOrderCreation = async () => {
    if (shippingInfo.method === 'door') {
        await updateUserAddress(JSON.parse(shippingInfo.details));
    }
    
    try {
        const createdOrder = await checkout({
            items: cart,
            total: finalTotal,
            shippingMethod: shippingInfo.method,
            shippingDetails: shippingInfo.details,
            shippingCost: shippingCost
        });
        setOrderToPay(createdOrder);
    } catch(error) {
        console.error("Order creation failed", error);
        alert("Could not create your order. Please try again.");
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (regPassword !== regConfirmPassword) {
        setAuthError("Passwords do not match!");
        return;
    }
    const success = await register({
        name: regName, email: regEmail, birthday: regDob, password: regPassword
    });
    if(success) {
        setShowAuthModal(false);
        setIsAwaitingLogin(true);
    } else {
        setAuthError("Registration failed. Please try again.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      const success = await login(regEmail, regPassword);
      if (success) {
          setShowAuthModal(false);
          setIsAwaitingLogin(true);
      } else {
          setAuthError("Invalid credentials.");
      }
  };


  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-gray-600">
            <CreditCard size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-gray-400">Looks like you haven't added any treasures yet.</p>
        <Link to="/" className="px-6 py-3 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-500 transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
       
       <ShippingProgressBar subtotal={cartTotal} onContinueShopping={handleContinueShopping} />
       
        {showAuthModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
                <div className="bg-zinc-900 border border-pink-500 rounded-2xl p-8 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-white">{authMode === 'register' ? 'Create an Account' : 'Sign In'}</h3>
                        <p className="text-xs text-gray-400 mt-2">An account is required to track your order history and status.</p>
                    </div>
                    {authMode === 'register' ? (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} className="w-full pl-4 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" placeholder="Full Name" />
                            <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full pl-4 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" placeholder="Email Address" />
                            <input type="date" required value={regDob} onChange={e => setRegDob(e.target.value)} className="w-full pl-4 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" />
                            <input type={showPassword ? "text" : "password"} required value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full pl-4 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" placeholder="Create Password" />
                            <input type={showPassword ? "text" : "password"} required value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} className="w-full pl-4 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" placeholder="Confirm Password" />
                            {authError && <p className="text-xs text-red-400 text-center">{authError}</p>}
                            <button type="submit" className="w-full py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-500">Create Account & Continue</button>
                            <p className="text-xs text-center text-gray-500">Already have an account? <button type="button" onClick={() => setAuthMode('login')} className="text-cyan-400 underline">Login</button></p>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full pl-4 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" placeholder="Email Address" />
                            <input type={showPassword ? "text" : "password"} required value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full pl-4 p-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm" placeholder="Password" />
                            {authError && <p className="text-xs text-red-400 text-center">{authError}</p>}
                            <button type="submit" className="w-full py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500">Sign In & Continue</button>
                            <p className="text-xs text-center text-gray-500">New here? <button type="button" onClick={() => setAuthMode('register')} className="text-pink-400 underline">Create Account</button></p>
                        </form>
                    )}
                </div>
            </div>
        )}

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <PayFastForm 
            ref={payFastRef}
            amount={orderToPay?.total ?? finalTotal}
            itemName={orderToPay ? `Order ${orderToPay.orderNumber}` : 'Spoil Me Vintage Order'}
            email={user.email}
            customStr1={orderToPay?.id ?? ''}
            customStr2={shippingInfo.method}
            customStr3={appliedVoucher?.code || ''}
        />

        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">
            <h1 className="text-2xl font-bold text-white mb-4">Shopping Cart ({cartItemCount})</h1>
            
            <div className="space-y-4">
                {cart.map((item, idx) => {
                  let availableStock = item.stock;
                  if (item.type === 'Ring' && item.selectedSize && item.ringStock) {
                      availableStock = item.ringStock[item.selectedSize] || 0;
                  }
                  const isStockLimitReached = item.quantity >= availableStock;

                  return (
                    <div key={`${item.id}_${idx}`} className="bg-zinc-900 border border-gray-800 p-4 rounded-xl flex gap-4 items-start">
                      <div className="w-20 h-20 bg-black rounded-lg overflow-hidden border border-gray-700 shrink-0">
                          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-white text-sm line-clamp-2">{item.name}</h3>
                            <button onClick={() => removeFromCart(item.id, { 
                                selectedSize: item.selectedSize, 
                                selectedMaterial: item.selectedMaterial,
                                selectedChainStyle: item.selectedChainStyle,
                                selectedChainLength: item.selectedChainLength
                            })} className="text-gray-500 hover:text-red-400 p-1">
                                <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                            {item.selectedSize && <div>Size: <span className="text-gray-300">{item.selectedSize}</span></div>}
                            {item.selectedMaterial && <div>Material: <span className="text-gray-300">{item.selectedMaterial}</span></div>}
                            {item.selectedChainStyle && <div>Chain: <span className="text-gray-300">{item.selectedChainStyle} {item.selectedChainLength ? `(${item.selectedChainLength})` : ''}</span></div>}
                          </div>

                          <div className="flex justify-between items-end mt-3">
                            <div className="flex items-center gap-3 bg-black rounded-lg border border-gray-700 px-2 py-1">
                                <button onClick={() => updateCartQuantity(item.id, item.quantity - 1, item)} className="text-gray-400 hover:text-white"><Minus size={14} /></button>
                                <span className="text-sm font-bold text-white w-4 text-center">{item.quantity}</span>
                                <button 
                                    onClick={() => updateCartQuantity(item.id, item.quantity + 1, item)} 
                                    className="text-gray-400 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed"
                                    disabled={isStockLimitReached}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="font-bold text-white">
                                R{((item.price + (item.selectedMaterialModifier || 0)) * item.quantity).toFixed(2)}
                            </div>
                          </div>
                      </div>
                    </div>
                  )
                })}
            </div>
        </div>

        {/* Right Column: Summary & Checkout */}
        <div className="space-y-6">
            
            <ShippingSelector
              cartItemCount={cartItemCount}
              onShippingChange={setShippingInfo}
              subtotal={cartTotal}
            />

            {/* Order Summary */}
            <div className="bg-zinc-900 border border-gray-800 p-6 rounded-xl">
              <h3 className="font-bold text-white mb-4">Summary</h3>
              
              <div className="space-y-2 text-sm text-gray-400 mb-4 pb-4 border-b border-gray-800">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white">R{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-white">{isFreeShippingEligible ? <span className="text-green-400">FREE</span> : `R${shippingCost.toFixed(2)}`}</span>
                  </div>
                  {discountAmount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount</span>
                        <span>-R{discountAmount.toFixed(2)}</span>
                      </div>
                  )}
              </div>

              <div className="flex justify-between items-end mb-6">
                  <span className="text-gray-300 font-bold">Total</span>
                  <span className="text-2xl font-bold text-white">R{finalTotal.toFixed(2)}</span>
              </div>

              {!appliedVoucher ? (
                  <div className="flex gap-2 mb-4">
                      <input 
                        type="text" 
                        placeholder="Promo Code" 
                        className="flex-1 bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-pink-500 outline-none"
                        value={voucherInput}
                        onChange={e => setVoucherInput(e.target.value)}
                      />
                      <button onClick={handleApplyVoucher} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm border border-gray-600">
                          Apply
                      </button>
                  </div>
              ) : (
                  <div className="bg-green-900/20 border border-green-500/30 p-3 rounded-lg mb-4 flex justify-between items-center text-xs">
                      <span className="text-green-400 font-bold flex items-center gap-1"><Check size={12} /> Code {appliedVoucher.code} Applied</span>
                      <button onClick={() => setAppliedVoucher(null)} className="text-gray-500 hover:text-white">Remove</button>
                  </div>
              )}
              {voucherError && <p className="text-xs text-red-400 mb-4">{voucherError}</p>}

              <button 
                  onClick={handleCheckout}
                  className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                  Pay Now <ArrowRight size={20} />
              </button>
              
              <div className="text-center mt-3 text-xs text-gray-500 flex justify-center gap-2">
                  <ShieldCheck size={14} /> Secure Payment via PayFast
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
