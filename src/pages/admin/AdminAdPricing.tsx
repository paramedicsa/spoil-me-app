import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input, Switch } from "@nextui-org/react";
import { useStore } from '../../../context/StoreContext';

const AdminAdPricing: React.FC = () => {
  const { db } = useStore();
  const [packages, setPackages] = useState([]);
  const [socialAddon, setSocialAddon] = useState({ enabled: true, priceZAR: 199, priceUSD: 12.00, reachCount: 7540 });

  useEffect(() => {
    // Load current ad config from Firestore
    const loadConfig = async () => {
      if (!db) return;
      try {
        const doc = await db.collection('settings').doc('ad_config').get();
        if (doc.exists) {
          const data = doc.data();
          setPackages(data.packages || []);
          setSocialAddon(data.socialAddon || socialAddon);
        }
      } catch (error) {
        console.error('Error loading ad config:', error);
      }
    };
    loadConfig();
  }, [db]);

  const handlePackageChange = (index: number, field: string, value: any) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };
    setPackages(updated);
  };

  const handleSocialChange = (field: string, value: any) => {
    setSocialAddon({ ...socialAddon, [field]: value });
  };

  const saveChanges = async () => {
    if (!db) return;
    try {
      await db.collection('settings').doc('ad_config').set({
        packages,
        socialAddon
      });
      alert('Ad pricing updated successfully!');
    } catch (error) {
      console.error('Error saving ad config:', error);
      alert('Failed to save changes.');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Marketing Settings</h1>

      <Card className="mb-8">
        <CardBody>
          <h2 className="text-2xl font-bold mb-4">Ad Packages</h2>
          <div className="space-y-4">
            {packages.map((pkg, index) => (
              <div key={pkg.id} className="border border-zinc-300 dark:border-zinc-600 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">{pkg.name}</h3>
                  <Switch
                    checked={pkg.active}
                    onChange={(e) => handlePackageChange(index, 'active', e.target.checked)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    label="Duration (Days)"
                    type="number"
                    value={pkg.durationDays}
                    onChange={(e) => handlePackageChange(index, 'durationDays', parseInt(e.target.value))}
                  />
                  <Input
                    label="Price ZAR"
                    type="number"
                    value={pkg.priceZAR}
                    onChange={(e) => handlePackageChange(index, 'priceZAR', parseFloat(e.target.value))}
                  />
                  <Input
                    label="Price USD"
                    type="number"
                    value={pkg.priceUSD}
                    onChange={(e) => handlePackageChange(index, 'priceUSD', parseFloat(e.target.value))}
                  />
                  <Input
                    label="Benefit"
                    value={pkg.benefit}
                    onChange={(e) => handlePackageChange(index, 'benefit', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="mb-8">
        <CardBody>
          <h2 className="text-2xl font-bold mb-4">Social Media Add-on</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Enabled</label>
              <Switch
                checked={socialAddon.enabled}
                onChange={(e) => handleSocialChange('enabled', e.target.checked)}
              />
            </div>
            <Input
              label="Price ZAR"
              type="number"
              value={socialAddon.priceZAR.toString()}
              onChange={(e) => handleSocialChange('priceZAR', parseFloat(e.target.value))}
            />
            <Input
              label="Price USD"
              type="number"
              value={socialAddon.priceUSD.toString()}
              onChange={(e) => handleSocialChange('priceUSD', parseFloat(e.target.value))}
            />
            <Input
              label="Network Reach"
              type="number"
              value={socialAddon.reachCount.toString()}
              onChange={(e) => handleSocialChange('reachCount', parseInt(e.target.value))}
            />
          </div>
        </CardBody>
      </Card>

      <Button onClick={saveChanges} className="bg-blue-500 text-white">
        Save Changes
      </Button>
    </div>
  );
};

export default AdminAdPricing;
