import React, { useMemo } from 'react';

function scoreContextSentence(score, breaks) {
  if (score >= 80) return "You're in a beautiful rhythm — small wins add up.";
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
    neutral: 'Balanced',
  };
  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-500';
  const strokeColor = score >= 80 ? '#7cb874' : score >= 60 ? '#c88a2d' : '#d99faf';
  const arcMuted = score >= 80 ? 'rgba(124,184,116,0.15)' : score >= 60 ? 'rgba(200,138,45,0.15)' : 'rgba(217,159,175,0.15)';

  const contextLine = useMemo(() => scoreContextSentence(score, breaks), [score, breaks]);

  return (
    <div className="bento-card flex flex-col items-center h-full glow-lavender">
      <h3 className="bento-label mb-5 w-full text-left">Wellness Score</h3>

      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f0f8" strokeWidth="7" />
          <circle cx="60" cy="60" r="54" fill="none" stroke={arcMuted} strokeWidth="7"
            strokeDasharray={circumference} strokeDashoffset="0" />
          <circle cx="60" cy="60" r="54" fill="none" stroke={strokeColor} strokeWidth="7"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-serif font-bold ${scoreColor}`}>{Math.round(score)}</span>
          <span className="text-[11px] text-slate-400 font-medium">/ 100</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed px-2 min-h-[2.5rem] flex items-center justify-center">
        {contextLine}
      </p>

      <div className="mt-5 w-full pt-5 flex items-stretch justify-around gap-3"
           style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
        <div className="flex-1 text-center rounded-2xl bg-slate-50/60 py-3.5 px-3 hover:bg-white/70 transition-all">
          <p className="bento-label mb-2">Mood</p>
          <span className="text-base font-semibold text-slate-700 leading-none block font-serif">
            {moodLabels[mood] || moodLabels.neutral}
          </span>
        </div>
        <div className="flex-1 text-center rounded-2xl bg-slate-50/60 py-3.5 px-3 hover:bg-white/70 transition-all">
          <p className="bento-label mb-2">Streak</p>
          <span className="text-xl font-serif font-semibold text-violet-600 leading-none block">{streakDays}</span>
          <p className="text-[11px] text-slate-400 mt-1.5">days</p>
        </div>
      </div>
    </div>
  );
}
