import React from 'react';
import EmotionBadge from './EmotionBadge';

export default function AIResponse({ analysis }) {
  if (!analysis) return null;

  const { emotion, confidence, sentiment, reframe } = analysis;
  const allEmotions = analysis.allEmotions || analysis.all_emotions;

  return (
    <div className="glass-card p-5 border border-helix-border/50 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-helix-text">Analysis</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <EmotionBadge emotion={emotion} confidence={confidence} />
        {sentiment && (
          <span
            className={`text-xs px-3 py-1.5 rounded border font-medium capitalize ${
              sentiment === 'positive'
                ? 'bg-helix-mint/10 text-helix-mint border-helix-mint/30'
                : sentiment === 'negative'
                  ? 'bg-helix-red/10 text-helix-red border-helix-red/30'
                  : 'bg-helix-muted/10 text-helix-muted border-helix-border/40'
            }`}
          >
            {sentiment}
          </span>
        )}
      </div>

      {allEmotions && allEmotions.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {allEmotions.slice(0, 4).map((e) => (
            <div key={e.label} className="flex items-center gap-2">
              <span className="text-xs text-helix-muted w-16 capitalize">{e.label}</span>
              <div className="flex-1 h-1.5 bg-helix-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-helix-accent to-helix-sky rounded-full"
                  style={{ width: `${e.score * 100}%` }}
                />
              </div>
              <span className="text-xs text-helix-muted w-10 text-right">{Math.round(e.score * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      {reframe && (
        <div className="bg-helix-bg/40 border border-helix-border/50 rounded-xl p-4">
          <p className="text-xs text-helix-muted font-medium mb-1 uppercase tracking-wide">Reframe</p>
          <p className="text-sm text-helix-text leading-relaxed">{reframe}</p>
        </div>
      )}
    </div>
  );
}
