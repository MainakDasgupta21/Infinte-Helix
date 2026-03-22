import React from 'react';
import { parseIso } from '../../utils/periodMath';

function longFmt(iso) {
  if (!iso) return '—';
  const d = parseIso(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PeriodStats({ lastPeriodStartIso, nextPeriodInfo, averageCycleDays }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="glass-card p-4 border border-helix-border/30">
        <p className="text-xs text-helix-muted uppercase tracking-wide mb-1">Last period started</p>
        <p className="text-sm font-semibold text-helix-text leading-snug">{longFmt(lastPeriodStartIso)}</p>
      </div>
      <div className="glass-card p-4 border border-helix-accent/20">
        <p className="text-xs text-helix-muted uppercase tracking-wide mb-1">Estimated next period</p>
        {nextPeriodInfo ? (
          <>
            <p className="text-sm font-semibold text-helix-text">
              {nextPeriodInfo.daysUntil === 0
                ? 'Could be today or very soon'
                : `${nextPeriodInfo.daysUntil} day${nextPeriodInfo.daysUntil === 1 ? '' : 's'} away`}
            </p>
            <p className="text-xs text-helix-muted mt-1">{nextPeriodInfo.label}</p>
          </>
        ) : (
          <p className="text-sm text-helix-muted">Add a period to see an estimate</p>
        )}
      </div>
      <div className="glass-card p-4 border border-helix-border/30">
        <p className="text-xs text-helix-muted uppercase tracking-wide mb-1">Typical cycle length</p>
        {averageCycleDays != null ? (
          <p className="text-sm font-semibold text-helix-text">~{averageCycleDays} days</p>
        ) : (
          <p className="text-xs text-helix-muted leading-relaxed">
            Log at least two periods to personalize. Until then we use 28 days for estimates.
          </p>
        )}
      </div>
    </div>
  );
}
