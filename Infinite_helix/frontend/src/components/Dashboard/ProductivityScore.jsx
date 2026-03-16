import React from 'react';

export default function ProductivityScore({ score = 0, streakDays = 0, mood = 'neutral' }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  const moodEmojis = { focused: '🎯', happy: '😊', stressed: '😤', tired: '😴', calm: '🧘', neutral: '😐' };
  const scoreColor = score >= 80 ? 'text-helix-mint' : score >= 60 ? 'text-helix-amber' : 'text-helix-red';
  const strokeColor = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';

  return (
    <div className="glass-card p-6 glow-accent flex flex-col items-center">
      <h3 className="text-sm font-medium text-helix-muted mb-4">Wellness Score</h3>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#2e2e3c" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={strokeColor} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-display font-bold ${scoreColor}`}>{score}</span>
          <span className="text-xs text-helix-muted">/ 100</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="text-center">
          <span className="text-lg">{moodEmojis[mood] || '😐'}</span>
          <p className="text-xs text-helix-muted capitalize mt-1">{mood}</p>
        </div>
        <div className="w-px h-8 bg-helix-border" />
        <div className="text-center">
          <span className="text-lg font-semibold text-helix-accent">{streakDays}</span>
          <p className="text-xs text-helix-muted mt-1">Day Streak</p>
        </div>
      </div>
    </div>
  );
}
