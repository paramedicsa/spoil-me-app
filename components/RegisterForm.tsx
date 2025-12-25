import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { signUpWithEmail } from '../utils/supabaseClient';

interface RegisterFormProps {
  onSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    gender: '',
    favoriteColor: '',
    country: '',
    password: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.dob || !formData.gender || !formData.favoriteColor || !formData.country) {
      alert("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      await signUpWithEmail(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob,
        gender: formData.gender,
        favoriteColor: formData.favoriteColor,
        country: formData.country,
        email: formData.email,
        createdAt: new Date().toISOString(),
        membershipTier: 'none',
        role: 'user',
        wishlist: []
      });

      onSuccess();
    } catch (error: any) {
      console.error('Registration Error', error);
      alert(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-yellow-500"
            placeholder="First name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-yellow-500"
            placeholder="Last name"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-yellow-500"
          placeholder="Enter your email"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
          <input
            type="date"
            value={formData.dob}
            onChange={(e) => handleInputChange('dob', e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-yellow-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-yellow-500"
            required
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Favorite Color</label>
        <select
          value={formData.favoriteColor}
          onChange={(e) => handleInputChange('favoriteColor', e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-yellow-500"
          required
        >
          <option value="">Select favorite color</option>
          <option value="red">Red</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="yellow">Yellow</option>
          <option value="purple">Purple</option>
          <option value="pink">Pink</option>
          <option value="orange">Orange</option>
          <option value="black">Black</option>
          <option value="white">White</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
        <input
          type="text"
          value={formData.country}
          onChange={(e) => handleInputChange('country', e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-yellow-500"
          placeholder="Enter your country"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-3 py-2 pr-10 bg-zinc-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-yellow-500"
            placeholder="Create a password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-yellow-400"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:from-pink-400 hover:via-purple-400 hover:to-cyan-300 disabled:bg-gray-600 text-black font-bold py-2 px-4 rounded-md transition-all shadow-lg hover:shadow-[0_0_10px_rgba(236,72,153,0.5)]"
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default RegisterForm;
