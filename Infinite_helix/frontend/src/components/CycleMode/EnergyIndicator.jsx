import React from 'react';

const ENERGY_LEVELS = {
  menstrual: { level: 25, label: 'Low Energy', color: '#f472b6', suggestion: 'Take it easy. Focus on lighter tasks and self-care.' },
  follicular: { level: 65, label: 'Rising Energy', color: '#34d399', suggestion: 'Great time for creative work and planning new projects.' },
  ovulatory: { level: 95, label: 'Peak Energy', color: '#fbbf24', suggestion: 'Your peak! Schedule important presentations and hard tasks.' },
  luteal: { level: 45, label: 'Winding Down', color: '#c084fc', suggestion: 'Wrap up tasks and organize. Be gentle with yourself.' },
};

export default function EnergyIndicator({ phase }) {
  const config = ENERGY_LEVELS[phase] || ENERGY_LEVELS.follicular;
  const segments = 10;

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-helix-muted mb-4">Energy Level</h3>

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
        <p className="text-xs text-helix-accent font-medium mb-1">AI Suggestion</p>
        <p className="text-sm text-helix-text leading-relaxed">{config.suggestion}</p>
      </div>
    </div>
  );
}
