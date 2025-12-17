import React from 'react';
import { X, Shield, FileText, CheckCircle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  planName: string;
  planAmount: number;
  currency: 'ZAR' | 'USD';
}

const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  onAgree,
  planName,
  planAmount,
  currency
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Shield className="text-yellow-400" size={24} />
            <div>
              <h2 className="text-2xl font-bold text-white">Terms & Conditions</h2>
              <p className="text-gray-400 text-sm">
                Review before subscribing to <span className="text-yellow-400 font-semibold">{planName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Terms Content */}
        <div className="p-6 space-y-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
              <FileText size={18} />
              Subscription Details
            </h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p><strong>Plan:</strong> {planName}</p>
              <p><strong>Price:</strong> {currency === 'USD' ? '$' : 'R'}{planAmount} per month</p>
              <p><strong>Billing:</strong> Monthly recurring subscription</p>
              <p><strong>Cancellation:</strong> Cancel anytime via your account</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Terms and Conditions of Service & Membership</h3>

            <div className="text-gray-300 text-sm space-y-3 max-h-60 overflow-y-auto bg-gray-800/30 p-4 rounded-lg">
              <div>
                <h4 className="text-yellow-400 font-medium mb-2">1. INTRODUCTION AND ACCEPTANCE</h4>
                <p>Welcome to Spoil Me Vintage. By subscribing to a membership package, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to all of these Terms, do not use this service.</p>
              </div>

              <div>
                <h4 className="text-yellow-400 font-medium mb-2">2. MEMBERSHIP & SUBSCRIPTION SERVICES</h4>
                <p>Membership fees are billed monthly. Benefits are specific to the currency selected (ZAR for South Africa, USD for International). You may cancel at any time via your account portal.</p>
              </div>

              <div>
                <h4 className="text-yellow-400 font-medium mb-2">3. "THE SECRET VAULT" POLICY</h4>
                <p>Items from The Secret Vault are sold as-is and may include minor imperfections. All sales are final with no returns, refunds, or exchanges permitted.</p>
              </div>

              <div>
                <h4 className="text-yellow-400 font-medium mb-2">4. PAYMENT TERMS</h4>
                <p>Payments are processed securely via PayFast (ZAR) or PayPal (USD). Spoil Me Vintage does not store your full credit card details.</p>
              </div>

              <div>
                <h4 className="text-yellow-400 font-medium mb-2">5. RETURNS AND REFUNDS</h4>
                <p>Standard products may be returned within 7 days. Secret Vault items are final sale. International returns are generally not accepted due to shipping costs.</p>
              </div>

              <div>
                <h4 className="text-yellow-400 font-medium mb-2">6. LIMITATION OF LIABILITY</h4>
                <p>Spoil Me Vintage shall not be liable for allergic reactions to jewelry materials or indirect damages. Maximum liability is limited to the amount paid in the previous 3 months.</p>
              </div>

              <div>
                <h4 className="text-yellow-400 font-medium mb-2">7. GOVERNING LAW</h4>
                <p>These Terms are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the exclusive jurisdiction of the Magistrate's Court in Worcester, Western Cape.</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-yellow-400 mt-1 flex-shrink-0" size={20} />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-yellow-400 mb-2">By subscribing, you acknowledge that:</p>
                <ul className="space-y-1 text-xs">
                  <li>• You have read and understood these terms</li>
                  <li>• You agree to the monthly recurring billing</li>
                  <li>• You can cancel your subscription at any time</li>
                  <li>• Secret Vault items are sold as-is</li>
                  <li>• You may receive personalized birthday gifts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAgree}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg transition-all shadow-lg hover:shadow-yellow-500/25"
          >
            I Agree - Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
