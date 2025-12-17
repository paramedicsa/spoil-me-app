import React from 'react';
import { UserPlus, LogIn, X } from 'lucide-react';

interface AuthChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseLogin: () => void;
  onChooseSignup: () => void;
  planName: string;
  planAmount: number;
  currency: 'ZAR' | 'USD';
}

const AuthChoiceModal: React.FC<AuthChoiceModalProps> = ({
  isOpen,
  onClose,
  onChooseLogin,
  onChooseSignup,
  planName,
  planAmount,
  currency
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-gray-700 rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              Account Required
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Please sign in or create an account to continue
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Options */}
          <div className="space-y-4">
            <button
              onClick={onChooseLogin}
              className="w-full flex items-center gap-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl hover:bg-blue-900/30 transition-all group"
            >
              <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <LogIn className="text-blue-400" size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Sign In</h3>
                <p className="text-gray-400 text-sm">Already have an account? Continue here</p>
              </div>
            </button>

            <button
              onClick={onChooseSignup}
              className="w-full flex items-center gap-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl hover:bg-purple-900/30 transition-all group"
            >
              <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                <UserPlus className="text-purple-400" size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Create Account</h3>
                <p className="text-gray-400 text-sm">New to Spoil Me? Sign up now</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthChoiceModal;
