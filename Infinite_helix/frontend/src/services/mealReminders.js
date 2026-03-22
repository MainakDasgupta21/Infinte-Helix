import { showDesktopNotification } from './notifications';

const CONFIG_KEY = 'helix_meal_reminders_config';
const DAILY_FIRES_KEY = 'helix_meal_daily_fires';

export const APP_SETTINGS_KEY = 'helix_app_settings';

const ROAST_POOL = {
  breakfast: [
    "Babe, your laptop doesn't count as breakfast. Go eat something real.",
    "You opened 6 tabs before eating. Bestie, your stomach called \u2014 it's not happy.",
    "Good morning! Your brain runs on food, not vibes. Please eat.",
    "Skipping breakfast again? Your productivity is about to betray you in 2 hours. Just saying.",
    "The report can wait. Breakfast cannot. GO. EAT. NOW.",
    "Hope you slept and didn't just close your eyes for 4 hours thinking about deadlines. Now eat.",
    "New day, new chance to actually eat before opening your laptop. Revolutionary concept, we know.",
  ],
  morning_tea: [
    "You've been grinding since breakfast. Your brain deserves a warm drink and a 5-min breather.",
    "Coffee break? Tea break? Either way \u2014 step away from that keyboard for a second.",
    "You're not a machine. Even machines need coolant. Go grab something warm.",
    "Morning slump hitting? That's your body saying 'feed me or I'm shutting down'. Tea time.",
    "Quick chai/coffee break. Your code will still be broken when you get back. Promise.",
  ],
  lunch: [
    "It's lunchtime and you're still typing. The food is not going to eat itself.",
    "Deadline or not \u2014 even robots need charging. You are not a robot. Probably.",
    "Your last meal was hours ago. That's not discipline, that's just suffering.",
    "Lunch break means BREAK. Close the laptop. We're watching.",
    "You've been staring at that screen since morning. Your eyes and stomach both filed a complaint.",
  ],
  afternoon_tea: [
    "3pm energy crash incoming. Grab a snack before your brain goes on strike.",
    "Afternoon slump? Your body is not being dramatic \u2014 it genuinely needs fuel. Snack time.",
    "You've been running on fumes since lunch. A light snack and stretch will do wonders.",
    "Quick break: your future self will thank you for this 5-minute snack pause.",
    "Tea, biscuit, or a fruit \u2014 pick your fighter. Just stop typing for 5 minutes.",
  ],
  dinner: [
    "It's evening and you're STILL working. The laptop will survive without you. Go eat dinner.",
    "Your brain worked hard today. Feed it dinner, rest, and zero screens for one hour.",
    "You started this morning. It is now evening. Even Beyonc\u00e9 eats dinner. Please eat.",
    "Sending this with love \u2014 close the tabs. The work is not going anywhere. Dinner time.",
    "Wind down with something nice. You've earned it. No, cereal doesn't count.",
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Default schedule (24h HH:mm). User can change any time from Settings. */
export const DEFAULT_MEAL_REMINDERS = [
  { id: 'breakfast', label: 'Breakfast', time: '08:00', body: ROAST_POOL.breakfast[0] },
  { id: 'morning_tea', label: 'Morning Tea / Coffee', time: '10:30', body: ROAST_POOL.morning_tea[0] },
  { id: 'lunch', label: 'Lunch Break', time: '13:00', body: ROAST_POOL.lunch[0] },
  { id: 'afternoon_tea', label: 'Afternoon Snack', time: '16:00', body: ROAST_POOL.afternoon_tea[0] },
  { id: 'dinner', label: 'Dinner Time', time: '20:00', body: ROAST_POOL.dinner[0] },
];

function pad(n) {
  return String(n).padStart(2, '0');
}

export function nowHHMM() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getAppSettings() {
  try {
    return JSON.parse(localStorage.getItem(APP_SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveAppSettings(settings) {
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

function mergeWithDefaults(saved) {
  const byId = {};
  (saved.reminders || []).forEach((r) => {
    byId[r.id] = r;
  });
  const reminders = DEFAULT_MEAL_REMINDERS.map((def) => {
    const s = byId[def.id];
    return {
      ...def,
      enabled: s?.enabled !== false,
      time: s?.time && /^\d{2}:\d{2}$/.test(s.time) ? s.time : def.time,
      label: s?.label || def.label,
      body: s?.body || def.body,
    };
  });
  return {
    masterEnabled: saved?.masterEnabled !== false,
    reminders,
  };
}

export function loadMealReminderConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return mergeWithDefaults({});
    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return mergeWithDefaults({});
  }
}

export function saveMealReminderConfig(partial) {
  const current = loadMealReminderConfig();
  const next = { ...current, ...partial };
  if (partial.reminders) {
    next.reminders = partial.reminders;
  }
  localStorage.setItem(CONFIG_KEY, JSON.stringify({
    masterEnabled: next.masterEnabled,
    reminders: next.reminders.map((r) => ({
      id: r.id,
      enabled: r.enabled,
      time: r.time,
      label: r.label,
      body: r.body,
    })),
  }));
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getTodayFires() {
  try {
    const all = JSON.parse(localStorage.getItem(DAILY_FIRES_KEY) || '{}');
    const d = getTodayKey();
    return all[d] || {};
  } catch {
    return {};
  }
}

function markFired(id) {
  const d = getTodayKey();
  try {
    const all = JSON.parse(localStorage.getItem(DAILY_FIRES_KEY) || '{}');
    if (!all[d]) all[d] = {};
    all[d][id] = true;
    const keys = Object.keys(all).sort();
    while (keys.length > 14) delete all[keys.shift()];
    localStorage.setItem(DAILY_FIRES_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function notificationsGloballyAllowed() {
  const s = getAppSettings();
  if (s.notifications === false) return false;
  if (s.desktopNotifs === false) return false;
  return true;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export const MEAL_REMINDER_EVENT = 'helix-meal-reminder';

export function clearTodayFires() {
  try {
    const all = JSON.parse(localStorage.getItem(DAILY_FIRES_KEY) || '{}');
    delete all[getTodayKey()];
    localStorage.setItem(DAILY_FIRES_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

function fireMealReminder(r) {
  const pool = ROAST_POOL[r.id];
  const body = pool ? pickRandom(pool) : r.body;

  console.log(`[Helix] Firing meal reminder: ${r.label} (${r.time})`);

  showDesktopNotification(r.label, body, {
    tag: `helix-meal-${r.id}-${getTodayKey()}`,
    silent: getAppSettings().soundEnabled === false,
  });

  window.dispatchEvent(new CustomEvent(MEAL_REMINDER_EVENT, {
    detail: { id: `meal-${r.id}-${Date.now()}`, type: 'meal', label: r.label, message: body },
  }));
}

export function tickMealReminders() {
  const allowed = notificationsGloballyAllowed();
  if (!allowed) return;

  const cfg = loadMealReminderConfig();
  if (!cfg.masterEnabled) return;

  const now = nowHHMM();
  const nowMin = toMinutes(now);
  const fired = getTodayFires();

  for (const r of cfg.reminders) {
    if (!r.enabled) continue;
    if (fired[r.id]) continue;
    const targetMin = toMinutes(r.time);

    const isPastTarget = nowMin >= targetMin;
    if (!isPastTarget) continue;

    markFired(r.id);
    fireMealReminder(r);
  }
}

if (typeof window !== 'undefined') {
  window.__helixTestReminder = () => {
    console.log('[Helix] Test reminder triggered manually');
    fireMealReminder({
      id: 'lunch',
      label: 'Lunch Break',
      time: nowHHMM(),
      body: pickRandom(ROAST_POOL.lunch),
    });
  };
}

let _intervalId = null;
let _started = false;

export function startMealReminderScheduler(intervalMs = 30000) {
  if (_intervalId) clearInterval(_intervalId);

  clearTodayFires();
  console.log('[Helix] Meal reminder scheduler started');

  _started = true;
  tickMealReminders();
  _intervalId = setInterval(tickMealReminders, intervalMs);
  return () => {
    clearInterval(_intervalId);
    _intervalId = null;
    _started = false;
  };
}
