import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/authContext';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage } from '../lib/httpError';
import { api } from '../api/axios';
import Logo from '../assets/budgetbuddy-logo.png';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('you@example.com');
  const [password, setPassword] = useState('P@ssw0rd!');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Modal State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetToken, setResetToken] = useState('');

  // New Password Reset State
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(email, password);
      nav('/');
    } catch (ex: unknown) {
      setErr(getErrorMessage(ex, 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestReset(e: FormEvent) {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    try {
      // Generate a simple reset token
      const response = await api.post('/api/auth/request-password-reset', { 
        email: resetEmail 
      });
      
      setResetToken(response.data.token);
      setResetSuccess(true);
    } catch (ex: unknown) {
      setResetError(getErrorMessage(ex, 'User not found or error occurred'));
    } finally {
      setResetLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setResetError('');

    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters');
      return;
    }

    setResetLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        email: resetEmail,
        token: resetToken,
        newPassword: newPassword
      });

      // Success! Close modal and show success message
      alert('Password reset successful! You can now login with your new password.');
      closeForgotPasswordModal();
    } catch (ex: unknown) {
      setResetError(getErrorMessage(ex, 'Failed to reset password'));
    } finally {
      setResetLoading(false);
    }
  }

  function closeForgotPasswordModal() {
    setShowForgotPassword(false);
    setShowResetForm(false);
    setResetEmail('');
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetSuccess(false);
    setResetError('');
  }

  function proceedToReset() {
    setShowResetForm(true);
    setResetSuccess(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bb-gradient-animate">
      <div className="w-full max-w-md">
        {/* Logo & Welcome */}
        <div className="text-center mb-8 bb-float">
          <img src={Logo} alt="BudgetBuddy" className="h-16 w-auto mx-auto mb-4 drop-shadow-2xl" />
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back!</h1>
          <p className="text-white/90 text-lg">Sign in to manage your finances</p>
        </div>

        {/* Login Card */}
        <div className="bb-glass p-8 shadow-2xl">
          <form onSubmit={onSubmit} className="space-y-6">
            {err && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 animate-shake">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                </svg>
                <span className="text-sm text-red-800">{String(err)}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  className="bb-input pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="bb-input pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-slate-400 hover:text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-slate-400 hover:text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2" />
                <span className="ml-2 text-sm text-slate-700">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bb-btn-primary flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-700">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition">
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Demo Credentials Note */}
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-900 mb-1">💡 Demo Account:</p>
            <p className="text-xs text-indigo-700">Email: you@example.com</p>
            <p className="text-xs text-indigo-700">Password: P@ssw0rd!</p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-white/90">
            <div className="text-2xl mb-1">💰</div>
            <p className="text-xs font-medium">Track Expenses</p>
          </div>
          <div className="text-white/90">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs font-medium">View Analytics</p>
          </div>
          <div className="text-white/90">
            <div className="text-2xl mb-1">🤖</div>
            <p className="text-xs font-medium">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bb-card p-8 max-w-md w-full animate-slide-in">
            {!resetSuccess && !showResetForm ? (
              <>
                {/* Step 1: Enter Email */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
                  <button
                    onClick={closeForgotPasswordModal}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-slate-600 mb-6">
                  Enter your email address to receive a password reset code.
                </p>

                <form onSubmit={handleRequestReset} className="space-y-6">
                  {resetError && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                      <p className="text-sm text-red-800">{resetError}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        className="bb-input pl-10"
                        placeholder="you@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeForgotPasswordModal}
                      className="flex-1 bb-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bb-btn-primary flex items-center justify-center gap-2"
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        'Get Reset Code'
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : resetSuccess && !showResetForm ? (
              <>
                {/* Step 2: Show Token */}
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Your Reset Code</h3>
                  
                  <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-4 mb-4">
                    <p className="text-xs text-slate-600 mb-2">Copy this code:</p>
                    <code className="text-2xl font-mono font-bold text-indigo-600 select-all">
                      {resetToken}
                    </code>
                  </div>

                  <p className="text-sm text-slate-600 mb-6">
                    Use this code to reset your password. Keep it safe!
                  </p>

                  <button
                    onClick={proceedToReset}
                    className="bb-btn-primary w-full"
                  >
                    Continue to Reset Password
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Step 3: Enter New Password */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Set New Password</h2>
                  <button
                    onClick={closeForgotPasswordModal}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  {resetError && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                      <p className="text-sm text-red-800">{resetError}</p>
                    </div>
                  )}

                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <p className="text-xs text-indigo-900">
                      <strong>Reset Code:</strong> <code className="font-mono">{resetToken}</code>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="bb-input"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="bb-input"
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bb-btn-primary flex items-center justify-center gap-2"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}