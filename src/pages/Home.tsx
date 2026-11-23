import { ActionButton } from '@3gaspo/app-ui/ActionButton';
import { useLocalDay } from '@3gaspo/app-ui/useLocalDay';
import { formatDate } from '@3gaspo/app-ui/formats';
import { StateFeedback } from '../components/StateFeedback';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../providers/Providers';
import { Smile, X, MessageSquare, Save } from 'lucide-react';

export const Home: React.FC<{ onNavigateToSettings: () => void }> = ({ onNavigateToSettings }) => {
  const { moods, entries, saveEntry, deleteEntry, loading } = useData();
  const today = useLocalDay();
  const [drafts, setDrafts] = useState<Record<string, { value: string; revision: number; acknowledged: boolean }>>({});
  const revision = useRef(0);
  const writes = useRef(Promise.resolve());
  const inFlight = useRef(new Map<string, Promise<void>>());
  const [pending, setPending] = useState(0);
  const isSavingNote = pending > 0;
  const [saveError, setSaveError] = useState<string | null>(null);

  // Get local date YYYY-MM-DD
  const getTodayDateString = () => {
    const d = today;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTodayDateString();
  const todayEntry = entries[todayStr];
  const selectedMoodId = todayEntry?.moodId || null;
  const currentMood = moods.find(m => m.id === selectedMoodId);
  const draft = drafts[todayStr];
  const note = draft?.value ?? todayEntry?.note ?? '';
  const desiredMood = useRef({ date: todayStr, id: selectedMoodId });
  if (desiredMood.current.date !== todayStr || !pending) desiredMood.current = { date: todayStr, id: selectedMoodId };

  // Accept the saved snapshot only after it acknowledges this exact draft.
  // Older snapshots and unrelated entry updates cannot replace active typing.
  useEffect(() => {
    if (!draft?.acknowledged || draft.value.trim() !== (todayEntry?.note ?? '')) return;
    setDrafts(previous => {
      if (previous[todayStr] !== draft) return previous;
      const next = { ...previous }; delete next[todayStr]; return next;
    });
  }, [todayStr, todayEntry?.note, draft]);

  const setNote = (value: string) => {
    const nextRevision = ++revision.current;
    setDrafts(previous => ({ ...previous, [todayStr]: { value, revision: nextRevision, acknowledged: false } }));
  };

  const writeEntry = (moodId: string | null): Promise<void> => {
    const date = todayStr, value = note, draftRevision = draft?.revision;
    const key = JSON.stringify([date, moodId, value]);
    const existing = inFlight.current.get(key);
    if (existing) return existing;
    setSaveError(null);
    setPending(count => count + 1);
    const write = writes.current.then(() => saveEntry(date, moodId, value));
    const observed = write.then(() => {
      setDrafts(previous => previous[date]?.revision === draftRevision && draftRevision !== undefined
        ? { ...previous, [date]: { ...previous[date], acknowledged: true } } : previous);
    }, () => {
      setSaveError('Could not save entry. Try again.');
    }).finally(() => {
      inFlight.current.delete(key);
      setPending(count => count - 1);
    });
    writes.current = observed;
    inFlight.current.set(key, observed);
    return observed;
  };

  // Handle tap on mood color button
  const handleMoodSelect = async (moodId: string) => {
    desiredMood.current = { date: todayStr, id: moodId };
    await writeEntry(moodId);
  };

  // Clear mood for today
  const handleClearMood = async () => {
    desiredMood.current = { date: todayStr, id: null };
    await writeEntry(null);
  };

  // Save note separately if needed (auto-saves on blur or save button)
  const handleSaveNote = async () => {
    if (note.trim() === (todayEntry?.note ?? '') && !saveError) return;
    await writeEntry(desiredMood.current.id);
  };

  const getTodayFormatted = () => {
    return formatDate(new Date(), 'full');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="home-view">
      {/* Header section */}
      <header className="app-home-header">
        <h1 className="app-brand-title" id="home-title">
          Moody
        </h1>
      </header>
      <p className="ui-meta app-home-meta text-sm font-medium uppercase tracking-wider text-ui-muted" id="home-date">
        {getTodayFormatted()}
      </p>

      {/* Main card showing current mood state when selected */}
      {saveError && <StateFeedback kind="error" title={saveError} />}
      {currentMood && (
        <div 
          className="mood-status shadow-sm border border-black/[0.03] dark:border-white/[0.03]"
          style={{
            backgroundColor: `${currentMood.color}15`,
            borderLeft: `8px solid ${currentMood.color}`
          }}
          id="today-mood-status-card"
        >
          <div className="mood-status__summary">
            <span 
              className="w-3 h-3 shrink-0 rounded-full shadow-inner"
              aria-hidden="true"
              style={{ backgroundColor: currentMood.color }}
            />
            <h2 className="mood-status__title text-ui-text">
              Feeling {currentMood.name}
            </h2>
          </div>
          <ActionButton
            type="button"
            scope="moody-today" onClick={handleClearMood}
            className="ui-button mood-status__clear flex items-center gap-1 text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 rounded-full cursor-pointer shrink-0"
            id="clear-mood-btn"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Mood</span>
          </ActionButton>
        </div>
      )}

      {/* Mood Palette Selection Section */}
      <div className="ui-section-card mood-palette bg-ui-section" id="mood-palette-section">
        <h2 className="ui-section-title" id="mood-palette-heading">
          Mood
        </h2>
        
        {loading && moods.length === 0 ? (
          <StateFeedback kind="loading" />
        ) : moods.length === 0 ? (
          <StateFeedback title="No moods">
            <ActionButton
              onClick={onNavigateToSettings}
              className="text-xs text-ui-ink underline"
            >
              Configure in Settings
            </ActionButton>
          </StateFeedback>
        ) : (
          <div className="mood-grid" id="mood-buttons-grid">
            {moods.map((mood) => {
              const isSelected = selectedMoodId === mood.id;
              return (
                <ActionButton
                  key={mood.id}
                  type="button"
                  aria-pressed={isSelected}
                  title={mood.name}
                  onClick={() => handleMoodSelect(mood.id)}
                  style={{ 
                    borderColor: isSelected ? mood.color : 'transparent',
                    backgroundColor: isSelected ? `${mood.color}15` : undefined
                  }}
                  scope="moody-today" className="mood-button relative border-2 ui-interactive-surface bg-ui-surface cursor-pointer group shadow-sm"
                  id={`mood-btn-${mood.id}`}
                >
                  <span 
                    className="mood-button__color rounded-full shadow-sm"
                    aria-hidden="true"
                    style={{ backgroundColor: mood.color }}
                  />
                  <span className="mood-button__name text-ui-text">
                    {mood.name}
                  </span>
                  {isSelected && (
                    <span 
                      className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                      aria-hidden="true"
                      style={{ backgroundColor: mood.color }}
                    />
                  )}
                </ActionButton>
              );
            })}
          </div>
        )}
      </div>

      {/* Diary / Note Section */}
      <div className="ui-section-card bg-ui-section p-8 rounded-[32px] space-y-5" id="note-section">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-ui-muted" />
            <h3 className="ui-section-title text-[10px] font-bold uppercase tracking-widest text-ui-muted">
              Daily Note
            </h3>
          </div>
          {note.trim() !== (todayEntry?.note || '') && (
            <ActionButton
              onClick={handleSaveNote}
              disabled={isSavingNote}
              className="ui-button flex items-center space-x-1 text-xs font-bold text-ui-ink bg-ui-section px-3 py-1.5 rounded-full hover:bg-ui-ink/10 disabled:opacity-50 transition-transform cursor-pointer"
              id="save-note-btn"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingNote ? 'Saving…' : 'Save'}</span>
            </ActionButton>
          )}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleSaveNote}
          placeholder="Add optional notes about your day here..."
          rows={4}
          className="ui-field w-full p-4 text-base rounded-2xl bg-ui-surface border border-ui-ink/10 text-ui-text placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-ui-ink/20 resize-none shadow-sm"
          id="today-note-textarea"
        />
      </div>
    </div>
  );
};
