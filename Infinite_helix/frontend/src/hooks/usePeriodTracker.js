import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getLastPeriodStartIso,
  estimateNextPeriodStartIso,
  averageCycleLengthDays,
  getCycleDayFromLastStart,
  daysFromTodayTo,
  formatAroundDateFromIso,
  sortEntriesByStart,
  addDaysIso,
} from '../utils/periodMath';

export const STORAGE_KEY = 'helix_period_entries';
const LEGACY_CYCLE_START = 'cycleStart';

function generateId() {
  return globalThis.crypto?.randomUUID?.() || `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    const legacy = localStorage.getItem(LEGACY_CYCLE_START);
    if (legacy && /^\d{4}-\d{2}-\d{2}$/.test(legacy)) {
      const migrated = [
        {
          id: generateId(),
          startDate: legacy,
          endDate: addDaysIso(legacy, 4),
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_CYCLE_START);
      return migrated;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function persist(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota */
  }
}

/**
 * Persistent period entries + derived stats for the cycle dashboard.
 */
export function usePeriodTracker() {
  const [entries, setEntries] = useState(loadFromStorage);

  useEffect(() => {
    persist(entries);
  }, [entries]);

  const addEntry = useCallback((startDate, endDate) => {
    let end = endDate || addDaysIso(startDate, 4);
    if (end < startDate) end = addDaysIso(startDate, 4);
    setEntries((prev) => [
      ...prev,
      { id: generateId(), startDate, endDate: end },
    ]);
  }, []);

  const updateEntry = useCallback((id, startDate, endDate) => {
    let end = endDate || addDaysIso(startDate, 4);
    if (end < startDate) end = addDaysIso(startDate, 4);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, startDate, endDate: end } : e)));
  }, []);

  const removeEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const sorted = useMemo(() => sortEntriesByStart(entries), [entries]);

  const lastPeriodStartIso = useMemo(() => getLastPeriodStartIso(entries), [entries]);

  const averageCycleDays = useMemo(() => averageCycleLengthDays(entries), [entries]);

  const estimatedNextIso = useMemo(() => estimateNextPeriodStartIso(entries), [entries]);

  const nextPeriodInfo = useMemo(() => {
    if (!estimatedNextIso) return null;
    const daysUntil = daysFromTodayTo(estimatedNextIso);
    return {
      iso: estimatedNextIso,
      daysUntil: Math.max(0, daysUntil),
      label: formatAroundDateFromIso(estimatedNextIso),
    };
  }, [estimatedNextIso]);

  const cycleDay = useMemo(() => getCycleDayFromLastStart(lastPeriodStartIso), [lastPeriodStartIso]);

  return {
    entries: sorted,
    addEntry,
    updateEntry,
    removeEntry,
    lastPeriodStartIso,
    averageCycleDays,
    estimatedNextIso,
    nextPeriodInfo,
    cycleDay,
    hasEntries: entries.length > 0,
  };
}
