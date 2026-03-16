import React from 'react';
import { useWellness } from '../../context/WellnessContext';
import { HiOutlineX } from 'react-icons/hi';

const TYPE_STYLES = {
  hydration: { icon: '💧', bg: 'bg-helix-sky/10', border: 'border-helix-sky/20', text: 'text-helix-sky' },
  stretch: { icon: '🌿', bg: 'bg-helix-mint/10', border: 'border-helix-mint/20', text: 'text-helix-mint' },
  eyes: { icon: '👀', bg: 'bg-helix-accent/10', border: 'border-helix-accent/20', text: 'text-helix-accent' },
  meeting: { icon: '🧘', bg: 'bg-helix-pink/10', border: 'border-helix-pink/20', text: 'text-helix-pink' },
  emotional: { icon: '💜', bg: 'bg-helix-accent/10', border: 'border-helix-accent/20', text: 'text-helix-accent' },
};

const PRIORITY_DOT = { gentle: 'bg-helix-mint', moderate: 'bg-helix-amber', important: 'bg-helix-pink' };

export default function NudgeFeed() {
  const { nudges, dismissNudge } = useWellness();
  const activeNudges = nudges.filter(n => !n.dismissed);
  const pastNudges = nudges.filter(n => n.dismissed);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-helix-muted">Wellness Nudges</h3>
        {activeNudges.length > 0 && (
          <span className="text-xs bg-helix-pink/10 text-helix-pink px-2 py-1 rounded-full font-medium">
            {activeNudges.length} active
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {activeNudges.map(nudge => {
          const style = TYPE_STYLES[nudge.type] || TYPE_STYLES.emotional;
          return (
            <div key={nudge.id} className={`${style.bg} border ${style.border} rounded-xl p-3 animate-slide-up`}>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-helix-text leading-relaxed">{nudge.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[nudge.priority]}`} />
                    <span className="text-xs text-helix-muted">{nudge.time}</span>
                  </div>
                </div>
                <button onClick={() => dismissNudge(nudge.id)} className="text-helix-muted hover:text-helix-text p-1">
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {pastNudges.length > 0 && (
          <div className="pt-2 border-t border-helix-border">
            <p className="text-xs text-helix-muted mb-2">Earlier</p>
            {pastNudges.map(nudge => {
              const style = TYPE_STYLES[nudge.type] || TYPE_STYLES.emotional;
              return (
                <div key={nudge.id} className="flex items-center gap-2 py-1.5 opacity-50">
                  <span className="text-sm">{style.icon}</span>
                  <p className="text-xs text-helix-muted line-through flex-1">{nudge.message}</p>
                  <span className="text-xs text-helix-muted">{nudge.time}</span>
                </div>
              );
            })}
          </div>
        )}

        {nudges.length === 0 && (
          <div className="text-center py-8 text-helix-muted">
            <span className="text-2xl">🌸</span>
            <p className="text-sm mt-2">All caught up! You're doing great.</p>
          </div>
        )}
      </div>
    </div>
  );
}
