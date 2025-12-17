import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';

const ArtistPartnershipPage: React.FC = () => {
  const { currency: curr, applyForArtist } = useStore();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    name: '',
    surname: '',
    artistTradeName: '',
    contactNumber: '',
    email: '',
    productImages: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const urls = Array.from(files).map(file => URL.createObjectURL(file));
      setApplicationData(prev => ({ ...prev, productImages: urls }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await applyForArtist(applicationData);
      alert('Application submitted successfully! We will review it and contact you soon.');
      setShowApplicationForm(false);
      setApplicationData({
        name: '',
        surname: '',
        artistTradeName: '',
        contactNumber: '',
        email: '',
        productImages: []
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    <div className="bg-black text-white min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-yellow-400">Your Art. Global Stage. 1% Fees.</h1>
          <p className="text-xl mt-4 text-zinc-300">Join a curated marketplace for elite jewelry artists and reach over 7,000 collectors worldwide.</p>
          <button
            onClick={() => setShowApplicationForm(true)}
            className="mt-8 bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-500 transition-colors"
          >
            {curr === 'ZAR' ? 'START YOUR SHOP - R19 / Month' : 'START YOUR SHOP - $1.50 / Month'}
          </button>
        </header>

        {/* Trust Timeline Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-yellow-400 mb-8">The Trust Timeline: Secure Escrow Payments</h2>
          <div className="flex justify-between items-center text-center">
            <div className="flex-1">
              <div className="text-4xl mb-2">🛒</div>
              <h3 className="font-bold text-lg">Sold</h3>
              <p className="text-zinc-400">Funds are held securely in escrow.</p>
            </div>
            <div className="flex-1 text-zinc-500">---&gt;</div>
            <div className="flex-1">
              <div className="text-4xl mb-2">🏭</div>
              <h3 className="font-bold text-lg">Hub Check</h3>
              <p className="text-zinc-400">Your piece is inspected at our Worcester hub.</p>
            </div>
            <div className="flex-1 text-zinc-500">---&gt;</div>
            <div className="flex-1">
              <div className="text-4xl mb-2">📦</div>
              <h3 className="font-bold text-lg">Delivered</h3>
              <p className="text-zinc-400">The collector receives your art.</p>
            </div>
            <div className="flex-1 text-zinc-500">---&gt;</div>
            <div className="flex-1">
              <div className="text-4xl mb-2">💰</div>
              <h3 className="font-bold text-lg">Day 30</h3>
              <p className="text-zinc-400">Funds are released to your wallet.</p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-yellow-400 mb-8">Choose Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {pricingTiers.map((tier) => (
              <div key={tier.name} className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 text-center hover:border-yellow-400 transition-all">
                <h3 className="text-2xl font-bold text-yellow-400">{tier.name}</h3>
                <p className="text-4xl font-bold my-4">
                  {curr === 'ZAR' ? `R${tier.priceZAR}` : `$${tier.priceUSD}`}
                  <span className="text-lg font-normal text-zinc-400">/month</span>
                </p>
                <p className="text-zinc-400 mb-4">{tier.slots} Product Slots</p>
                <button className="w-full bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors">
                  Select Plan
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section>
          <h2 className="text-3xl font-bold text-center text-yellow-400 mb-8">How It Works</h2>
          <div className="max-w-3xl mx-auto text-lg text-zinc-300 space-y-4">
            <p>1. Apply to become a partner. We review applications to maintain a high-quality, curated collection of handmade jewelry.</p>
            <p>2. Once approved, choose a subscription plan that fits your needs. You can upload professional photos of your products. No need to send us stock upfront!</p>
            <p>3. When an item sells, you ship it to our hub in Worcester, South Africa for inspection. You are responsible for this initial shipping cost.</p>
            <p>4. We handle the final quality check and ship the item to the customer. If an item fails inspection, it will be returned to you at your cost, or you can opt to have it sold in our 'Vault' at a reduced price.</p>
            <p>5. Your funds are held in escrow and released to your artist wallet 30 days after the customer receives the item. Our commission is a flat 1% of the sale price.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ArtistPartnershipPage;

