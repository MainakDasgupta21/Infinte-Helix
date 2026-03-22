import { showDesktopNotification } from './notifications';
import { getAppSettings } from './mealReminders';

const CONFIG_KEY = 'helix_private_care_config';
const FIRE_KEY = 'helix_private_care_fires';

export const PRIVATE_CARE_EVENT = 'helix-private-care-reminder';

export const DEFAULT_CONFIG = {
  enabled: false,
  intervalHours: 4,
  activeToday: false,
};

export function loadPrivateCareConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function savePrivateCareConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

const DISCREET_MESSAGES = [
  "Quick self-care check \u2014 it's been a while. Take a moment for yourself.",
  "Gentle reminder: time for a quick freshen-up break. You deserve it.",
  "Hey, it's been {hours}h. A quick bathroom break might be a good idea right now.",
  "Personal care reminder \u2014 staying fresh keeps you comfortable and confident all day.",
  "Time for a quick refresh. Step away for a few minutes, you'll feel so much better.",
  "You've been focused for a while. Perfect time for a quick personal break.",
  "Comfort check! A quick freshen-up now means feeling great for the rest of the day.",
  "Small reminder: taking care of yourself is not optional. Quick break time.",
];

function getRandomMessage(intervalHours) {
  const msg = DISCREET_MESSAGES[Math.floor(Math.random() * DISCREET_MESSAGES.length)];
  return msg.replace('{hours}', String(intervalHours || 4));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getFireCount() {
  try {
    const all = JSON.parse(localStorage.getItem(FIRE_KEY) || '{}');
    return all[todayKey()] || 0;
  } catch {
    return 0;
  }
}

function incrementFireCount() {
  try {
    const all = JSON.parse(localStorage.getItem(FIRE_KEY) || '{}');
    const d = todayKey();
    all[d] = (all[d] || 0) + 1;
    const keys = Object.keys(all).sort();
    while (keys.length > 30) delete all[keys.shift()];
    localStorage.setItem(FIRE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

function notificationsAllowed() {
  const s = getAppSettings();
  if (s.notifications === false) return false;
  if (s.desktopNotifs === false) return false;
  return true;
}

function fireReminder(intervalHours) {
  const msg = getRandomMessage(intervalHours);
  console.log('[Helix] Private care reminder fired');

  showDesktopNotification('Self-Care Break', msg, {
    tag: `helix-private-care-${Date.now()}`,
    silent: getAppSettings().soundEnabled === false,
  });

  incrementFireCount();

  window.dispatchEvent(new CustomEvent(PRIVATE_CARE_EVENT, {
    detail: {
      id: `private-care-${Date.now()}`,
      type: 'privatecare',
      label: 'Self-Care Break',
      message: msg,
      count: getFireCount(),
    },
  }));
}

let _intervalId = null;

export function startPrivateCareScheduler() {
  stopPrivateCareScheduler();

  const cfg = loadPrivateCareConfig();
  if (!cfg.enabled || !cfg.activeToday) {
    return () => {};
  }
  if (!notificationsAllowed()) {
    return () => {};
  }

  const ms = (cfg.intervalHours || 4) * 60 * 60 * 1000;
  console.log(`[Helix] Private care scheduler started \u2014 every ${cfg.intervalHours}h`);

  _intervalId = setInterval(() => {
    const latest = loadPrivateCareConfig();
    if (!latest.enabled || !latest.activeToday || !notificationsAllowed()) return;
    fireReminder(latest.intervalHours);
  }, ms);

  return stopPrivateCareScheduler;
}

export function stopPrivateCareScheduler() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

export function restartPrivateCareScheduler() {
  stopPrivateCareScheduler();
  return startPrivateCareScheduler();
}
