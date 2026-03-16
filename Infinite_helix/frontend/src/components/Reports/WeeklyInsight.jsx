import React from 'react';
import { HiOutlineTrendingUp, HiOutlineTrendingDown, HiOutlineCheckCircle, HiOutlineLightBulb } from 'react-icons/hi';

const INSIGHTS = [
  {
    icon: HiOutlineTrendingUp,
    title: 'Productivity Up 12%',
    detail: 'Your focus sessions increased from 3.2 to 4.1 per day compared to last week.',
    color: 'text-helix-mint',
    bg: 'bg-helix-mint/10',
  },
  {
    icon: HiOutlineTrendingDown,
    title: 'Hydration Needs Attention',
    detail: 'You averaged 4.2 glasses/day — below your 8 glass goal. Try setting morning reminders.',
    color: 'text-helix-amber',
    bg: 'bg-helix-amber/10',
  },
  {
    icon: HiOutlineCheckCircle,
    title: 'Great Break Balance',
    detail: 'You took breaks every 72 min on average — close to the ideal 90 min cycle.',
    color: 'text-helix-sky',
    bg: 'bg-helix-sky/10',
  },
  {
    icon: HiOutlineLightBulb,
    title: 'Peak Focus: 9-11 AM',
    detail: 'Your highest concentration scores consistently happen in morning hours. Schedule deep work then.',
    color: 'text-helix-accent',
    bg: 'bg-helix-accent/10',
  },
];

const SUMMARY = {
  avgScore: 74,
  totalFocusHours: 28.5,
  breaksPerDay: 4.8,
  moodTrend: 'improving',
  topEmotion: 'focused',
};

export default function WeeklyInsight() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-helix-muted">Weekly Report Card</h3>
          <p className="text-xs text-helix-muted/70 mt-0.5">Mar 10 — Mar 16, 2026</p>
        </div>
        <div className="glass-card px-3 py-1.5">
          <span className="text-xs text-helix-muted">Avg Score: </span>
          <span className="text-sm font-bold text-helix-mint">{SUMMARY.avgScore}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-helix-bg/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-display font-bold text-helix-accent">{SUMMARY.totalFocusHours}h</p>
          <p className="text-xs text-helix-muted">Focus Time</p>
        </div>
        <div className="bg-helix-bg/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-display font-bold text-helix-sky">{SUMMARY.breaksPerDay}</p>
          <p className="text-xs text-helix-muted">Breaks/Day</p>
        </div>
        <div className="bg-helix-bg/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-display font-bold text-helix-mint capitalize">{SUMMARY.moodTrend}</p>
          <p className="text-xs text-helix-muted">Mood Trend</p>
        </div>
        <div className="bg-helix-bg/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-display font-bold text-helix-pink capitalize">{SUMMARY.topEmotion}</p>
          <p className="text-xs text-helix-muted">Top Emotion</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-helix-muted font-medium uppercase tracking-wider">Insights & Suggestions</p>
        {INSIGHTS.map((insight, i) => (
          <div key={i} className={`${insight.bg} rounded-xl p-4 border border-helix-border/20`}>
            <div className="flex items-start gap-3">
              <insight.icon className={`w-5 h-5 mt-0.5 ${insight.color}`} />
              <div>
                <p className="text-sm font-medium text-helix-text">{insight.title}</p>
                <p className="text-xs text-helix-muted mt-1 leading-relaxed">{insight.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
