import React, { useState, useEffect } from 'react';
import { getDocument, updateDocument, createDocument } from '../../utils/supabaseClient';

interface AdPackage {
  id: string;
  name: string;
  durationDays: number;
  priceZAR: number;
  priceUSD: number;
  benefit: string;
  active: boolean;
}

interface SocialAddon {
  enabled: boolean;
  priceZAR: number;
  priceUSD: number;
  reachCount: number;
}

const AdminAdPricing: React.FC = () => {
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [socialAddon, setSocialAddon] = useState<SocialAddon>({ enabled: true, priceZAR: 199, priceUSD: 12.00, reachCount: 7540 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getDocument<{ packages?: AdPackage[]; socialAddon?: SocialAddon }>('settings', 'ad_config');
      if (data) {
        setPackages(data.packages || []);
        setSocialAddon(data.socialAddon || socialAddon);
      }
    } catch (error) {
      console.error('Error loading ad config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      try {
        await updateDocument('settings', 'ad_config', {
          packages,
          socialAddon,
        });
      } catch (err) {
        // If update failed (e.g., record doesn't exist), create it
        await createDocument('settings', {
          id: 'ad_config',
          packages,
          socialAddon,
        });
      }
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving ad config:', error);
      alert('Failed to save configuration.');
    }
  };

  const updatePackage = (index: number, field: keyof AdPackage, value: any) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };
    setPackages(updated);
  };

  const updateSocialAddon = (field: keyof SocialAddon, value: any) => {
    setSocialAddon({ ...socialAddon, [field]: value });
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-yellow-400">Marketing Settings</h1>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Ad Packages</h2>
        <div className="overflow-x-auto">
          <table className="w-full bg-gray-800 rounded-lg">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Duration (Days)</th>
                <th className="p-4 text-left">Price (ZAR)</th>
                <th className="p-4 text-left">Price (USD)</th>
                <th className="p-4 text-left">Benefit</th>
                <th className="p-4 text-left">Active</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg, index) => (
                <tr key={pkg.id} className="border-b border-gray-700">
                  <td className="p-4">
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => updatePackage(index, 'name', e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      value={pkg.durationDays}
                      onChange={(e) => updatePackage(index, 'durationDays', parseInt(e.target.value))}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.01"
                      value={pkg.priceZAR}
                      onChange={(e) => updatePackage(index, 'priceZAR', parseFloat(e.target.value))}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.01"
                      value={pkg.priceUSD}
                      onChange={(e) => updatePackage(index, 'priceUSD', parseFloat(e.target.value))}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="text"
                      value={pkg.benefit}
                      onChange={(e) => updatePackage(index, 'benefit', e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={pkg.active}
                      onChange={(e) => updatePackage(index, 'active', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Social Media Add-on</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Enabled</label>
              <input
                type="checkbox"
                checked={socialAddon.enabled}
                onChange={(e) => updateSocialAddon('enabled', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price (ZAR)</label>
              <input
                type="number"
                step="0.01"
                value={socialAddon.priceZAR}
                onChange={(e) => updateSocialAddon('priceZAR', parseFloat(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price (USD)</label>
              <input
                type="number"
                step="0.01"
                value={socialAddon.priceUSD}
                onChange={(e) => updateSocialAddon('priceUSD', parseFloat(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Network Reach</label>
              <input
                type="number"
                value={socialAddon.reachCount}
                onChange={(e) => updateSocialAddon('reachCount', parseInt(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={saveConfig}
        className="bg-yellow-400 text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-500 transition-colors"
      >
        Save Changes
      </button>
    </div>
  );
};

export default AdminAdPricing;
