import React from 'react';

const AdminAdRevenue: React.FC = () => {
  // Mock data for demonstration
  const adRevenueData = {
    totalRevenue: 5400,
    topSpenders: [
      { artist: 'Artist A', amount: 1200 },
      { artist: 'Artist B', amount: 950 },
      { artist: 'Artist C', amount: 700 },
    ],
    slotUtilization: {
      homepageSlots: 8,
      totalHomepageSlots: 10,
      categorySlots: 45,
    },
  };

  return (
    <div className="p-4 md:p-6 bg-zinc-900 rounded-lg border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-6">Ad Revenue & Performance</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-black/30 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Total Ad Revenue</h3>
          <p className="text-4xl font-bold text-white">R{adRevenueData.totalRevenue.toLocaleString()}</p>
          <p className="text-gray-400">this month</p>
        </div>
        <div className="bg-black/30 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">Homepage Slot Utilization</h3>
          <p className="text-4xl font-bold text-white">
            {adRevenueData.slotUtilization.homepageSlots} / {adRevenueData.slotUtilization.totalHomepageSlots}
          </p>
          <p className="text-gray-400">slots filled</p>
        </div>
        <div className="bg-black/30 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">Active Category Ads</h3>
          <p className="text-4xl font-bold text-white">{adRevenueData.slotUtilization.categorySlots}</p>
          <p className="text-gray-400">promotions running</p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-yellow-400 mb-4">Top Spenders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-zinc-800">
              <tr>
                <th className="px-4 py-2">Artist</th>
                <th className="px-4 py-2">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {adRevenueData.topSpenders.map((spender, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="px-4 py-2 font-medium text-white">{spender.artist}</td>
                  <td className="px-4 py-2 text-green-400">R{spender.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAdRevenue;

