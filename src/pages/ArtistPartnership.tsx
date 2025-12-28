import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HelpCircle, X } from 'lucide-react';
import { uploadFile, supabase } from '../../utils/supabaseClient';
import { useStore } from '../../context/StoreContext';

const ArtistPartnershipPage: React.FC = () => {
  const { currency: curr, applyForArtist, user, isDemoMode, isSupabaseConfigured, register } = useStore();
  const navigate = useNavigate();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isDollar, setIsDollar] = useState(false);
  const [applicationData, setApplicationData] = useState({
    name: '',
    surname: '',
    artistTradeName: '',
    contactNumber: '',
    email: '',
    productImages: [] as string[],
    plan: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inlineTermsOpen, setInlineTermsOpen] = useState(false);
  const [uploadWarning, setUploadWarning] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;
    setApplicationData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      // append to existing, but limit to 5 total
      const combined = [...selectedFiles, ...newFiles];
      if (combined.length > 5) {
        setUploadWarning('Maximum 5 images allowed; extras were ignored');
      } else {
        setUploadWarning('');
      }
      const trimmed = combined.slice(0, 5);
      setSelectedFiles(trimmed);
      // revoke old previews to avoid leaks when replacing
      previews.forEach(url => URL.revokeObjectURL(url));
      setPreviews(trimmed.map(file => URL.createObjectURL(file)));
    }
  };

  const { updateUser } = useStore();

  const openApplicationForm = (plan?: string) => {
    const base = {
      name: user && user.id && user.name ? user.name.split(' ')[0] || '' : applicationData.name,
      surname: user && user.id && user.name ? (user.name.split(' ').slice(1).join(' ') || '') : applicationData.surname,
      artistTradeName: (user as any)?.artistTradeName || applicationData.artistTradeName,
      contactNumber: (user as any)?.contactNumber || applicationData.contactNumber,
      email: user?.email || applicationData.email,
      birthday: (user as any)?.birthday || (applicationData as any).birthday || '',
      gender: (user as any)?.gender || (applicationData as any).gender || '',
      country: (user as any)?.country || (applicationData as any).country || '',
      favoriteColor: (user as any)?.favoriteColor || (applicationData as any).favoriteColor || '',
    } as any;
    setApplicationData(prev => ({ ...prev, ...base, plan: plan || prev.plan }));
    setShowApplicationForm(true);
  };

  const requiredProfileFields = ['name', 'surname', 'contactNumber', 'email'];

  const missingFields = requiredProfileFields.filter(f => !((applicationData as any)[f] || '').toString().trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // If user is logged in, update their profile with any provided fields before submitting
      if (user && user.id && user.id !== 'guest') {
        const profileUpdates: any = {};
        ['name', 'surname', 'birthday', 'gender', 'country', 'favoriteColor', 'contactNumber', 'artistTradeName', 'email'].forEach(k => {
          const v = (applicationData as any)[k];
          if (v) profileUpdates[k] = v;
        });
        if (Object.keys(profileUpdates).length > 0) {
          try { await updateUser(profileUpdates); } catch (err) { console.warn('Failed to update user profile before application', err); }
        }
      }
      // If user is not logged in
      if (!user || user.id === 'guest') {
        if (!isDemoMode) {
          // In normal mode, require password & create account
          if (!password) throw new Error('Please choose a password to create your account.');
          if (password.length < 6) throw new Error('Password must be at least 6 characters.');
          if (password !== confirmPassword) throw new Error('Passwords do not match.');

          // Attempt registration (include additional profile fields)
          const registered = await register({
            name: applicationData.name,
            surname: applicationData.surname,
            email: applicationData.email,
            password,
            artistTradeName: applicationData.artistTradeName,
            birthday: (applicationData as any).birthday || null,
            gender: (applicationData as any).gender || null,
            country: (applicationData as any).country || null,
            favoriteColor: (applicationData as any).favoriteColor || null
          } as any);
          if (!registered) throw new Error('Failed to create account.');
        } else {
          // Demo mode: if the user provided a password, attempt to register in Supabase as well (best-effort)
          if (password) {
            if (password.length < 6) throw new Error('Password must be at least 6 characters.');
            if (password !== confirmPassword) throw new Error('Passwords do not match.');
            try {
              const registered = await register({
                name: applicationData.name,
                surname: applicationData.surname,
                email: applicationData.email,
                password,
                artistTradeName: applicationData.artistTradeName,
                birthday: (applicationData as any).birthday || null,
                gender: (applicationData as any).gender || null,
                country: (applicationData as any).country || null,
                favoriteColor: (applicationData as any).favoriteColor || null
              } as any);
              if (!registered) console.warn('Registration during demo apply did not complete successfully. Proceeding with demo fallback.');
            } catch (err) {
              console.warn('Registration during demo apply failed (continuing demo):', err);
            }
          }
        }
      }
      // Upload selected files to Supabase storage and collect public URLs
      let uploadedUrls: string[] = [];
      try {
        if (!isDemoMode && isSupabaseConfigured && selectedFiles && selectedFiles.length > 0) {
          // Ensure the upload path uses the exact auth UID (no 'user_' prefix). If current user.id looks like a demo id,
          // attempt to fetch the authenticated user id from Supabase session.
          let effectiveUserId = user && user.id ? String(user.id) : 'anon';
          // Simple heuristic: UUIDs contain dashes and hex; demo ids start with 'user_'. Try to get a real supabase user id when possible.
          const looksLikeDemoId = /^user_/.test(effectiveUserId);
          if (looksLikeDemoId && typeof supabase !== 'undefined' && supabase) {
            try {
              const sessionRes = await supabase.auth.getUser();
              const realId = (sessionRes as any)?.data?.user?.id;
              if (realId) effectiveUserId = realId;
            } catch (e) {
              console.warn('Could not resolve real auth user id; falling back to existing id for upload path', e);
            }
          }

          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const safeName = encodeURIComponent(file.name.replace(/\s+/g, '_'));
            // RLS policies expect objects under <uid>/<filename>
            const path = `${effectiveUserId}/${safeName}`;
            const url = await uploadFile('artist-applications', path, file);
            if (url) uploadedUrls.push(url);
          }
        } else {
          // Demo mode or storage not available: fallback to using local previews
          uploadedUrls = previews.slice();
        }
      } catch (err) {
        console.error('uploadFile failed:', err);
        // Fallback: use previews (object URLs) so application can still be submitted in offline/demo
        uploadedUrls = previews.slice();
      }

      await applyForArtist({ ...applicationData, productImages: uploadedUrls, plan: applicationData.plan, termsAgreed });
      alert('Application submitted successfully! We will review it and contact you soon.');
      setShowApplicationForm(false);
      setApplicationData({
        name: '',
        surname: '',
        artistTradeName: '',
        contactNumber: '',
        email: '',
        productImages: [],
        plan: ''
      });
      setSelectedFiles([]);
      setPreviews([]);
      setTermsAgreed(false);
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

  const infoContent = (key: string): { title: string; body: React.ReactNode } => {
    switch (key) {
      case 'sold':
        return {
          title: 'Sold — Funds in Escrow',
          body: (
            <>
              <p>
                When an item sells, the customer's payment is held securely in escrow by our payment processor. Funds are reserved and protected until delivery and inspection are complete.
              </p>
              <p>
                Escrow protects both buyers and artists by allowing disputes or returns to be handled before the payout is released. This encourages confident purchasing and fewer chargebacks.
              </p>
            </>
          ),
        };
      case 'hub':
        return {
          title: 'Hub Check — Worcester Inspection',
          body: (
            <>
              <p>
                Each sold item must have at least <strong className="text-amber-300">one physical item</strong> of the product stored at the Worcester hub and recorded in our hub inventory <em>before the product goes live to be sold</em>. This inventory record ensures we can fulfill the sale, schedule inspections, and prevent delays or penalties.
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setInfoExpanded(e => !e)}
                  aria-expanded={infoExpanded}
                  className="text-amber-300 underline text-sm"
                >
                  Read more on how this works?
                </button>
                </div>
                {infoExpanded && (
                  <div className="mt-3 text-sm text-zinc-300 space-y-2">
                    <p>
                      Storage is free for <strong>one physical stock item</strong> when the product is listed. If you want to store additional identical items, we charge a once-off fee per extra item. We do not keep more than <strong>20</strong> of the same item in our hub.
                    </p>
                    <p>
                      Pricing: {isDollar ? <><strong>$0.50</strong> per additional item (USD)</> : <><strong>R2</strong> per additional item (ZAR)</>} — charged once when inventory is added.
                    </p>
                    <p>
                      This policy helps ensure timely delivery, maintain accurate inventory, and avoid penalties related to missing or unverified stock.
                    </p>
                  </div>
                )}
              <p className="mt-3">
                If an item fails inspection, we will contact the artist with options (return, rework, or <button
                  type="button"
                  onClick={() => setVaultInfoOpen(v => !v)}
                  aria-expanded={vaultInfoOpen}
                  className="text-amber-300 underline font-semibold"
                >sell in Vault</button>). This process helps ensure customer satisfaction and timely delivery while protecting artists from avoidable penalties.
              </p>

              {vaultInfoOpen && (
                <div className="mt-2 p-3 bg-amber-900/10 border border-amber-700/30 rounded-md text-sm text-amber-200">
                  <strong className="text-amber-300">Sell in Vault:</strong>
                  <div className="mt-2 text-amber-100">
                    <div className="font-semibold">How The Vault Works:</div>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-amber-100">
                      <li><strong>Exclusive Access:</strong> Only Deluxe Members can purchase.</li>
                      <li><strong>Loyalty Limits:</strong> Month 1 members can buy 5 items. Limits increase every month.</li>
                      <li><strong>First Come, First Serve:</strong> Stock is limited. Once it's gone, it's gone.</li>
                      <li><strong>As-Is:</strong> Items may be samples or have minor imperfections.</li>
                    </ul>
                    <p className="mt-2 text-amber-200">These items sell at low prices; expected artist profit is typically 5% or less.</p>
                  </div>
                </div>
              )}
            </>
          ),
        };
      case 'delivered':
        return {
          title: 'Delivered — Collector Receives the Item',
          body: (
            <>
              <p>
                Once the hub ships the item to the collector and delivery is confirmed, the collector has a short window to report issues. Delivery confirmation marks the transfer of physical possession and starts the countdown to escrow release.
              </p>
              <p>
                Smooth deliveries speed up payouts and build trust on the platform — and help avoid penalties associated with late or failed deliveries.
              </p>
            </>
          ),
        };
      case 'day30':
        return {
          title: 'Day 30 — Funds Released',
          body: (
            <>
              <p>
                Provided no disputes or returns are logged within the 30-day protection window after delivery, the escrowed funds are released to your artist wallet on Day 30.
              </p>
              <p>
                This delay gives buyers time to report any issues while ensuring artists are paid fairly for legitimate sales. Our commission of 1% is deducted before the payout.
              </p>
            </>
          ),
        };
      default:
        return { title: '', body: '' };
    }
  };
  // Dummy data for pricing cards - replace with dynamic data from your backend/context
  const pricingTiers = [
    {
      name: 'Tester',
      slots: 5,
      priceZAR: 19,
      priceUSD: 1.50,
      features: ['5 Product Slots', 'Basic Support'],
    },
    {
      name: 'Hobbyist',
      slots: 20,
      priceZAR: 49,
      priceUSD: 4.00,
      features: ['20 Product Slots', 'Email Support'],
    },
    {
      name: 'Creator',
      slots: 50,
      priceZAR: 99,
      priceUSD: 8.00,
      features: ['50 Product Slots', 'Priority Support', 'Access to Analytics'],
    },
    {
      name: 'Boutique',
      slots: 100,
      priceZAR: 189,
      priceUSD: 15.00,
      features: ['100 Product Slots', 'Dedicated Support', 'Advanced Analytics'],
    },
    {
      name: 'Gallery',
      slots: 250,
      priceZAR: 399,
      priceUSD: 32.00,
      features: ['250 Product Slots', '24/7 Support', 'Full Analytics Suite'],
    },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black text-white min-h-screen p-4 sm:p-8 font-sans overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold text-white font-cherry">Your Art. Global Stage. 1% Fees.</h1>
              <p className="text-sm sm:text-lg mt-2 text-zinc-300">Join a curated marketplace for elite jewelry artists and reach over 7,000 collectors worldwide.</p>
            </div>

            {/* Currency Toggle */}
            <div className="flex items-center gap-3">
              <div className="text-xs text-zinc-400">Currency</div>
              <div
                role="button"
                aria-label="Toggle currency"
                onClick={() => setIsDollar(d => !d)}
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
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-4xl font-bold text-amber-400 font-cherry">Premium Artist Program</h2>
              <p className="text-sm text-zinc-300 mt-2">Curated, vetted, and shipped with care.</p>
            </div>

            <div>
              <Link to={`/register?source=artist`} className="inline-block mt-2 sm:mt-0 bg-amber-600 hover:bg-amber-500 text-black font-semibold py-3 px-5 rounded-full shadow-lg">
                START YOUR SHOP - {isDollar ? '$1.50' : 'R19'} / Month
              </Link>
            </div>
          </div>
        </header>

        {/* Trust Timeline Section */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-amber-400 text-center mb-6">The Trust Timeline</h3>
          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-6">
            <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 text-center relative ring-amber-600/30 shadow-[0_16px_48px_rgba(250,204,21,0.14)]">
              <div className="text-3xl mb-2">🛒</div>
              <div className="flex items-center justify-center gap-2">
                <h4 className="font-bold">Sold</h4>
                <button aria-label="More info about Sold" onClick={() => setInfoOpen('sold')} className="p-1 rounded-full bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-zinc-400 mt-1">Funds held securely in escrow.</p>
            </div>
            <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-center ring-amber-600/30 shadow-[0_16px_48px_rgba(250,204,21,0.14)]">
              <div className="text-3xl mb-2">🏭</div>
              <div className="flex items-center justify-center gap-2">
                <h4 className="font-bold">Hub Check</h4>
                <button aria-label="More info about Hub Check" onClick={() => setInfoOpen('hub')} className="p-1 rounded-full bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-zinc-400 mt-1">Piece inspected at our Worcester hub.</p>
            </div>
            <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-center ring-amber-600/30 shadow-[0_16px_48px_rgba(250,204,21,0.14)]">
              <div className="text-3xl mb-2">📦</div>
              <div className="flex items-center justify-center gap-2">
                <h4 className="font-bold">Delivered</h4>
                <button aria-label="More info about Delivered" onClick={() => setInfoOpen('delivered')} className="p-1 rounded-full bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-zinc-400 mt-1">Collector receives your art.</p>
            </div>
            <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-center ring-amber-600/30 shadow-[0_16px_48px_rgba(250,204,21,0.14)]">
              <div className="text-3xl mb-2">💰</div>
              <div className="flex items-center justify-center gap-2">
                <h4 className="font-bold">Day 30</h4>
                <button aria-label="More info about Day 30" onClick={() => setInfoOpen('day30')} className="p-1 rounded-full bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-zinc-400 mt-1">Funds released to your wallet.</p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-amber-400 text-center mb-6">Choose Your Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {pricingTiers.map((tier) => {
              const price = isDollar ? `$${tier.priceUSD}` : `R${tier.priceZAR}`;
              return (
                <div key={tier.name} className={`bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 text-center flex flex-col justify-between ${tier.name === 'Creator' ? 'ring-2 ring-amber-600' : ''}`}>
                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <h4 className="text-2xl font-bold text-amber-400">{tier.name}</h4>
                      {tier.name === 'Creator' && (
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
                    <button
                        type="button"
                        onClick={() => openApplicationForm(tier.name)}
                      className="inline-block w-full bg-amber-600 hover:bg-amber-500 text-black font-semibold py-2 rounded-full"
                    >
                      Apply Now
                    </button>
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
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowApplicationForm(false)} />
            <form onSubmit={handleSubmit} className="relative bg-zinc-900 border border-zinc-800 rounded-t-xl md:rounded-xl p-4 md:p-6 w-full max-w-md z-10">
              {/* Drag handle for mobile bottom-sheet */}
              <div className="w-full flex items-center justify-center md:hidden mb-2">
                <div className="w-14 h-1.5 bg-zinc-800 rounded-full" />
              </div>
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-bold text-white">Artist Application</h4>
                <button type="button" onClick={() => setShowApplicationForm(false)} aria-label="Close application form" className="p-1 rounded bg-zinc-800/40 text-zinc-300">Close</button>
              </div>
              {applicationData.plan && (
                <div className="mb-3 text-sm text-zinc-400">Applying for: <strong className="text-amber-300">{applicationData.plan}</strong></div>
              )}

              {user && user.id && user.id !== 'guest' && (
                <div className="mb-3 p-3 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-300">
                  <div className="font-semibold text-white">Welcome back, {(user.name || '').split(' ')[0] || 'Artist'}!</div>
                  <div className="mt-2 text-sm">Please review your pre-filled details below and complete any missing fields before applying.</div>
                  {missingFields.length > 0 && (
                    <div className="mt-2 text-xs text-amber-300">Missing: {missingFields.join(', ')}</div>
                  )}
                </div>
              )}
              <div className="space-y-3">
                <input name="name" value={applicationData.name} onChange={handleInputChange} placeholder="First name" className="w-full bg-black border border-gray-700 rounded p-2 text-white" />
                <input name="surname" value={applicationData.surname} onChange={handleInputChange} placeholder="Surname" className="w-full bg-black border border-gray-700 rounded p-2 text-white" />
                <input name="artistTradeName" value={applicationData.artistTradeName} onChange={handleInputChange} placeholder="Artist / Trade name" className="w-full bg-black border border-gray-700 rounded p-2 text-white" />
                <input name="contactNumber" value={applicationData.contactNumber} onChange={handleInputChange} placeholder="Contact number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" />
                <input name="email" type="email" value={applicationData.email} onChange={handleInputChange} placeholder="Email" className="w-full bg-black border border-gray-700 rounded p-2 text-white" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Date of Birth</label>
                    <input name="birthday" type="date" value={(applicationData as any).birthday || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded p-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Gender</label>
                    <select name="gender" value={(applicationData as any).gender || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded p-2 text-white">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 bg-zinc-900 border border-gray-700 rounded p-2 text-white"
                        placeholder="Choose a password"
                      />
                      <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-300">
                        {showPassword ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.006.151-1.976.432-2.9M3 3l18 18" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 bg-zinc-900 border border-gray-700 rounded p-2 text-white"
                        placeholder="Confirm password"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(s => !s)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-300">
                        {showConfirmPassword ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.006.151-1.976.432-2.9M3 3l18 18" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Country</label>
                    <input name="country" type="text" value={(applicationData as any).country || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded p-2 text-white" placeholder="Country" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Favorite Color</label>
                    <select name="favoriteColor" value={(applicationData as any).favoriteColor || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded p-2 text-white">
                      <option value="">Select favorite color</option>
                      <option value="red">Red</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="yellow">Yellow</option>
                      <option value="purple">Purple</option>
                      <option value="pink">Pink</option>
                      <option value="orange">Orange</option>
                      <option value="black">Black</option>
                      <option value="white">White</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">Product images</label>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="w-full mt-1" />
                  <div className="mt-2 text-xs text-zinc-400">{previews.length === 0 ? 'No file chosen' : `${previews.length} / 5 images selected`}</div>
                  {previews.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {previews.map((src, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded overflow-hidden border border-zinc-800">
                          <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => {
                            // remove preview and file at idx
                            try { URL.revokeObjectURL(src); } catch (_) {}
                            setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                            setPreviews(prev => prev.filter((_, i) => i !== idx));
                            setUploadWarning('');
                          }} className="absolute top-1 right-1 p-1 rounded bg-black/60 text-zinc-200">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadWarning && (
                    <p className="text-xs text-amber-300 mt-2">{uploadWarning}</p>
                  )}
                </div>
                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setInlineTermsOpen(s => !s)} className="text-amber-300 underline text-sm">Read Terms & Conditions</button>
                    <label className="flex items-center gap-2 text-sm text-zinc-300">
                      <input
                        type="checkbox"
                        checked={termsAgreed}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // open inline terms so user can read and accept
                            setInlineTermsOpen(true);
                          } else {
                            setTermsAgreed(false);
                            setInlineTermsOpen(false);
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span>I agree to the <strong className="text-amber-300">Artist Terms & Conditions</strong></span>
                    </label>
                  </div>
                  {inlineTermsOpen && (
                    <div className="mt-3 bg-zinc-900 border border-zinc-800 p-4 rounded space-y-3 text-sm text-zinc-300 max-h-64 overflow-y-auto pr-3">
                      <div className="bg-amber-900/10 border border-amber-700/20 p-3 rounded text-amber-100">Please read these terms carefully. You must agree to proceed with your application.</div>
                      <section>
                        <h4 className="font-semibold text-white">1. Enrollment & Eligibility</h4>
                        <p className="mt-2">By applying you confirm that you own the rights to the items listed and that all information provided is accurate. We reserve the right to accept or reject applications.</p>
                      </section>
                      <section>
                        <h4 className="font-semibold text-white">2. Hub Inventory & Storage</h4>
                        <p className="mt-2">Each product must have at least one physical stock item recorded in our Worcester hub <strong className="text-amber-300">before the product goes live</strong>. Storage is free for one physical stock item. Additional identical items are subject to a once-off fee (R2 per item in ZAR or $0.50 per item in USD). We do not store more than 20 identical items per listing.</p>
                      </section>
                      <section>
                        <h4 className="font-semibold text-white">3. Inspection, Delivery & Escrow</h4>
                        <p className="mt-2">All sold items are inspected at our Worcester hub. Funds are held in escrow until delivery is confirmed and the buyer's inspection period passes. Payouts follow the platform's payout schedule and commission structure.</p>
                      </section>
                      <section>
                        <h4 className="font-semibold text-white">4. Vault Listing</h4>
                        <p className="mt-2">You may opt to have items relisted in the Vault. Vault items are sold as-is, may have minor imperfections, and are sold at low prices with expected artist profit typically 5% or less. Vault sales follow the rules: Deluxe Member access, loyalty limits, first-come first-serve, and limited stock.</p>
                      </section>
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => { setTermsAgreed(true); setInlineTermsOpen(false); }} className="bg-amber-600 text-black font-semibold py-2 px-4 rounded">Accept</button>
                        <button type="button" onClick={() => { setTermsAgreed(false); setInlineTermsOpen(false); }} className="bg-zinc-800 text-zinc-300 py-2 px-4 rounded">Close</button>
                      </div>
                    </div>
                  )}
                  {/* Warnings removed; Apply remains disabled until terms agreed and at least one image uploaded */}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !termsAgreed ||
                      selectedFiles.length === 0 ||
                      ((!user || user.id === 'guest') && !isDemoMode && (!password || password.length < 6 || password !== confirmPassword))
                    }
                    className="w-full bg-amber-600 text-black font-semibold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Applying…' : 'Apply'}
                  </button>
                  <button type="button" onClick={() => { setShowApplicationForm(false); setApplicationData(prev => ({ ...prev, plan: '' })); setSelectedFiles([]); setPreviews([]); setTermsAgreed(false); }} className="w-full sm:w-auto bg-zinc-800 text-zinc-300 py-2 px-4 rounded">Cancel</button>
                </div>
                                {uploadWarning && (
                                  <p className="text-xs text-amber-300 mt-2">{uploadWarning}</p>
                                )}
                                {(!isDemoMode && (!user || user.id === 'guest')) && (
                                  <div className="mt-2 text-xs">
                                    <p className="text-zinc-400">Note: Creating an account will be required to complete your application. Choose a password at least 6 characters long.</p>
                                    {password && confirmPassword && password !== confirmPassword && <p className="text-xs text-red-400">Passwords do not match.</p>}
                                  </div>
                                )}
              </div>
            </form>
          </div>
        )}

        {/* Terms & Conditions Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowTermsModal(false)} />
            <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-amber-300">Artist Terms & Conditions</h3>
                <button onClick={() => setShowTermsModal(false)} className="p-1 rounded bg-zinc-800/40 text-zinc-300">Close</button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3 text-sm text-zinc-300">
                <div className="bg-amber-900/10 border border-amber-700/20 p-3 rounded text-amber-100">Please read these terms carefully. You must agree to proceed with your application.</div>
                <section>
                  <h4 className="font-semibold text-white">1. Enrollment & Eligibility</h4>
                  <p className="mt-2">By applying you confirm that you own the rights to the items listed and that all information provided is accurate. We reserve the right to accept or reject applications.</p>
                </section>
                <section>
                  <h4 className="font-semibold text-white">2. Hub Inventory & Storage</h4>
                  <p className="mt-2">Each product must have at least one physical stock item recorded in our Worcester hub <strong className="text-amber-300">before the product goes live</strong>. Storage is free for one physical stock item. Additional identical items are subject to a once-off fee (R2 per item in ZAR or $0.50 per item in USD). We do not store more than 20 identical items per listing.</p>
                </section>
                <section>
                  <h4 className="font-semibold text-white">3. Inspection, Delivery & Escrow</h4>
                  <p className="mt-2">All sold items are inspected at our Worcester hub. Funds are held in escrow until delivery is confirmed and the buyer's inspection period passes. Payouts follow the platform's payout schedule and commission structure.</p>
                </section>
                <section>
                  <h4 className="font-semibold text-white">4. Vault Listing</h4>
                  <p className="mt-2">You may opt to have items relisted in the Vault. Vault items are sold as-is, may have minor imperfections, and are sold at low prices with expected artist profit typically 5% or less. Vault sales follow the rules: Deluxe Member access, loyalty limits, first-come first-serve, and limited stock.</p>
                </section>
                <section>
                  <h4 className="font-semibold text-white">5. Returns, Penalties & Termination</h4>
                  <p className="mt-2">Failure to provide accurate inventory or repeated delivery issues may result in penalties, temporary holds, or account termination. We will notify you and provide remediation steps when possible.</p>
                </section>
                <section>
                  <h4 className="font-semibold text-white">6. Intellectual Property & Representations</h4>
                  <p className="mt-2">You represent and warrant that you have all necessary rights to list and sell the items, and that listings do not infringe on third-party rights.</p>
                </section>
                <section>
                  <h4 className="font-semibold text-white">7. Governing Law</h4>
                  <p className="mt-2">These terms are governed by the laws applicable to Spoil Me's principal place of business.</p>
                </section>
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button onClick={() => { setTermsAgreed(true); setShowTermsModal(false); }} className="bg-amber-600 text-black font-semibold py-2 px-4 rounded">Agree & Close</button>
                <button onClick={() => { setShowTermsModal(false); setTermsAgreed(false); }} className="bg-zinc-800 text-zinc-300 py-2 px-4 rounded">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Info Modal / Bottom Sheet */}
        {infoOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setInfoOpen(null)} />
            <div role="dialog" aria-modal="true" aria-label="Timeline info" onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-xl md:rounded-xl p-4 md:p-6 z-10 ring-amber-600/30 shadow-[0_20px_60px_rgba(250,204,21,0.16)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white">{infoContent(infoOpen).title}</h4>
                  <div className="text-sm text-zinc-400 mt-2 space-y-3">{infoContent(infoOpen).body}</div>
                </div>
                <button aria-label="Close" onClick={() => setInfoOpen(null)} className="p-2 rounded-md bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
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

