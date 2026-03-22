import { showDesktopNotification } from './notifications';
import { getAppSettings } from './mealReminders';

const FIRED_KEY = 'helix_todo_reminder_fired';
export const TODO_REMINDER_EVENT = 'helix-todo-reminder';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getFired() {
  try {
    const all = JSON.parse(localStorage.getItem(FIRED_KEY) || '{}');
    return all[todayKey()] || {};
  } catch {
    return {};
  }
}

function markFired(todoId) {
  try {
    const all = JSON.parse(localStorage.getItem(FIRED_KEY) || '{}');
    const d = todayKey();
    if (!all[d]) all[d] = {};
    all[d][todoId] = true;
    const keys = Object.keys(all).sort();
    while (keys.length > 7) delete all[keys.shift()];
    localStorage.setItem(FIRED_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function nowHHMM() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function checkTodoReminders(todos) {
  if (!todos || !todos.length) return;

  const s = getAppSettings();
  if (s.notifications === false || s.desktopNotifs === false) return;

  const now = nowHHMM();
  const nowMin = toMinutes(now);
  const fired = getFired();

  for (const todo of todos) {
    if (!todo.remind_at || todo.completed) continue;
    if (fired[todo.id]) continue;

    const targetMin = toMinutes(todo.remind_at);
    if (nowMin >= targetMin) {
      markFired(todo.id);

      showDesktopNotification('Reminder \u{1F4CC}', todo.text, {
        tag: `helix-todo-${todo.id}`,
        silent: s.soundEnabled === false,
      });

      window.dispatchEvent(new CustomEvent(TODO_REMINDER_EVENT, {
        detail: {
          id: `todo-${todo.id}-${Date.now()}`,
          type: 'todo',
          label: 'Reminder',
          message: todo.text,
        },
      }));
    }
  }
}
