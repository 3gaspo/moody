/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Providers, useAuth } from './providers/Providers';
import { Home } from './pages/Home';
import { CalendarView } from './pages/Calendar';
import { Statistics } from './pages/Statistics';
import { SettingsPage } from './pages/Settings';
import { Smile, Calendar, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  // Render a clean loading indicator while auth is resolving
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-500">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wider uppercase opacity-80">Syncing session...</p>
      </div>
    );
  }

  // Standalone independent login/signup window if user is not authenticated
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="w-full min-h-screen bg-neutral-100 dark:bg-neutral-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Desktop Centering Frame (Mobile Shell) */}
      <div className="w-full max-w-lg min-h-screen mx-auto bg-white dark:bg-neutral-900 shadow-xl border-x border-black/[0.03] dark:border-white/[0.03] flex flex-col relative pb-24 pt-8 px-6">
        
        {/* Main Routed Area */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            {/* Home route */}
            <Route path="/home" element={<Home onNavigateToSettings={() => {}} />} />

            {/* Calendar route */}
            <Route path="/calendar" element={<CalendarView />} />

            {/* Statistics route */}
            <Route path="/statistics" element={<Statistics />} />

            {/* Settings route */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* Catch-all redirection */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>

        {/* Fixed Bottom Navigation (Exactly Four Bottom Tabs) */}
        <nav 
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-black/5 dark:border-white/5 flex items-center justify-around px-2 z-40 rounded-t-[32px] shadow-lg"
          id="bottom-tab-bar"
        >
          {/* Home Tab */}
          <Link 
            to="/home" 
            className={`flex flex-col items-center justify-center space-y-1 w-16 h-14 rounded-2xl transition-all cursor-pointer active:scale-95 ${
              path === '/home' 
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            id="tab-home"
          >
            <Smile className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Home</span>
          </Link>

          {/* Calendar Tab */}
          <Link 
            to="/calendar" 
            className={`flex flex-col items-center justify-center space-y-1 w-16 h-14 rounded-2xl transition-all cursor-pointer active:scale-95 ${
              path === '/calendar' 
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            id="tab-calendar"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Calendar</span>
          </Link>

          {/* Statistics Tab */}
          <Link 
            to="/statistics" 
            className={`flex flex-col items-center justify-center space-y-1 w-16 h-14 rounded-2xl transition-all cursor-pointer active:scale-95 ${
              path === '/statistics' 
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            id="tab-statistics"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Statistics</span>
          </Link>

          {/* Settings Tab */}
          <Link 
            to="/settings" 
            className={`flex flex-col items-center justify-center space-y-1 w-16 h-14 rounded-2xl transition-all cursor-pointer active:scale-95 ${
              path === '/settings' 
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            id="tab-settings"
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AppContent />
      </Providers>
    </BrowserRouter>
  );
}
