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
      <div className="bento-card p-4 border border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Last period started</p>
        <p className="text-sm font-semibold text-slate-800 leading-snug">{longFmt(lastPeriodStartIso)}</p>
      </div>
      <div className="bento-card p-4 border border-violet-100">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Estimated next period</p>
        {nextPeriodInfo ? (
          <>
            <p className="text-sm font-semibold text-slate-800">
              {nextPeriodInfo.daysUntil === 0
                ? 'Could be today or very soon'
                : `${nextPeriodInfo.daysUntil} day${nextPeriodInfo.daysUntil === 1 ? '' : 's'} away`}
            </p>
            <p className="text-xs text-slate-500 mt-1">{nextPeriodInfo.label}</p>
          </>
        ) : (
          <p className="text-sm text-slate-500">Add a period to see an estimate</p>
        )}
      </div>
      <div className="bento-card p-4 border border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Typical cycle length</p>
        {averageCycleDays != null ? (
          <p className="text-sm font-semibold text-slate-800">~{averageCycleDays} days</p>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed">
            Log at least two periods to personalize. Until then we use 28 days for estimates.
          </p>
        )}
      </div>
    </div>
  );
}
