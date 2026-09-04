import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate('/chat');
    } catch (err) {
      // Error handled in store
    }
  };

  const handleQuickFill = (role) => {
    clearError();
    if (role === 'admin') {
      setEmail('admin@campusmind.edu');
      setPassword('admin123456');
    } else {
      setEmail('student@campusmind.edu');
      setPassword('student123456');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-slate-800 shadow-2xl animate-fade-in relative">
        {/* Top Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-center text-white tracking-tight mb-1">
          Welcome Back to CampusMind
        </h2>
        <p className="text-xs text-center text-slate-400 mb-6">
          Sign in to access grounded college answers and document tools
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col gap-2 text-xs text-rose-300">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes('verify') && email && (
              <div className="pl-6.5">
                <Link
                  to={`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                  className="inline-flex items-center gap-1 font-semibold text-brand-400 hover:text-brand-300 hover:underline"
                >
                  Enter verification code here &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative rounded-xl bg-slate-900 border border-slate-700/80 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                }}
                placeholder="student@campusmind.edu"
                className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative rounded-xl bg-slate-900 border border-slate-700/80 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Signing In...
              </span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-medium text-slate-400 text-center mb-2.5">
            ⚡ Quick Test / Demo Accounts (Auto-fill)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('student')}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-brand-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              Student Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-amber-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Admin Demo
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
