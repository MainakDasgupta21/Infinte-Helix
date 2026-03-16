import React from 'react';
import { useWellness } from '../../context/WellnessContext';

function DropIcon({ filled, index }) {
  return (
    <button
      className={`transition-all duration-300 ${filled ? 'scale-110' : 'opacity-40 hover:opacity-60'}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
        <path
          d="M14 2C14 2 3 14 3 21C3 27.075 7.925 32 14 32C20.075 32 25 27.075 25 21C25 14 14 2 14 2Z"
          fill={filled ? '#38bdf8' : '#2e2e3c'}
          stroke={filled ? '#38bdf8' : '#3d3d52'}
          strokeWidth="1.5"
          className="transition-all duration-500"
        />
        {filled && (
          <path
            d="M10 19C10 19 11 22 14 22"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}

export default function HydrationTracker() {
  const { todayMetrics, addHydration } = useWellness();
  const { hydration } = todayMetrics;
  const progress = (hydration.glasses / hydration.goal) * 100;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-helix-muted">Hydration</h3>
        <span className="text-xs text-helix-sky font-medium">{hydration.glasses} / {hydration.goal} glasses</span>
      </div>

      <div className="flex justify-center gap-1.5 mb-4">
        {hydration.history.map((filled, i) => (
          <DropIcon key={i} filled={filled} index={i} />
        ))}
      </div>

      <div className="w-full h-1.5 bg-helix-bg rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-helix-sky to-helix-accent rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        onClick={addHydration}
        disabled={hydration.glasses >= hydration.goal}
        className="w-full py-2.5 rounded-xl bg-helix-sky/10 text-helix-sky text-sm font-medium
                   hover:bg-helix-sky/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {hydration.glasses >= hydration.goal ? '✓ Goal Reached!' : '+ Log Water'}
      </button>
    </div>
  );
}
