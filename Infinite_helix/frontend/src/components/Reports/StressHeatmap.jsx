import React from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'];

const HEATMAP_DATA = [
  [2, 3, 5, 4, 2, 3, 6, 5, 3],
  [1, 2, 4, 3, 2, 4, 5, 4, 2],
  [3, 4, 6, 7, 3, 5, 7, 6, 4],
  [2, 3, 5, 4, 2, 3, 4, 3, 2],
  [1, 2, 3, 2, 1, 2, 3, 2, 1],
];

function getColor(val) {
  if (val <= 1) return 'bg-helix-mint/20';
  if (val <= 2) return 'bg-helix-mint/40';
  if (val <= 3) return 'bg-helix-amber/30';
  if (val <= 4) return 'bg-helix-amber/50';
  if (val <= 5) return 'bg-helix-pink/40';
  if (val <= 6) return 'bg-helix-pink/60';
  return 'bg-helix-red/70';
}

export default function StressHeatmap() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-helix-muted">Stress Heatmap</h3>
        <div className="flex items-center gap-1">
          <span className="text-xs text-helix-muted mr-1">Low</span>
          {[1, 3, 5, 7].map(v => (
            <div key={v} className={`w-3 h-3 rounded-sm ${getColor(v)}`} />
          ))}
          <span className="text-xs text-helix-muted ml-1">High</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          <div className="flex gap-1 mb-1 ml-12">
            {HOURS.map(h => (
              <div key={h} className="flex-1 text-center text-xs text-helix-muted">{h}</div>
            ))}
          </div>
          {DAYS.map((day, di) => (
            <div key={day} className="flex items-center gap-1 mb-1">
              <span className="w-10 text-xs text-helix-muted text-right pr-2">{day}</span>
              {HEATMAP_DATA[di].map((val, hi) => (
                <div
                  key={hi}
                  className={`flex-1 h-8 rounded-md ${getColor(val)} transition-all hover:scale-110 cursor-default`}
                  title={`${day} ${HOURS[hi]}: Stress level ${val}/7`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
