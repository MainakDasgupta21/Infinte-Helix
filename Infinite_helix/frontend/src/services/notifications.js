export async function requestPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function showDesktopNotification(title, body, options = {}) {
  if (Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: options.tag || 'helix-nudge',
    silent: options.silent || false,
    ...options,
  });

  if (options.autoClose !== false) {
    setTimeout(() => notification.close(), options.duration || 5000);
  }

  return notification;
}

export function showNudgeNotification(nudge) {
  const titles = {
    hydration: '💧 Hydration Reminder',
    stretch: '🌿 Stretch Break',
    eyes: '👀 Eye Rest',
    meeting: '🧘 Pre-Meeting Calm',
    emotional: '💜 Wellness Check',
  };

  return showDesktopNotification(
    titles[nudge.type] || '✨ Wellness Nudge',
    nudge.message,
    { tag: `helix-${nudge.type}-${nudge.id}` }
  );
}
