import React from 'react';
import EmotionBadge from './EmotionBadge';

const DEMO_ENTRIES = [
  {
    id: 1, text: "Feeling really productive today, finished the UI refactor ahead of schedule!",
    emotion: 'joy', confidence: 0.91, sentiment: 'positive',
    timestamp: '2:30 PM', date: 'Today',
  },
  {
    id: 2, text: "The deadline pressure is getting to me. Too many meetings today.",
    emotion: 'fear', confidence: 0.73, sentiment: 'negative',
    timestamp: '11:15 AM', date: 'Today',
  },
  {
    id: 3, text: "Had a great standup. Team is really supportive.",
    emotion: 'joy', confidence: 0.88, sentiment: 'positive',
    timestamp: '9:45 AM', date: 'Today',
  },
  {
    id: 4, text: "Feeling a bit overwhelmed with the sprint goals.",
    emotion: 'sadness', confidence: 0.65, sentiment: 'negative',
    timestamp: '4:20 PM', date: 'Yesterday',
  },
  {
    id: 5, text: "Completed a challenging feature. Really proud of the solution.",
    emotion: 'joy', confidence: 0.94, sentiment: 'positive',
    timestamp: '2:00 PM', date: 'Yesterday',
  },
];

export default function EntryHistory({ entries = DEMO_ENTRIES }) {
  let currentDate = '';

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-helix-muted mb-4">Recent Entries</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {entries.map(entry => {
          const showDate = entry.date !== currentDate;
          if (showDate) currentDate = entry.date;

          return (
            <React.Fragment key={entry.id}>
              {showDate && (
                <p className="text-xs text-helix-muted font-medium pt-2 first:pt-0">{entry.date}</p>
              )}
              <div className="bg-helix-bg/40 rounded-xl p-4 border border-helix-border/30 hover:border-helix-accent/20 transition-colors">
                <p className="text-sm text-helix-text leading-relaxed mb-3">{entry.text}</p>
                <div className="flex items-center justify-between">
                  <EmotionBadge emotion={entry.emotion} confidence={entry.confidence} size="sm" />
                  <span className="text-xs text-helix-muted">{entry.timestamp}</span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
