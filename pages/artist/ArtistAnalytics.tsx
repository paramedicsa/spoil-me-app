import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext'; // Adjusted path
import { useAdConfig } from '../../hooks/useAdConfig'; // Import the hook
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Eye, MousePointerClick, TrendingUp, History, Rocket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component

// Mock Data
const mockActiveCampaign = {
  productName: 'Enchanted Silver Ring',
  tier: '💎 Weekly Icon',
  expiresIn: '3d 14h 30m',
  stats: {
    impressions: 1240,
    clicks: 85,
    ctr: 6.8,
  }
};

const mockCampaignHistory = [
  { id: 1, name: 'Silver Ring - 3 Day Pulse', paid: 59, currency: 'ZAR', result: '400 Clicks - SOLD' },
  { id: 2, name: 'Forest Pendant - 24h Flash', paid: 29, currency: 'ZAR', result: '150 Clicks - 2 sales' },
];

const mockChartData = [
    { name: 'Day 1', Clicks: 20, Views: 300 },
    { name: 'Day 2', Clicks: 35, Views: 500 },
    { name: 'Day 3', Clicks: 85, Views: 1240 },
];

const ArtistAnalytics = () => {
  const { currency } = useStore();
  const { packages, socialAddon, loading } = useAdConfig();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 text-white space-y-12">
      <h1 className="text-3xl font-bold">Marketing Performance</h1>

      {/* Section A: Active Campaigns */}
      <div className="bg-zinc-900 border-2 border-green-500 rounded-2xl p-8 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
        <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2"><Rocket/> Active Campaign</h2>
        <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
                <div className="bg-zinc-700 h-48 w-full rounded-lg mb-4 flex items-center justify-center"><p>Product Image</p></div>
                <h3 className="text-xl font-semibold">{mockActiveCampaign.productName}</h3>
                <p className="text-green-400">{mockActiveCampaign.tier}</p>
                <p className="text-sm text-gray-400">Expires in: {mockActiveCampaign.expiresIn}</p>
            </div>
            <div className="md:w-2/3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-zinc-800 p-4 rounded-lg text-center">
                        <Eye className="mx-auto mb-2 text-blue-400" size={24}/>
                        <p className="text-2xl font-bold">{mockActiveCampaign.stats.impressions.toLocaleString()}</p>
                        <p className="text-sm text-gray-400">Views</p>
                    </div>
                    <div className="bg-zinc-800 p-4 rounded-lg text-center">
                        <MousePointerClick className="mx-auto mb-2 text-yellow-400" size={24}/>
                        <p className="text-2xl font-bold">{mockActiveCampaign.stats.clicks}</p>
                        <p className="text-sm text-gray-400">Clicks</p>
                    </div>
                    <div className="bg-zinc-800 p-4 rounded-lg text-center">
                        <TrendingUp className="mx-auto mb-2 text-pink-400" size={24}/>
                        <p className="text-2xl font-bold">{mockActiveCampaign.stats.ctr}%</p>
                        <p className="text-sm text-gray-400">Conversion</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={mockChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444' }}/>
                        <Legend />
                        <Line type="monotone" dataKey="Views" stroke="#3b82f6" />
                        <Line type="monotone" dataKey="Clicks" stroke="#facc15" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Section B: Promote a New Product */}
      <div>
        <h2 className="text-2xl font-bold mb-4">🚀 Promote a New Product</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.filter(p => p.active).map(pkg => (
            <div key={pkg.id} className="bg-zinc-800 border border-gray-700 rounded-lg p-6 flex flex-col">
              <h3 className="text-xl font-bold text-yellow-400 mb-2">{pkg.name}</h3>
              <p className="text-gray-400 mb-4 flex-grow">{pkg.benefit}</p>
              <div className="text-center my-4">
                <span className="text-4xl font-bold">
                  {currency === 'ZAR' ? `R${pkg.priceZAR}` : `$${pkg.priceUSD.toFixed(2)}`}
                </span>
                <span className="text-gray-500"> / {pkg.durationDays} day{pkg.durationDays > 1 ? 's' : ''}</span>
              </div>
              <Button className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold">
                Select Package
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Social Addon Section */}
      {socialAddon.enabled && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-2">Supercharge with Social Media!</h2>
            <p className="mb-4">Reach our network of <span className="font-bold">{socialAddon.reachCount.toLocaleString()}</span> followers.</p>
            <Button className="bg-white text-black font-bold">
                Add Social Boost for {currency === 'ZAR' ? `R${socialAddon.priceZAR}` : `$${socialAddon.priceUSD.toFixed(2)}`}
            </Button>
        </div>
      )}

      {/* Section C: Campaign History */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><History/> Campaign History</h2>
        <div className="space-y-3">
            {mockCampaignHistory.map(item => (
                <div key={item.id} className="bg-zinc-800 p-4 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-400">Paid: {currency === 'ZAR' ? `R${item.paid}` : `$${(item.paid / 15).toFixed(2)}`}</p>
                    </div>
                    <p className="text-green-400 font-medium">{item.result}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ArtistAnalytics;

