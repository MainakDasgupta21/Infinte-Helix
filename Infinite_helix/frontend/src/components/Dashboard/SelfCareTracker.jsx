import React, { useState } from 'react';
import { HiOutlineEye, HiOutlineRefresh } from 'react-icons/hi';
import { useWellness } from '../../context/WellnessContext';

export default function SelfCareTracker() {
  const { todayMetrics, logSelfCare } = useWellness();
  const sc = todayMetrics.selfCare;
  const [animating, setAnimating] = useState(null);

  const handleLog = async (action) => {
    setAnimating(action);
    await logSelfCare(action);
    setTimeout(() => setAnimating(null), 600);
  };

  const stretchCount = sc.stretch || 0;
  const eyeRestCount = sc.eye_rest || 0;
  const stretchGoal = sc.goals?.stretch || 25;
  const eyeGoal = sc.goals?.eye_rest || 30;
  const stretchPct = Math.min(100, Math.round((stretchCount / stretchGoal) * 100));
  const eyePct = Math.min(100, Math.round((eyeRestCount / eyeGoal) * 100));

  return (
    <div className="bento-card h-full flex flex-col">
      <h3 className="bento-label mb-5">Self-Care Actions</h3>

      <div className="space-y-4 flex-1">
        {/* Stretch Breaks */}
        <div className="bg-slate-50/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-violet-50">
                <HiOutlineRefresh className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Stretch Breaks</p>
                <p className="text-[11px] text-slate-400">{stretchCount} / {stretchGoal} today</p>
              </div>
            </div>
            <span className="text-lg font-serif font-bold text-violet-600">{stretchPct}%</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-600 transition-all duration-700"
                style={{ width: `${stretchPct}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => handleLog('stretch')}
            disabled={stretchCount >= stretchGoal}
            className={`w-full py-2.5 rounded-2xl text-xs font-medium transition-all duration-200
              ${stretchCount >= stretchGoal
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-violet-50 text-violet-600 hover:bg-violet-100 active:scale-[0.98]'}
              ${animating === 'stretch' ? 'scale-95 opacity-80' : ''}`}
          >
            {stretchCount >= stretchGoal ? 'Goal reached!' : 'Log Stretch Break'}
          </button>
        </div>

        {/* Eye Rest */}
        <div className="bg-slate-50/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-rose-50">
                <HiOutlineEye className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Eye Rest (20-20-20)</p>
                <p className="text-[11px] text-slate-400">{eyeRestCount} / {eyeGoal} today</p>
              </div>
            </div>
            <span className="text-lg font-serif font-bold text-rose-500">{eyePct}%</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-700"
                style={{ width: `${eyePct}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => handleLog('eye_rest')}
            disabled={eyeRestCount >= eyeGoal}
            className={`w-full py-2.5 rounded-2xl text-xs font-medium transition-all duration-200
              ${eyeRestCount >= eyeGoal
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-rose-50 text-rose-500 hover:bg-rose-100 active:scale-[0.98]'}
              ${animating === 'eye_rest' ? 'scale-95 opacity-80' : ''}`}
          >
            {eyeRestCount >= eyeGoal ? 'Goal reached!' : 'Log Eye Rest'}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-400/60 mt-4 text-center">
        Eye reminders fire every 20 min automatically
      </p>
    </div>
  );
}
