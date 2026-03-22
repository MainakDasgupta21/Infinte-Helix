import React, { useMemo } from 'react';
import { HiOutlinePause, HiOutlineClock } from 'react-icons/hi';

const CARD_TITLE = 'text-[13px] uppercase tracking-[0.06em] font-semibold text-helix-muted';

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
    <div className="glass-card p-6 h-full flex flex-col rounded-2xl border border-helix-border/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className={CARD_TITLE}>Break Balance</h3>
        <div className="w-8 h-8 rounded-lg bg-helix-sky/10 flex items-center justify-center">
          <HiOutlinePause className="w-4 h-4 text-helix-sky" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-2" role="img" aria-label={`${breaks.taken} of ${breaks.suggested} breaks`}>
        {Array.from({ length: breaks.suggested }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full border ${i < breaks.taken ? 'bg-helix-sky border-helix-sky' : 'bg-transparent border-helix-border'}`}
          />
        ))}
      </div>
      <p className="text-xs text-helix-muted mb-3">
        {breaks.taken} / {breaks.suggested} breaks
      </p>

      <div className="w-full h-2 bg-helix-bg rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-helix-sky to-helix-mint rounded-full transition-all duration-700"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="space-y-2 flex-1">
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
          <div className="rounded-xl px-3 py-2.5 bg-amber-500/15 border border-amber-500/25 text-amber-200/95 text-xs font-medium">
            {remaining} more break{remaining > 1 ? 's' : ''} recommended today
          </div>
        )}
        <p className="text-[11px] text-helix-muted pt-1">
          Next suggested break: in {nextBreakMins} min
        </p>
      </div>
    </div>
  );
}
