import React, { useState, useEffect } from 'react';
import { useWellness } from '../../context/WellnessContext';
import { HiOutlineX } from 'react-icons/hi';

const TYPE_STYLES = {
  hydration: { icon: '💧', gradient: 'from-sky-500/20 to-cyan-500/20', border: 'border-sky-500/30' },
  stretch: { icon: '🌿', gradient: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30' },
  eyes: { icon: '👀', gradient: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30' },
  meeting: { icon: '🧘', gradient: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30' },
  emotional: { icon: '💜', gradient: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30' },
};

export default function NotificationOverlay() {
  const { nudges, dismissNudge } = useWellness();
  const [visible, setVisible] = useState(null);

  useEffect(() => {
    const active = nudges.find(n => !n.dismissed);
    if (active && (!visible || visible.id !== active.id)) {
      setVisible(active);
      const timer = setTimeout(() => {
        dismissNudge(active.id);
        setVisible(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [nudges]);

  if (!visible) return null;

  const style = TYPE_STYLES[visible.type] || TYPE_STYLES.emotional;

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm animate-slide-up">
      <div className={`bg-gradient-to-r ${style.gradient} backdrop-blur-xl border ${style.border} rounded-2xl p-4 shadow-2xl`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl animate-float">{style.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-helix-text mb-1">Wellness Nudge</p>
            <p className="text-sm text-helix-text/80 leading-relaxed">{visible.message}</p>
          </div>
          <button
            onClick={() => { dismissNudge(visible.id); setVisible(null); }}
            className="text-helix-muted hover:text-helix-text transition-colors"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
