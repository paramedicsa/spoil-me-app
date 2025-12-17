import React, { useState, useEffect } from 'react';
import { Search, Calendar, Download, Filter, RefreshCw, Eye } from 'lucide-react';
import { paypalPayoutService } from '../../services/paypalPayoutService';

interface PayPalTransaction {
  id: string;
  type: 'subscription' | 'payout' | 'refund';
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  payerEmail?: string;
  recipientEmail?: string;
  description?: string;
  paypalTransactionId: string;
}

const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<PayPalTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<PayPalTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  // Mock data - in real app, fetch from PayPal API
  useEffect(() => {
    const mockTransactions: PayPalTransaction[] = [
      {
        id: '1',
        type: 'subscription',
        amount: 5.00,
        currency: 'USD',
        status: 'COMPLETED',
        createdAt: '2024-12-01T10:00:00Z',
        payerEmail: 'user1@example.com',
        description: 'Insider Club Membership',
        paypalTransactionId: 'PAY-123456789'
      },
      {
        id: '2',
        type: 'payout',
        amount: 250.00,
        currency: 'USD',
        status: 'SUCCESS',
        createdAt: '2024-12-02T14:30:00Z',
        recipientEmail: 'affiliate@example.com',
        description: 'Affiliate Commission',
        paypalTransactionId: 'PAYOUT-987654321'
      },
      {
        id: '3',
        type: 'subscription',
        amount: 12.00,
        currency: 'USD',
        status: 'COMPLETED',
        createdAt: '2024-12-03T09:15:00Z',
        payerEmail: 'user2@example.com',
        description: 'Gold Member Membership',
        paypalTransactionId: 'PAY-456789123'
      }
    ];
    setTransactions(mockTransactions);
    setFilteredTransactions(mockTransactions);
  }, []);

  useEffect(() => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.paypalTransactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.payerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.createdAt);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, statusFilter, typeFilter, dateRange]);

  const handleSyncTransactions = async () => {
    setIsLoading(true);
    try {
      // In real app, this would sync with PayPal API
      const syncedTransactions = await paypalPayoutService.getTransactionHistory(
        dateRange.start || undefined,
        dateRange.end || undefined
      );
      setTransactions(syncedTransactions);
      alert('Transactions synced successfully!');
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'text-green-400 bg-green-900/20';
      case 'pending':
      case 'processing':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'failed':
      case 'cancelled':
        return 'text-red-400 bg-red-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'subscription':
        return 'text-blue-400 bg-blue-900/20';
      case 'payout':
        return 'text-purple-400 bg-purple-900/20';
      case 'refund':
        return 'text-orange-400 bg-orange-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Status', 'Transaction ID', 'Email', 'Description'];
    const csvData = filteredTransactions.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      t.type,
      t.amount,
      t.currency,
      t.status,
      t.paypalTransactionId,
      t.payerEmail || t.recipientEmail || '',
      t.description || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paypal-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-bold text-white">PayPal Transactions</h1>
          <p className="text-gray-400 text-sm">Search and monitor PayPal transactions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSyncTransactions}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Sync Transactions
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-gray-800 p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:border-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:border-blue-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="subscription">Subscription</option>
              <option value="payout">Payout</option>
              <option value="refund">Refund</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-lg text-white focus:border-blue-500 outline-none"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-lg text-white focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-zinc-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>No transactions found matching your criteria.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-black/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-black/20">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                      {transaction.currency} {transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-cyan-400">
                      {transaction.paypalTransactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {transaction.payerEmail || transaction.recipientEmail}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                      {transaction.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Transactions</p>
              <p className="text-2xl font-bold text-white">{filteredTransactions.length}</p>
            </div>
            <Calendar className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Volume</p>
              <p className="text-2xl font-bold text-white">
                ${filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </p>
            </div>
            <Search className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-white">
                {filteredTransactions.length > 0
                  ? Math.round((filteredTransactions.filter(t =>
                      t.status.toLowerCase() === 'completed' ||
                      t.status.toLowerCase() === 'success'
                    ).length / filteredTransactions.length) * 100)
                  : 0}%
              </p>
            </div>
            <Eye className="text-purple-500" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
