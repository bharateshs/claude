import React, { useState } from 'react';
import { Eye, EyeOff, BarChart3 } from 'lucide-react';
import { login } from '../lib/api';
import { useAuthStore } from '../store/auth';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { email: 'admin@dashboard.com', password: 'admin123', label: 'Admin (all clients)', role: 'admin' },
  { email: 'techcorpinc@client.com', password: 'client123', label: 'TechCorp Inc.', role: 'client' },
  { email: 'retailbrandco@client.com', password: 'client123', label: 'RetailBrand Co.', role: 'client' },
  { email: 'financehubltd@client.com', password: 'client123', label: 'FinanceHub Ltd.', role: 'client' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login: storeLogin } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter email and password');
    setLoading(true);
    try {
      const res = await login(email, password);
      storeLogin(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #030712 0%, #0f172a 50%, #030712 100%)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl mx-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Branding */}
        <div className="flex flex-col justify-center p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">SocialPulse</div>
              <div className="text-sm text-gray-500">Analytics Dashboard</div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Real-time Social<br />Media Intelligence
          </h1>
          <p className="text-gray-400 mb-8">
            Monitor Instagram, Facebook, LinkedIn, X/Twitter, and YouTube metrics. Track media spends, get AI-powered insights.
          </p>
          <div className="space-y-2">
            {['Real-time multi-platform analytics', 'Media spends & ROI tracking', 'AI-powered insights & recommendations', 'Export to XLSX, PDF & PPT'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-6">Access your analytics dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gray-900 px-2 text-gray-600">Demo Accounts</span>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => quickLogin(acc)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 transition-all text-sm group"
                >
                  <div className="text-left">
                    <div className="text-gray-300 font-medium">{acc.label}</div>
                    <div className="text-gray-600 text-xs">{acc.email}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    acc.role === 'admin' ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/20 text-blue-400'
                  }`}>
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
