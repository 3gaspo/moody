import { ACTIONS } from '@3gaspo/app-ui/labels';
import { ValidatedForm } from './ValidatedForm';
import React, { useEffect, useId, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useData } from '../providers/Providers';
import { Dialog, DialogActions } from './Dialog';

export function AddMoodDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addFormId = useId();
  const { addMood } = useData();
  const [newMoodName, setNewMoodName] = useState('');
  const [newMoodColor, setNewMoodColor] = useState('#3b82f6');
  const [moodError, setMoodError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => { if (open) setMoodError(null); }, [open]);

  // Create Mood
  const handleCreateMood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setMoodError(null);
    if (!newMoodName.trim()) {
      setMoodError('Please enter a mood name.');
      return;
    }
    setIsSaving(true);
    try {
      await addMood(newMoodName, newMoodColor);
      setNewMoodName('');
      setNewMoodColor('#3b82f6');
      onClose();
    } catch (err: any) {
      setMoodError(err.message || 'Failed to add mood.');
    } finally {
      setIsSaving(false);
    }
  };

  return <Dialog open={open} busy={isSaving} onClose={onClose} title="Add mood">
    <ValidatedForm id={addFormId} onSubmit={handleCreateMood} className="space-y-5">
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="ui-field-label text-xs font-bold text-ui-muted">Mood Label Name</label>
          <input
            type="text"
            required
            value={newMoodName}
            onChange={(e) => setNewMoodName(e.target.value)}
            placeholder="e.g. Creative, Tired, Peaceful"
            className="ui-field w-full p-3.5 bg-ui-section rounded-xl border border-ui-ink/10 text-ui-text text-sm placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-ui-ink/20"
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <label className="ui-field-label text-xs font-bold text-ui-muted block">Mood Color swatch</label>
          <div className="flex items-center space-x-3 bg-ui-section p-3.5 rounded-xl border border-ui-ink/10">
            <input
              type="color"
              value={newMoodColor}
              onChange={(e) => setNewMoodColor(e.target.value)}
              className="w-10 h-10 border-0 rounded-md cursor-pointer overflow-hidden p-0 bg-transparent"
            />
            <span className="ui-meta text-sm font-semibold uppercase text-ui-ink/60">
              {newMoodColor}
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

      <DialogActions form={addFormId} cancel>
        <button
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
          className="ui-button ui-button-primary flex-1 py-3 px-4 font-bold text-ui-primary-text bg-ui-primary hover:bg-ui-primary-hover rounded-xl transition-transform cursor-pointer shadow-sm"
        >
          {isSaving ? ACTIONS.saving : ACTIONS.save}
        </button>

      </DialogActions>
    </ValidatedForm>
  </Dialog>;
}
