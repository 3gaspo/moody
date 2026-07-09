/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Mood,
  MoodEntry,
  AppSettings,
  UserSession,
  AuthProviderInterface,
  DataProviderInterface
} from '../types';
import { firebaseReady, auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
  setDoc,
  updateDoc,
  deleteDoc,
  where
} from 'firebase/firestore';

const AuthContext = createContext<AuthProviderInterface | null>(null);
const DataContext = createContext<DataProviderInterface | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- AUTH STATE ---
  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- DATA STATE ---
  const [moods, setMoods] = useState<Mood[]>([]);
  const [entries, setEntries] = useState<Record<string, MoodEntry>>({});
  const [settings, setSettings] = useState<AppSettings>({ theme: 'light' });
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // --- DETERMINATION OF MODE ---
  const isFirebaseMode = firebaseReady && auth !== null && db !== null;

  // --- LOCAL AUTH IMPLEMENTATION ---
  useEffect(() => {
    if (!isFirebaseMode) {
      // Local Auth initialization
      const signedOutFlag = localStorage.getItem('moody_local_signed_out');
      const savedUser = localStorage.getItem('moody_local_user');

      if (signedOutFlag === 'true') {
        setUser(null);
      } else if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // First launch: Create default local user and sign them in
        const defaultUser = { uid: 'local-user-id', email: 'local-user@example.com' };
        localStorage.setItem('moody_local_user', JSON.stringify(defaultUser));
        localStorage.removeItem('moody_local_signed_out');
        setUser(defaultUser);
      }
      setAuthLoading(false);
    } else {
      // Firebase Auth initialization
      const unsubscribe = onAuthStateChanged(auth!, (firebaseUser: any) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'user@firebase.com'
          });
        } else {
          setUser(null);
        }
        setAuthLoading(false);
      }, (err: any) => {
        setAuthError(err.message);
        setAuthLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isFirebaseMode]);

  const signUp = async (email: string, password: string): Promise<UserSession> => {
    setAuthError(null);
    if (!isFirebaseMode) {
      const newUser = { uid: `local-${Date.now()}`, email };
      localStorage.setItem('moody_local_user', JSON.stringify(newUser));
      localStorage.removeItem('moody_local_signed_out');
      setUser(newUser);
      return newUser;
    } else {
      try {
        const result = await createUserWithEmailAndPassword(auth!, email, password);
        const newUser = {
          uid: result.user.uid,
          email: result.user.email || email
        };
        setUser(newUser);
        return newUser;
      } catch (err: any) {
        setAuthError(err.message);
        throw err;
      }
    }
  };

  const signIn = async (email: string, password: string): Promise<UserSession> => {
    setAuthError(null);
    if (!isFirebaseMode) {
      const existingUser = { uid: `local-${email.replace(/[^a-zA-Z0-9]/g, '')}`, email };
      localStorage.setItem('moody_local_user', JSON.stringify(existingUser));
      localStorage.removeItem('moody_local_signed_out');
      setUser(existingUser);
      return existingUser;
    } else {
      try {
        const result = await signInWithEmailAndPassword(auth!, email, password);
        const loggedUser = {
          uid: result.user.uid,
          email: result.user.email || email
        };
        setUser(loggedUser);
        return loggedUser;
      } catch (err: any) {
        setAuthError(err.message);
        throw err;
      }
    }
  };

  const signOut = async (): Promise<void> => {
    setAuthError(null);
    if (!isFirebaseMode) {
      localStorage.setItem('moody_local_signed_out', 'true');
      localStorage.removeItem('moody_local_user');
      setUser(null);
    } else {
      try {
        await fbSignOut(auth!);
        setUser(null);
      } catch (err: any) {
        setAuthError(err.message);
        throw err;
      }
    }
  };

  const clearError = () => {
    setAuthError(null);
  };

  // --- DATA SYNCHRONIZATION AND MUTATIONS ---
  const defaultMoodsSeed = useMemo(() => [
    { id: 'great', name: 'Great', color: '#22c55e', order: 0 },
    { id: 'good', name: 'Good', color: '#84cc16', order: 1 },
    { id: 'okay', name: 'Okay', color: '#facc15', order: 2 },
    { id: 'bad', name: 'Bad', color: '#f97316', order: 3 },
    { id: 'awful', name: 'Awful', color: '#ef4444', order: 4 },
  ], []);

  // Sync data whenever user or database changes
  useEffect(() => {
    if (!user) {
      setMoods([]);
      setEntries({});
      setSettings({ theme: 'light' });
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setDataError(null);

    if (!isFirebaseMode) {
      // Local Database initialization & sync
      const uid = user.uid;
      const moodsKey = `moody_moods_${uid}`;
      const entriesKey = `moody_entries_${uid}`;
      const settingsKey = `moody_settings_${uid}`;

      // Initialize Settings
      let localSettings: AppSettings = { theme: 'light' };
      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) {
        localSettings = JSON.parse(savedSettings);
      } else {
        localStorage.setItem(settingsKey, JSON.stringify(localSettings));
      }
      setSettings(localSettings);

      // Initialize Moods (Seeding if empty)
      let localMoods: Mood[] = [];
      const savedMoods = localStorage.getItem(moodsKey);
      if (savedMoods) {
        localMoods = JSON.parse(savedMoods);
      }

      if (localMoods.length === 0) {
        const now = new Date().toISOString();
        localMoods = defaultMoodsSeed.map(m => ({
          ...m,
          createdAt: now,
          updatedAt: now
        }));
        localStorage.setItem(moodsKey, JSON.stringify(localMoods));
      }
      setMoods(localMoods);

      // Initialize Entries
      let localEntries: Record<string, MoodEntry> = {};
      const savedEntries = localStorage.getItem(entriesKey);
      if (savedEntries) {
        localEntries = JSON.parse(savedEntries);
      }
      setEntries(localEntries);
      setDataLoading(false);
    } else {
      // Firebase Database real-time sync
      const uid = user.uid;

      // 1. Sync Settings
      const settingsRef = doc(db!, 'users', uid, 'settings', 'main');
      const unsubscribeSettings = onSnapshot(settingsRef, (snapshot: any) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data() as AppSettings);
        } else {
          // Default settings if none exist
          setSettings({ theme: 'light' });
        }
      }, (err: any) => {
        setDataError(err.message);
      });

      // 2. Sync Moods with Automatic Seeding
      const moodsQuery = query(collection(db!, 'users', uid, 'moods'), orderBy('order'));
      const unsubscribeMoods = onSnapshot(moodsQuery, async (snapshot: any) => {
        const list: Mood[] = [];
        snapshot.forEach((docSnap: any) => {
          list.push(docSnap.data() as Mood);
        });

        if (list.length === 0) {
          // Seed default moods idempotently
          try {
            const batch = writeBatch(db!);
            const now = new Date().toISOString();
            defaultMoodsSeed.forEach(m => {
              const mRef = doc(db!, 'users', uid, 'moods', m.id);
              batch.set(mRef, {
                id: m.id,
                name: m.name,
                color: m.color,
                order: m.order,
                createdAt: now,
                updatedAt: now
              });
            });
            // Also write settings default
            batch.set(settingsRef, { theme: 'light' }, { merge: true });
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${uid}/moods`);
          }
        } else {
          setMoods(list);
        }
        setDataLoading(false);
      }, (err: any) => {
        handleFirestoreError(err, OperationType.GET, `users/${uid}/moods`);
      });

      // 3. Sync Entries
      const entriesQuery = collection(db!, 'users', uid, 'entries');
      const unsubscribeEntries = onSnapshot(entriesQuery, (snapshot: any) => {
        const dict: Record<string, MoodEntry> = {};
        snapshot.forEach((docSnap: any) => {
          dict[docSnap.id] = docSnap.data() as MoodEntry;
        });
        setEntries(dict);
      }, (err: any) => {
        handleFirestoreError(err, OperationType.GET, `users/${uid}/entries`);
      });

      return () => {
        unsubscribeSettings();
        unsubscribeMoods();
        unsubscribeEntries();
      };
    }
  }, [user, isFirebaseMode, defaultMoodsSeed]);

  // --- MUTATION IMPLEMENTATIONS ---

  const addMood = async (name: string, color: string): Promise<void> => {
    if (!user) return;
    const uid = user.uid;
    const nameLower = name.trim().toLowerCase();

    // Validate uniqueness case-insensitively
    const isDuplicate = moods.some(m => m.name.toLowerCase() === nameLower);
    if (isDuplicate) {
      throw new Error('A mood with this name already exists.');
    }

    const newId = `mood-${Date.now()}`;
    const now = new Date().toISOString();
    const newMood: Mood = {
      id: newId,
      name: name.trim(),
      color,
      order: moods.length,
      createdAt: now,
      updatedAt: now
    };

    if (!isFirebaseMode) {
      const moodsKey = `moody_moods_${uid}`;
      const updatedMoods = [...moods, newMood];
      localStorage.setItem(moodsKey, JSON.stringify(updatedMoods));
      setMoods(updatedMoods);
    } else {
      const { doc, setDoc } = await import('firebase/firestore');
      try {
        await setDoc(doc(db!, 'users', uid, 'moods', newId), newMood);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/moods/${newId}`);
      }
    }
  };

  const updateMood = async (id: string, name: string, color: string): Promise<void> => {
    if (!user) return;
    const uid = user.uid;
    const nameLower = name.trim().toLowerCase();

    // Validate uniqueness case-insensitively excluding itself
    const isDuplicate = moods.some(m => m.id !== id && m.name.toLowerCase() === nameLower);
    if (isDuplicate) {
      throw new Error('A mood with this name already exists.');
    }

    const now = new Date().toISOString();

    if (!isFirebaseMode) {
      const moodsKey = `moody_moods_${uid}`;
      const updatedMoods = moods.map(m => {
        if (m.id === id) {
          return { ...m, name: name.trim(), color, updatedAt: now };
        }
        return m;
      });
      localStorage.setItem(moodsKey, JSON.stringify(updatedMoods));
      setMoods(updatedMoods);
    } else {
      const { doc, updateDoc } = await import('firebase/firestore');
      try {
        await updateDoc(doc(db!, 'users', uid, 'moods', id), {
          name: name.trim(),
          color,
          updatedAt: now
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/moods/${id}`);
      }
    }
  };

  const deleteMood = async (id: string): Promise<void> => {
    if (!user) return;
    if (moods.length <= 1) {
      throw new Error('You must keep at least one mood configuration.');
    }
    const uid = user.uid;

    if (!isFirebaseMode) {
      const moodsKey = `moody_moods_${uid}`;
      const entriesKey = `moody_entries_${uid}`;

      // 1. Filter out the deleted mood
      const remainingMoods = moods
        .filter(m => m.id !== id)
        .map((m, index) => ({ ...m, order: index })); // Reorder deterministically

      localStorage.setItem(moodsKey, JSON.stringify(remainingMoods));

      // 2. Set affected entries' moodId to null gracefully
      const updatedEntries = { ...entries };
      Object.keys(updatedEntries).forEach(date => {
        if (updatedEntries[date].moodId === id) {
          updatedEntries[date] = {
            ...updatedEntries[date],
            moodId: null,
            updatedAt: new Date().toISOString()
          };
        }
      });
      localStorage.setItem(entriesKey, JSON.stringify(updatedEntries));

      setMoods(remainingMoods);
      setEntries(updatedEntries);
    } else {
      const { doc, writeBatch, collection, getDocs, query, where } = require('firebase/firestore');
      try {
        const batch = writeBatch(db!);
        
        // Delete the mood document
        const moodRef = doc(db!, 'users', uid, 'moods', id);
        batch.delete(moodRef);

        // Fetch affected historical entries to update their moodId to null
        const entriesQuery = query(
          collection(db!, 'users', uid, 'entries'),
          where('moodId', '==', id)
        );
        const querySnapshot = await getDocs(entriesQuery);
        const now = new Date().toISOString();
        
        querySnapshot.forEach((docSnap: any) => {
          batch.update(docSnap.ref, {
            moodId: null,
            updatedAt: now
          });
        });

        // Reorder remaining moods to avoid order breakage
        const remaining = moods.filter(m => m.id !== id);
        remaining.forEach((m, index) => {
          const mRef = doc(db!, 'users', uid, 'moods', m.id);
          batch.update(mRef, { order: index });
        });

        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/moods`);
      }
    }
  };

  const saveEntry = async (date: string, moodId: string | null, note: string): Promise<void> => {
    if (!user) return;
    const uid = user.uid;

    const trimmedNote = note.trim();
    // Prefer deletion if both mood and note are empty/cleared
    if (moodId === null && trimmedNote === '') {
      await deleteEntry(date);
      return;
    }

    const now = new Date().toISOString();
    const existingEntry = entries[date];

    const newEntry: MoodEntry = {
      id: date,
      date,
      moodId,
      note: trimmedNote,
      createdAt: existingEntry ? existingEntry.createdAt : now,
      updatedAt: now
    };

    if (!isFirebaseMode) {
      const entriesKey = `moody_entries_${uid}`;
      const updatedEntries = {
        ...entries,
        [date]: newEntry
      };
      localStorage.setItem(entriesKey, JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
    } else {
      const { doc, setDoc } = await import('firebase/firestore');
      try {
        await setDoc(doc(db!, 'users', uid, 'entries', date), newEntry);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/entries/${date}`);
      }
    }
  };

  const deleteEntry = async (date: string): Promise<void> => {
    if (!user) return;
    const uid = user.uid;

    if (!isFirebaseMode) {
      const entriesKey = `moody_entries_${uid}`;
      const updatedEntries = { ...entries };
      delete updatedEntries[date];
      localStorage.setItem(entriesKey, JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
    } else {
      const { doc, deleteDoc } = await import('firebase/firestore');
      try {
        await deleteDoc(doc(db!, 'users', uid, 'entries', date));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/entries/${date}`);
      }
    }
  };

  const updateThemeSetting = async (theme: 'light' | 'dark'): Promise<void> => {
    if (!user) return;
    const uid = user.uid;

    if (!isFirebaseMode) {
      const settingsKey = `moody_settings_${uid}`;
      const newSettings = { theme };
      localStorage.setItem(settingsKey, JSON.stringify(newSettings));
      setSettings(newSettings);
    } else {
      const { doc, setDoc } = await import('firebase/firestore');
      try {
        await setDoc(doc(db!, 'users', uid, 'settings', 'main'), { theme }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/settings/main`);
      }
    }
  };

  const clearHistory = async (): Promise<void> => {
    if (!user) return;
    const uid = user.uid;

    if (!isFirebaseMode) {
      const entriesKey = `moody_entries_${uid}`;
      localStorage.setItem(entriesKey, JSON.stringify({}));
      setEntries({});
    } else {
      const { collection, getDocs, doc, writeBatch } = require('firebase/firestore');
      try {
        const querySnapshot = await getDocs(collection(db!, 'users', uid, 'entries'));
        const chunks: any[] = [];
        let currentChunk: any[] = [];
        
        querySnapshot.forEach((docSnap: any) => {
          currentChunk.push(docSnap.ref);
          if (currentChunk.length >= 400) {
            chunks.push(currentChunk);
            currentChunk = [];
          }
        });
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
        }

        for (const chunk of chunks) {
          const batch = writeBatch(db!);
          chunk.forEach((ref: any) => batch.delete(ref));
          await batch.commit();
        }
        setEntries({});
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/entries`);
      }
    }
  };

  const resetAll = async (): Promise<void> => {
    if (!user) return;
    const uid = user.uid;

    if (!isFirebaseMode) {
      const moodsKey = `moody_moods_${uid}`;
      const entriesKey = `moody_entries_${uid}`;
      const settingsKey = `moody_settings_${uid}`;

      const now = new Date().toISOString();
      const reseededMoods = defaultMoodsSeed.map(m => ({
        ...m,
        createdAt: now,
        updatedAt: now
      }));

      localStorage.setItem(moodsKey, JSON.stringify(reseededMoods));
      localStorage.setItem(entriesKey, JSON.stringify({}));
      localStorage.setItem(settingsKey, JSON.stringify({ theme: 'light' }));

      setMoods(reseededMoods);
      setEntries({});
      setSettings({ theme: 'light' });
    } else {
      const { collection, getDocs, doc, writeBatch } = require('firebase/firestore');
      try {
        // Delete all entries
        const entriesSnap = await getDocs(collection(db!, 'users', uid, 'entries'));
        const moodsSnap = await getDocs(collection(db!, 'users', uid, 'moods'));

        const batch = writeBatch(db!);

        entriesSnap.forEach((docSnap: any) => {
          batch.delete(docSnap.ref);
        });

        moodsSnap.forEach((docSnap: any) => {
          batch.delete(docSnap.ref);
        });

        // Reseed default moods and reset theme in the same batch
        const now = new Date().toISOString();
        defaultMoodsSeed.forEach(m => {
          const mRef = doc(db!, 'users', uid, 'moods', m.id);
          batch.set(mRef, {
            id: m.id,
            name: m.name,
            color: m.color,
            order: m.order,
            createdAt: now,
            updatedAt: now
          });
        });

        const settingsRef = doc(db!, 'users', uid, 'settings', 'main');
        batch.set(settingsRef, { theme: 'light' });

        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }
    }
  };

  // --- THEME REFLECTION ---
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const authValue = useMemo<AuthProviderInterface>(() => ({
    user,
    loading: authLoading,
    error: authError,
    signUp,
    signIn,
    signOut,
    clearError
  }), [user, authLoading, authError]);

  const dataValue = useMemo<DataProviderInterface>(() => ({
    moods,
    entries,
    loading: dataLoading,
    error: dataError,
    settings,
    addMood,
    updateMood,
    deleteMood,
    saveEntry,
    deleteEntry,
    updateThemeSetting,
    clearHistory,
    resetAll
  }), [moods, entries, dataLoading, dataError, settings]);

  return (
    <AuthContext.Provider value={authValue}>
      <DataContext.Provider value={dataValue}>
        {children}
      </DataContext.Provider>
    </AuthContext.Provider>
  );
};
