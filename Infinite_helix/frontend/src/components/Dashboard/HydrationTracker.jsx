import React, { useState } from 'react';
import { useWellness } from '../../context/WellnessContext';

const QUICK_AMOUNTS = [
  { label: 'Glass', ml: 250 },
  { label: 'Cup', ml: 200 },
  { label: 'Bottle', ml: 500 },
  { label: 'Sip', ml: 100 },
];

function WaterWave({ progress }) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  return (
    <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700 ease-out"
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
    <div className="bento-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="bento-label">Hydration</h3>
        <span className="text-xs text-blue-600 font-medium">
          {hydration.ml_today} / {hydration.goal_ml} ml
        </span>
      </div>

      <div className="flex items-center justify-center gap-6 mb-5 flex-1 min-h-[7rem]">
        <div
          className="relative flex flex-col items-center justify-end rounded-xl overflow-hidden bg-slate-50"
          style={{ width: 44, height: 112, border: '1px solid rgba(0,0,0,0.04)' }}
          aria-hidden
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500/90 to-blue-600/85 transition-all duration-700 ease-out"
            style={{ height: `${fillPct}%` }}
          />
          <div className="absolute inset-x-0 top-0 h-2 rounded-t-xl bg-white/80 z-10" />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="text-3xl font-serif font-bold text-blue-600 leading-none">{progress}%</span>
          <span className="text-xs text-slate-400 mt-2 max-w-[11rem] leading-snug">
            {remainingMl > 0 ? `${remainingMl} ml remaining to goal` : 'Goal reached'}
          </span>
        </div>
      </div>

      <WaterWave progress={progress} />

      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={amountMl}
              onChange={handleAmountChange}
              min="50"
              max="2000"
              step="50"
              className="w-full bg-slate-50 rounded-2xl px-4 py-2.5 pr-10 text-sm text-slate-700
                         focus:outline-none focus:bg-white focus:shadow-[0_2px_12px_rgb(0,0,0,0.04)] transition-all
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">ml</span>
          </div>
          <button
            onClick={handleLog}
            disabled={goalReached || amountMl <= 0}
            className="px-5 py-2.5 rounded-2xl bg-blue-50 text-blue-600 text-sm font-medium
                       hover:bg-blue-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                       whitespace-nowrap"
          >
            {goalReached ? 'Done' : 'Log'}
          </button>
        </div>

        <div className="flex gap-2">
          {QUICK_AMOUNTS.map(({ label, ml }) => {
            const selected = amountMl === ml;
            return (
              <button
                key={label}
                onClick={() => setAmountMl(ml)}
                className={`flex-1 py-2 rounded-2xl text-xs font-medium transition-all duration-200
                  ${selected
                    ? 'bg-blue-600 text-white shadow-[0_4px_16px_rgba(59,130,200,0.2)]'
                    : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
              >
                {label}
                <span className={`block text-[10px] mt-0.5 ${selected ? 'text-white/80' : 'opacity-60'}`}>{ml}ml</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
