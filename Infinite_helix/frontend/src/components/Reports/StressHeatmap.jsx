import React from 'react';

function getColor(val) {
  if (val <= 1) return 'bg-emerald-500/25';
  if (val <= 2) return 'bg-emerald-500/40';
  if (val <= 3) return 'bg-amber-500/30';
  if (val <= 4) return 'bg-amber-500/45';
  if (val <= 5) return 'bg-rose-500/40';
  if (val <= 6) return 'bg-rose-500/55';
  return 'bg-red-500/70';
}

function getLabel(val) {
  if (val <= 2) return 'Low';
  if (val <= 4) return 'Moderate';
  if (val <= 6) return 'Elevated';
  return 'High';
}

export default function StressHeatmap({ heatmap }) {
  if (!heatmap || !heatmap.data || !heatmap.days || !heatmap.hours) return null;

  const { days, hours, data } = heatmap;

  const allVals = data.flat();
  const avgStress = (allVals.reduce((a, b) => a + b, 0) / allVals.length).toFixed(1);
  const peakVal = Math.max(...allVals);
  let peakDay = '', peakHour = '';
  data.forEach((row, di) => {
    row.forEach((val, hi) => {
      if (val === peakVal) { peakDay = days[di]; peakHour = hours[hi]; }
    });
  });

  return (
    <div className="glass-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-medium text-helix-muted">Stress Heatmap</h3>
          <p className="text-xs text-helix-muted/60 mt-0.5">
            Avg: {avgStress}/7 &middot; Peak: {peakDay} {peakHour} ({peakVal}/7)
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-helix-muted mr-1">Low</span>
          {[1, 3, 5, 7].map((v) => (
            <div key={v} className={`w-4 h-4 rounded ${getColor(v)}`} title={getLabel(v)} />
          ))}
          <span className="text-xs text-helix-muted ml-1">High</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[420px]">
          <div className="flex gap-1 mb-1.5 ml-12">
            {hours.map((h) => (
              <div key={h} className="flex-1 text-center text-[10px] text-helix-muted">{h}</div>
            ))}
          </div>
          {days.map((day, di) => (
            <div key={day} className="flex items-center gap-1 mb-1">
              <span className="w-10 text-xs text-helix-muted text-right pr-2 flex-shrink-0">{day}</span>
              {data[di].map((val, hi) => (
                <div
                  key={hi}
                  className={`flex-1 h-9 rounded-lg ${getColor(val)} transition-all duration-200 hover:scale-105 cursor-default flex items-center justify-center`}
                  title={`${day} ${hours[hi]}: Stress ${val}/7 (${getLabel(val)})`}
                >
                  <span className="text-[10px] text-helix-text/40 font-medium">{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
