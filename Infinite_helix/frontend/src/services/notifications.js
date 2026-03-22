let _permissionGranted = false;

export function isPermissionGranted() {
  return _permissionGranted || (typeof Notification !== 'undefined' && Notification.permission === 'granted');
}

export async function requestPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return false;
  }
  if (Notification.permission === 'granted') {
    _permissionGranted = true;
    return true;
  }
  if (Notification.permission === 'denied') {
    return false;
  }
  const permission = await Notification.requestPermission();
  _permissionGranted = permission === 'granted';
  return _permissionGranted;
}

export function showDesktopNotification(title, body, options = {}) {
  if (!_permissionGranted && Notification.permission !== 'granted') {
    console.warn('[Helix] Desktop notification skipped — permission:', Notification.permission);
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: options.tag || 'helix-nudge',
      silent: options.silent || false,
      ...options,
    });

    if (options.autoClose !== false) {
      setTimeout(() => notification.close(), options.duration || 6000);
    }

    return notification;
  } catch (err) {
    console.error('[Helix] Desktop notification failed:', err);
    return null;
  }
}

const NUDGE_TITLES = {
  hydration: 'Hydration Check',
  stretch: 'Move Your Body!',
  eyes: 'Eye Rest (20-20-20)',
  posture: 'Posture Police',
  meeting: 'Meeting Incoming',
  emotional: 'Vibe Check',
  winddown: 'Log Off Already!',
  morning: 'Good Morning!',
  streak: 'Achievement Unlocked',
};

export function showNudgeNotification(nudge) {
  const title = NUDGE_TITLES[nudge.type] || 'Wellness nudge';

  return showDesktopNotification(
    title,
    nudge.message,
    { tag: `helix-${nudge.type}-${nudge.id}` }
  );
}
