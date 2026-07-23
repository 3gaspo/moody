/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Mood {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MoodEntry {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  moodId: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  uid: string;
  email: string;
}

export interface AuthState {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
}

export interface AppSettings {
  theme: 'light' | 'dark';
}

export interface AuthProviderInterface {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<UserSession>;
  signIn: (email: string, password: string) => Promise<UserSession>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export interface DataProviderInterface {
  moods: Mood[];
  entries: Record<string, MoodEntry>; // key is YYYY-MM-DD
  loading: boolean;
  error: string | null;
  settings: AppSettings;
  
  // Mood mutations
  addMood: (name: string, color: string) => Promise<void>;
  updateMood: (id: string, name: string, color: string) => Promise<void>;
  deleteMood: (id: string) => Promise<void>;
  resetMoods: () => Promise<void>;
  
  // Entry mutations
  saveEntry: (date: string, moodId: string | null, note: string) => Promise<void>;
  deleteEntry: (date: string) => Promise<void>;
  
  // App-level actions
  updateThemeSetting: (theme: 'light' | 'dark') => Promise<void>;
  clearHistory: () => Promise<void>;
  resetAll: () => Promise<void>;
}
