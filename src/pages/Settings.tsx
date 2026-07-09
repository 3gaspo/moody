/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth, useData } from '../providers/Providers';
import { firebaseReady } from '../lib/firebase';
import {
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Download,
  RotateCcw,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Heart,
  Palette,
  Check,
  AlertTriangle,
  X
} from 'lucide-react';
import { Mood, MoodEntry } from '../types';

// Constants to customize easily
const SUPPORT_URL = 'https://ko-fi.com/3gaspo';
const APP_VERSION = '0.0.0';

export const SettingsPage: React.FC = () => {
  const { user, signUp, signIn, signOut, error: authError, clearError } = useAuth();
  const {
    moods,
    entries,
    settings,
    addMood,
    updateMood,
    deleteMood,
    updateThemeSetting,
    clearHistory,
    resetAll,
    loading: dataLoading
  } = useData();

  const isDevMode = !firebaseReady;

  // App settings state
  const [showAddMoodModal, setShowAddMoodModal] = useState(false);
  const [newMoodName, setNewMoodName] = useState('');
  const [newMoodColor, setNewMoodColor] = useState('#3b82f6');
  const [moodError, setMoodError] = useState<string | null>(null);

  // Edit Mood state
  const [editingMood, setEditingMood] = useState<Mood | null>(null);
  const [editMoodName, setEditMoodName] = useState('');
  const [editMoodColor, setEditMoodColor] = useState('');

  // Reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [deletingMoodId, setDeletingMoodId] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authFormLoading, setAuthFormLoading] = useState(false);

  // Toggle Dark Mode
  const handleToggleDarkMode = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateThemeSetting(nextTheme);
  };

  // Create Mood
  const handleCreateMood = async (e: React.FormEvent) => {
    e.preventDefault();
    setMoodError(null);
    if (!newMoodName.trim()) {
      setMoodError('Please enter a mood name.');
      return;
    }
    try {
      await addMood(newMoodName, newMoodColor);
      setNewMoodName('');
      setNewMoodColor('#3b82f6');
      setShowAddMoodModal(false);
    } catch (err: any) {
      setMoodError(err.message || 'Failed to add mood.');
    }
  };

  // Edit Mood Submit
  const handleEditMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMoodError(null);
    if (!editingMood) return;
    if (!editMoodName.trim()) {
      setMoodError('Mood name cannot be empty.');
      return;
    }
    try {
      await updateMood(editingMood.id, editMoodName, editMoodColor);
      setEditingMood(null);
    } catch (err: any) {
      setMoodError(err.message || 'Failed to update mood.');
    }
  };

  // Auth Form Submit
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

  // CSV Export
  const handleCSVExport = () => {
    // Columns: date,mood_id,mood_name,mood_color,note,created_at,updated_at
    const headers = ['date', 'mood_id', 'mood_name', 'mood_color', 'note', 'created_at', 'updated_at'];
    
    const rows = Object.values(entries).map((entry: MoodEntry) => {
      const mood = entry.moodId ? moods.find(m => m.id === entry.moodId) : null;
      
      const escapeValue = (val: string | null | undefined) => {
        if (!val) return '';
        let str = String(val).replace(/"/g, '""');
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str}"`;
        }
        return str;
      };

      return [
        escapeValue(entry.date),
        escapeValue(mood ? entry.moodId : ''),
        escapeValue(mood ? mood.name : ''),
        escapeValue(mood ? mood.color : ''),
        escapeValue(entry.note),
        escapeValue(entry.createdAt),
        escapeValue(entry.updatedAt)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `moody-data-${todayStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset Modal Handlers
  const handleClearHistory = async () => {
    setIsResetting(true);
    try {
      await clearHistory();
      setShowResetModal(false);
    } catch (err) {
      console.error('Reset entries error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetAll = async () => {
    setIsResetting(true);
    try {
      await resetAll();
      setShowResetModal(false);
    } catch (err) {
      console.error('Reset all error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in" id="settings-view">
      {/* Page Title & Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white" id="settings-title">
            Settings
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Control Panel &amp; Options
          </p>
        </div>
        {isDevMode && (
          <span className="text-xs font-black tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase" id="dev-mode-label">
            Dev Mode
          </span>
        )}
      </div>

      {/* SECTION 1: Moods Settings (App-Specific) */}
      <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[32px] space-y-6" id="moods-settings-section">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              App-specific
            </span>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Moods
            </h2>
          </div>
          <button
            onClick={() => {
              setMoodError(null);
              setShowAddMoodModal(true);
            }}
            className="flex items-center space-x-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-transform active:scale-95 cursor-pointer shadow-sm"
            id="add-mood-trigger"
          >
            <Plus className="w-4 h-4" />
            <span>Add Mood</span>
          </button>
        </div>

        {/* Mood List */}
        <div className="space-y-3" id="settings-moods-list">
          {moods.map((mood) => (
            <div
              key={mood.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center space-x-4">
                <span
                  className="w-8 h-8 rounded-full shadow-inner flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: mood.color }}
                />
                <span className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                  {mood.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {deletingMoodId === mood.id ? (
                  <div className="flex items-center space-x-1.5 bg-red-500/10 p-1.5 rounded-2xl border border-red-500/20 animate-fade-in">
                    <button
                      onClick={async () => {
                        try {
                          await deleteMood(mood.id);
                          setDeletingMoodId(null);
                        } catch (err: any) {
                          setMoodError(err.message || 'Failed to delete mood.');
                          setDeletingMoodId(null);
                        }
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-transform active:scale-95 cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeletingMoodId(null)}
                      className="px-3 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-transform active:scale-95 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingMood(mood);
                        setEditMoodName(mood.name);
                        setEditMoodColor(mood.color);
                        setMoodError(null);
                        setDeletingMoodId(null);
                      }}
                      className="p-2.5 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                      title="Edit Mood"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (moods.length <= 1) {
                          setMoodError('You cannot delete the last mood. At least one mood configuration must remain.');
                          return;
                        }
                        setMoodError(null);
                        setDeletingMoodId(mood.id);
                      }}
                      disabled={moods.length <= 1}
                      className="p-2.5 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Delete Mood"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Appearance */}
      <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[32px] space-y-5" id="appearance-settings-section">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Appearance
          </span>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Theme
          </h2>
        </div>

        {/* Toggle Dark mode switch row */}
        <div className="flex items-center justify-between p-5 bg-white dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <span className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl">
              <Palette className="w-5 h-5" />
            </span>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Dark Mode</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Toggle dark visual mode</p>
            </div>
          </div>

          {/* Pill Switch */}
          <button
            onClick={handleToggleDarkMode}
            className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none ${
              settings.theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            id="theme-pill-switch"
          >
            <span
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* SECTION 3: Account (Sign in / Create Account, or Display Signed In profile) */}
      <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[32px] space-y-5" id="account-settings-section">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Account Management
          </span>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Account
          </h2>
        </div>

        {user ? (
          /* Logged In */
          <div className="flex items-center space-x-4 p-5 bg-white dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm" id="signed-in-account-card">
            <span className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner">
              <User className="w-6 h-6" />
            </span>
            <div className="flex-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block">
                Logged In User
              </span>
              <p className="font-bold text-gray-800 dark:text-gray-100 text-lg break-all">
                {user.email}
              </p>
            </div>
          </div>
        ) : (
          /* Signed Out Auth Form */
          <form onSubmit={handleAuthSubmit} className="p-6 bg-white dark:bg-black/20 rounded-3xl border border-black/5 dark:border-white/5 shadow-md space-y-4" id="signed-out-auth-form">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
              {isSignUp ? 'Create account' : 'Sign in or Create account'}
            </h3>

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
                  className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  id="auth-email-input"
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
                  className="w-full pl-11 pr-12 py-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  id="auth-password-input"
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

            {/* Submit Auth Button */}
            <button
              type="submit"
              disabled={authFormLoading}
              className="w-full py-3.5 bg-black dark:bg-white dark:text-black text-white font-bold rounded-xl hover:opacity-90 active:scale-98 transition-all cursor-pointer text-center text-sm shadow-sm"
              id="auth-submit-btn"
            >
              {authFormLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>

            {/* Toggle Sign-In / Create Account Mode */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  clearError();
                }}
                className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:underline cursor-pointer"
                id="toggle-auth-mode-btn"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Create account'}
              </button>
            </div>

            {/* Error displays */}
            {authError && (
              <div className="flex items-start space-x-2 p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="break-all">{authError}</p>
              </div>
            )}
          </form>
        )}
      </div>

      {/* SECTION 4: Actions (Disconnect, Download, Reset) */}
      <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[32px] space-y-4" id="actions-settings-section">
        <div className="space-y-1 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            System Commands
          </span>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Actions
          </h2>
        </div>

        {/* 1. Disconnect / Sign out */}
        {user && (
          showSignOutConfirm ? (
            <div 
              className="w-full p-5 bg-orange-500/5 dark:bg-orange-500/10 rounded-2xl border border-orange-500/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in"
              id="action-disconnect-confirm-box"
            >
              <div className="flex items-center space-x-3 text-left">
                <span className="p-2 bg-orange-500/20 text-orange-500 rounded-xl">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                </span>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">Sign out of session?</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">You will need to sign back in to access synced historical states.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={async () => {
                    try {
                      await signOut();
                      setShowSignOutConfirm(false);
                    } catch (err) {
                      console.error('Sign out error:', err);
                    }
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Confirm Sign Out
                </button>
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  className="px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="w-full flex items-center justify-between p-5 bg-white dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm text-left hover:shadow-md transition-shadow active:scale-99 cursor-pointer"
              id="action-disconnect-btn"
            >
              <div className="flex items-center space-x-3.5">
                <span className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
                  <LogOut className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-base">Disconnect / Sign out</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Safely log out of your profile session</p>
                </div>
              </div>
            </button>
          )
        )}

        {/* 2. Download data as CSV */}
        <button
          onClick={handleCSVExport}
          className="w-full flex items-center justify-between p-5 bg-white dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm text-left hover:shadow-md transition-shadow active:scale-99 cursor-pointer"
          id="action-download-csv-btn"
        >
          <div className="flex items-center space-x-3.5">
            <span className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
              <Download className="w-5 h-5" />
            </span>
            <div>
              <p className="font-bold text-gray-800 dark:text-gray-100 text-base">Download data as CSV</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Export logged entries to moody-data-YYYY-MM-DD.csv</p>
            </div>
          </div>
        </button>

        {/* 3. Reset data (Red theme) */}
        <button
          onClick={() => setShowResetModal(true)}
          className="w-full flex items-center justify-between p-5 bg-red-500/5 hover:bg-red-500/10 dark:bg-red-500/5 dark:hover:bg-red-500/10 rounded-2xl border border-red-500/10 text-left transition-colors active:scale-99 cursor-pointer"
          id="action-reset-data-btn"
        >
          <div className="flex items-center space-x-3.5">
            <span className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </span>
            <div>
              <p className="font-bold text-red-600 dark:text-red-500 text-base">Reset data</p>
              <p className="text-xs text-red-500/70">Wipe statistics history or reseed default layouts</p>
            </div>
          </div>
        </button>
      </div>

      {/* SECTION 5: Footer credits */}
      <div className="pt-8 flex flex-col items-center justify-center text-center space-y-6 border-t border-black/5 dark:border-white/5" id="settings-footer-section">
        {/* Credit Logo */}
        <div className="w-40 h-40 flex items-center justify-center rounded-[32px] overflow-hidden bg-black/5 dark:bg-white/5">
          <img
            src="/gaspo_logo.svg"
            alt="Gaspard Berthelier Logo"
            className="w-32 h-32 object-contain"
            onError={(e) => {
              // Hide or render fallback text if missing
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Support the project button */}
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-black dark:bg-white dark:text-black text-white rounded-full font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          id="support-project-link"
        >
          <Heart className="w-4 h-4 fill-red-500 stroke-red-500" />
          <span>Support the project</span>
        </a>

        {/* Text credits */}
        <div className="space-y-1 text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider opacity-80">
          <p>Moody &mdash; version {APP_VERSION}</p>
          <p>GASPARD BERTHELIER</p>
          <p className="lowercase">gberthelier.projet@gmail.com</p>
        </div>
      </div>

      {/* MODAL: ADD MOOD */}
      {showAddMoodModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={() => setShowAddMoodModal(false)}
        >
          <form
            onSubmit={handleCreateMood}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[32px] p-8 space-y-5 shadow-xl border border-black/5 dark:border-white/5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Mood</h3>
              <button
                type="button"
                onClick={() => setShowAddMoodModal(false)}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-gray-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500">Mood Label Name</label>
                <input
                  type="text"
                  required
                  value={newMoodName}
                  onChange={(e) => setNewMoodName(e.target.value)}
                  placeholder="e.g. Creative, Tired, Peaceful"
                  className="w-full p-3.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 block">Mood Color swatch</label>
                <div className="flex items-center space-x-3 bg-black/5 dark:bg-white/5 p-3.5 rounded-xl border border-black/10 dark:border-white/10">
                  <input
                    type="color"
                    value={newMoodColor}
                    onChange={(e) => setNewMoodColor(e.target.value)}
                    className="w-10 h-10 border-0 rounded-md cursor-pointer overflow-hidden p-0 bg-transparent"
                  />
                  <span className="text-sm font-semibold uppercase text-gray-600 dark:text-gray-300">
                    {newMoodColor}
                  </span>
                </div>
              </div>

              {moodError && (
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{moodError}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-3">
              <button
                type="submit"
                className="flex-1 py-3 px-4 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl active:scale-95 transition-transform cursor-pointer shadow-sm"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowAddMoodModal(false)}
                className="py-3 px-5 font-bold text-gray-700 dark:text-gray-300 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT MOOD */}
      {editingMood && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={() => setEditingMood(null)}
        >
          <form
            onSubmit={handleEditMoodSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[32px] p-8 space-y-5 shadow-xl border border-black/5 dark:border-white/5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Mood</h3>
              <button
                type="button"
                onClick={() => setEditingMood(null)}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-gray-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500">Mood Label Name</label>
                <input
                  type="text"
                  required
                  value={editMoodName}
                  onChange={(e) => setEditMoodName(e.target.value)}
                  className="w-full p-3.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 block">Mood Color swatch</label>
                <div className="flex items-center space-x-3 bg-black/5 dark:bg-white/5 p-3.5 rounded-xl border border-black/10 dark:border-white/10">
                  <input
                    type="color"
                    value={editMoodColor}
                    onChange={(e) => setEditMoodColor(e.target.value)}
                    className="w-10 h-10 border-0 rounded-md cursor-pointer overflow-hidden p-0 bg-transparent"
                  />
                  <span className="text-sm font-semibold uppercase text-gray-600 dark:text-gray-300">
                    {editMoodColor}
                  </span>
                </div>
              </div>

              {moodError && (
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{moodError}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-3">
              <button
                type="submit"
                className="flex-1 py-3 px-4 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl active:scale-95 transition-transform cursor-pointer shadow-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingMood(null)}
                className="py-3 px-5 font-bold text-gray-700 dark:text-gray-300 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESET DATA MODAL */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={() => {
            if (!isResetting) setShowResetModal(false);
          }}
          id="reset-confirmation-modal"
        >
          <div
            className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[32px] p-8 space-y-6 shadow-xl border border-black/5 dark:border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 text-red-500">
              <AlertTriangle className="w-7 h-7" />
              <h3 className="text-xl font-bold">Reset Data</h3>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Are you sure you want to proceed? Choose an action below to wipe data. This action is permanent and cannot be undone.
            </p>

            <div className="flex flex-col space-y-3 pt-2">
              {/* Clear History */}
              <button
                onClick={handleClearHistory}
                disabled={isResetting}
                className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-2xl transition-all active:scale-98 disabled:opacity-50 cursor-pointer text-center text-sm"
                id="clear-history-btn"
              >
                {isResetting ? 'Processing...' : 'Clear History'}
              </button>

              {/* Reset All */}
              <button
                onClick={handleResetAll}
                disabled={isResetting}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all active:scale-98 disabled:opacity-50 cursor-pointer text-center text-sm"
                id="reset-all-btn"
              >
                {isResetting ? 'Processing...' : 'Reset All'}
              </button>

              {/* Cancel */}
              <button
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="w-full py-3.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all active:scale-98 disabled:opacity-50 cursor-pointer text-center text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
