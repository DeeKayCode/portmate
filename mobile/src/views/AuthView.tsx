import React, { useState } from 'react';
import { store } from '../api/store';
import { Anchor, ShieldCheck, Mail, Lock, User as UserIcon, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthViewProps {
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verifyToken, setVerifyToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await store.login(email.trim(), password);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      if (msg.toLowerCase().includes('verification required')) {
        setError('Email verification required. Please enter your verification token.');
        setMode('verify');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (password.length < 12) {
      setError('Password must be at least 12 characters.');
      return;
    }

    if (!/^[A-Za-z0-9_]{3,32}$/.test(username.trim())) {
      setError('Username must be 3-32 characters and contain only letters, numbers, and underscores.');
      return;
    }

    setLoading(true);
    try {
      const res = await store.register(email.trim(), password, username.trim());
      if (res && res.verificationRequired) {
        setInfo(`Account created for ${email}! A verification token was generated. Enter it below to activate your account.`);
        setMode('verify');
      } else {
        setInfo('Account created! Please sign in.');
        setMode('login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!verifyToken.trim()) {
      setError('Please enter your verification token.');
      return;
    }

    setLoading(true);
    try {
      await store.verifyEmail(verifyToken.trim());
      setInfo('Email verified successfully! You can now sign in with your credentials.');
      setMode('login');
      setPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    resetMessages();
    const token = prompt('Enter Google ID token (or simulated token):');
    if (!token) return;

    setLoading(true);
    try {
      await store.googleLogin(token.trim());
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google authentication unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-4 py-8">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
          <Anchor className="h-8 w-8" />
        </div>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">PortMate</h1>
        <p className="mt-1 text-xs text-slate-500">Cross paths with friends across the world's cruise ports</p>
      </div>

      {/* Main Auth Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => { resetMessages(); setMode('login'); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === 'login' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { resetMessages(); setMode('register'); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === 'register' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => { resetMessages(); setMode('verify'); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === 'verify' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Verify
          </button>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{info}</span>
          </div>
        )}

        {/* Mode: Sign In */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sailor@cruises.org"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-brand-dark active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Mode: Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="captain_dave"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">3-32 characters (letters, numbers, underscores)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sailor@cruises.org"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Must be at least 12 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-brand-dark active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Mode: Verify Email */}
        {mode === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Verification Token</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="Paste token received via email"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Check your inbox or test runner output for the verification code.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-brand-dark active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}

        {/* Google Alternative */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-98 disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4 text-brand" />
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
