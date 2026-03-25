import React from 'react';
import { HiOutlineEye, HiOutlineClock, HiOutlineHeart, HiOutlineRefresh } from 'react-icons/hi';

const METRICS_CONFIG = [
  {
    key: 'hydration',
    label: 'Hydration',
    icon: HiOutlineHeart,
    color: 'from-blue-600 to-blue-400',
    textColor: 'text-blue-600',
    format: (d) => ({
      value: `${d.avg_ml} / ${d.goal_ml}`,
      unit: 'ml avg',
      detail: `Best day: ${d.best_day} \u00b7 ${d.total_ml} ml total`,
      pct: d.completion_pct,
    }),
  },
  {
    key: 'breaks',
    label: 'Break Balance',
    icon: HiOutlineClock,
    color: 'from-emerald-600 to-emerald-400',
    textColor: 'text-emerald-600',
    format: (d) => ({
      value: d.total,
      unit: 'breaks taken',
      detail: `Every ${d.avg_interval_min} min (ideal: ${d.ideal_interval} min)`,
      pct: d.compliance_pct,
    }),
  },
  {
    key: 'stretches',
    label: 'Stretch Breaks',
    icon: HiOutlineRefresh,
    color: 'from-violet-600 to-indigo-500',
    textColor: 'text-violet-600',
    format: (d) => ({
      value: `${d.done} / ${d.suggested}`,
      unit: 'completed',
      detail: `${d.suggested - d.done} more to hit your goal`,
      pct: d.compliance_pct,
    }),
  },
  {
    key: 'eye_rest',
    label: 'Eye Rest (20-20-20)',
    icon: HiOutlineEye,
    color: 'from-rose-500 to-rose-400',
    textColor: 'text-rose-500',
    format: (d) => ({
      value: `${d.done} / ${d.suggested}`,
      unit: 'completed',
      detail: `${d.suggested - d.done} more to reach target`,
      pct: d.compliance_pct,
    }),
  },
];

export default function SelfCareMetrics({ selfCare }) {
  if (!selfCare) return null;

  return (
    <div className="glass-card p-6">
      <div className="mb-5">
        <h3 className="text-sm font-medium text-slate-500">Self-Care Progress</h3>
        <p className="text-xs text-slate-500/60 mt-0.5">How well you cared for yourself this week</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {METRICS_CONFIG.map(({ key, label, icon: Icon, color, textColor, format }) => {
          const d = selfCare[key];
          if (!d) return null;
          const { value, unit, detail, pct } = format(d);

          return (
            <div key={key} className="bg-slate-100/50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${textColor} bg-current/10`}>
                    <Icon className={`w-4.5 h-4.5 ${textColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500/70">{detail}</p>
                  </div>
                </div>
                <span className={`text-lg font-serif font-bold ${textColor}`}>{pct}%</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-slate-200/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">{value} {unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
