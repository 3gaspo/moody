/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../providers/Providers';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signUp, signIn, error: authError, clearError } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authFormLoading, setAuthFormLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email.trim() || !password.trim()) return;

    setAuthFormLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setAuthFormLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center p-4 transition-colors duration-300" id="auth-screen-root">
      {/* Centered card using same frame widths as application */}
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[32px] border border-black/5 dark:border-white/5 shadow-2xl p-8 flex flex-col space-y-8 animate-fade-in" id="auth-screen-card">
        {/* App Logo & Welcome */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <img
            src="/moody.svg"
            alt="Moody App Icon"
            className="w-20 h-20 object-contain"
            id="auth-app-icon"
          />
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white" id="auth-welcome-title">
              Moody
            </h1>
            {isSignUp && (
              <p className="text-sm text-gray-400 dark:text-gray-500" id="auth-welcome-subtitle">
                Create a profile to start tracking your daily mood
              </p>
            )}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4" id="auth-screen-form">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500">Email Address</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full pl-11 pr-4 py-3.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                id="auth-screen-email-input"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500">Password</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secure password"
                className="w-full pl-11 pr-12 py-3.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                id="auth-screen-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={authFormLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl active:scale-98 transition-all cursor-pointer text-center text-sm shadow-md"
            id="auth-screen-submit-btn"
          >
            {authFormLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>

          {/* Toggle Button */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                clearError();
              }}
              className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:underline cursor-pointer"
              id="auth-screen-toggle-mode-btn"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Create account'}
            </button>
          </div>

          {/* Errors display */}
          {authError && (
            <div className="flex items-start space-x-2 p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-medium animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="break-all">{authError}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
