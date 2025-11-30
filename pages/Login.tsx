

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Lock, Mail, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(email, password);
    if (success) {
      navigate('/admin');
    } else {
      setError('Invalid credentials. Please check your email and password.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 space-y-8 bg-zinc-900 rounded-2xl border border-gray-800 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-handwriting font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to access your account
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]"
          >
            Sign In <ArrowRight size={16} />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Don't have an account? <span className="text-gray-400">Registration is currently invite only.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;