import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HelpCircle, X } from 'lucide-react';
import { uploadFile, supabase } from '../../utils/supabaseClient';
import RegisterForm from '../../components/RegisterForm';
import { useStore } from '../../context/StoreContext';

const ArtistPartnershipPage: React.FC = () => {
  const { currency: curr, toggleCurrency, applyForArtist, user, isSupabaseConfigured, resendVerificationEmail, isDemoMode } = useStore();
  const navigate = useNavigate();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerNotice, setRegisterNotice] = useState<string | null>(null);
  const registerModalRef = React.useRef<boolean>(false);

  useEffect(() => {
    registerModalRef.current = showRegisterModal;
    if (showRegisterModal) setRegisterNotice(null);
  }, [showRegisterModal]);
  // currency selection is managed globally in store; derive local flag
  const isDollar = curr === 'USD';
  const [shopName, setShopName] = useState('');
  const [productImagesFiles, setProductImagesFiles] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineTermsOpen, setInlineTermsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Terms are displayed in a modal popup; remove inline terms expansion
  const [uploadWarning, setUploadWarning] = useState('');


  // no longer updating user profile during member-only applications

  const openApplicationForm = (plan?: string) => {
    // Prefill shop name from existing profile and record chosen plan
    setShopName((user as any)?.artistTradeName || '');
    setSelectedPlan(plan || null);
    setShowApplicationForm(true);
  };

  const isGuestOrGhost = !user || user.id === 'guest';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Step 1: Get the User
      const { data: { user: authUser } } = await supabase.auth.getUser();
      // Step 2: Check Auth - if no user, alert and stop
      if (!authUser) {
        // If user is logged in locally but email not confirmed, prompt to verify first
        if (user && user.id && user.id !== 'guest' && user.email) {
          console.warn('No Supabase auth session but user is logged in locally. Email not confirmed.');
          const doResend = window.confirm(
            `Please verify your email (${user.email}) before applying.\n\n` +
            `Check your inbox for the verification link, or click OK to resend the verification email.`
          );
          if (doResend) {
            const success = await resendVerificationEmail(user.email);
            if (success) {
              alert('Verification email sent! Please check your inbox and click the link to verify, then try applying again.');
            } else {
              alert('Failed to resend verification email. Please contact support.');
            }
          }
          setIsSubmitting(false);
          return;
        }
        // Demo mode fallback: allow local-only application
        if (isDemoMode || !isSupabaseConfigured) {
          if (!termsAgreed) {
            alert('You must agree to the Terms and Conditions to apply.');
            setIsSubmitting(false);
            return;
          }
          // Save to localStorage for demo
          const demoApp = {
            id: `demo-${Date.now()}`,
            user_id: user?.id || 'demo-user',
            shop_name: shopName || `${user?.name || 'Demo Artist'}`,
            product_images: productImagesFiles.map(f => URL.createObjectURL(f)),
            status: 'pending',
            created_at: new Date().toISOString()
          };
          const existing = JSON.parse(localStorage.getItem('spv_artist_applications') || '[]');
          existing.push(demoApp);
          localStorage.setItem('spv_artist_applications', JSON.stringify(existing));
          alert('DEMO MODE: Application saved locally (not sent to server).');
          setShowSuccess(true);
          setShowApplicationForm(false);
          setShopName('');
          setProductImagesFiles([]);
          productImagePreviews.forEach(url => URL.revokeObjectURL(url));
          setProductImagePreviews([]);
          setTermsAgreed(false);
          setIsSubmitting(false);
          return;
        }
        alert('Please login first');
        setIsSubmitting(false);
        return;
      }

      if (!termsAgreed) {
        alert('You must agree to the Terms and Conditions to apply.');
        setIsSubmitting(false);
        return;
      }

      // Step 3: The Upload (atomic, direct to storage)
      const uploadedUrls: string[] = [];
      const selectedFiles = productImagesFiles.slice(0, 5);
      for (const file of selectedFiles) {
        const { data, error } = await supabase.storage
          .from('artist-applications')
          .upload(`${authUser.id}/${Date.now()}_${file.name}`, file);
        if (data) uploadedUrls.push(data.path);
        if (error) {
          console.error('Upload error:', error);
          alert('Upload failed: ' + error.message);
          setIsSubmitting(false);
          return;
        }
      }

      // Step 4: Use centralized applyForArtist (handles sanitization, duplicate checks, admin notification)
      try {
        await applyForArtist({ shop_name: shopName || `${user?.name || 'Artist'}`, product_images: uploadedUrls, terms_agreed: true, plan: selectedPlan });
        alert('SUCCESS! Application sent.');
        setShowSuccess(true);
        setShowApplicationForm(false);
        // reset local form
        setShopName('');
        setProductImagesFiles([]);
        productImagePreviews.forEach(url => URL.revokeObjectURL(url));
        setProductImagePreviews([]);
        setTermsAgreed(false);
      } catch (err: any) {
        console.error('DATABASE ERROR (applyForArtist):', err);
        alert('Failed to submit application: ' + (err?.message || err?.error || String(err)));
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Info modal state for timeline items
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [vaultInfoOpen, setVaultInfoOpen] = useState(false);

  useEffect(() => {
    // reset expanded view whenever a different info panel is opened/closed
    setInfoExpanded(false);
    setVaultInfoOpen(false);
  }, [infoOpen]);

  // Simplified info content helper to avoid complex nested JSX during fix-up
  const infoContent = (key: string): { title: string; body: React.ReactNode } => {
    return { title: '', body: null };
  };

  const pricingTiers = [
    {
      name: 'Tester',
      slots: 5,
      priceZAR: 19,
      priceUSD: 1.50,
      features: ['5 Product Slots', 'Basic Support'],
      locked: false,
      lockReason: '',
    },
    {
      name: 'Hobbyist',
      slots: 20,
      priceZAR: 49,
      priceUSD: 4.00,
      features: ['20 Product Slots', 'Email Support'],
      locked: false,
      lockReason: '',
    },
    {
      name: 'Creator',
      slots: 50,
      priceZAR: 99,
      priceUSD: 8.00,
      features: ['50 Product Slots', 'Priority Support', 'Access to Analytics'],
      locked: false,
      lockReason: '',
      mostPopular: true,
    },
    {
      name: 'Boutique',
      slots: 100,
      priceZAR: 189,
      priceUSD: 15.00,
      features: ['100 Product Slots', 'Dedicated Support', 'Advanced Analytics'],
      locked: true,
      lockReason: 'Requires 100+ sales to unlock',
    },
    {
      name: 'Gallery',
      slots: 250,
      priceZAR: 399,
      priceUSD: 32.00,
      features: ['250 Product Slots', '24/7 Support', 'Full Analytics Suite'],
      locked: true,
      lockReason: 'Invitation Only',
    },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black text-white min-h-screen p-4 sm:p-8 font-sans overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <header className="mb-8 text-center">
          <div>
            <h1 className="font-cherry text-3xl sm:text-4xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.45)]">Your Art. Global Stage. 1% Fees.</h1>
            <p className="font-architects text-lg sm:text-xl md:text-xl text-gray-300 max-w-2xl mt-2 mx-auto">Join a curated marketplace trusted by 176 small artists — over <strong>50,000</strong> app downloads, <strong>6,000+</strong> members, and <strong>7,000+</strong> regular buyers. Limited spots available.</p>
          </div>

          <div className="mt-6">
            <h2 className="text-2xl sm:text-3xl md:text-3xl font-bold text-amber-400 font-cherry">Premium Artist Program</h2>
            <p className="text-sm sm:text-lg text-zinc-300 mt-2">Curated, vetted, and shipped with care.</p>

            {/* Currency Toggle moved under the program title and centered */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="text-xs text-zinc-400">Currency</div>
              <div
                role="button"
                aria-label="Toggle currency"
                onClick={() => toggleCurrency()}
                className={`relative inline-flex items-center h-8 w-36 rounded-full p-1 cursor-pointer transition-colors ${isDollar ? 'bg-amber-600/20' : 'bg-zinc-800'}`}
              >
                <div className={`absolute left-1 top-1 bottom-1 w-16 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold ${!isDollar ? 'translate-x-0' : 'translate-x-16'} transition-transform`}>R</div>
                <div className={`absolute left-1 top-1 bottom-1 w-16 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold ${isDollar ? 'translate-x-16' : 'translate-x-0'} transition-transform`}>$</div>
                <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-zinc-400">
                  <span className={`mr-2 ${!isDollar ? 'text-amber-400 font-semibold' : ''}`}>ZAR (R)</span>
                  <span className={`${isDollar ? 'text-amber-400 font-semibold' : ''}`}>USD ($)</span>
                </div>
              </div>
            </div>

            {/* Primary CTA is big text (non-link), split lines and with a shocking pink shadow */}
            <div className="mt-6">
              <div className="inline-block text-center">
                <div className="font-cherry text-2xl sm:text-3xl md:text-3xl text-white" style={{ textShadow: '0 12px 40px rgba(236,72,153,0.95)' }}>START YOUR SHOP</div>
                <div className="text-xs text-zinc-300 mt-1">As little as</div>
                <div className="text-2xl sm:text-3xl md:text-3xl font-cherry text-white mt-1">{isDollar ? '$1.50' : 'R19'}</div>
                <div className="text-sm text-zinc-400">/ Month</div>
              </div>
            </div>
          </div>
        </header>

        {/* Trust Timeline Section */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-purple-400 text-center mb-6">The Trust Timeline</h3>
          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-6">
            {[
              { key: 'sold', icon: '🛒', title: 'Sold', body: 'Funds held securely in escrow.' },
              { key: 'hub', icon: '🏭', title: 'Hub Check', body: 'Piece inspected at our Worcester hub.' },
              { key: 'delivered', icon: '📦', title: 'Delivered', body: 'Collector receives your art.' },
              { key: 'day30', icon: '💰', title: 'Day 30', body: 'Funds released to your wallet.' },
            ].map(({ key, icon, title, body }) => (
              <div key={key} className="flex-1 bg-zinc-900 border-4 border-green-500 rounded-2xl p-4 text-center relative" style={{ boxShadow: '0 16px 48px rgba(16,185,129,0.14)' }}>
                <div className="text-3xl mb-2">{icon}</div>
                <div className="flex items-center justify-center gap-2">
                  <h4 className="font-bold text-white">{title}</h4>
                  <button aria-label={`More info about ${title}`} onClick={() => setInfoOpen(key)} className="p-1 rounded-full bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-zinc-400 mt-1">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-amber-400 text-center mb-6">Choose Your Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {pricingTiers.map((tier) => {
              const price = isDollar ? `$${tier.priceUSD}` : `R${tier.priceZAR}`;
              const styles: Record<string, any> = {
                Tester: { border: 'border-4 border-cyan-500', title: 'text-cyan-400', btn: 'bg-cyan-600 hover:bg-cyan-500', shadow: '0 0 25px 5px rgba(34,211,238,0.14)' },
                Hobbyist: { border: 'border-4 border-purple-800', title: 'text-purple-500', btn: 'bg-purple-600 hover:bg-purple-500', shadow: '0 0 25px 5px rgba(124,58,237,0.14)' },
                Creator: { border: 'border-4 border-amber-600', title: 'text-amber-400', btn: 'bg-amber-600 hover:bg-amber-500', shadow: '0 0 25px 5px rgba(250,204,21,0.14)' },
                Boutique: { border: 'border-4 border-pink-500', title: 'text-pink-400', btn: 'bg-pink-600 hover:bg-pink-500', shadow: '0 0 25px 5px rgba(219,39,119,0.12)' },
                Gallery: { border: 'border-4 border-green-500', title: 'text-green-400', btn: 'bg-green-600 hover:bg-green-500', shadow: '0 0 25px 5px rgba(34,197,94,0.12)' },
              };
              const s = styles[tier.name] || { border: 'border border-zinc-800', title: 'text-amber-400', btn: 'bg-amber-600 hover:bg-amber-500', shadow: 'none' };

              const capacityMap: Record<string, { capacity: number; taken: number }> = {
                Tester: { capacity: 50, taken: 45 },
                Hobbyist: { capacity: 50, taken: 46 },
                Creator: { capacity: 50, taken: 46 },
                Boutique: { capacity: 30, taken: 21 },
                Gallery: { capacity: 20, taken: 18 },
              };

              const prog = capacityMap[tier.name] || { capacity: 50, taken: 0 };
              const percentage = Math.round((prog.taken / prog.capacity) * 100);
              const isLocked = tier.locked || false;

              return (
                <div
                  key={tier.name}
                  className={`bg-zinc-900/40 rounded-2xl p-5 text-center flex flex-col justify-between ${s.border} ${selectedPlan === tier.name ? 'border-4 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.18)]' : ''} ${isLocked ? 'opacity-60' : ''}`}
                  style={{ boxShadow: s.shadow }}
                >
                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <h4 className={`text-2xl font-bold ${s.title}`}>{tier.name}</h4>
                      {tier.mostPopular && (
                        <span className="text-xs bg-amber-600 text-black px-2 py-1 rounded-full font-bold">MOST POPULAR</span>
                      )}
                    </div>

                    <p className="text-3xl font-bold my-4 text-white">{price}<span className="text-sm text-zinc-400 ml-1">/month</span></p>
                    <p className="text-zinc-400 mb-4">{tier.slots} Slots</p>
                    <ul className="text-sm text-zinc-400 mb-4 space-y-1">
                      {tier.features.map(f => (<li key={f}>• {f}</li>))}
                    </ul>
                  </div>

                  <div>
                    {isLocked ? (
                      <div>
                        <div className="w-full bg-zinc-800 text-zinc-400 font-bold py-2 px-4 rounded-md mb-2 border border-zinc-700 flex items-center justify-center gap-2">
                          <span>🔒</span>
                          <span>LOCKED</span>
                        </div>
                        <div className="text-xs text-amber-400 font-semibold">{tier.lockReason}</div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openApplicationForm(tier.name)}
                          className={`w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:from-pink-400 hover:via-purple-400 hover:to-cyan-300 text-black font-bold py-2 px-4 rounded-md transition-all shadow-lg hover:shadow-[0_0_10px_rgba(236,72,153,0.5)] ${selectedPlan === tier.name ? 'ring-4 ring-pink-400/30' : ''}`}
                        >
                          Apply Now
                        </button>
                        {/* Progress bar (only show for unlocked tiers) */}
                        <div className="mt-4 text-sm text-zinc-400">{prog.taken} / {prog.capacity} spots taken</div>
                        <div className="w-full bg-gray-800 rounded-full h-2 mt-2 overflow-hidden">
                          <div className="h-2 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]" style={{ width: `${percentage}%` }} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section>
          <h3 className="text-xl font-semibold text-amber-400 text-center mb-6">How It Works</h3>
          <div className="max-w-3xl mx-auto text-lg text-zinc-300 space-y-4">
            <ol className="list-decimal list-inside space-y-3">
              <li><strong>Apply:</strong> Submit your application to join our curated artist program.</li>
              <li><strong>Approved / Upload:</strong> Once approved, upload your product images and details.</li>
              <li><strong>Ship to Hub:</strong> Ship sold items to our Worcester hub for inspection.</li>
              <li><strong>Quality Check:</strong> We inspect and package items for the collector.</li>
              <li><strong>Escrow Release:</strong> Funds held in escrow are released on day 30 to your wallet.</li>
            </ol>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mt-10">
          <h3 className="text-xl font-semibold text-amber-400 text-center mb-2">What Artists Say</h3>
          <p className="text-center text-zinc-400 mb-4">Real feedback from our first few months of operation.</p>

          <div className="overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none gap-4 flex md:grid md:grid-cols-3 lg:grid-cols-5">
            {[
              { author: 'Sarah J. (Small Batch Smith)', text: "I honestly didn't believe the 1% fee was real at first. I'm a small-time artist, but since joining 3 months ago, my customer base has tripled." },
              { author: 'David K.', text: "The escrow system is a lifesaver. I used to worry about scams, but the Worcester hub check makes the buyer feel safe, which makes them buy more." },
              { author: 'Elena M.', text: "Finally, a platform that doesn't eat 20% of my profits. The $4 hobbyist plan is cheaper than a cup of coffee. It's only been live a few months but the traffic is great." },
              { author: 'Jabu N.', text: "I was skeptical about shipping to a hub first, but it actually saves me headache dealing with international customs. They handle the hard part." },
              { author: 'Chloe R.', text: "I switched from Etsy. The global reach here for such a low monthly fee is unbeatable. I love that it's curated so I'm not competing with mass-produced junk." },
            ].map((r, idx) => (
              <div key={idx} className="snap-start min-w-[260px] md:min-w-0 bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 m-2 md:m-0">
                <p className="text-sm text-zinc-300">"{r.text}"</p>
                <p className="mt-3 text-xs text-zinc-400 font-semibold">— {r.author}</p>
              </div>
            ))}
          </div>
        </section>
        {/* Application Form Modal / Inline Form */}
        {showApplicationForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowApplicationForm(false)} />
            <form onSubmit={handleSubmit} className="relative bg-zinc-900 border-4 border-purple-800 rounded-2xl p-6 w-full max-w-md z-10 mx-auto">
              {/* Drag handle for mobile bottom-sheet (now centered) */}
              <div className="w-full flex items-center justify-center md:hidden mb-2">
                <div className="w-14 h-1.5 bg-zinc-800 rounded-full" />
              </div>
              <button type="button" onClick={() => setShowApplicationForm(false)} aria-label="Close application form" className="absolute top-3 right-3 p-2 rounded bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
              <div className="mb-3 text-center">
                <h4 className="text-lg font-bold text-white">Artist Application</h4>
              </div>

              {/* Guest / Ghost notice */}
              {isGuestOrGhost ? (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded text-center">
                    <p className="text-sm text-zinc-300">Application for Artist Shop needs an account. Please create one to continue.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => navigate('/login')} className="flex-1 bg-zinc-800 text-white py-2 rounded">Login</button>
                    <button
                      type="button"
                      onClick={() => {
                        // Close the application form first so the register modal can appear in front
                        setShowApplicationForm(false);
                        setRegisterNotice('Opening registration…');
                        // Small delay to let the modal close animation finish, then open register modal
                        setTimeout(() => {
                          setSelectedPlan(null);
                          setShowRegisterModal(true);

                          // After another short delay, if the modal did not open, show a clickable fallback notice.
                          setTimeout(() => {
                            if (!registerModalRef.current) {
                              setRegisterNotice('Could not open inline register. Click below to open the full registration page.');
                            } else {
                              setRegisterNotice(null);
                            }
                          }, 250);
                        }, 80);
                      }}
                      className="flex-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:from-pink-400 hover:via-purple-400 hover:to-cyan-300 text-black font-bold py-2 px-4 rounded-md transition-all shadow-lg hover:shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-3 p-3 bg-zinc-900 border-2 border-cyan-500 rounded-xl text-sm text-zinc-300">
                    <div className="font-semibold text-white">Welcome back, {(user.name || '').split(' ')[0] || 'Artist'}!</div>
                    <div className="mt-2 text-sm">Your email: <strong className="text-amber-300">{user.email}</strong></div>
                  </div>

                  <label className="block text-sm font-medium text-gray-300 mb-1">Shop Name</label>
                  <input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Shop Name"
                    className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-yellow-500"
                  />

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Upload images (max 5)</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      const arr = Array.from(files).slice(0, 5);
                      setProductImagesFiles(arr);
                      // revoke old previews
                      productImagePreviews.forEach(url => { try { URL.revokeObjectURL(url); } catch (_) {} });
                      setProductImagePreviews(arr.map(f => URL.createObjectURL(f)));
                    }} className="w-full mt-1" />
                    <div className="mt-2 text-xs text-zinc-400">{productImagePreviews.length === 0 ? 'No file chosen' : `${productImagePreviews.length} / 5 images selected`}</div>
                    {productImagePreviews.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {productImagePreviews.map((src, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded overflow-hidden border border-zinc-800">
                            <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => {
                              try { URL.revokeObjectURL(src); } catch (_) {}
                              setProductImagesFiles(prev => prev.filter((_, i) => i !== idx));
                              setProductImagePreviews(prev => prev.filter((_, i) => i !== idx));
                            }} className="absolute top-1 right-1 p-1 rounded bg-black/60 text-zinc-200">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-zinc-300">
                        <input
                          type="checkbox"
                          checked={termsAgreed || inlineTermsOpen}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // show the inline terms block for the user to read and explicitly Agree
                              setInlineTermsOpen(true);
                            } else {
                              // user unchecked - hide inline block and clear confirmation
                              setTermsAgreed(false);
                              setInlineTermsOpen(false);
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span>I agree to the <strong className="text-amber-300">Artist Terms & Conditions</strong></span>
                      </label>
                    </div>

                    {/* Inline Terms block: appears when checkbox is toggled on, requires explicit Agree to finalize */}
                    {inlineTermsOpen && (
                      <div className="mt-3 bg-zinc-900 border border-pink-500 p-4 rounded-xl shadow-lg text-sm text-zinc-300">
                        <div className="mb-3 text-center">
                          <h4 className="font-cherry text-lg text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400">Artist Terms & Conditions</h4>
                        </div>
                        <div className="max-h-40 overflow-y-auto pr-2 space-y-3">
                          <p className="text-zinc-300">Please read these terms carefully. You must agree to proceed with your application.</p>
                          <section>
                            <h5 className="font-semibold text-white">1. Enrollment & Eligibility</h5>
                            <p className="mt-1 text-zinc-300">By applying you confirm that you own the rights to the items listed and that all information provided is accurate. We reserve the right to accept or reject applications.</p>
                          </section>
                          <section>
                            <h5 className="font-semibold text-white">2. Hub Inventory & Storage</h5>
                            <p className="mt-1 text-zinc-300">Each product must have at least one physical stock item recorded in our Worcester hub <strong className="text-amber-300">before the product goes live</strong>. Storage is free for one physical stock item. Additional identical items are subject to a once-off fee.</p>
                          </section>
                          <section>
                            <h5 className="font-semibold text-white">3. Inspection, Delivery & Escrow</h5>
                            <p className="mt-1 text-zinc-300">All sold items are inspected at our Worcester hub. Funds are held in escrow until delivery is confirmed and the buyer's inspection period passes.</p>
                          </section>
                        </div>
                        <div className="mt-3 flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => { setTermsAgreed(true); setInlineTermsOpen(false); }}
                            className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 text-black font-bold py-2 px-4 rounded-md transition-all shadow-lg hover:shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                          >
                            Agree & Close
                          </button>
                          <button type="button" onClick={() => { setInlineTermsOpen(false); setTermsAgreed(false); }} className="bg-zinc-800 text-zinc-300 py-2 px-4 rounded">Close</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !termsAgreed || productImagesFiles.length === 0 || !shopName.trim()}
                      className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:from-pink-400 hover:via-purple-400 hover:to-cyan-300 disabled:bg-gray-600 text-black font-bold py-2 px-4 rounded-md transition-all shadow-lg hover:shadow-[0_0_10px_rgba(236,72,153,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Applying…' : 'Apply'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowApplicationForm(false); setShopName(''); setProductImagesFiles([]); productImagePreviews.forEach(url => URL.revokeObjectURL(url)); setProductImagePreviews([]); setTermsAgreed(false); }}
                      className="w-full sm:w-auto bg-zinc-800 text-zinc-300 py-2 px-4 rounded"
                    >
                      Cancel
                    </button>
                  </div>

                  {showSuccess && (
                    <div className="mt-3 p-3 bg-green-900/20 border border-green-500 rounded text-green-300">Thank you! Your shop is being reviewed.</div>
                  )}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Terms are shown inline when the user toggles the checkbox (see above) */}

        {/* Register Modal (for guest users who want to create account while applying) */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowRegisterModal(false)} />
            <div className="relative w-full max-w-md bg-zinc-900 border border-gray-800 rounded-2xl p-6 z-20 shadow-2xl">
              <button onClick={() => setShowRegisterModal(false)} aria-label="Close register" className="absolute top-3 right-3 p-2 rounded bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
              <div className="text-center mb-4">
                <h3 className="font-cherry text-2xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400">Create Account</h3>
                <p className="text-sm text-zinc-400">Create an account to finish your Artist application.</p>
              </div>
              {registerNotice && (
                <div role="status" aria-live="polite" className="mb-3 text-sm text-center text-amber-300">
                  <div className="mb-2">{registerNotice}</div>
                  <div>
                    <button onClick={() => navigate('/register?source=artist')} className="bg-pink-600 text-white px-3 py-1 rounded">Open full register page</button>
                  </div>
                </div>
              )}
              {/* RegisterForm expects onSuccess callback */}
              <div>
                <RegisterForm onSuccess={() => {
                  setShowRegisterModal(false);
                  // After successful registration, open application form and prefill shop name (wait briefly for store update)
                  setShowApplicationForm(true);
                  setTimeout(() => {
                    setShopName((user as any)?.artistTradeName || '');
                  }, 50);
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Timeline Info Modal / Bottom Sheet */}
        {infoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setInfoOpen(null)} />
            <div role="dialog" aria-modal="true" aria-label="Timeline info" onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 z-10 ring-amber-600/30 shadow-[0_20px_60px_rgba(250,204,21,0.16)] text-center">
              <button aria-label="Close" onClick={() => setInfoOpen(null)} className="absolute top-3 right-3 p-2 rounded-md bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300">
                <X className="w-4 h-4" />
              </button>
              <div>
                <h4 className="text-lg font-bold text-white">{infoContent(infoOpen).title}</h4>
                <div className="text-sm text-zinc-400 mt-3 space-y-3">{infoContent(infoOpen).body}</div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-zinc-500" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div>© {new Date().getFullYear()} Spoil Me Vintage — Artists: 1% fee, curated marketplace.</div>
        </footer>
      </div>
    </div>
  );
};

export default ArtistPartnershipPage;

