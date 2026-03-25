import React, { useState } from 'react';
import { useWellness } from '../../context/WellnessContext';
import { HiOutlineX } from 'react-icons/hi';

const TYPE_STYLES = {
  hydration: { label: 'Hydration', bg: 'bg-blue-50', text: 'text-blue-600', emoji: '\uD83D\uDCA7' },
  stretch:   { label: 'Move!', bg: 'bg-emerald-50', text: 'text-emerald-600', emoji: '\uD83E\uDDD8' },
  posture:   { label: 'Posture', bg: 'bg-emerald-50', text: 'text-emerald-600', emoji: '\uD83E\uDEBB' },
  eyes:      { label: 'Eye Rest', bg: 'bg-violet-50', text: 'text-violet-600', emoji: '\uD83D\uDC41\uFE0F' },
  meeting:   { label: 'Meeting', bg: 'bg-rose-50', text: 'text-rose-500', emoji: '\uD83C\uDFAF' },
  emotional: { label: 'Vibe Check', bg: 'bg-violet-50', text: 'text-violet-600', emoji: '\uD83D\uDC9C' },
  winddown:  { label: 'Log Off!', bg: 'bg-violet-50', text: 'text-violet-600', emoji: '\uD83C\uDF19' },
  morning:   { label: 'Morning', bg: 'bg-amber-50', text: 'text-amber-600', emoji: '\u2600\uFE0F' },
  streak:    { label: 'Achievement', bg: 'bg-amber-50', text: 'text-amber-600', emoji: '\uD83C\uDFC6' },
};

const PRIORITY_DOT = { gentle: 'bg-emerald-600', moderate: 'bg-amber-600', important: 'bg-rose-500' };

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getContextualNudge() {
  const h = new Date().getHours();
  if (h < 9 || h >= 18) return null;
  if (h < 13) return { key: 'morning', text: "Start with your hardest task while your brain still respects you. Focus peaks now." };
  if (h < 15) return { key: 'postlunch', text: "Post-lunch slump? That's not laziness, that's biology. A 5-min walk fixes it." };
  if (h < 16) return { key: 'bridge', text: "Guard your deep work. Those 47 Slack messages can wait. Probably." };
  return { key: 'late', text: "Wind down mode \u2014 finish what you started, don't start what you can't finish." };
}

function dismissStorageKey() {
  return `wellness-ctx-nudge-${todayKey()}`;
}

export default function NudgeFeed() {
  const { nudges, dismissNudge } = useWellness();
  const activeNudges = nudges.filter((n) => !n.dismissed);
  const pastNudges = nudges.filter((n) => n.dismissed);

  const [dismissedSlotKey, setDismissedSlotKey] = useState(() =>
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(dismissStorageKey()) : null
  );

  const contextual = getContextualNudge();
  const showContextual =
    activeNudges.length === 0 && contextual && dismissedSlotKey !== contextual.key;

  const dismissContext = () => {
    if (!contextual) return;
    const k = dismissStorageKey();
    sessionStorage.setItem(k, contextual.key);
    setDismissedSlotKey(contextual.key);
  };

  const workHours = (() => {
    const h = new Date().getHours();
    return h >= 9 && h < 18;
  })();

  return (
    <div className="bento-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="bento-label">Wellness Nudges</h3>
        {activeNudges.length > 0 && (
          <span className="text-[11px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-xl font-medium tabular-nums">
            {activeNudges.length} active
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1 flex-1">
        {activeNudges.map((nudge) => {
          const style = TYPE_STYLES[nudge.type] || TYPE_STYLES.emotional;
          return (
            <div key={nudge.id} className={`${style.bg} rounded-2xl p-4 animate-slide-up`}>
              <div className="flex items-start gap-3">
                <span className={`text-[10px] uppercase tracking-wider font-semibold shrink-0 mt-0.5 ${style.text}`}>
                  {style.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 leading-relaxed">{nudge.message}</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[nudge.priority]}`} />
                    <span className="text-[11px] text-slate-400">{nudge.time}</span>
                  </div>
                </div>
                <button type="button" onClick={() => dismissNudge(nudge.id)} className="text-slate-300 hover:text-slate-500 p-1 transition-colors">
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {showContextual && (
          <div className="rounded-2xl bg-violet-50 p-4 flex items-start gap-3">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-violet-600 shrink-0 mt-0.5">Tip</span>
            <p className="text-sm text-slate-600 leading-relaxed flex-1 min-w-0">{contextual.text}</p>
            <button
              type="button"
              onClick={dismissContext}
              className="shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-xl bg-white/60 text-slate-500 hover:text-slate-700 hover:bg-white/80 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {pastNudges.length > 0 && (
          <div className="pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
            <p className="text-[11px] text-slate-400 mb-2">Earlier</p>
            {pastNudges.map((nudge) => {
              const style = TYPE_STYLES[nudge.type] || TYPE_STYLES.emotional;
              return (
                <div key={nudge.id} className="flex items-center gap-2 py-2 opacity-50">
                  <span className={`text-[10px] uppercase w-16 shrink-0 ${style.text}`}>{style.label}</span>
                  <p className="text-xs text-slate-400 line-through flex-1">{nudge.message}</p>
                  <span className="text-[11px] text-slate-400">{nudge.time}</span>
                </div>
              );
            })}
          </div>
        )}

        {nudges.length === 0 && !showContextual && (
          <div className="text-center py-10 text-slate-400">
            {workHours ? (
              <p className="text-sm">More nudges will appear as your day unfolds.</p>
            ) : (
              <p className="text-sm">You&apos;re all caught up.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
