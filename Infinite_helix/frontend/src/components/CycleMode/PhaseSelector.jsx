import React from 'react';

const PHASES = [
  {
    id: 'menstrual', name: 'Menstrual', days: 'Day 1–5', emoji: '🌙',
    color: 'from-red-400/20 to-pink-400/20 border-pink-400/30',
    activeColor: 'from-red-400/40 to-pink-400/40 border-pink-400/60',
    energy: 'Low', focus: 'Rest & Reflect',
    tips: ['Gentle movement only', 'Warm beverages', 'Shorter work sessions', 'Extra breaks'],
  },
  {
    id: 'follicular', name: 'Follicular', days: 'Day 6–13', emoji: '🌱',
    color: 'from-green-400/20 to-emerald-400/20 border-emerald-400/30',
    activeColor: 'from-green-400/40 to-emerald-400/40 border-emerald-400/60',
    energy: 'Rising', focus: 'Plan & Create',
    tips: ['Great for brainstorming', 'Start new projects', 'Social collaboration', 'Try new routines'],
  },
  {
    id: 'ovulatory', name: 'Ovulatory', days: 'Day 14–16', emoji: '☀️',
    color: 'from-amber-400/20 to-yellow-400/20 border-amber-400/30',
    activeColor: 'from-amber-400/40 to-yellow-400/40 border-amber-400/60',
    energy: 'Peak', focus: 'Present & Lead',
    tips: ['Schedule presentations', 'Lead meetings', 'Tackle hard problems', 'Peak social energy'],
  },
  {
    id: 'luteal', name: 'Luteal', days: 'Day 17–28', emoji: '🍂',
    color: 'from-purple-400/20 to-indigo-400/20 border-purple-400/30',
    activeColor: 'from-purple-400/40 to-indigo-400/40 border-purple-400/60',
    energy: 'Decreasing', focus: 'Complete & Organize',
    tips: ['Finish existing tasks', 'Detail-oriented work', 'Organize & clean up', 'More frequent breaks'],
  },
];

export default function PhaseSelector({ activePhase, onSelect }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-helix-muted">Select Current Phase</h3>
      <div className="grid grid-cols-2 gap-3">
        {PHASES.map(phase => {
          const isActive = activePhase === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => onSelect(phase.id)}
              className={`p-4 rounded-xl border text-left transition-all bg-gradient-to-br ${
                isActive ? phase.activeColor : phase.color
              } ${isActive ? 'ring-1 ring-white/10 scale-[1.02]' : 'hover:scale-[1.01]'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{phase.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-helix-text">{phase.name}</p>
                  <p className="text-xs text-helix-muted">{phase.days}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-helix-muted">Energy:</span>
                <span className="text-xs font-medium text-helix-text">{phase.energy}</span>
              </div>
              <p className="text-xs text-helix-accent">{phase.focus}</p>

              {isActive && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                  {phase.tips.map((tip, i) => (
                    <p key={i} className="text-xs text-helix-muted flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-helix-accent" />
                      {tip}
                    </p>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
