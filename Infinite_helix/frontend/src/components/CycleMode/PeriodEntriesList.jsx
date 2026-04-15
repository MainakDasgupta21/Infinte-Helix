import React from 'react';
import { parseIso } from '../../utils/periodMath';

function fmt(iso) {
  const d = parseIso(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PeriodEntriesList({ entries, onEdit, onDelete }) {
  if (!entries.length) return null;

  return (
    <div className="bento-card p-5">
      <h3 className="text-sm font-medium text-helix-muted mb-3">Your logged periods</h3>
      <ul className="space-y-2">
        {[...entries].reverse().map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 bg-helix-surface/50 rounded-xl border border-helix-border/50"
          >
            <span className="text-sm text-helix-text">
              {fmt(e.startDate)}
              {e.endDate && e.endDate !== e.startDate ? (
                <span className="text-helix-muted"> → {fmt(e.endDate)}</span>
              ) : null}
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(e)}
                className="text-xs text-helix-accent hover:text-rose-500 font-medium"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(e.id)}
                className="text-xs text-red-600 hover:text-red-600 font-medium"
              >
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
