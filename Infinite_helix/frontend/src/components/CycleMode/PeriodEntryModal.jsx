import React, { useState, useEffect } from 'react';

/**
 * Add or edit a period range (start required; end defaults to 5-day span if omitted in save handler).
 */
export default function PeriodEntryModal({ open, mode, initialEntry, onClose, onSave, onDelete }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const todayIso = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialEntry) {
      setStart(initialEntry.startDate);
      setEnd(initialEntry.endDate || '');
    } else {
      setStart('');
      setEnd('');
    }
  }, [open, mode, initialEntry]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!start) return;
    if (end && end < start) return;
    onSave({ startDate: start, endDate: end || undefined });
    onClose();
  }

  function handleDelete() {
    if (mode === 'edit' && initialEntry && onDelete) {
      onDelete(initialEntry.id);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="presentation"
    >
      <div
        className="glass-card p-6 max-w-md w-full border border-helix-border shadow-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="period-modal-title"
      >
        <h2 id="period-modal-title" className="text-lg font-display font-semibold text-helix-text mb-1">
          {mode === 'edit' ? 'Edit period' : 'Add last period'}
        </h2>
        <p className="text-xs text-helix-muted mb-4">
          First day is required. Last day is optional (we assume 5 days if you leave it blank).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pe-start" className="block text-xs font-medium text-helix-muted mb-1">
              First day of period
            </label>
            <input
              id="pe-start"
              type="date"
              value={start}
              max={todayIso}
              onChange={(e) => setStart(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-helix-bg/60 border border-helix-border text-helix-text text-sm
                         focus:border-helix-accent focus:ring-1 focus:ring-helix-accent/30 outline-none"
            />
          </div>
          <div>
            <label htmlFor="pe-end" className="block text-xs font-medium text-helix-muted mb-1">
              Last day of period (optional)
            </label>
            <input
              id="pe-end"
              type="date"
              value={end}
              min={start || undefined}
              max={todayIso}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-helix-bg/60 border border-helix-border text-helix-text text-sm
                         focus:border-helix-accent focus:ring-1 focus:ring-helix-accent/30 outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 min-w-[8rem] py-2.5 rounded-xl bg-gradient-to-r from-helix-accent to-helix-sky text-white font-semibold text-sm"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-helix-border text-helix-muted text-sm hover:text-helix-text"
            >
              Cancel
            </button>
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-xl text-helix-red text-sm border border-helix-red/30 hover:bg-helix-red/10"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
