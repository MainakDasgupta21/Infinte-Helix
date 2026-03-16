import React from 'react';
import EmotionBadge from './EmotionBadge';

export default function AIResponse({ analysis }) {
  if (!analysis) return null;

  const { emotion, confidence, sentiment, reframe, allEmotions } = analysis;

  return (
    <div className="glass-card p-5 glow-pink animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-helix-accent to-helix-pink flex items-center justify-center">
          <span className="text-xs">✦</span>
        </div>
        <span className="text-sm font-medium text-helix-text">AI Analysis</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <EmotionBadge emotion={emotion} confidence={confidence} />
        {sentiment && (
          <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
            sentiment === 'positive' ? 'bg-helix-mint/10 text-helix-mint border-helix-mint/30'
            : sentiment === 'negative' ? 'bg-helix-red/10 text-helix-red border-helix-red/30'
            : 'bg-helix-muted/10 text-helix-muted border-helix-muted/30'
          }`}>
            {sentiment === 'positive' ? '☀️' : sentiment === 'negative' ? '🌧' : '☁️'} {sentiment}
          </span>
        )}
      </div>

      {allEmotions && allEmotions.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {allEmotions.slice(0, 4).map(e => (
            <div key={e.label} className="flex items-center gap-2">
              <span className="text-xs text-helix-muted w-16 capitalize">{e.label}</span>
              <div className="flex-1 h-1.5 bg-helix-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-helix-accent to-helix-pink rounded-full"
                  style={{ width: `${e.score * 100}%` }}
                />
              </div>
              <span className="text-xs text-helix-muted w-10 text-right">{Math.round(e.score * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      {reframe && (
        <div className="bg-helix-accent/5 border border-helix-accent/20 rounded-xl p-4">
          <p className="text-xs text-helix-accent font-medium mb-1">💜 Supportive Reframe</p>
          <p className="text-sm text-helix-text leading-relaxed">{reframe}</p>
        </div>
      )}
    </div>
  );
}
