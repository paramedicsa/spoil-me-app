import React, { useState, useEffect } from 'react';
import { DollarSign, Send, AlertCircle, CheckCircle, Clock, Users, TrendingUp } from 'lucide-react';
import { paypalPayoutService, PayoutRequest } from '../services/paypalPayoutService';

interface AffiliatePayout {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  payoutId?: string;
}

const AdminPayouts: React.FC = () => {
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<AffiliatePayout | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Mock data - in real app, fetch from backend
  useEffect(() => {
    const mockPayouts: AffiliatePayout[] = [
      {
        id: '1',
        affiliateId: 'aff_001',
        affiliateName: 'John Smith',
        affiliateEmail: 'john@example.com',
        amount: 250.00,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        affiliateId: 'aff_002',
        affiliateName: 'Sarah Johnson',
        affiliateEmail: 'sarah@example.com',
        amount: 180.50,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];
    setPayouts(mockPayouts);
  }, []);

  const handlePayout = async (payout: AffiliatePayout) => {
    setIsProcessing(true);
    try {
      const payoutRequest: PayoutRequest = {
        recipientEmail: payout.affiliateEmail,
        amount: payout.amount,
        currency: 'USD',
        note: `Spoil Me Vintage Commission - ${payout.affiliateName}`
      };

      const result = await paypalPayoutService.createPayout(payoutRequest);

      if (result.success) {
        // Update local state
        setPayouts(prev => prev.map(p =>
          p.id === payout.id
            ? { ...p, status: 'processing', payoutId: result.payoutId }
            : p
        ));

        alert(`Payout initiated successfully! PayPal Payout ID: ${result.payoutId}`);
      } else {
        alert(`Payout failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Payout error:', error);
      alert('An error occurred while processing the payout.');
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
      setSelectedPayout(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'processing':
        return <Clock className="text-yellow-500" size={16} />;
      case 'failed':
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <Clock className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'processing':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-bold text-white">Affiliate Payouts</h1>
          <p className="text-gray-400 text-sm">Manage commission payouts to affiliates</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Payouts</p>
              <p className="text-2xl font-bold text-white">${totalPending.toFixed(2)}</p>
            </div>
            <DollarSign className="text-yellow-500" size={24} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Affiliates</p>
              <p className="text-2xl font-bold text-white">{payouts.length}</p>
            </div>
            <Users className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">This Month</p>
              <p className="text-2xl font-bold text-white">$1,245.50</p>
            </div>
            <TrendingUp className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-zinc-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Pending Payouts</h2>
        </div>

        <div className="overflow-x-auto">
          {pendingPayouts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
              <p>No pending payouts at this time.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-black/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Affiliate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {pendingPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-black/20">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {payout.affiliateName}
                        </div>
                        <div className="text-sm text-gray-400">
                          {payout.affiliateEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-400">
                        ${payout.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)} bg-black/30`}>
                        {getStatusIcon(payout.status)}
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedPayout(payout);
                          setShowConfirmDialog(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <Send size={14} />
                        Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedPayout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Payout</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Affiliate:</p>
                <p className="text-white font-medium">{selectedPayout.affiliateName}</p>
                <p className="text-gray-400 text-sm">{selectedPayout.affiliateEmail}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Amount:</p>
                <p className="text-green-400 font-bold text-lg">${selectedPayout.amount.toFixed(2)} USD</p>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  This will initiate a PayPal payout to the affiliate's email address.
                  The payout will be processed according to PayPal's schedule.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={() => handlePayout(selectedPayout)}
                disabled={isProcessing}
                className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;
