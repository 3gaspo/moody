import { ScreenBoundary } from './components/ScreenBoundary';
import { StateFeedback } from './components/StateFeedback';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Providers, useAuth } from './providers/Providers';
import { Home } from './pages/Home';
const CalendarView = lazy(() => import('./pages/Calendar').then(module => ({ default: module.CalendarView })));
const Statistics = lazy(() => import('./pages/Statistics').then(module => ({ default: module.Statistics })));
const SettingsPage = lazy(() => import('./pages/Settings').then(module => ({ default: module.SettingsPage })));
import { Smile, Calendar, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { BottomNavigation } from './components/BottomNavigation';
const AuthScreen = lazy(() => import('./components/AuthScreen').then(module => ({ default: module.AuthScreen })));

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Render a clean loading indicator while auth is resolving
  if (authLoading) return <div className="min-h-screen bg-ui-page flex items-center justify-center"><StateFeedback kind="loading" /></div>;

  // Standalone independent login/signup window if user is not authenticated
  if (!user) {
    return <ScreenBoundary><Suspense fallback={<StateFeedback kind="loading" />}><AuthScreen /></Suspense></ScreenBoundary>;
  }

  return (
    <div className="app-shell w-full bg-ui-page text-ui-text transition-colors duration-300">
      {/* Desktop Centering Frame (Mobile Shell) */}
      <div className="app-page flex flex-col relative">
        
        {/* Main Routed Area */}
        <div className="flex-1">
          <ScreenBoundary><Suspense fallback={<StateFeedback kind="loading" />}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            {/* Home route */}
            <Route path="/home" element={<Home onNavigateToSettings={() => navigate('/settings')} />} />

            {/* Calendar route */}
            <Route path="/calendar" element={<CalendarView />} />

            {/* Statistics route */}
            <Route path="/statistics" element={<Statistics />} />

            {/* Settings route */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* Catch-all redirection */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
          </Suspense></ScreenBoundary>
        </div>

        {/* Fixed Bottom Navigation (Exactly Four Bottom Tabs) */}
        <BottomNavigation id="bottom-tab-bar" items={[
          { to: '/home', label: 'Home', icon: Smile, id: 'tab-home' },
          { to: '/calendar', label: 'Calendar', icon: Calendar, id: 'tab-calendar' },
          { to: '/statistics', label: 'Statistics', icon: BarChart3, id: 'tab-statistics' },
          { to: '/settings', label: 'Settings', icon: SettingsIcon, id: 'tab-settings' },
        ]} />
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
