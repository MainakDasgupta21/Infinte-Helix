import React, { useMemo } from 'react';
import { HiOutlinePause, HiOutlineClock } from 'react-icons/hi';

export default function BreakBalance({ breaks }) {
  if (!breaks) return null;

  const progress = (breaks.taken / breaks.suggested) * 100;
  const remaining = breaks.suggested - breaks.taken;

  const nextBreakMins = useMemo(() => {
    const avg = breaks.avgDuration || 8;
    const last = breaks.lastBreak || '14:55';
    const [h, m] = last.split(':').map(Number);
    if (Number.isNaN(h)) return 45;
    const now = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    target.setMinutes(target.getMinutes() + avg);
    let diff = Math.round((target - now) / 60000);
    if (diff < 5) diff = 45;
    return Math.min(90, Math.max(15, diff));
  }, [breaks]);

  return (
    <div className="bento-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="bento-label">Break Balance</h3>
        <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center">
          <HiOutlinePause className="w-4 h-4 text-blue-600" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3" role="img" aria-label={`${breaks.taken} of ${breaks.suggested} breaks`}>
        {Array.from({ length: breaks.suggested }).map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full transition-all duration-500 ${
              i < breaks.taken ? 'bg-blue-600 shadow-[0_0_8px_rgba(59,130,200,0.3)]' : 'bg-slate-100'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-400 mb-4">
        {breaks.taken} / {breaks.suggested} breaks
      </p>

      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <HiOutlineClock className="w-3.5 h-3.5" />
            <span>Last break</span>
          </div>
          <span className="text-slate-600 font-medium">{breaks.lastBreak}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Avg duration</span>
          <span className="text-slate-600 font-medium">{breaks.avgDuration} min</span>
        </div>
        {remaining > 0 && (
          <div className="rounded-2xl px-4 py-3 bg-amber-50 text-amber-600 text-xs font-medium">
            {remaining} more break{remaining > 1 ? 's' : ''} recommended today
          </div>
        )}
        <p className="text-[11px] text-slate-400 pt-1">
          Next suggested break: in {nextBreakMins} min
        </p>
      </div>
    </div>
  );
}
