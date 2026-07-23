/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../providers/Providers';
import { ChevronLeft, ChevronRight, MessageSquare, Trash2, X, AlertCircle } from 'lucide-react';

export const CalendarView: React.FC = () => {
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
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Open modal for day
  const handleDayClick = (dateStr: string, entry: any) => {
    setActiveDateStr(dateStr);
    setModalMoodId(entry?.moodId || null);
    setModalNote(entry?.note || '');
    setShowDeleteConfirm(false);
  };

  // Save changes from modal
  const handleSaveChanges = async () => {
    if (!activeDateStr) return;
    try {
      await saveEntry(activeDateStr, modalMoodId, modalNote);
      setActiveDateStr(null);
    } catch (err) {
      console.error('Error saving calendar changes:', err);
    }
  };

  // Delete day entry entirely
  const handleConfirmDelete = async () => {
    if (!activeDateStr) return;
    try {
      await deleteEntry(activeDateStr);
      setActiveDateStr(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in" id="calendar-view">
      {/* Header section */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white" id="calendar-title">
          Calendar
        </h1>
      </div>

      {/* Calendar Controls & Month selector */}
      <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[32px] space-y-6" id="calendar-card">
        <div className="flex items-center justify-between px-2">
          <button
            onClick={handlePrevMonth}
            className="p-3 bg-white dark:bg-black/20 rounded-full text-gray-700 dark:text-gray-300 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            id="prev-month-btn"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100" id="current-month-label">
            {monthName} {year}
          </h2>

          <button
            onClick={handleNextMonth}
            className="p-3 bg-white dark:bg-black/20 rounded-full text-gray-700 dark:text-gray-300 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            id="next-month-btn"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-center font-bold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          {weekdays.map((day, idx) => (
            <div key={idx}>{day}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2.5 sm:gap-3.5" id="calendar-days-grid">
          {gridCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="aspect-square opacity-0" />;
            }

            const { day, dateStr, entry } = cell;
            const mood = entry?.moodId ? moods.find(m => m.id === entry.moodId) : null;
            const hasNote = !!entry?.note;

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(dateStr, entry)}
                style={{
                  backgroundColor: mood ? `${mood.color}25` : undefined,
                  borderColor: mood ? mood.color : 'transparent'
                }}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center border-2 bg-white dark:bg-black/20 hover:shadow-md cursor-pointer transition-all active:scale-95 shadow-sm group`}
                id={`calendar-cell-${dateStr}`}
              >
                <span 
                  className={`text-sm font-semibold transition-colors group-hover:text-black dark:group-hover:text-white ${
                    mood ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {day}
                </span>

                {/* Mood color circle indicator inside card */}
                {mood && (
                  <span 
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shadow-inner"
                    style={{ backgroundColor: mood.color }}
                  />
                )}

                {/* Note Indicator */}
                {hasNote && (
                  <span className="absolute top-1 right-1.5 text-blue-500 dark:text-blue-400">
                    <MessageSquare className="w-3 h-3 fill-current opacity-80" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Edit modal */}
      {activeDateStr && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveDateStr(null)}
          id="day-edit-modal"
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-[32px] p-8 space-y-6 shadow-xl border border-black/5 dark:border-white/5 overflow-y-auto max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white" id="modal-date-label">
                  Edit Entry
                </h3>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                  {new Date(activeDateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setActiveDateStr(null)}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-gray-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selecting mood color inside modal */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Mood
              </span>
              <div className="grid grid-cols-5 gap-2">
                {moods.map((mood) => {
                  const isSel = modalMoodId === mood.id;
                  return (
                    <button
                      key={mood.id}
                      onClick={() => setModalMoodId(mood.id)}
                      style={{
                        backgroundColor: isSel ? `${mood.color}25` : undefined,
                        borderColor: isSel ? mood.color : 'transparent'
                      }}
                      className="aspect-square flex flex-col items-center justify-center p-1 rounded-2xl border-2 bg-black/5 dark:bg-white/5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title={mood.name}
                    >
                      <span 
                        className="w-7 h-7 rounded-full shadow-md flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: mood.color }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Clear current mood */}
              {modalMoodId && (
                <button
                  onClick={() => setModalMoodId(null)}
                  className="flex items-center space-x-1.5 text-xs text-red-500 font-semibold bg-red-500/10 px-3 py-1.5 rounded-full hover:bg-red-500/20 active:scale-95 transition-transform cursor-pointer mt-2"
                >
                  <X className="w-3 h-3" />
                  <span>Remove Mood Color</span>
                </button>
              )}
            </div>

            {/* Edit note */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 block">
                Note
              </label>
              <textarea
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Write something about this day..."
                rows={3}
                className="w-full p-4 text-base rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none shadow-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* Save changes */}
              <button
                onClick={handleSaveChanges}
                className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all cursor-pointer shadow-md text-center"
              >
                Save
              </button>

              {/* Delete Entire entry */}
              {entries[activeDateStr] && (
                showDeleteConfirm ? (
                  <div className="flex items-center space-x-2 bg-red-500/10 p-2 rounded-2xl border border-red-500/20">
                    <button
                      onClick={handleConfirmDelete}
                      className="py-2.5 px-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform cursor-pointer"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="py-2.5 px-3.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl active:scale-95 transition-transform cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 active:scale-98 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Entry</span>
                  </button>
                )
              )}

              {/* Cancel */}
              <button
                onClick={() => setActiveDateStr(null)}
                className="py-3.5 px-4 rounded-2xl font-bold text-gray-700 dark:text-gray-300 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 active:scale-98 transition-all cursor-pointer text-center"
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
