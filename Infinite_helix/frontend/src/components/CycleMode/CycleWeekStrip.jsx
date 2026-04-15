import React from 'react';

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseCycleStart(iso) {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
}

function daysBetween(start, end) {
  return Math.round((startOfDay(end) - startOfDay(start)) / 86400000);
}

function cycleDayForDate(cycleStartIso, date) {
  const start = parseCycleStart(cycleStartIso);
  const diff = daysBetween(start, date);
  if (diff < 0) return null;
  return (diff % 28) + 1;
}

function addDays(date, n) {
  const x = new Date(date);
  x.setDate(x.getDate() + n);
  return x;
}

export default function CycleWeekStrip({ cycleStartIso }) {
  const today = startOfDay(new Date());
  const days = [-3, -2, -1, 0, 1, 2, 3].map((offset) => addDays(today, offset));

  return (
    <div className="bento-card p-4">
      <h3 className="text-xs font-medium text-helix-muted mb-3">This week</h3>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((d) => {
          const isToday = daysBetween(d, today) === 0;
          const cd = cycleDayForDate(cycleStartIso, d);
          const label = d.toLocaleDateString(undefined, { weekday: 'short' });
          const dateNum = d.getDate();
          const monthShort = d.toLocaleDateString(undefined, { month: 'short' });

          return (
            <div
              key={d.toISOString()}
              className={`rounded-xl p-2 sm:p-3 text-center border transition-all ${
                isToday
                  ? 'bg-helix-accent/15 border-helix-accent ring-1 ring-helix-accent/20'
                  : 'bg-helix-surface/50 border-helix-border/50'
              }`}
            >
              <p className="text-[10px] sm:text-xs text-helix-muted uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-helix-text mt-0.5">{dateNum}</p>
              <p className="text-[10px] text-helix-muted">{monthShort}</p>
              <p className={`text-xs mt-1 font-medium ${isToday ? 'text-helix-accent' : 'text-helix-muted'}`}>
                Day {cd != null ? cd : '—'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
