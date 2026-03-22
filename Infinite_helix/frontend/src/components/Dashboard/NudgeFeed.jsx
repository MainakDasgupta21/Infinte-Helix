import React, { useState } from 'react';
import { useWellness } from '../../context/WellnessContext';
import { HiOutlineX } from 'react-icons/hi';

const CARD_TITLE = 'text-[13px] uppercase tracking-[0.06em] font-semibold text-helix-muted';

const TYPE_STYLES = {
  hydration: { label: 'Hydration', bg: 'bg-helix-sky/10', border: 'border-helix-sky/20', text: 'text-helix-sky', emoji: '\uD83D\uDCA7' },
  stretch:   { label: 'Move!', bg: 'bg-helix-mint/10', border: 'border-helix-mint/20', text: 'text-helix-mint', emoji: '\uD83E\uDDD8' },
  posture:   { label: 'Posture', bg: 'bg-helix-mint/10', border: 'border-helix-mint/20', text: 'text-helix-mint', emoji: '\uD83E\uDEBB' },
  eyes:      { label: 'Eye Rest', bg: 'bg-helix-accent/10', border: 'border-helix-accent/20', text: 'text-helix-accent', emoji: '\uD83D\uDC41\uFE0F' },
  meeting:   { label: 'Meeting', bg: 'bg-helix-pink/10', border: 'border-helix-pink/20', text: 'text-helix-pink', emoji: '\uD83C\uDFAF' },
  emotional: { label: 'Vibe Check', bg: 'bg-helix-accent/10', border: 'border-helix-accent/20', text: 'text-helix-accent', emoji: '\uD83D\uDC9C' },
  winddown:  { label: 'Log Off!', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', emoji: '\uD83C\uDF19' },
  morning:   { label: 'Morning', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', emoji: '\u2600\uFE0F' },
  streak:    { label: 'Achievement', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', emoji: '\uD83C\uDFC6' },
};

const PRIORITY_DOT = { gentle: 'bg-helix-mint', moderate: 'bg-helix-amber', important: 'bg-helix-pink' };

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getContextualNudge() {
  const h = new Date().getHours();
  if (h < 9 || h >= 18) return null;
  if (h < 13) {
    return { key: 'morning', text: "Start with your hardest task while your brain still respects you. Focus peaks now." };
  }
  if (h < 15) {
    return { key: 'postlunch', text: "Post-lunch slump? That's not laziness, that's biology. A 5-min walk fixes it. Science said so." };
  }
  if (h < 16) {
    return { key: 'bridge', text: "Guard your deep work. Those 47 Slack messages can wait. Probably." };
  }
  return { key: 'late', text: "Wind down mode \u2014 finish what you started, don't start what you can't finish." };
}

function dismissStorageKey() {
  return `helix-ctx-nudge-${todayKey()}`;
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
    <div className="glass-card p-6 h-full flex flex-col rounded-[20px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className={CARD_TITLE}>Wellness Nudges</h3>
        {activeNudges.length > 0 && (
          <span className="text-xs bg-helix-border/40 text-helix-muted px-2 py-1 rounded font-medium tabular-nums">
            {activeNudges.length} active
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1 flex-1">
        {activeNudges.map((nudge) => {
          const style = TYPE_STYLES[nudge.type] || TYPE_STYLES.emotional;
          return (
            <div key={nudge.id} className={`${style.bg} border ${style.border} rounded-xl p-3 animate-slide-up`}>
              <div className="flex items-start gap-3">
                <span
                  className={`text-[10px] uppercase tracking-wide font-semibold shrink-0 mt-0.5 px-1.5 py-0.5 rounded border border-current/20 ${style.text}`}
                >
                  {style.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-helix-text leading-relaxed">{nudge.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[nudge.priority]}`} />
                    <span className="text-xs text-helix-muted">{nudge.time}</span>
                  </div>
                </div>
                <button type="button" onClick={() => dismissNudge(nudge.id)} className="text-helix-muted hover:text-helix-text p-1">
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {showContextual && (
          <div className="rounded-xl border border-helix-accent/25 bg-helix-accent/10 p-3 flex items-start gap-3">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-helix-accent shrink-0 mt-0.5">Tip</span>
            <p className="text-sm text-helix-text leading-relaxed flex-1 min-w-0">{contextual.text}</p>
            <button
              type="button"
              onClick={dismissContext}
              className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg bg-helix-bg/50 border border-helix-border/60 text-helix-muted hover:text-helix-text hover:bg-helix-bg transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {pastNudges.length > 0 && (
          <div className="pt-2 border-t border-helix-border">
            <p className="text-xs text-helix-muted mb-2">Earlier</p>
            {pastNudges.map((nudge) => {
              const style = TYPE_STYLES[nudge.type] || TYPE_STYLES.emotional;
              return (
                <div key={nudge.id} className="flex items-center gap-2 py-1.5 opacity-50">
                  <span className={`text-[10px] uppercase w-16 shrink-0 ${style.text}`}>{style.label}</span>
                  <p className="text-xs text-helix-muted line-through flex-1">{nudge.message}</p>
                  <span className="text-xs text-helix-muted">{nudge.time}</span>
                </div>
              );
            })}
          </div>
        )}

        {nudges.length === 0 && !showContextual && (
          <div className="text-center py-8 text-helix-muted">
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
