import { showDesktopNotification } from './notifications';
import { getAppSettings } from './mealReminders';

const STORAGE_KEY = 'helix_eye_rest_config';
const FIRE_KEY = 'helix_eye_rest_fires';

export const EYE_REST_EVENT = 'helix-eye-rest-reminder';

export const DEFAULT_EYE_REST_CONFIG = {
  enabled: true,
  intervalMinutes: 20,
};

export function loadEyeRestConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_EYE_REST_CONFIG };
    return { ...DEFAULT_EYE_REST_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_EYE_REST_CONFIG };
  }
}

export function saveEyeRestConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

const MESSAGES = [
  "You've been staring at this screen so long your eyes are basically crying for help.",
  "Look away from the screen for 20 seconds. Yes, right now. We'll wait.",
  "Your eyes are not monitors. They need rest. Look at a wall. A plant. Anything but this.",
  "20-20-20 rule \u2014 every 20 mins, look 20 feet away for 20 seconds. Do it or your future self will be very annoyed.",
  "Your screen time is impressive. Your eye health? Not so much. Look away. NOW.",
  "Quick eye break! Stare at something far away. No, the other monitor doesn't count.",
  "Your eyes just filed a formal complaint. Please look at literally anything else for 20 seconds.",
  "Fun fact: your eyes blink 66% less when staring at screens. Blink. Look away. You're welcome.",
  "Screen break! Close your eyes for a few seconds, then look at something 20 feet away. Your retinas will throw a party.",
];

function getRandomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
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
    while (keys.length > 7) delete all[keys.shift()];
    localStorage.setItem(FIRE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

function notificationsGloballyAllowed() {
  const s = getAppSettings();
  if (s.notifications === false) return false;
  if (s.desktopNotifs === false) return false;
  return true;
}

function fireEyeRestReminder() {
  const msg = getRandomMessage();
  console.log('[Helix] Eye rest reminder fired');

  showDesktopNotification('Eye Rest (20-20-20)', msg, {
    tag: `helix-eye-rest-${Date.now()}`,
    silent: getAppSettings().soundEnabled === false,
  });

  incrementFireCount();

  window.dispatchEvent(new CustomEvent(EYE_REST_EVENT, {
    detail: {
      id: `eye-rest-${Date.now()}`,
      type: 'eyes',
      label: 'Eye Rest',
      message: msg,
      count: getFireCount(),
    },
  }));
}

let _intervalId = null;

export function startEyeRestScheduler() {
  stopEyeRestScheduler();

  const cfg = loadEyeRestConfig();
  if (!cfg.enabled) {
    console.log('[Helix] Eye rest scheduler disabled');
    return () => {};
  }

  if (!notificationsGloballyAllowed()) {
    console.log('[Helix] Eye rest scheduler skipped \u2014 notifications globally disabled');
    return () => {};
  }

  const ms = (cfg.intervalMinutes || 20) * 60 * 1000;
  console.log(`[Helix] Eye rest scheduler started \u2014 every ${cfg.intervalMinutes} min`);

  _intervalId = setInterval(() => {
    const latestCfg = loadEyeRestConfig();
    if (!latestCfg.enabled || !notificationsGloballyAllowed()) return;
    fireEyeRestReminder();
  }, ms);

  return stopEyeRestScheduler;
}

export function stopEyeRestScheduler() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

export function restartEyeRestScheduler() {
  stopEyeRestScheduler();
  return startEyeRestScheduler();
}
