import React from 'react';

const EMOTION_CONFIG = {
  joy:      { emoji: '😊', color: 'bg-helix-mint/15 text-helix-mint border-helix-mint/30' },
  sadness:  { emoji: '😢', color: 'bg-helix-sky/15 text-helix-sky border-helix-sky/30' },
  anger:    { emoji: '😤', color: 'bg-helix-red/15 text-helix-red border-helix-red/30' },
  fear:     { emoji: '😰', color: 'bg-helix-amber/15 text-helix-amber border-helix-amber/30' },
  surprise: { emoji: '😲', color: 'bg-helix-accent/15 text-helix-accent border-helix-accent/30' },
  disgust:  { emoji: '🤢', color: 'bg-helix-pink/15 text-helix-pink border-helix-pink/30' },
  neutral:  { emoji: '😐', color: 'bg-helix-muted/15 text-helix-muted border-helix-muted/30' },
};

export default function EmotionBadge({ emotion, confidence, size = 'md' }) {
  const config = EMOTION_CONFIG[emotion] || EMOTION_CONFIG.neutral;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeClasses}`}>
      <span>{config.emoji}</span>
      <span className="capitalize">{emotion}</span>
      {confidence && <span className="opacity-60">{Math.round(confidence * 100)}%</span>}
    </span>
  );
}
