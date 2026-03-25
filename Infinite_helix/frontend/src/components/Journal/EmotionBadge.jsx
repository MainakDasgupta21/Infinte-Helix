import React from 'react';

const EMOTION_CONFIG = {
  joy:      { color: 'bg-helix-mint/15 text-helix-mint border-helix-mint/30' },
  sadness:  { color: 'bg-helix-sky/15 text-helix-sky border-helix-sky/30' },
  anger:    { color: 'bg-helix-red/15 text-helix-red border-helix-red/30' },
  fear:     { color: 'bg-helix-amber/15 text-helix-amber border-helix-amber/30' },
  surprise: { color: 'bg-helix-accent/15 text-helix-accent border-helix-accent/30' },
  disgust:  { color: 'bg-helix-pink/15 text-helix-pink border-helix-pink/30' },
  neutral:  { color: 'bg-helix-muted/15 text-helix-muted border-helix-muted/30' },
};

export default function EmotionBadge({ emotion, confidence, size = 'md' }) {
  const config = EMOTION_CONFIG[emotion] || EMOTION_CONFIG.neutral;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeClasses}`}>
      <span className="capitalize">{emotion}</span>
      {confidence && <span className="opacity-80">{Math.round(confidence * 100)}%</span>}
    </span>
  );
}
