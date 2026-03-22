import React, { useMemo } from 'react';

const CARD_TITLE = 'text-[13px] uppercase tracking-[0.06em] font-semibold text-helix-muted';

function scoreContextSentence(score, breaks) {
  if (score >= 80) return "You're in a good rhythm — small wins add up.";
  if (score >= 60) {
    const need = Math.max(0, (breaks?.suggested || 6) - (breaks?.taken || 0));
    if (need > 0) return `Take ${need} more break${need === 1 ? '' : 's'} to reach 80 today.`;
    return 'Steady progress — a short reset could still lift your score.';
  }
  const gap = 80 - score;
  const est = Math.min(6, Math.max(1, Math.ceil(gap / 12)));
  return `Take ${est} more mindful break${est === 1 ? '' : 's'} to reach 80 today.`;
}

export default function ProductivityScore({ score = 0, streakDays = 0, mood = 'neutral', breaks }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  const moodLabels = {
    focused: 'Focused',
    happy: 'Positive',
    stressed: 'Stressed',
    tired: 'Tired',
    calm: 'Calm',
    neutral: 'Neutral',
  };
  const scoreColor = score >= 80 ? 'text-helix-mint' : score >= 60 ? 'text-helix-amber' : 'text-helix-red';
  const strokeColor = score >= 80 ? '#3db89a' : score >= 60 ? '#d4a84b' : '#e07070';
  const arcMuted = score >= 80 ? 'rgba(61, 184, 154, 0.15)' : score >= 60 ? 'rgba(212, 168, 75, 0.15)' : 'rgba(224, 112, 112, 0.15)';

  const contextLine = useMemo(() => scoreContextSentence(score, breaks), [score, breaks]);

  return (
    <div className="glass-card p-6 glow-accent flex flex-col items-center h-full rounded-2xl border border-helix-border/30">
      <h3 className={`${CARD_TITLE} mb-4 w-full text-left`}>Wellness Score</h3>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#2e2e3c" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={arcMuted}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset="0"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-display font-bold ${scoreColor}`}>{score}</span>
          <span className="text-xs text-helix-muted">/ 100</span>
        </div>
      </div>
      <p className="text-xs text-helix-muted text-center mt-3 leading-relaxed px-1 min-h-[2.5rem] flex items-center justify-center">
        {contextLine}
      </p>
      <div className="mt-4 w-full pt-4 border-t border-helix-border/40 flex items-stretch justify-around gap-2">
        <div className="flex-1 text-center rounded-xl bg-helix-bg/40 py-3 px-2">
          <p className={`${CARD_TITLE} mb-2`}>Today&apos;s mood</p>
          <span className="text-lg font-semibold text-helix-text leading-none block">
            {moodLabels[mood] || moodLabels.neutral}
          </span>
        </div>
        <div className="flex-1 text-center rounded-xl bg-helix-bg/40 py-3 px-2">
          <p className={`${CARD_TITLE} mb-2`}>Streak</p>
          <span className="text-xl font-display font-semibold text-helix-accent leading-none block">{streakDays}</span>
          <p className="text-xs text-helix-muted mt-1.5">days</p>
        </div>
      </div>
    </div>
  );
}
