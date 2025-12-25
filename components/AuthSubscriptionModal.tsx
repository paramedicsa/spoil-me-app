import React, { useState } from 'react';
import { Eye, EyeOff, X, Calendar, User, Mail, Lock, Heart } from 'lucide-react';
import { signUpWithEmail } from '@repo/utils/supabaseClient';

interface AuthSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: {
    name: string;
    amount: number;
    currency: 'ZAR' | 'USD';
  };
  onSuccess: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  dob: string;
  gender: string;
  favoriteColor: string;
  password: string;
}

const AuthSubscriptionModal: React.FC<AuthSubscriptionModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  onSuccess
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    gender: '',
    favoriteColor: '',
    password: ''
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignupAndSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      alert("Please agree to the Terms and Conditions.");
      return;
    }

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email ||
        !formData.dob || !formData.gender || !formData.favoriteColor || !formData.password) {
      alert("Please fill in all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // Use Supabase sign up helper which also creates the profile row
      await signUpWithEmail(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob,
        gender: formData.gender,
        favoriteColor: formData.favoriteColor,
        email: formData.email,
        createdAt: new Date().toISOString(),
        membershipTier: 'none',
        role: 'user',
        affiliateCode: '', // will be set server-side or on first update
        affiliateStats: {
          status: 'none',
          totalSalesCount: 0,
          totalSalesValue: 0,
          commissionRate: 0,
          balance: 0,
          recurringBalance: 0,
          vaultPurchasesThisMonth: 0,
          membershipMonths: 0,
          weeklyMilestones: {
            membershipsSold: 0,
            salesValue: 0,
            vaultItemsSold: 0,
            weekStart: new Date().toISOString()
          }
        },
        wishlist: [],
        notifications: [],
        isAdmin: false,
        loyaltyPoints: 0,
        isMember: false
      });

      // Close modal & proceed with payment flow
      onClose();
      onSuccess();

    } catch (error: any) {
      console.error("Signup Error", error);
      alert(error.message || "An error occurred during signup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-gray-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              Create Account to Subscribe
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              You selected the <span className="text-blue-400 font-semibold">{selectedPlan.name}</span> Plan
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSignupAndSubscribe} className="p-6 space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 rounded-lg focus:border-blue-400 focus:outline-none"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 rounded-lg focus:border-blue-400 focus:outline-none"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 pl-10 rounded-lg focus:border-blue-400 focus:outline-none"
                placeholder="john@example.com"
                required
              />
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* DOB and Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Date of Birth *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white p-3 pl-10 rounded-lg focus:border-blue-400 focus:outline-none"
                  required
                />
                <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
              </div>
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Gender *
              </label>
              <div className="relative">
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white p-3 pl-10 rounded-lg focus:border-blue-400 focus:outline-none appearance-none"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
              </div>
            </div>
          </div>

          {/* Favorite Color */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Favorite Color *
            </label>
            <div className="relative">
              <select
                value={formData.favoriteColor}
                onChange={(e) => handleInputChange('favoriteColor', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 pl-10 rounded-lg focus:border-blue-400 focus:outline-none appearance-none"
                required
              >
                <option value="">Choose your favorite color</option>
                <option value="Red">Red</option>
                <option value="Blue">Blue</option>
                <option value="Green">Green</option>
                <option value="Purple">Purple</option>
                <option value="Pink">Pink</option>
                <option value="Yellow">Yellow</option>
                <option value="Orange">Orange</option>
                <option value="Black">Black</option>
                <option value="White">White</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
              </select>
              <Heart className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 pl-10 pr-12 rounded-lg focus:border-blue-400 focus:outline-none"
                placeholder="Create a strong password"
                required
                minLength={6}
              />
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-1">Minimum 6 characters</p>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-purple-400 bg-gray-700 border-gray-600 rounded focus:ring-purple-400 focus:ring-2"
              />
              <div className="text-sm">
                <span className="text-gray-300">
                  I agree to the{' '}
                  <button
                    type="button"
                    className="text-purple-400 hover:text-purple-300 underline"
                    onClick={() => window.open('/terms', '_blank')}
                  >
                    Terms and Conditions
                  </button>
                </span>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!agreedToTerms || isLoading}
            className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all ${
              agreedToTerms && !isLoading
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white shadow-lg hover:shadow-purple-500/25'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                Creating Account...
              </div>
            ) : (
              `Create Account & Pay ${selectedPlan.currency === 'USD' ? '$' : 'R'}${selectedPlan.amount}`
            )}
          </button>

          <p className="text-gray-400 text-xs text-center">
            By creating an account, you agree to receive personalized birthday gifts based on your favorite color.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthSubscriptionModal;
