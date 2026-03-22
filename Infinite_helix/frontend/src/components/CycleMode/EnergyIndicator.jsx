import React from 'react';

function configForCycleDay(cycleDay) {
  const d = cycleDay;
  if (d >= 1 && d <= 5) {
    return {
      level: 25,
      label: 'Rest and restore',
      color: '#c97b9a',
      suggestion: 'Go easy on yourself today. Shorter tasks and cozy breaks will feel better than pushing hard.',
    };
  }
  if (d >= 6 && d <= 13) {
    return {
      level: 74,
      label: 'Good focus window',
      color: '#3db89a',
      suggestion: 'Your head may feel clearer—good for planning, learning something new, or ticking off medium tasks.',
    };
  }
  if (d >= 14 && d <= 16) {
    return {
      level: 92,
      label: 'Peak performance',
      color: '#fbbf24',
      suggestion: 'You might feel extra sharp—use it for things that need confidence, focus, or speaking up.',
    };
  }
  return {
    level: 52,
    label: 'Wind down mode',
    color: '#6b8cff',
    suggestion: 'Finishing and tidying up may feel easier than starting big new things. Small wins still count.',
  };
}

export default function EnergyIndicator({ cycleDay }) {
  const day = Math.min(28, Math.max(1, Number(cycleDay) || 1));
  const config = configForCycleDay(day);
  const segments = 10;

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-helix-muted mb-4">How your energy may feel</h3>

      <div className="flex items-center justify-center gap-1.5 mb-4">
        {Array.from({ length: segments }).map((_, i) => {
          const filled = (i + 1) * 10 <= config.level;
          return (
            <div
              key={i}
              className="w-6 h-8 rounded-md transition-all duration-500"
              style={{
                backgroundColor: filled ? config.color : '#2e2e3c',
                opacity: filled ? 0.6 + (i / segments) * 0.4 : 0.3,
                transform: filled ? `scaleY(${0.5 + (i / segments) * 0.5})` : 'scaleY(0.3)',
              }}
            />
          );
        })}
      </div>

      <div className="text-center mb-4">
        <p className="text-lg font-display font-semibold text-helix-text">{config.label}</p>
        <p className="text-2xl font-bold" style={{ color: config.color }}>{config.level}%</p>
      </div>

      <div className="bg-helix-bg/50 rounded-xl p-4 border border-helix-border/20">
        <p className="text-xs text-helix-accent font-medium mb-1">Tips for you</p>
        <p className="text-sm text-helix-text leading-relaxed">{config.suggestion}</p>
      </div>
    </div>
  );
}
