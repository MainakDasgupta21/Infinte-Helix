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
      <h3 className="text-xs font-medium text-slate-500 mb-3">This week</h3>
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
                  ? 'bg-violet-100 border-violet-600 ring-1 ring-violet-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{dateNum}</p>
              <p className="text-[10px] text-slate-500">{monthShort}</p>
              <p className={`text-xs mt-1 font-medium ${isToday ? 'text-violet-600' : 'text-slate-500'}`}>
                Day {cd != null ? cd : '—'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
