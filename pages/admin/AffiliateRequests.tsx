import React, { useState, useEffect } from 'react';
import { Check, X, Clock, User, AlertTriangle, RefreshCw } from 'lucide-react';
import { callServerFunction } from '@repo/utils/supabaseClient';
import { queryDocuments, subscribeToTable } from '@repo/utils/supabaseClient';

// Server function caller (migrated from Firebase httpsCallable)

interface AffiliateApplication {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
  autoApproveAt: Date;
  rejectionReason?: string;
  approvedBy?: string;
  userEmail?: string;
  userName?: string;
}

const AffiliateRequests: React.FC = () => {
  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<AffiliateApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    let unsub: (() => void) | null = null;

    const load = async () => {
      const apps = await queryDocuments<any>('affiliate_applications', { filters: { status: 'pending' }, orderBy: { column: 'applied_at', ascending: false } });
      setApplications((apps || []).map(a => ({ id: a.id, ...a, appliedAt: a.applied_at ? new Date(a.applied_at) : new Date(), autoApproveAt: a.auto_approve_at ? new Date(a.auto_approve_at) : new Date() })));
      setLoading(false);
    };

    load();

    unsub = subscribeToTable('affiliate_applications', async () => {
      const apps = await queryDocuments<any>('affiliate_applications', { filters: { status: 'pending' }, orderBy: { column: 'applied_at', ascending: false } });
      setApplications((apps || []).map(a => ({ id: a.id, ...a, appliedAt: a.applied_at ? new Date(a.applied_at) : new Date(), autoApproveAt: a.auto_approve_at ? new Date(a.auto_approve_at) : new Date() })));
    });

    return () => { if (unsub) unsub(); };
  }, []);

  const calculateTimeLeft = (autoApproveAt: Date) => {
    const now = new Date();
    const approveTime = autoApproveAt;
    const diff = approveTime.getTime() - now.getTime();

    if (diff <= 0) return 'Auto-approving...';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m left`;
  };

  const handleApprove = async (applicationId: string) => {
    setProcessingId(applicationId);
    try {
      await callServerFunction('reviewAffiliateApplication', {
        applicationId,
        decision: 'approve',
        reason: 'Approved by admin'
      });

      alert('Application approved successfully!');
    } catch (error: any) {
      console.error('Error approving application:', error);
      alert(`Failed to approve: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    const finalReason = customReason || rejectionReason;

    if (!finalReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessingId(selectedApplication.id);
    try {
      await callServerFunction('reviewAffiliateApplication', {
        applicationId: selectedApplication.id,
        decision: 'reject',
        reason: finalReason
      });

      alert('Application rejected successfully!');
      setShowRejectModal(false);
      setSelectedApplication(null);
      setRejectionReason('');
      setCustomReason('');
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      alert(`Failed to reject: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (application: AffiliateApplication) => {
    setSelectedApplication(application);
    setShowRejectModal(true);
    setRejectionReason('');
    setCustomReason('');
  };

  const quickRejectReasons = [
    'Profile incomplete',
    'Social media presence too low',
    'Not currently accepting new partners in your region',
    'Application does not meet our partnership criteria',
    'Duplicate application'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gold animate-pulse">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Affiliate Applications</h1>
        <p className="text-gray-400">Review and manage partner applications</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Pending Review</h3>
          </div>
          <p className="text-3xl font-bold text-blue-400">{applications.length}</p>
          <p className="text-sm text-gray-400">Applications waiting</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Auto-Approve</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-400">
            {applications.filter(app => {
              const now = new Date();
              const approveTime = app.autoApproveAt;
              return approveTime.getTime() - now.getTime() <= 10 * 60 * 1000; // Within 10 minutes
            }).length}
          </p>
          <p className="text-sm text-gray-400">Within 10 minutes</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Urgent</h3>
          </div>
          <p className="text-3xl font-bold text-red-400">
            {applications.filter(app => {
              const now = new Date();
              const approveTime = app.autoApproveAt;
              return approveTime.getTime() - now.getTime() <= 0; // Already overdue
            }).length}
          </p>
          <p className="text-sm text-gray-400">Overdue for auto-approval</p>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-zinc-700">
          <h2 className="text-xl font-semibold text-white">Pending Applications</h2>
          <p className="text-gray-400 text-sm">Applications will auto-approve after 1 hour if not reviewed</p>
        </div>

        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No pending applications</h3>
            <p className="text-gray-500">All applications have been reviewed or auto-approved</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-700">
            {applications.map((application) => (
              <div key={application.id} className="p-6 hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {application.userName || `User ${application.userId.slice(0, 8)}`}
                      </h3>
                      <p className="text-gray-400 text-sm">{application.userEmail || application.userId}</p>
                      <p className="text-gray-500 text-xs">
                        Applied: {application.appliedAt.toLocaleDateString()} at{' '}
                        {application.appliedAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Auto-approve in</div>
                      <div className="text-yellow-400 font-medium">
                        {calculateTimeLeft(application.autoApproveAt)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(application.id)}
                        disabled={processingId === application.id}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        {processingId === application.id ? 'Approving...' : 'Approve'}
                      </button>

                      <button
                        onClick={() => openRejectModal(application)}
                        disabled={processingId === application.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Reject Application</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Reason for Rejection</label>
                <div className="space-y-2">
                  {quickRejectReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setRejectionReason(reason)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        rejectionReason === reason
                          ? 'border-red-500 bg-red-900/20 text-red-300'
                          : 'border-zinc-700 bg-zinc-800 text-gray-300 hover:border-zinc-600'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Custom Reason (Optional)</label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Provide additional details..."
                  rows={3}
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleReject}
                disabled={processingId === selectedApplication.id}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                {processingId === selectedApplication.id ? 'Rejecting...' : 'Reject Application'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateRequests;
