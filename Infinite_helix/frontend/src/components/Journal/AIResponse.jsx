import React, { useState } from 'react';
import EmotionBadge from './EmotionBadge';
import {
  HiOutlineHeart,
  HiOutlineLightBulb,
  HiOutlineLightningBolt,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlinePencilAlt,
  HiOutlineRefresh,
} from 'react-icons/hi';

const TIP_ICONS = {
  breathe: HiOutlineRefresh,
  move: HiOutlineLightningBolt,
  journal: HiOutlinePencilAlt,
  social: HiOutlineUserGroup,
  goal: HiOutlineLightBulb,
  comfort: HiOutlineHeart,
  boundary: HiOutlineShieldCheck,
};

export default function AIResponse({ analysis }) {
  const [expandedTip, setExpandedTip] = useState(null);

  if (!analysis) return null;

  const { emotion, confidence, sentiment, suggestions } = analysis;
  const allEmotions = analysis.allEmotions || analysis.all_emotions;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Emotion Detection Summary */}
      <div className="glass-card p-5 border border-helix-border/50">
        <div className="flex items-center gap-2 mb-3">
          <HiOutlineSparkles className="w-4 h-4 text-helix-accent" />
          <span className="text-sm font-medium text-helix-text">Analysis</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <EmotionBadge emotion={emotion} confidence={confidence} />
          {sentiment && (
            <span
              className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize ${
                sentiment === 'positive'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : sentiment === 'negative'
                    ? 'bg-red-500/10 text-red-600 border-red-500/20'
                    : 'bg-helix-border/30 text-helix-muted border-helix-border/50'
              }`}
            >
              {sentiment}
            </span>
          )}
        </div>

        {allEmotions && allEmotions.length > 0 && (
          <div className="space-y-1.5">
            {allEmotions.slice(0, 4).map((e) => (
              <div key={e.label} className="flex items-center gap-2">
                <span className="text-xs text-helix-muted w-16 capitalize">{e.label}</span>
                <div className="flex-1 h-1.5 bg-helix-surface/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-full transition-all duration-700"
                    style={{ width: `${e.score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-helix-muted w-10 text-right">{Math.round(e.score * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wellness Suggestions */}
      {suggestions && (
        <>
          {/* Heading + Insight */}
          <div className="glass-card p-5 border border-helix-accent/20 bg-gradient-to-br from-helix-accent/10 to-transparent">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-helix-accent/15 border border-helix-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <HiOutlineLightBulb className="w-5 h-5 text-helix-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-helix-text mb-1">{suggestions.heading}</h3>
                <p className="text-sm text-helix-muted leading-relaxed">{suggestions.insight}</p>
              </div>
            </div>
          </div>

          {/* Quick Action */}
          {suggestions.quick_action && (
            <div className="glass-card p-4 border border-emerald-500/20 bg-emerald-500/10">
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineLightningBolt className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                  {suggestions.quick_action.label}
                </span>
              </div>
              <p className="text-sm text-helix-text leading-relaxed">{suggestions.quick_action.text}</p>
            </div>
          )}

          {/* Actionable Tips */}
          {suggestions.tips && suggestions.tips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-helix-muted uppercase tracking-wide px-1">
                Coping Strategies
              </p>
              {suggestions.tips.map((tip, idx) => {
                const Icon = TIP_ICONS[tip.icon] || HiOutlineLightBulb;
                const isExpanded = expandedTip === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => setExpandedTip(isExpanded ? null : idx)}
                    className="w-full text-left glass-card p-4 border border-helix-border/50 hover:border-helix-accent/20 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-helix-accent/10 border border-helix-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-helix-accent/15 transition-colors">
                        <Icon className="w-4 h-4 text-helix-accent" />
                      </div>
                      <span className="text-sm font-medium text-helix-text flex-1">{tip.title}</span>
                      <span className={`text-xs text-helix-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </div>
                    {isExpanded && (
                      <p className="mt-3 ml-11 text-sm text-helix-muted leading-relaxed animate-slide-up">
                        {tip.text}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Affirmation */}
          {suggestions.affirmation && (
            <div className="text-center py-4 px-6">
              <p className="text-sm text-helix-accent italic leading-relaxed">
                "{suggestions.affirmation}"
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
