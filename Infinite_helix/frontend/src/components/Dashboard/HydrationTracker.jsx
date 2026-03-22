import React, { useState } from 'react';
import { useWellness } from '../../context/WellnessContext';

const QUICK_AMOUNTS = [
  { label: 'Glass', ml: 250 },
  { label: 'Cup', ml: 200 },
  { label: 'Bottle', ml: 500 },
  { label: 'Sip', ml: 100 },
];

const CARD_TITLE = 'text-[13px] uppercase tracking-[0.06em] font-semibold text-helix-muted';

function WaterWave({ progress }) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  return (
    <div className="relative w-full h-3 bg-helix-bg rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-helix-sky to-cyan-400 rounded-full transition-all duration-700 ease-out"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
}

export default function HydrationTracker() {
  const { todayMetrics, addHydration } = useWellness();
  const { hydration } = todayMetrics;
  const [amountMl, setAmountMl] = useState(hydration.default_amount_ml || 250);

  const progress = hydration.goal_ml > 0
    ? Math.round((hydration.ml_today / hydration.goal_ml) * 100)
    : 0;
  const goalReached = hydration.ml_today >= hydration.goal_ml;
  const remainingMl = Math.max(0, (hydration.goal_ml || 0) - (hydration.ml_today || 0));

  const handleLog = () => {
    if (amountMl > 0 && !goalReached) {
      addHydration(amountMl);
    }
  };

  const handleAmountChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0) {
      setAmountMl(val);
    }
  };

  const fillPct = Math.min(100, Math.max(0, progress));

  return (
    <div className="glass-card p-6 h-full flex flex-col rounded-[20px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className={CARD_TITLE}>Hydration</h3>
        <span className="text-xs text-helix-sky font-medium">
          {hydration.ml_today} / {hydration.goal_ml} ml
        </span>
      </div>

      <div className="flex items-center justify-center gap-6 mb-4 flex-1 min-h-[7rem]">
        <div
          className="relative flex flex-col items-center justify-end rounded-b-xl rounded-t-md border border-helix-border/80 bg-helix-bg/80 overflow-hidden"
          style={{ width: 44, height: 112 }}
          aria-hidden
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500/90 to-helix-sky/85 transition-all duration-700 ease-out"
            style={{ height: `${fillPct}%` }}
          />
          <div className="absolute inset-x-0 top-0 h-2 rounded-t-md bg-helix-card/90 border-b border-helix-border/40 z-10" />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="text-3xl font-display font-bold text-helix-sky leading-none">{progress}%</span>
          <span className="text-xs text-helix-muted mt-2 max-w-[11rem] leading-snug">
            {remainingMl > 0 ? `${remainingMl} ml remaining to goal` : 'Goal reached'}
          </span>
        </div>
      </div>

      <WaterWave progress={progress} />

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={amountMl}
              onChange={handleAmountChange}
              min="50"
              max="2000"
              step="50"
              className="w-full bg-helix-bg/50 border border-helix-border rounded-xl px-3 py-2 pr-10 text-sm text-helix-text
                         focus:outline-none focus:border-helix-sky/50 focus:ring-1 focus:ring-helix-sky/20 transition-all
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-helix-muted">ml</span>
          </div>
          <button
            onClick={handleLog}
            disabled={goalReached || amountMl <= 0}
            className="px-4 py-2 rounded-xl bg-helix-sky/10 text-helix-sky text-sm font-medium
                       hover:bg-helix-sky/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                       whitespace-nowrap"
          >
            {goalReached ? 'Done' : 'Log'}
          </button>
        </div>

        <div className="flex gap-1.5">
          {QUICK_AMOUNTS.map(({ label, ml }) => {
            const selected = amountMl === ml;
            return (
              <button
                key={label}
                onClick={() => setAmountMl(ml)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border
                  ${selected
                    ? 'bg-helix-sky text-white border-helix-sky shadow-sm'
                    : 'bg-helix-bg/50 text-helix-muted hover:text-helix-text border-helix-border/50'
                  }`}
              >
                {label}
                <span className={`block text-[10px] ${selected ? 'text-white/85' : 'opacity-70'}`}>{ml}ml</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
