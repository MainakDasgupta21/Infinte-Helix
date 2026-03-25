import { useState, useEffect, useCallback, useRef } from 'react';

const LOG_KEY = 'helix_break_log';
const DONE_KEY = 'helix_break_done_today';

const SCHEDULED_BREAKS = [
  { id: 'breakfast',       label: 'Breakfast',           time: '08:00', emoji: '🍳', message: 'Start your day with a nourishing breakfast. Your brain needs fuel.' },
  { id: 'morning_tea',     label: 'Morning Tea / Coffee',time: '10:30', emoji: '☕', message: 'Take a warm break. Step away from the screen for 5 minutes.' },
  { id: 'lunch',           label: 'Lunch Break',         time: '13:00', emoji: '🥗', message: 'Time for a proper lunch. Eat away from your desk if you can.' },
  { id: 'afternoon_snack', label: 'Afternoon Snack',     time: '16:00', emoji: '🍎', message: 'A light snack keeps your energy steady through the afternoon.' },
  { id: 'dinner',          label: 'Dinner Time',         time: '20:00', emoji: '🍽️', message: 'Wind down your day with dinner. You\'ve earned this rest.' },
];

const WELLNESS_REMINDERS = [
  { id: 'eye_rest',  label: 'Eye Rest (20-20-20)',  emoji: '👁️',  intervalMin: 20, message: 'Look at something 20 feet away for 20 seconds. Your eyes need a reset.' },
  { id: 'stretch',   label: 'Quick Stretch',        emoji: '🧘', intervalMin: 45, message: 'Stand up, stretch your shoulders, neck, and wrists. 60 seconds is enough.' },
  { id: 'water',     label: 'Drink Water',          emoji: '💧', intervalMin: 30, message: 'Stay hydrated. Take a few sips of water right now.' },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadDoneToday() {
  try {
    const data = JSON.parse(localStorage.getItem(DONE_KEY) || '{}');
    if (data.date !== todayKey()) return { date: todayKey(), items: {} };
    return data;
  } catch { return { date: todayKey(), items: {} }; }
}

function saveDoneToday(data) {
  try { localStorage.setItem(DONE_KEY, JSON.stringify(data)); } catch {}
}

function loadBreakLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }
  catch { return []; }
}

function saveBreakLog(log) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-300))); } catch {}
}

export function getBreakLog() {
  return loadBreakLog();
}

export function getScheduledBreaks() {
  return SCHEDULED_BREAKS;
}

export default function useBreakReminder() {
  const [activeReminder, setActiveReminder] = useState(null);
  const [doneToday, setDoneToday] = useState(() => loadDoneToday());
  const wellnessTimersRef = useRef({});

  const markDone = useCallback((reminderId) => {
    const updated = { ...doneToday, items: { ...doneToday.items, [reminderId]: new Date().toISOString() } };
    setDoneToday(updated);
    saveDoneToday(updated);

    const log = loadBreakLog();
    const reminder = SCHEDULED_BREAKS.find(b => b.id === reminderId) || WELLNESS_REMINDERS.find(w => w.id === reminderId);
    log.push({
      id: reminderId,
      label: reminder?.label || reminderId,
      emoji: reminder?.emoji || '✅',
      type: SCHEDULED_BREAKS.find(b => b.id === reminderId) ? 'meal' : 'wellness',
      completedAt: new Date().toISOString(),
      date: todayKey(),
    });
    saveBreakLog(log);
    setActiveReminder(null);
  }, [doneToday]);

  const snoozeReminder = useCallback((reminderId, minutes = 10) => {
    const updated = { ...doneToday, items: { ...doneToday.items, [`${reminderId}_snoozed`]: Date.now() + minutes * 60_000 } };
    setDoneToday(updated);
    saveDoneToday(updated);
    setActiveReminder(null);
  }, [doneToday]);

  const dismissReminder = useCallback(() => {
    setActiveReminder(null);
  }, []);

  // Check scheduled meal/break times every 30 seconds
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const done = loadDoneToday();

      for (const brk of SCHEDULED_BREAKS) {
        if (done.items[brk.id]) continue;

        const snoozeKey = `${brk.id}_snoozed`;
        if (done.items[snoozeKey] && Date.now() < done.items[snoozeKey]) continue;

        const [brkH, brkM] = brk.time.split(':').map(Number);
        const [nowH, nowM] = currentTime.split(':').map(Number);
        const brkTotalMin = brkH * 60 + brkM;
        const nowTotalMin = nowH * 60 + nowM;

        if (nowTotalMin >= brkTotalMin && nowTotalMin <= brkTotalMin + 30) {
          setActiveReminder({ ...brk, type: 'meal' });
          return;
        }
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Periodic wellness reminders (eye rest, stretch, water)
  useEffect(() => {
    WELLNESS_REMINDERS.forEach(reminder => {
      if (wellnessTimersRef.current[reminder.id]) return;

      wellnessTimersRef.current[reminder.id] = setInterval(() => {
        const done = loadDoneToday();
        const lastDone = done.items[reminder.id];

        if (lastDone) {
          const elapsed = Date.now() - new Date(lastDone).getTime();
          if (elapsed < reminder.intervalMin * 60_000) return;
        }

        const snoozeKey = `${reminder.id}_snoozed`;
        if (done.items[snoozeKey] && Date.now() < done.items[snoozeKey]) return;

        setActiveReminder(prev => {
          if (prev) return prev;
          return { ...reminder, type: 'wellness' };
        });
      }, reminder.intervalMin * 60_000);
    });

    return () => {
      Object.values(wellnessTimersRef.current).forEach(clearInterval);
      wellnessTimersRef.current = {};
    };
  }, []);

  const todayStats = {
    meals: SCHEDULED_BREAKS.filter(b => doneToday.items[b.id]).length,
    totalMeals: SCHEDULED_BREAKS.length,
    wellness: WELLNESS_REMINDERS.reduce((count, w) => {
      const log = loadBreakLog().filter(l => l.date === todayKey() && l.id === w.id);
      return count + log.length;
    }, 0),
    completedIds: Object.keys(doneToday.items).filter(k => !k.endsWith('_snoozed')),
  };

  return { activeReminder, markDone, snoozeReminder, dismissReminder, doneToday, todayStats };
}
