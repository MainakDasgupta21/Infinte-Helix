/** Pure helpers for period dates — no React. */

export function toIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDaysIso(iso, n) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function daysBetweenIso(startIso, endIso) {
  const a = startOfDay(parseIso(startIso));
  const b = startOfDay(parseIso(endIso));
  return Math.round((b - a) / 86400000);
}

/** All YYYY-MM-DD strings from start through end inclusive */
export function expandRangeToIsoSet(startIso, endIso) {
  const set = new Set();
  let cur = startOfDay(parseIso(startIso));
  const end = startOfDay(parseIso(endIso));
  while (cur <= end) {
    set.add(toIso(cur));
    cur = new Date(cur);
    cur.setDate(cur.getDate() + 1);
  }
  return set;
}

/** Build highlight data from period entries */
export function buildPeriodHighlightMaps(entries) {
  const periodDays = new Set();
  const periodStarts = new Set();
  entries.forEach((e) => {
    periodStarts.add(e.startDate);
    const end = e.endDate || addDaysIso(e.startDate, 4);
    expandRangeToIsoSet(e.startDate, end).forEach((iso) => periodDays.add(iso));
  });
  return { periodDays, periodStarts };
}

/** Sort by startDate ascending */
export function sortEntriesByStart(entries) {
  return [...entries].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Average days between consecutive period starts; null if not enough data */
export function averageCycleLengthDays(entries) {
  const sorted = sortEntriesByStart(entries).filter((e) => e.startDate);
  if (sorted.length < 2) return null;
  let sum = 0;
  let count = 0;
  for (let i = 1; i < sorted.length; i++) {
    const diff = daysBetweenIso(sorted[i - 1].startDate, sorted[i].startDate);
    if (diff > 0 && diff < 60) {
      sum += diff;
      count += 1;
    }
  }
  if (count === 0) return null;
  return Math.round(sum / count);
}

/** Most recent period start (ISO) or null */
export function getLastPeriodStartIso(entries) {
  const sorted = sortEntriesByStart(entries);
  if (!sorted.length) return null;
  return sorted[sorted.length - 1].startDate;
}

const DEFAULT_CYCLE = 28;

/**
 * Next estimated period start: lastStart + cycleLen (repeat until >= today)
 */
export function estimateNextPeriodStartIso(entries, fallbackCycleDays = DEFAULT_CYCLE) {
  const last = getLastPeriodStartIso(entries);
  if (!last) return null;
  const avg = averageCycleLengthDays(entries);
  const cycleLen = avg || fallbackCycleDays;
  const today = startOfDay(new Date());
  let next = startOfDay(parseIso(last));
  next.setDate(next.getDate() + cycleLen);
  while (next < today) {
    next.setDate(next.getDate() + cycleLen);
  }
  return toIso(next);
}

export function daysFromTodayTo(iso) {
  const today = startOfDay(new Date());
  const target = startOfDay(parseIso(iso));
  return Math.round((target - today) / 86400000);
}

/** Cycle day 1–28 from last period start */
export function getCycleDayFromLastStart(lastStartIso) {
  if (!lastStartIso) return 1;
  const start = parseIso(lastStartIso);
  const today = startOfDay(new Date());
  const diff = Math.round((today - startOfDay(start)) / 86400000);
  if (diff < 0) return 1;
  return (diff % 28) + 1;
}

export function formatAroundDateFromIso(iso) {
  const d = parseIso(iso);
  return `Around ${d.getDate()} ${d.toLocaleDateString(undefined, { month: 'short' })}`;
}
