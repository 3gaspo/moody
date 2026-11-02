import { ActionButton } from '@3gaspo/app-ui/ActionButton';
import { ValidatedForm } from '../components/ValidatedForm';
import { SettingsSwitch } from '../components/SettingsSwitch';
import { PageHeader } from '../components/PageHeader';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';
import { Dialog, DialogActions } from '../components/Dialog';
import { AddMoodDialog } from '../components/AddMoodDialog';
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
import packageJson from '../../package.json';

// Constants to customize easily
const SUPPORT_URL = 'https://ko-fi.com/3gaspo';
const APP_VERSION = packageJson.version;

export const SettingsPage: React.FC = () => {
  const editFormId = useId();
  const { user, signUp, signIn, signOut, error: authError, clearError } = useAuth();
  const {
    moods,
    entries,
    settings,
    updateMood,
    deleteMood,
    resetMoods,
    updateThemeSetting,
    clearHistory,
    resetAll,
    loading: dataLoading
  } = useData();

  const isDevMode = !firebaseReady;

  // App settings state
  const [showAddMoodModal, setShowAddMoodModal] = useState(false);
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
  const handleResetMoods = async () => {
    setIsResetting(true);
    try {
      await resetMoods();
      setShowResetModal(false);
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearHistory = async () => {
    setIsResetting(true);
    try {
      await clearHistory();
      setShowResetModal(false);
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetAll = async () => {
    setIsResetting(true);
    try {
      await resetAll();
      setShowResetModal(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in" id="settings-view">
      {/* Page Title & Header */}
      <PageHeader title="Settings" devMode={isDevMode} titleId="settings-title" devModeId="dev-mode-label" />

      {/* SECTION 1: Moods Settings (App-Specific) */}
      <div className="ui-section-card bg-ui-section p-8 rounded-[32px] space-y-6" id="moods-settings-section">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="ui-section-title">
              Moods
            </h2>
          </div>
          <ActionButton scope="moody-settings"
            onClick={() => {
              setMoodError(null);
              setShowAddMoodModal(true);
            }}
            className="ui-button flex items-center space-x-1 text-xs font-bold bg-ui-primary hover:bg-ui-primary-hover text-ui-primary-text px-4 py-2 rounded-full transition-transform cursor-pointer shadow-sm"
            id="add-mood-trigger"
          >
            <Plus className="w-4 h-4" />
            <span>Add mood</span>
          </ActionButton>
        </div>

        {/* Mood List */}
        <div className="space-y-3" id="settings-moods-list">
          {moods.map((mood) => (
            <div
              key={mood.id}
              className={`ui-setting-list-row ui-setting-mood ui-item-card bg-ui-surface border border-ui-border shadow-sm ${deletingMoodId === mood.id ? 'ui-setting-mood--confirm' : ''}`}
            >
              <div className="flex items-center space-x-4">
                <span
                  className="w-8 h-8 rounded-full shadow-inner flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: mood.color }}
                />
                <span title={mood.name} className="ui-setting-list-name font-semibold text-ui-text text-base">
                  {mood.name}
                </span>
              </div>
              <div className="ui-setting-list-actions">
                {deletingMoodId === mood.id ? (
                  <div className="flex items-center space-x-1.5 bg-red-500/10 p-1.5 rounded-2xl border border-red-500/20 animate-fade-in">
                    <ActionButton scope="moody-settings"
                      onClick={async () => {
                        try {
                          await deleteMood(mood.id);
                          setDeletingMoodId(null);
                        } catch (err: any) {
                          setMoodError(err.message || 'Failed to delete mood.');
                        }
                      }}
                      className="ui-button ui-button-danger px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-transform cursor-pointer"
                    >
                      Delete
                    </ActionButton>
                    <ActionButton scope="moody-settings"
                      onClick={() => setDeletingMoodId(null)}
                      className="ui-button ui-button-secondary px-3 py-1 bg-ui-section hover:bg-black/10 dark:hover:bg-white/10 text-ui-ink/70 text-xs font-bold rounded-xl transition-transform cursor-pointer"
                    >
                      Cancel
                    </ActionButton>
                  </div>
                ) : (
                  <>
                    <ActionButton scope="moody-settings"
                      onClick={() => {
                        setEditingMood(mood);
                        setEditMoodName(mood.name);
                        setEditMoodColor(mood.color);
                        setMoodError(null);
                        setDeletingMoodId(null);
                      }}
                      className="ui-icon-button ui-row-action bg-ui-section hover:bg-black/10 dark:hover:bg-white/10 text-ui-ink/60 transition-colors cursor-pointer"
                      title="Edit mood"
                    >
                      <Edit2 className="w-4 h-4" />
                    </ActionButton>
                    <ActionButton scope="moody-settings"
                      onClick={() => {
                        if (moods.length <= 1) {
                          setMoodError('You cannot delete the last mood. At least one mood configuration must remain.');
                          return;
                        }
                        setMoodError(null);
                        setDeletingMoodId(mood.id);
                      }}
                      disabled={moods.length <= 1}
                      className="ui-icon-button ui-row-action bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Delete mood"
                    >
                      <Trash2 className="w-4 h-4" />
                    </ActionButton>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Appearance */}
      <div className="ui-section-card bg-ui-section p-8 rounded-[32px] space-y-5" id="appearance-settings-section">
        <div className="space-y-1">
          <h2 className="ui-section-title">
            Appearance
          </h2>
        </div>

        {/* Toggle Dark mode switch row */}
        <div className="ui-setting-row ui-item-card flex items-center justify-between p-5 bg-ui-surface rounded-2xl border border-ui-border shadow-sm">
          <div className="ui-setting-label">
            <span className="ui-setting-icon">
              <Palette className="w-5 h-5" />
            </span>
            <div>
              <p className="font-semibold text-ui-text text-base">Dark Mode</p>
            </div>
          </div>

          {/* Pill Switch */}
          <SettingsSwitch checked={settings.theme === 'dark'} onClick={handleToggleDarkMode} label="Dark Mode" id="theme-pill-switch" />
        </div>
      </div>

      {/* SECTION 3: Account (Sign in / Create Account, or Display Signed In profile) */}
      <div className="ui-section-card bg-ui-section p-8 rounded-[32px] space-y-5" id="account-settings-section">
        <div className="space-y-1">
          <h2 className="ui-section-title">
            Account
          </h2>
        </div>

        {user ? (
          /* Logged In */
          <div className="ui-item-card flex items-center space-x-4 p-5 bg-ui-surface rounded-2xl border border-ui-border shadow-sm" id="signed-in-account-card">
            <span className="w-12 h-12 rounded-full bg-ui-section text-ui-ink flex items-center justify-center shadow-inner">
              <User className="w-6 h-6" />
            </span>
            <div className="flex-1">
              <span className="ui-section-title text-[9px] font-black uppercase tracking-wider text-ui-muted block">
                Logged In User
              </span>
              <p className="font-bold text-ui-text text-lg break-all">
                {user.email}
              </p>
            </div>
          </div>
        ) : (
          /* Signed Out Auth Form */
          <ValidatedForm onSubmit={handleAuthSubmit} className="p-6 bg-ui-surface rounded-3xl border border-ui-border shadow-md space-y-4" id="signed-out-auth-form">
            <h3 className="ui-item-title text-lg font-bold text-ui-text mb-1">
              {isSignUp ? 'Create account' : 'Sign in or Create account'}
            </h3>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="ui-field-label text-xs font-bold text-ui-muted">Email Address</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-ui-ink/40">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="ui-field ui-field-leading w-full pl-11 pr-4 py-3 bg-ui-section rounded-xl border border-ui-ink/10 text-ui-text text-sm placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-ui-ink/20"
                  id="auth-email-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="ui-field-label text-xs font-bold text-ui-muted">Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-ui-ink/40">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="ui-field ui-field-leading ui-field-trailing w-full pl-11 pr-12 py-3 bg-ui-section rounded-xl border border-ui-ink/10 text-ui-text text-sm placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-ui-ink/20"
                  id="auth-password-input"
                />
                <ActionButton scope="moody-settings"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-ui-ink/40 hover:text-ui-ink/60 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </ActionButton>
              </div>
            </div>

            {/* Submit Auth Button */}
            <ActionButton scope="moody-settings"
              type="submit"
              disabled={authFormLoading}
              className="ui-button ui-button-primary w-full py-3.5 bg-ui-primary text-ui-primary-text font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer text-center text-sm shadow-sm"
              id="auth-submit-btn"
            >
              {authFormLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </ActionButton>

            {/* Toggle Sign-In / Create Account Mode */}
            <div className="text-center">
              <ActionButton scope="moody-settings"
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  clearError();
                }}
                className="text-xs font-bold text-ui-muted hover:underline cursor-pointer"
                id="toggle-auth-mode-btn"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Create account'}
              </ActionButton>
            </div>

            {/* Error displays */}
            {authError && (
              <div role="alert" className="ui-error flex items-start space-x-2 p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="break-all">{authError}</p>
              </div>
            )}
          </ValidatedForm>
        )}
      </div>

      {/* SECTION 4: Actions (Disconnect, Download, Reset) */}
      <div className="ui-section-card bg-ui-section p-8 rounded-[32px] space-y-4" id="actions-settings-section">
        <h2 className="ui-section-title">Actions</h2>
        {/* 1. Disconnect / Sign out */}
        {user && (
          showSignOutConfirm ? (
            <div 
              className="w-full p-5 bg-orange-500/5 dark:bg-orange-500/10 rounded-2xl border border-orange-500/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in"
              id="action-disconnect-confirm-box"
            >
              <div className="flex items-center space-x-3.5 text-left">
                <span className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <p className="text-sm font-bold text-ui-text">Confirm session sign out?</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <ActionButton scope="moody-settings"
                  onClick={async () => {
                    try {
                      await signOut();
                      setShowSignOutConfirm(false);
                    } catch (err) {
                      throw err;
                    }
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Confirm Sign Out
                </ActionButton>
                <ActionButton scope="moody-settings"
                  onClick={() => setShowSignOutConfirm(false)}
                  className="ui-button ui-button-secondary px-4 py-2 bg-ui-section hover:bg-black/10 dark:hover:bg-white/10 text-ui-ink/70 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </ActionButton>
              </div>
            </div>
          ) : (
            <ActionButton scope="moody-settings"
              onClick={() => setShowSignOutConfirm(true)}
              className="ui-setting-action w-full flex items-center p-5 bg-ui-surface rounded-2xl border border-ui-border shadow-sm text-left hover:shadow-md transition-shadow cursor-pointer"
              id="action-disconnect-btn"
            >
              <div className="flex items-center space-x-3.5">
                <span className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
                  <LogOut className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-bold text-ui-text text-base">Disconnect / Sign out</p>
                </div>
              </div>
            </ActionButton>
          )
        )}

        {/* 2. Download data as CSV */}
        <ActionButton scope="moody-settings"
          onClick={handleCSVExport}
          className="ui-setting-action w-full flex items-center p-5 bg-ui-surface rounded-2xl border border-ui-border shadow-sm text-left hover:shadow-md transition-shadow cursor-pointer"
          id="action-download-csv-btn"
        >
          <div className="flex items-center space-x-3.5">
            <span className="p-2.5 bg-ui-section text-ui-ink rounded-xl">
              <Download className="w-5 h-5" />
            </span>
            <div>
              <p className="font-bold text-ui-text text-base">Download data as CSV</p>
            </div>
          </div>
        </ActionButton>

        {/* 3. Reset data (Red theme) */}
        <ActionButton scope="moody-settings"
          onClick={() => setShowResetModal(true)}
          className="ui-setting-action w-full flex items-center p-5 bg-red-500/5 hover:bg-red-500/10 dark:bg-red-500/5 dark:hover:bg-red-500/10 rounded-2xl border border-red-500/10 text-left transition-colors cursor-pointer"
          id="action-reset-data-btn"
        >
          <div className="flex items-center space-x-3.5">
            <span className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </span>
            <div>
              <p className="font-bold text-red-600 dark:text-red-500 text-base">Reset data</p>
            </div>
          </div>
        </ActionButton>
      </div>

      {/* SECTION 5: Footer credits */}
      <div className="pt-8 flex flex-col items-center justify-center text-center space-y-6 border-t border-ui-border" id="settings-footer-section">
        {/* Credit Logo */}
        <img
          src="/gaspo_logo.svg"
          alt="Gaspard Berthelier Logo"
          className="w-32 h-32 object-contain"
          onError={(e) => {
            // Hide or render fallback text if missing
            e.currentTarget.style.display = 'none';
          }}
        />

        {/* Support the project button */}
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-ui-primary text-ui-primary-text rounded-full font-bold text-sm shadow-md transition-all cursor-pointer"
          id="support-project-link"
        >
          <Heart className="w-4 h-4 fill-red-500 stroke-red-500" />
          <span>Support the project</span>
        </a>

        {/* Text credits */}
        <div className="ui-meta space-y-1 text-xs text-ui-muted font-semibold uppercase tracking-wider opacity-80">
          <p>Moody &mdash; version {APP_VERSION}</p>
          <p>GASPARD BERTHELIER</p>
          <p className="lowercase">gberthelier.projet@gmail.com</p>
        </div>
      </div>

      {/* MODAL: ADD MOOD */}
      <AddMoodDialog open={showAddMoodModal} onClose={() => setShowAddMoodModal(false)} />

      {/* MODAL: EDIT MOOD */}
      {editingMood && (
        <Dialog open={!!editingMood} onClose={() => setEditingMood(null)} title="Edit mood">
          <ValidatedForm id={editFormId} onSubmit={handleEditMoodSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="ui-field-label text-xs font-bold text-ui-muted">Mood Label Name</label>
                <input
                  type="text"
                  required
                  value={editMoodName}
                  onChange={(e) => setEditMoodName(e.target.value)}
                  className="ui-field w-full p-3.5 bg-ui-section rounded-xl border border-ui-ink/10 text-ui-text text-sm focus:outline-none focus:ring-2 focus:ring-ui-ink/20"
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label className="ui-field-label text-xs font-bold text-ui-muted block">Mood Color swatch</label>
                <div className="flex items-center space-x-3 bg-ui-section p-3.5 rounded-xl border border-ui-ink/10">
                  <input
                    type="color"
                    value={editMoodColor}
                    onChange={(e) => setEditMoodColor(e.target.value)}
                    className="w-10 h-10 border-0 rounded-md cursor-pointer overflow-hidden p-0 bg-transparent"
                  />
                  <span className="ui-meta text-sm font-semibold uppercase text-ui-ink/60">
                    {editMoodColor}
                  </span>
                </div>
              </div>

              {moodError && (
                <div role="alert" className="ui-error p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{moodError}</span>
                </div>
              )}
            </div>

            <DialogActions form={editFormId} cancel>
              <ActionButton scope="moody-settings"
                type="submit"
                className="ui-button ui-button-primary flex-1 py-3 px-4 font-bold text-ui-primary-text bg-ui-primary hover:bg-ui-primary-hover rounded-xl transition-transform cursor-pointer shadow-sm"
              >
                Save
              </ActionButton>

            </DialogActions>
          </ValidatedForm>
        </Dialog>
      )}

      {/* RESET DATA MODAL */}
      {showResetModal && (
        <Dialog open={showResetModal} onClose={() => setShowResetModal(false)} title="Reset data" busy={isResetting} id="reset-confirmation-modal">
            <p className="ui-meta text-sm text-ui-muted leading-relaxed">
              This action is permanent.
            </p>

            <DialogActions>
              {/* Reset Moods to Default */}
              <ActionButton scope="moody-settings"
                onClick={handleResetMoods}
                disabled={isResetting}
                className="ui-button ui-button-secondary w-full py-3.5 bg-ui-section hover:bg-ui-ink/10 text-ui-ink font-bold rounded-2xl transition-all disabled:opacity-50 cursor-pointer text-center text-sm"
                id="reset-moods-btn"
              >
                {isResetting ? 'Processing...' : 'Restore Default Moods'}
              </ActionButton>

              {/* Clear History */}
              <ActionButton scope="moody-settings"
                onClick={handleClearHistory}
                disabled={isResetting}
                className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-2xl transition-all disabled:opacity-50 cursor-pointer text-center text-sm"
                id="clear-history-btn"
              >
                {isResetting ? 'Processing...' : 'Clear History'}
              </ActionButton>

              {/* Reset All */}
              <ActionButton scope="moody-settings"
                onClick={handleResetAll}
                disabled={isResetting}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all disabled:opacity-50 cursor-pointer text-center text-sm"
                id="reset-all-btn"
              >
                {isResetting ? 'Processing...' : 'Reset All'}
              </ActionButton>

              {/* Cancel */}
              <ActionButton scope="moody-settings"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="ui-button ui-button-secondary w-full py-3.5 bg-ui-section hover:bg-black/10 dark:hover:bg-white/10 text-ui-ink/70 font-bold rounded-2xl transition-all disabled:opacity-50 cursor-pointer text-center text-sm"
              >
                Cancel
              </ActionButton>
            </DialogActions>
        </Dialog>
      )}
    </div>
  );
};
