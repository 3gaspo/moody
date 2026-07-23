/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useData } from '../providers/Providers';
import { Smile, X, MessageSquare, Save } from 'lucide-react';

export const Home: React.FC<{ onNavigateToSettings: () => void }> = ({ onNavigateToSettings }) => {
  const { moods, entries, saveEntry, deleteEntry, loading } = useData();
  const [note, setNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Get local date YYYY-MM-DD
  const getTodayDateString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTodayDateString();
  const todayEntry = entries[todayStr];
  const selectedMoodId = todayEntry?.moodId || null;
  const currentMood = moods.find(m => m.id === selectedMoodId);

  // Sync note input with database state
  useEffect(() => {
    if (todayEntry) {
      setNote(todayEntry.note || '');
    } else {
      setNote('');
    }
  }, [todayEntry]);

  // Handle tap on mood color button
  const handleMoodSelect = async (moodId: string) => {
    try {
      await saveEntry(todayStr, moodId, note);
    } catch (err) {
      console.error('Error saving mood:', err);
    }
  };

  // Clear mood for today
  const handleClearMood = async () => {
    try {
      await saveEntry(todayStr, null, note);
    } catch (err) {
      console.error('Error clearing mood:', err);
    }
  };

  // Save note separately if needed (auto-saves on blur or save button)
  const handleSaveNote = async () => {
    setIsSavingNote(true);
    try {
      await saveEntry(todayStr, selectedMoodId, note);
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const getTodayFormatted = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in" id="home-view">
      {/* Header section */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white" id="home-title">
          Moody
        </h1>
        <p className="text-sm font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500" id="home-date">
          {getTodayFormatted()}
        </p>
      </div>

      {/* Main card showing current mood state when selected */}
      {currentMood && (
        <div 
          className="relative overflow-hidden p-6 sm:p-8 rounded-[32px] transition-all duration-500 ease-out flex items-center justify-between shadow-sm border border-black/[0.03] dark:border-white/[0.03]"
          style={{
            backgroundColor: `${currentMood.color}15`,
            borderLeft: `8px solid ${currentMood.color}`
          }}
          id="today-mood-status-card"
        >
          <div className="flex items-center space-x-3">
            <span 
              className="w-5 h-5 rounded-full shadow-inner animate-pulse" 
              style={{ backgroundColor: currentMood.color }}
            />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Feeling {currentMood.name}
            </h2>
          </div>
          <button
            onClick={handleClearMood}
            className="flex items-center space-x-1 text-xs font-bold text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-full transition-transform active:scale-95 cursor-pointer shrink-0"
            id="clear-mood-btn"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Mood</span>
          </button>
        </div>
      )}

      {/* Mood Palette Selection Section */}
      <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[32px] space-y-5" id="mood-palette-section">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100" id="mood-palette-heading">
          How are you feeling today?
        </h2>
        
        {loading && moods.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-400">Loading moods...</div>
        ) : moods.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 mb-2">No moods configured.</p>
            <button 
              onClick={onNavigateToSettings}
              className="text-xs text-blue-500 underline"
            >
              Configure in Settings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" id="mood-buttons-grid">
            {moods.map((mood) => {
              const isSelected = selectedMoodId === mood.id;
              return (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood.id)}
                  style={{ 
                    borderColor: isSelected ? mood.color : 'transparent',
                    backgroundColor: isSelected ? `${mood.color}15` : undefined
                  }}
                  className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300 bg-white dark:bg-black/20 hover:shadow-md cursor-pointer active:scale-95 group shadow-sm`}
                  id={`mood-btn-${mood.id}`}
                >
                  <span 
                    className="w-10 h-10 rounded-full mb-3 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform" 
                    style={{ backgroundColor: mood.color }}
                  />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {mood.name}
                  </span>
                  {isSelected && (
                    <span 
                      className="absolute top-2 right-2 w-2 h-2 rounded-full" 
                      style={{ backgroundColor: mood.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Diary / Daily Note Section */}
      <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[32px] space-y-5" id="note-section">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Daily Note
            </h3>
          </div>
          {note.trim() !== (todayEntry?.note || '') && (
            <button
              onClick={handleSaveNote}
              disabled={isSavingNote}
              className="flex items-center space-x-1 text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full hover:bg-blue-500/20 disabled:opacity-50 transition-transform active:scale-95 cursor-pointer"
              id="save-note-btn"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingNote ? 'Saving...' : 'Save Note'}</span>
            </button>
          )}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleSaveNote}
          placeholder="Add optional notes about your day here..."
          rows={4}
          className="w-full p-4 text-base rounded-2xl bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none shadow-sm"
          id="today-note-textarea"
        />
      </div>
    </div>
  );
};
