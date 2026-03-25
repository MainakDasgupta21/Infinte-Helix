import React, { useMemo, useState } from 'react';
import { buildPeriodHighlightMaps, toIso, startOfDay } from '../../utils/periodMath';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  return cells;
}

function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

/**
 * Month grid with period days highlighted (rose) and first day of each period marked.
 */
export default function PeriodCalendarGrid({ entries }) {
  const today = startOfDay(new Date());
  const minNav = addMonths(today, -24);
  const firstOfMinMonth = new Date(minNav.getFullYear(), minNav.getMonth(), 1);

  const [view, setView] = useState(() => ({
    y: today.getFullYear(),
    m: today.getMonth(),
  }));

  const { periodDays, periodStarts } = useMemo(() => buildPeriodHighlightMaps(entries), [entries]);

  const grid = useMemo(() => buildMonthGrid(view.y, view.m), [view.y, view.m]);

  const viewMonthStart = new Date(view.y, view.m, 1);
  const canGoPrev = viewMonthStart > firstOfMinMonth;
  const canGoNext =
    view.y < today.getFullYear() || (view.y === today.getFullYear() && view.m < today.getMonth());

  function goPrev() {
    if (!canGoPrev) return;
    setView((v) => {
      let m = v.m - 1;
      let y = v.y;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
      return { y, m };
    });
  }

  function goNext() {
    if (!canGoNext) return;
    setView((v) => {
      let m = v.m + 1;
      let y = v.y;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      return { y, m };
    });
  }

  const title = viewMonthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          className="p-2 rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
          aria-label="Previous month"
        >
          ←
        </button>
        <p className="text-sm font-semibold text-slate-800 min-w-[10rem] text-center">{title}</p>
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          className="p-2 rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10px] sm:text-xs text-slate-500 py-1 font-medium">
            {w}
          </div>
        ))}
        {grid.map((d, i) => {
          if (d === null) {
            return <div key={`e-${i}`} className="aspect-square" />;
          }
          const iso = toIso(d);
          const isPeriod = periodDays.has(iso);
          const isStart = periodStarts.has(iso);
          const isToday = startOfDay(d).getTime() === today.getTime();

          return (
            <div
              key={iso}
              className={`aspect-square rounded-lg text-sm font-medium flex flex-col items-center justify-center transition-all border
                ${isPeriod ? 'bg-rose-500/25 border-rose-400/40 text-slate-800' : 'border-transparent text-slate-800'}
                ${isStart ? 'ring-2 ring-rose-400 ring-offset-1 ring-offset-slate-50' : ''}
                ${isToday && !isPeriod ? 'ring-1 ring-slate-200 bg-slate-100' : ''}
                ${isToday && isPeriod ? 'ring-1 ring-violet-200' : ''}
              `}
              title={isStart ? 'Period start' : isPeriod ? 'Period' : undefined}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-500/40 border border-rose-400/50" /> Period day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-rose-400" /> First day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded ring-1 ring-slate-200 bg-slate-100" /> Today
        </span>
      </div>
    </div>
  );
}
