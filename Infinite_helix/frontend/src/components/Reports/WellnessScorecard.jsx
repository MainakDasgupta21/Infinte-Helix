import React from 'react';
import {
  HiOutlineClock,
  HiOutlineLightningBolt,
  HiOutlineHeart,
  HiOutlineTrendingUp,
  HiOutlinePencilAlt,
  HiOutlineFire,
} from 'react-icons/hi';

function moodLabel(m) {
  if (!m) return '—';
  return String(m).replace(/_/g, ' ');
}

export default function WellnessScorecard({ score, summary, dailyScores }) {
  if (!score || !summary) return null;

  const circumference = 2 * Math.PI * 54;
  const filled = (score.current / 100) * circumference;
  const changePositive = score.change >= 0;

  const stats = [
    {
      label: 'Focus Time',
      value: `${summary.total_focus_hours}h`,
      sub: `${summary.avg_daily_focus}h/day avg`,
      icon: HiOutlineLightningBolt,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Breaks / Day',
      value: summary.breaks_per_day,
      sub: `Every ${summary.avg_break_interval_min} min`,
      icon: HiOutlineClock,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Hydration',
      value: `${summary.hydration_avg_ml} ml`,
      sub: `of ${summary.hydration_goal_ml} ml goal`,
      icon: HiOutlineHeart,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Mood Trend',
      value: summary.mood_trend,
      sub: `Top: ${summary.top_emotion}`,
      icon: HiOutlineTrendingUp,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
    },
    {
      label: 'Journal',
      value: `${summary.journal_entries}`,
      sub: 'entries this week',
      icon: HiOutlinePencilAlt,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Streak',
      value: `${summary.streak_days}`,
      sub: 'days active',
      icon: HiOutlineFire,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="glass-card p-6">
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        {/* Score Circle */}
        <div className="flex flex-col items-center gap-3 min-w-[180px]">
          <div className="relative">
            <svg width="140" height="140" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6b8cff" />
                  <stop offset="100%" stopColor="#5eb0d8" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="54" fill="none" stroke="#2e2e3c" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${filled} ${circumference - filled}`}
                transform="rotate(-90 60 60)"
                className="transition-all duration-1000"
              />
              <text x="60" y="55" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold" fill="#e8e4f0" fontSize="32" fontWeight="700" fontFamily="'Playfair Display', serif">
                {score.current}
              </text>
              <text x="60" y="78" textAnchor="middle" fill="#9490a8" fontSize="11" fontFamily="'DM Sans', sans-serif">
                out of 100
              </text>
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-600">
              {score.grade}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${changePositive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {changePositive ? '\u2191' : '\u2193'} {Math.abs(score.change)} from last week
            </span>
          </div>

          <p className="text-xs text-slate-500 text-center">Wellness Score</p>
        </div>

        {/* Stats + Daily Scores */}
        <div className="flex-1 w-full space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`${stat.bg} rounded-xl p-3.5 border border-slate-100`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-xs text-slate-500">{stat.label}</span>
                  </div>
                  <p className={`text-lg font-serif font-bold ${stat.color} capitalize`}>{stat.value}</p>
                  <p className="text-xs text-slate-500/70 mt-0.5">{stat.sub}</p>
                </div>
              );
            })}
          </div>

          {dailyScores && dailyScores.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2.5">Daily Wellness</p>
              <div className="space-y-1.5">
                {dailyScores.map((d) => (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-8 text-right">{d.day}</span>
                    <div className="flex-1 h-5 bg-slate-100/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600/80 to-blue-600/70 transition-all duration-700 flex items-center justify-end pr-2"
                        style={{ width: `${d.score}%` }}
                      >
                        <span className="text-[10px] font-medium text-white/90">{d.score}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 w-16 text-right capitalize truncate" title={d.mood}>
                      {moodLabel(d.mood)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
