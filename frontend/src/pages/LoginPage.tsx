import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { User } from '../types';

export const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', { phone, pin });
      login(res.data.token, res.data.user);

      const role = res.data.user.role;
      if (role === 'SUPER_ADMIN') navigate('/admin');
      else if (role === 'TDE') navigate('/tde');
      else if (role === 'MASTER_AGENT') navigate('/ma');
      else if (role === 'REBALANCER') navigate('/rebalancer');
      else navigate('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #00843D 0%, #006630 50%, #1a1a2e 100%)' }}>
      {/* Header */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #00843D, #E4007C)' }}>
              <span className="text-white font-black text-3xl">Z</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">ZLMS</h1>
            <p className="text-green-200 text-sm mt-1">Zamtel Liquidity Management System</p>
            <p className="text-green-300 text-xs mt-0.5 italic">Create Your World</p>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-2xl shadow-2xl p-7">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Sign In</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0970000001"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  required
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  6-Digit PIN
                </label>
                <input
                  type="password"
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.slice(0, 6))}
                  maxLength={6}
                  pattern="\d{6}"
                  className="input tracking-widest text-center text-xl"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading || pin.length !== 6}
                className="btn-primary w-full mt-2"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">
              Demo: Phone 0970000001 · PIN 123456
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-green-300 text-xs mt-6 opacity-70">
            © 2026 Zamtel · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
};
