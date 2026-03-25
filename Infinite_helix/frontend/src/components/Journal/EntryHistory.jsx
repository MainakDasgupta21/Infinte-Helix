import React from 'react';
import EmotionBadge from './EmotionBadge';

function formatTimestamp(ts) {
  if (!ts) return '';
  if (ts.includes('AM') || ts.includes('PM') || ts.includes(':')) return ts;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
}

function formatDate(ts) {
  if (!ts) return 'Today';
  if (['Today', 'Yesterday'].includes(ts)) return ts;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Today';
  }
}

export default function EntryHistory({ entries: propEntries }) {
  const entries = (propEntries || []).map(e => ({
    ...e,
    date: formatDate(e.timestamp || e.date),
    displayTime: formatTimestamp(e.timestamp),
  }));

  let currentDate = '';

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500">Recent Entries</h3>
        {entries.length > 0 && (
          <span className="text-xs text-violet-600">{entries.length} entries</span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">{'\u270D\uFE0F'}</div>
          <p className="text-sm font-medium text-slate-800 mb-1">No journal entries yet</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Write how you feel above. You'll get personalized coping strategies and wellness advice — not just emojis.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {entries.map((entry, idx) => {
            const showDate = entry.date !== currentDate;
            if (showDate) currentDate = entry.date;

            return (
              <React.Fragment key={entry.id || idx}>
                {showDate && (
                  <p className="text-xs text-slate-500 font-medium pt-2 first:pt-0">{entry.date}</p>
                )}
                <div className="bg-slate-100/40 rounded-xl p-4 border border-slate-200 hover:border-violet-200 transition-colors">
                  <p className="text-sm text-slate-800 leading-relaxed mb-3">{entry.text}</p>
                  <div className="flex items-center justify-between">
                    <EmotionBadge emotion={entry.emotion} confidence={entry.confidence} size="sm" />
                    <span className="text-xs text-slate-500">{entry.displayTime || entry.timestamp}</span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
