import { ActionButton } from '@3gaspo/app-ui/ActionButton';
import { formatDate, formatMonth } from '@3gaspo/app-ui/formats';
import { CalendarHeader } from '../components/CalendarHeader';
import { ValidatedForm } from '../components/ValidatedForm';
import { Dialog, DialogActions } from '../components/Dialog';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useId } from 'react';
import { useData } from '../providers/Providers';
import { ChevronLeft, ChevronRight, MessageSquare, Trash2, X, AlertCircle } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const entryFormId = useId();
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const { moods, entries, saveEntry, deleteEntry } = useData();

  // Current year/month viewed in the calendar (0-indexed month)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Modal active state
  const [activeDateStr, setActiveDateStr] = useState<string | null>(null);
  const [modalMoodId, setModalMoodId] = useState<string | null>(null);
  const [modalNote, setModalNote] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Move to previous month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Move to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Compute weekdays (Monday to Sunday)
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Days of the month grid mapping
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayIndex = useMemo(() => {
    const day = new Date(year, month, 1).getDay();
    // Adjust so Monday = 0, Sunday = 6
    return day === 0 ? 6 : day - 1;
  }, [year, month]);

  // Construct items for grid
  const gridCells = useMemo(() => {
    const cells = [];
    
    // Empty cells for alignment before first day of month
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        day,
        dateStr,
        entry: entries[dateStr] || null
      });
    }

    return cells;
  }, [year, month, daysInMonth, firstDayIndex, entries]);

  // Format month title

  // Open modal for day
  const handleDayClick = (dateStr: string, entry: any) => {
    setSaveError('');
    setActiveDateStr(dateStr);
    setModalMoodId(entry?.moodId || null);
    setModalNote(entry?.note || '');
    setShowDeleteConfirm(false);
  };

  // Save changes from modal
  const handleSaveChanges = async () => {
    if (!activeDateStr || saving) return;
    setSaveError(''); setSaving(true);
    try {
      await saveEntry(activeDateStr, modalMoodId, modalNote);
      setActiveDateStr(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save. Try again.');
    } finally { setSaving(false); }
  };

  // Delete day entry entirely
  const handleConfirmDelete = async () => {
    if (!activeDateStr || saving) return;
    setSaveError(''); setSaving(true);
    try {
      await deleteEntry(activeDateStr);
      setActiveDateStr(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not delete. Try again.');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="calendar-view">
      {/* Header section */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-4xl font-bold tracking-tight text-ui-text" id="calendar-title">
          Calendar
        </h1>
      </div>

      {/* Calendar Controls & Month selector */}
      <div className="ui-calendar-card" id="calendar-card">
        <CalendarHeader title={formatMonth(currentDate)} onPrevious={handlePrevMonth} onNext={handleNextMonth} previousId="prev-month-btn" nextId="next-month-btn" titleId="current-month-label" />

        {/* Weekday headers */}
        <div className="ui-calendar-weekdays">
          {weekdays.map((day, idx) => (
            <div key={idx} className="ui-calendar-weekday">{day}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="ui-calendar-grid" id="calendar-days-grid">
          {gridCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="ui-calendar-day opacity-0 pointer-events-none" />;
            }

            const { day, dateStr, entry } = cell;
            const mood = entry?.moodId ? moods.find(m => m.id === entry.moodId) : null;
            const hasNote = !!entry?.note;

            return (
              <ActionButton
                key={dateStr}
                onClick={() => handleDayClick(dateStr, entry)}
                data-date={dateStr} title={dateStr} aria-current={dateStr === new Intl.DateTimeFormat('en-CA').format(new Date()) ? 'date' : undefined} aria-pressed={activeDateStr === dateStr}
                style={{
                  backgroundColor: mood ? `${mood.color}25` : undefined,
                  borderColor: mood ? mood.color : 'transparent'
                }}
                className="ui-calendar-day border-2 bg-ui-surface hover:shadow-md transition-colors group"
                id={`calendar-cell-${dateStr}`}
              >
                <span 
                  className={"ui-meta " + (`text-sm font-semibold transition-colors group-hover:text-black dark:group-hover:text-white ${
                    mood ? 'text-ui-text' : 'text-ui-muted'
                  }`)}
                >
                  {day}
                </span>

                {/* Mood color circle indicator inside card */}
                {mood && (
                  <span 
                    className="ui-calendar-mood rounded-full"
                    style={{ backgroundColor: mood.color }}
                  />
                )}

                {/* Note Indicator */}
                {hasNote && (
                  <span className="ui-calendar-note text-ui-ink">
                    <MessageSquare className="w-3 h-3 fill-current opacity-80" />
                  </span>
                )}
              </ActionButton>
            );
          })}
        </div>
      </div>

      {/* Edit modal */}
      {activeDateStr && (
        <Dialog open={!!activeDateStr} busy={saving} onClose={() => setActiveDateStr(null)} title="Edit Entry" id="day-edit-modal">
            <p className="ui-meta text-xs text-ui-muted mb-5">{formatDate(activeDateStr, 'full')}</p>
            <ValidatedForm id={entryFormId} onSubmit={handleSaveChanges} className="space-y-6">
            {/* Selecting mood color inside modal */}
            <div className="space-y-3">
              <span className="ui-section-title text-[10px] font-bold uppercase tracking-widest text-ui-muted">
                Mood
              </span>
              <div className="grid grid-cols-5 gap-2">
                {moods.map((mood) => {
                  const isSel = modalMoodId === mood.id;
                  return (
                    <ActionButton
                      type="button"
                      key={mood.id}
                      onClick={() => setModalMoodId(mood.id)}
                      style={{
                        backgroundColor: isSel ? `${mood.color}25` : undefined,
                        borderColor: isSel ? mood.color : 'transparent'
                      }}
                      className="aspect-square flex flex-col items-center justify-center p-1 rounded-2xl border-2 bg-ui-section transition-all cursor-pointer"
                      title={mood.name}
                    >
                      <span 
                        className="w-7 h-7 rounded-full shadow-md flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: mood.color }}
                      />
                    </ActionButton>
                  );
                })}
              </div>

              {/* Clear current mood */}
              {modalMoodId && (
                <ActionButton
                  type="button"
                  onClick={() => setModalMoodId(null)}
                  className="flex items-center space-x-1.5 text-xs text-red-500 font-semibold bg-red-500/10 px-3 py-1.5 rounded-full hover:bg-red-500/20 transition-transform cursor-pointer mt-2"
                >
                  <X className="w-3 h-3" />
                  <span>Remove Mood Color</span>
                </ActionButton>
              )}
            </div>

            {/* Edit note */}
            <div className="space-y-2">
              <label className="ui-field-label text-[10px] font-bold uppercase tracking-widest text-ui-muted block">
                Note
              </label>
              <textarea
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Write something about this day..."
                rows={3}
                className="ui-field w-full p-4 text-base rounded-2xl bg-ui-section border border-ui-ink/10 text-ui-text placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-ui-ink/20 resize-none shadow-sm"
              />
            </div>

            {/* Actions */}
            {saveError && <p role="alert" className="ui-error">{saveError}</p>}
            <DialogActions form={entryFormId}>
              {/* Save changes */}
              <ActionButton
                type="submit" disabled={saving}
                className="ui-button ui-button-primary flex-1 py-3.5 px-4 rounded-2xl font-bold text-ui-primary-text bg-ui-primary hover:bg-ui-primary-hover transition-all cursor-pointer shadow-md text-center"
              >
                Save
              </ActionButton>

              {/* Delete Entire entry */}
              {entries[activeDateStr] && (
                showDeleteConfirm ? (
                  <div className="flex items-center space-x-2 bg-red-500/10 p-2 rounded-2xl border border-red-500/20">
                    <ActionButton
                      busyLabel="Deleting…" onClick={handleConfirmDelete}
                      className="ui-button ui-button-danger py-2.5 px-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-transform cursor-pointer"
                    >
                      Delete
                    </ActionButton>
                    <ActionButton
                      onClick={() => setShowDeleteConfirm(false)}
                      className="ui-button ui-button-secondary py-2.5 px-3.5 bg-ui-section hover:bg-black/10 dark:hover:hover:bg-white/10 text-ui-ink/70 text-xs font-bold rounded-xl transition-transform cursor-pointer"
                    >
                      Cancel
                    </ActionButton>
                  </div>
                ) : (
                  <ActionButton
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete entry</span>
                  </ActionButton>
                )
              )}

              {/* Cancel */}
              <ActionButton
                onClick={() => setActiveDateStr(null)}
                className="ui-button ui-button-secondary py-3.5 px-4 rounded-2xl font-bold text-ui-ink/70 bg-ui-section hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer text-center"
              >
                Cancel
              </ActionButton>
            </DialogActions>
            </ValidatedForm>
        </Dialog>
      )}
    </div>
  );
};
