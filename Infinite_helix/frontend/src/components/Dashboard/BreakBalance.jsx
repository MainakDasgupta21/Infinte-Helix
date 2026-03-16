import React from 'react';
import { HiOutlinePause, HiOutlineClock } from 'react-icons/hi';

export default function BreakBalance({ breaks }) {
  if (!breaks) return null;

  const progress = (breaks.taken / breaks.suggested) * 100;
  const remaining = breaks.suggested - breaks.taken;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-helix-muted">Break Balance</h3>
        <div className="w-8 h-8 rounded-lg bg-helix-sky/10 flex items-center justify-center">
          <HiOutlinePause className="w-4 h-4 text-helix-sky" />
        </div>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-display font-bold text-helix-text">{breaks.taken}</span>
        <span className="text-sm text-helix-muted mb-1">/ {breaks.suggested} breaks</span>
      </div>

      <div className="w-full h-2 bg-helix-bg rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-helix-sky to-helix-mint rounded-full transition-all duration-700"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-helix-muted">
            <HiOutlineClock className="w-3.5 h-3.5" />
            <span>Last break</span>
          </div>
          <span className="text-helix-text font-medium">{breaks.lastBreak}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-helix-muted">Avg duration</span>
          <span className="text-helix-text font-medium">{breaks.avgDuration} min</span>
        </div>
        {remaining > 0 && (
          <p className="text-xs text-helix-amber mt-2 bg-helix-amber/5 rounded-lg px-3 py-2">
            {remaining} more break{remaining > 1 ? 's' : ''} recommended today
          </p>
        )}
      </div>
    </div>
  );
}
