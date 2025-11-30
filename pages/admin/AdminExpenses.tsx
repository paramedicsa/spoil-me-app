import React, { useState, useEffect } from 'react';
import { Box, ExternalLink, DollarSign, Package, Truck } from 'lucide-react';

interface PudoCostItem {
  name: string;
  dimensions: string;
  maxWeight: string;
  boxCost: number;
  lockerToLockerCost: number | null;
  doorToLockerCost: number | null;
  lockerHandleFee: number;
  doorHandleFee: number;
}

const INITIAL_PUDO_COSTS: PudoCostItem[] = [
  { name: 'Extra-Small (XS)', dimensions: '60cm × 17cm × 8cm', maxWeight: '2kg', boxCost: 6, lockerToLockerCost: 49, doorToLockerCost: 69, lockerHandleFee: 0, doorHandleFee: 0 },
  { name: 'Small (S)', dimensions: '60cm × 41cm × 8cm', maxWeight: '5kg', boxCost: 15, lockerToLockerCost: 59, doorToLockerCost: 79, lockerHandleFee: 0, doorHandleFee: 0 },
  { name: 'Medium (M)', dimensions: '60cm × 41cm × 19cm', maxWeight: '10kg', boxCost: 18, lockerToLockerCost: null, doorToLockerCost: null, lockerHandleFee: 0, doorHandleFee: 0 },
];

interface PaxiCostItem {
  bag: string;
  serviceCost: number;
  handleFee: number;
}

interface PaxiServicesState {
  '7-9 Days Service': PaxiCostItem[];
  '3-5 Days Service': PaxiCostItem[];
}

const INITIAL_PAXI_COSTS: PaxiServicesState = {
  '7-9 Days Service': [
    { bag: 'Single Small Paxi Bags', serviceCost: 59.95, handleFee: 0 },
    { bag: 'Single Large Paxi Bags', serviceCost: 89.95, handleFee: 0 },
  ],
  '3-5 Days Service': [
    { bag: 'Single Small Paxi Bags', serviceCost: 109.95, handleFee: 0 },
    { bag: 'Single Large Paxi Bags', serviceCost: 139.95, handleFee: 0 },
  ]
};

interface PudoDoorToDoorItem {
  service: string;
  initialWeight: string;
  boxFee: number;
  initialCharge: number;
  ratePerKg: number | null;
  handleFee: number;
}

const INITIAL_DOOR_TO_DOOR_COSTS: PudoDoorToDoorItem[] = [
  { service: 'Overnight Courier (OVN)', initialWeight: 'Up to 2kg', boxFee: 6, initialCharge: 130.00, ratePerKg: 45.00, handleFee: 0 },
  { service: 'Economy Road (ECO)', initialWeight: '0 to 5kg', boxFee: 15, initialCharge: 90.00, ratePerKg: null, handleFee: 0 },
];

const AdminExpenses: React.FC = () => {
  const [pudoCosts, setPudoCosts] = useState<PudoCostItem[]>(() => {
    const saved = localStorage.getItem('spv_pudo_costs');
    return saved ? JSON.parse(saved) : INITIAL_PUDO_COSTS;
  });
  const [paxiCosts, setPaxiCosts] = useState<PaxiServicesState>(() => {
    const saved = localStorage.getItem('spv_paxi_costs');
    return saved ? JSON.parse(saved) : INITIAL_PAXI_COSTS;
  });
  const [doorToDoorCosts, setDoorToDoorCosts] = useState<PudoDoorToDoorItem[]>(() => {
    const saved = localStorage.getItem('spv_door_to_door_costs');
    return saved ? JSON.parse(saved) : INITIAL_DOOR_TO_DOOR_COSTS;
  });
  const [saveStatus, setSaveStatus] = useState<{[key: string]: string}>({});

  const handleSave = (key: string) => {
    setSaveStatus(prev => ({ ...prev, [key]: 'Saved!' }));
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, [key]: '' }));
    }, 2000);
  };

  // Effects below
  useEffect(() => {
    // Already loaded in useState initializer
  }, []);

  // Save PAXI data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('spv_paxi_costs', JSON.stringify(paxiCosts));
    } catch (error) {
      console.error("Failed to save PAXI costs to storage", error);
    }
  }, [paxiCosts]);
  
  // Load DoorToDoor data from localStorage
  useEffect(() => {
    // Already loaded in useState initializer
  }, []);

  // Save DoorToDoor data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('spv_door_to_door_costs', JSON.stringify(doorToDoorCosts));
    } catch (error) {
      console.error("Failed to save Door to Door costs to storage", error);
    }
  }, [doorToDoorCosts]);

  const handlePudoChange = (index: number, field: keyof PudoCostItem, value: string) => {
    const newCosts = [...pudoCosts];
    const numericValue = parseFloat(value) || 0;
    (newCosts[index] as any)[field] = numericValue;
    setPudoCosts(newCosts);
  };

  const handlePaxiChange = (service: keyof PaxiServicesState, bagIndex: number, field: keyof PaxiCostItem, value: string) => {
    const newCosts = { ...paxiCosts };
    const numericValue = parseFloat(value) || 0;
    (newCosts[service][bagIndex] as any)[field] = numericValue;
    setPaxiCosts(newCosts);
  };

  const handleDoorToDoorChange = (index: number, field: keyof PudoDoorToDoorItem, value: string) => {
    setDoorToDoorCosts(prev => {
      const newCosts = prev.map((item, idx) => {
        if (idx !== index) return item;
        let updated = { ...item };
        if (field === 'initialCharge' || field === 'ratePerKg' || field === 'handleFee' || field === 'boxFee') {
          const numericValue = parseFloat(value);
          if (field === 'ratePerKg' && (isNaN(numericValue) || value === '')) {
            updated[field] = null;
          } else {
            updated[field] = isNaN(numericValue) ? 0 : numericValue;
          }
        } else {
          updated[field] = value;
        }
        return updated;
      });
      return newCosts;
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[22px] font-bold text-white flex items-center gap-2">
          <DollarSign size={24} className="text-green-400" /> Shipping Expenses & Supplies
        </h1>
        <p className="text-gray-400 text-sm">Reference for PUDO & PAXI costs and supplies.</p>
      </div>

      {/* PUDO Section */}
      <div className="bg-zinc-900 border border-gray-700 p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-3">
            <Box size={20} className="text-cyan-400" /> PUDO Box & Service Pricing
          </h3>
          <a href="https://stationery.thecourierguy.co.za/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap">
            Order Stationery <ExternalLink size={16} />
          </a>
        </div>
        {/* PUDO Mobile View */}
        <div className="space-y-4 md:hidden">
          {/* ...existing mobile code... */}
          {pudoCosts.map((item, index) => {
            const lockerTotal = item.boxCost + (item.lockerToLockerCost || 0) + item.lockerHandleFee;
            const doorTotal = item.boxCost + (item.doorToLockerCost || 0) + item.doorHandleFee;
            return (
              <div key={index} className="bg-black/40 p-4 rounded-lg border border-gray-800">
                {/* ...existing code... */}
              </div>
            );
          })}
        </div>
        {/* PUDO Desktop Table View */}
        <div className="hidden md:block mt-8">
          {/* Locker to Locker Table */}
          <h4 className="font-bold text-cyan-400 mb-2 mt-6">Locker to Locker</h4>
          <table className="min-w-full text-sm text-left text-gray-400 mb-8">
            <thead className="bg-zinc-800 text-gray-300">
              <tr>
                <th className="px-4 py-2">Box</th>
                <th className="px-4 py-2">Dimensions</th>
                <th className="px-4 py-2">Max Weight</th>
                <th className="px-4 py-2">Box Cost</th>
                <th className="px-4 py-2">Locker to Locker</th>
                <th className="px-4 py-2">Locker Handle Fee</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Save</th>
              </tr>
            </thead>
            <tbody>
              {pudoCosts.map((item, idx) => {
                if (item.lockerToLockerCost === null) return null;
                const total = item.boxCost + (item.lockerToLockerCost || 0) + item.lockerHandleFee;
                return (
                  <tr key={idx} className="border-b border-gray-700">
                    <td className="px-4 py-2 font-bold text-white">{item.name}</td>
                    <td className="px-4 py-2">{item.dimensions}</td>
                    <td className="px-4 py-2">{item.maxWeight}</td>
                    <td className="px-4 py-2">
                      <input type="number" value={item.boxCost} onChange={e => handlePudoChange(idx, 'boxCost', e.target.value)} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={item.lockerToLockerCost || 0} onChange={e => handlePudoChange(idx, 'lockerToLockerCost', e.target.value)} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={item.lockerHandleFee} onChange={e => handlePudoChange(idx, 'lockerHandleFee', e.target.value)} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" />
                    </td>
                    <td className="px-4 py-2 font-bold text-cyan-400">R{total.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button className="px-2 py-1 bg-cyan-700 text-white rounded text-xs" onClick={() => { localStorage.setItem('spv_pudo_costs', JSON.stringify(pudoCosts)); handleSave(`pudo-lockerToLockerCost-${idx}`); }}>💾</button>
                      <span className="text-green-400 text-xs">{saveStatus[`pudo-lockerToLockerCost-${idx}`]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Door to Locker Table */}
          <h4 className="font-bold text-purple-400 mb-2 mt-6">Door to Locker</h4>
          <table className="min-w-full text-sm text-left text-gray-400">
            <thead className="bg-zinc-800 text-gray-300">
              <tr>
                <th className="px-4 py-2">Box</th>
                <th className="px-4 py-2">Dimensions</th>
                <th className="px-4 py-2">Max Weight</th>
                <th className="px-4 py-2">Box Cost</th>
                <th className="px-4 py-2">Door to Locker</th>
                <th className="px-4 py-2">Door Handle Fee</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Save</th>
              </tr>
            </thead>
            <tbody>
              {pudoCosts.map((item, idx) => {
                if (item.doorToLockerCost === null) return null;
                const total = item.boxCost + (item.doorToLockerCost || 0) + item.doorHandleFee;
                return (
                  <tr key={idx} className="border-b border-gray-700">
                    <td className="px-4 py-2 font-bold text-white">{item.name}</td>
                    <td className="px-4 py-2">{item.dimensions}</td>
                    <td className="px-4 py-2">{item.maxWeight}</td>
                    <td className="px-4 py-2">
                      <input type="number" value={item.boxCost} onChange={e => handlePudoChange(idx, 'boxCost', e.target.value)} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={item.doorToLockerCost || 0} onChange={e => handlePudoChange(idx, 'doorToLockerCost', e.target.value)} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={item.doorHandleFee} onChange={e => handlePudoChange(idx, 'doorHandleFee', e.target.value)} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" />
                    </td>
                    <td className="px-4 py-2 font-bold text-purple-400">R{total.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button className="px-2 py-1 bg-purple-700 text-white rounded text-xs" onClick={() => { localStorage.setItem('spv_pudo_costs', JSON.stringify(pudoCosts)); handleSave(`pudo-doorToLockerCost-${idx}`); }}>💾</button>
                      <span className="text-green-400 text-xs">{saveStatus[`pudo-doorToLockerCost-${idx}`]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAXI Section */}
      <div className="bg-zinc-900 border border-gray-700 p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-3">
            <Package size={20} className="text-pink-400" /> PAXI Bag & Service Pricing
          </h3>
          <a href="https://www.paxi.co.za/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap">
            PAXI Website <ExternalLink size={16} />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.entries(paxiCosts).map(([service, bags]) => (
            <div key={service}>
              <h4 className="font-bold text-pink-400 mb-2">{service}</h4>
              <table className="min-w-full text-sm text-left text-gray-400 mb-8">
                <thead className="bg-zinc-800 text-gray-300">
                  <tr>
                    <th className="px-4 py-2">Bag</th>
                    <th className="px-4 py-2">Box Fee</th>
                    <th className="px-4 py-2">Service Cost</th>
                    <th className="px-4 py-2">Handle Fee</th>
                    <th className="px-4 py-2">Total</th>
                    <th className="px-4 py-2">Save</th>
                  </tr>
                </thead>
                <tbody>
                  {bags.map((bag, idx) => {
                    // For demo, use a default box fee per bag type (could be editable or from config)
                    let boxFee = bag.bag.includes('Small') ? 6 : 15;
                    const total = boxFee + bag.serviceCost + bag.handleFee;
                    return (
                      <tr key={idx} className="border-b border-gray-700">
                        <td className="px-4 py-2 font-bold text-white">{bag.bag}</td>
                        <td className="px-4 py-2">
                          <input type="number" value={boxFee} onChange={e => {/* Optionally allow editing boxFee here if needed */}} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" disabled />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" value={bag.serviceCost} onChange={e => handlePaxiChange(service as keyof PaxiServicesState, idx, 'serviceCost', e.target.value)} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" value={bag.handleFee} onChange={e => handlePaxiChange(service as keyof PaxiServicesState, idx, 'handleFee', e.target.value)} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" />
                        </td>
                        <td className="px-4 py-2 font-bold text-pink-400">R{total.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <button className="px-2 py-1 bg-pink-700 text-white rounded text-xs" onClick={() => { localStorage.setItem('spv_paxi_costs', JSON.stringify(paxiCosts)); handleSave(`paxi-${service}-${idx}`); }}>💾</button>
                          <span className="text-green-400 text-xs">{saveStatus[`paxi-${service}-${idx}`]}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* Door-to-Door Section */}
      <div className="bg-zinc-900 border border-gray-700 p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-3">
            <Truck size={20} className="text-yellow-400" /> Door-to-Door Courier Pricing
          </h3>
        </div>
        <table className="min-w-full text-sm text-left text-gray-400 mb-8">
          <thead className="bg-zinc-800 text-gray-300">
            <tr>
              <th className="px-4 py-2">Service</th>
              <th className="px-4 py-2">Initial Weight</th>
              <th className="px-4 py-2">Box Fee</th>
              <th className="px-4 py-2">Initial Charge</th>
              <th className="px-4 py-2">Rate per Kg</th>
              <th className="px-4 py-2">Handle Fee</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Save</th>
            </tr>
          </thead>
          <tbody>
            {doorToDoorCosts.map((item, idx) => {
              const total = item.boxFee + item.initialCharge + (item.ratePerKg !== null ? item.ratePerKg : 0) + item.handleFee;
              return (
                <tr key={idx} className="border-b border-gray-700">
                  <td className="px-4 py-2 font-bold text-white">{item.service}</td>
                  <td className="px-4 py-2">{item.initialWeight}</td>
                  <td className="px-4 py-2">
                    <input type="number" value={item.boxFee} onChange={e => handleDoorToDoorChange(idx, 'boxFee', e.target.value)} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" value={item.initialCharge} onChange={e => handleDoorToDoorChange(idx, 'initialCharge', e.target.value)} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" />
                  </td>
                  <td className="px-4 py-2">
                    {item.ratePerKg !== null ? (
                      <input type="number" value={item.ratePerKg} onChange={e => handleDoorToDoorChange(idx, 'ratePerKg', e.target.value)} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" />
                    ) : '-'}
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" value={item.handleFee} onChange={e => handleDoorToDoorChange(idx, 'handleFee', e.target.value)} className="w-20 bg-zinc-800 border border-gray-600 rounded p-1 text-white text-right" />
                  </td>
                  <td className="px-4 py-2 font-bold text-yellow-400">R{total.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <button className="px-2 py-1 bg-yellow-700 text-white rounded text-xs" onClick={() => { localStorage.setItem('spv_door_to_door_costs', JSON.stringify(doorToDoorCosts)); handleSave(`doorToDoor-${idx}`); }}>💾</button>
                    <span className="text-green-400 text-xs">{saveStatus[`doorToDoor-${idx}`]}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminExpenses;
