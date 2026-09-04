import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShieldCheck, ArrowRight, AlertCircle, RefreshCw, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { verifyEmail, resendOTP, unverifiedEmail, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Email to verify: from URL search params or store fallback
  const emailParam = searchParams.get('email') || unverifiedEmail || '';
  const [email, setEmail] = useState(emailParam);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  // Auto-focus first digit input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Update email if param changes
  useEffect(() => {
    if (emailParam && emailParam !== email) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleDigitChange = (index, value) => {
    // Only accept single digit numbers
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanVal;
    setOtp(newOtp);
    clearError();
    setResendSuccess('');

    // Auto-advance to next input if filled
    if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        // Move back and clear previous
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    setOtp(newOtp);
    clearError();

    // Focus next empty or last filled
    const nextIdx = Math.min(pastedData.length, 5);
    if (inputRefs.current[nextIdx]) {
      inputRefs.current[nextIdx].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      return;
    }

    if (!email) {
      return;
    }

    try {
      const user = await verifyEmail({ email, otp: fullOtp });
      navigate(user.role === 'admin' ? '/admin/documents' : '/chat');
    } catch (err) {
      // Handled in store
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending || !email) return;

    setIsResending(true);
    clearError();
    setResendSuccess('');

    try {
      await resendOTP({ email });
      setResendSuccess('A fresh verification code has been sent to your email!');
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      // Handled in store
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-slate-800 shadow-2xl animate-fade-in relative">
        {/* Glow accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-16 bg-brand-500/20 blur-3xl pointer-events-none" />

        {/* Top Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-center text-white tracking-tight mb-1">
          Verify Your Email
        </h2>
        <p className="text-xs text-center text-slate-400 mb-2">
          We sent a 6-digit verification code to
        </p>
        <div className="flex items-center justify-center gap-1.5 mb-6">
          <span className="text-xs font-semibold text-brand-300 bg-brand-950/60 border border-brand-800/60 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-brand-400" />
            {email || 'your email'}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Resend Success Alert */}
        {resendSuccess && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{resendSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6 Digit Input Group */}
          <div>
            <label className="block text-xs font-semibold text-center text-slate-300 mb-3">
              Enter 6-Digit Code
            </label>
            <div className="flex items-center justify-center gap-2.5 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl bg-slate-900 border transition-all duration-150 focus:outline-none ${
                    digit
                      ? 'border-brand-500 text-white shadow-md shadow-brand-500/10 bg-slate-800/80'
                      : 'border-slate-700 text-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.join('').length < 6 || !email}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40 disabled:hover:scale-100"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              <>
                <span>Verify & Activate Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend Actions */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400 mb-2">
            Didn't receive the email code?
          </p>
          {cooldown > 0 ? (
            <span className="text-xs text-slate-500 font-medium inline-flex items-center gap-1.5">
              Resend available in <span className="text-brand-400 font-semibold">{cooldown}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Resending Code...' : 'Resend Verification Code'}
            </button>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
