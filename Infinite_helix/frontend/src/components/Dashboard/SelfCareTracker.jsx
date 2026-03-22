import React, { useState } from 'react';
import { HiOutlineEye, HiOutlineRefresh } from 'react-icons/hi';
import { useWellness } from '../../context/WellnessContext';

const CARD_TITLE = 'text-[13px] uppercase tracking-[0.06em] font-semibold text-helix-muted';

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
    <div className="glass-card p-6 h-full flex flex-col rounded-2xl border border-helix-border/30">
      <h3 className={`${CARD_TITLE} mb-4`}>Self-Care Actions</h3>

      <div className="space-y-4 flex-1">
        {/* Stretch Breaks */}
        <div className="bg-helix-bg/50 rounded-xl p-4 border border-helix-border/15">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-helix-accent/10">
                <HiOutlineRefresh className="w-4 h-4 text-helix-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-helix-text">Stretch Breaks</p>
                <p className="text-[11px] text-helix-muted">{stretchCount} / {stretchGoal} today</p>
              </div>
            </div>
            <span className="text-lg font-display font-bold text-helix-accent">{stretchPct}%</span>
          </div>
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex-1 h-2 bg-helix-border/25 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-helix-accent to-indigo-500 transition-all duration-700"
                style={{ width: `${stretchPct}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => handleLog('stretch')}
            disabled={stretchCount >= stretchGoal}
            className={`w-full py-2 rounded-xl text-xs font-medium transition-all duration-200 border
              ${stretchCount >= stretchGoal
                ? 'bg-helix-bg/30 text-helix-muted border-helix-border/20 cursor-not-allowed'
                : 'bg-helix-accent/10 text-helix-accent border-helix-accent/25 hover:bg-helix-accent/20 active:scale-[0.98]'}
              ${animating === 'stretch' ? 'scale-95 opacity-80' : ''}`}
          >
            {stretchCount >= stretchGoal ? 'Goal reached!' : 'Log Stretch Break'}
          </button>
        </div>

        {/* Eye Rest (20-20-20) */}
        <div className="bg-helix-bg/50 rounded-xl p-4 border border-helix-border/15">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-helix-pink/10">
                <HiOutlineEye className="w-4 h-4 text-helix-pink" />
              </div>
              <div>
                <p className="text-sm font-medium text-helix-text">Eye Rest (20-20-20)</p>
                <p className="text-[11px] text-helix-muted">{eyeRestCount} / {eyeGoal} today</p>
              </div>
            </div>
            <span className="text-lg font-display font-bold text-helix-pink">{eyePct}%</span>
          </div>
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex-1 h-2 bg-helix-border/25 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-helix-pink to-rose-400 transition-all duration-700"
                style={{ width: `${eyePct}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => handleLog('eye_rest')}
            disabled={eyeRestCount >= eyeGoal}
            className={`w-full py-2 rounded-xl text-xs font-medium transition-all duration-200 border
              ${eyeRestCount >= eyeGoal
                ? 'bg-helix-bg/30 text-helix-muted border-helix-border/20 cursor-not-allowed'
                : 'bg-helix-pink/10 text-helix-pink border-helix-pink/25 hover:bg-helix-pink/20 active:scale-[0.98]'}
              ${animating === 'eye_rest' ? 'scale-95 opacity-80' : ''}`}
          >
            {eyeRestCount >= eyeGoal ? 'Goal reached!' : 'Log Eye Rest'}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-helix-muted/60 mt-3 text-center">
        Eye reminders fire every 20 min automatically
      </p>
    </div>
  );
}
