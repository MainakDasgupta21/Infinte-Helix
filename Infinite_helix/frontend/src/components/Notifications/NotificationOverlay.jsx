import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWellness } from '../../context/WellnessContext';
import { HiOutlineX } from 'react-icons/hi';
import { MEAL_REMINDER_EVENT } from '../../services/mealReminders';
import { EYE_REST_EVENT } from '../../services/eyeRestReminder';
import { PRIVATE_CARE_EVENT } from '../../services/privateCareReminder';
import { TODO_REMINDER_EVENT } from '../../services/todoReminder';

const TYPE_STYLES = {
  hydration: { gradient: 'from-sky-500/20 to-cyan-500/20', border: 'border-sky-500/30', emoji: '\uD83D\uDCA7' },
  stretch:   { gradient: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30', emoji: '\uD83E\uDDD8' },
  posture:   { gradient: 'from-teal-500/20 to-emerald-500/20', border: 'border-teal-500/30', emoji: '\uD83E\uDEBB' },
  eyes:      { gradient: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30', emoji: '\uD83D\uDC41\uFE0F' },
  meeting:   { gradient: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30', emoji: '\uD83C\uDFAF' },
  emotional: { gradient: 'from-violet-500/20 to-purple-500/20', border: 'border-helix-accent/30', emoji: '\uD83D\uDC9C' },
  winddown:  { gradient: 'from-indigo-500/20 to-blue-500/20', border: 'border-indigo-500/30', emoji: '\uD83C\uDF19' },
  morning:   { gradient: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30', emoji: '\u2600\uFE0F' },
  streak:    { gradient: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30', emoji: '\uD83C\uDFC6' },
  meal:        { gradient: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/30', emoji: '\uD83C\uDF7D\uFE0F' },
  privatecare: { gradient: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30', emoji: '\uD83C\uDF3C' },
  todo:        { gradient: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/30', emoji: '\uD83D\uDCCC' },
};

const TYPE_TITLES = {
  hydration: 'Hydration Check',
  stretch: 'Move Your Body!',
  posture: 'Posture Police',
  eyes: 'Eye Rest (20-20-20)',
  meeting: 'Meeting Incoming',
  emotional: 'Vibe Check',
  winddown: 'Log Off Already!',
  morning: 'Good Morning!',
  streak: 'Achievement Unlocked',
  meal: 'Meal Reminder',
  privatecare: 'Self-Care Break',
  todo: 'Reminder',
};

export default function NotificationOverlay() {
  const { nudges, dismissNudge } = useWellness();
  const [visible, setVisible] = useState(null);
  const timerRef = useRef(null);

  const showNotification = useCallback((item) => {
    setVisible(item);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(null), 8000);
  }, []);

  useEffect(() => {
    const active = nudges.find(n => !n.dismissed);
    if (active && (!visible || visible.id !== active.id)) {
      showNotification(active);
    }
  }, [nudges, visible, showNotification]);

  useEffect(() => {
    function onMealReminder(e) {
      const { id, label, message } = e.detail;
      showNotification({ id, type: 'meal', title: label, message, isExternal: true });
    }
    window.addEventListener(MEAL_REMINDER_EVENT, onMealReminder);
    return () => window.removeEventListener(MEAL_REMINDER_EVENT, onMealReminder);
  }, [showNotification]);

  useEffect(() => {
    function onEyeRest(e) {
      const { id, message } = e.detail;
      showNotification({ id, type: 'eyes', title: 'Eye Rest (20-20-20)', message, isExternal: true });
    }
    window.addEventListener(EYE_REST_EVENT, onEyeRest);
    return () => window.removeEventListener(EYE_REST_EVENT, onEyeRest);
  }, [showNotification]);

  useEffect(() => {
    function onPrivateCare(e) {
      const { id, message } = e.detail;
      showNotification({ id, type: 'privatecare', title: 'Self-Care Break', message, isExternal: true });
    }
    window.addEventListener(PRIVATE_CARE_EVENT, onPrivateCare);
    return () => window.removeEventListener(PRIVATE_CARE_EVENT, onPrivateCare);
  }, [showNotification]);

  useEffect(() => {
    function onTodoReminder(e) {
      const { id, message } = e.detail;
      showNotification({ id, type: 'todo', title: 'Reminder \uD83D\uDCCC', message, isExternal: true });
    }
    window.addEventListener(TODO_REMINDER_EVENT, onTodoReminder);
    return () => window.removeEventListener(TODO_REMINDER_EVENT, onTodoReminder);
  }, [showNotification]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!visible) return null;

  const style = TYPE_STYLES[visible.type] || TYPE_STYLES.emotional;
  const title = visible.title || TYPE_TITLES[visible.type] || 'Wellness Nudge';

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm animate-slide-up">
      <div className={`bg-gradient-to-r ${style.gradient} backdrop-blur-xl border ${style.border} rounded-2xl p-4 shadow-2xl`}>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-helix-bg/50 border border-helix-border/40 text-lg">
            {style.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-helix-text mb-0.5">{title}</p>
            <p className="text-[13px] text-helix-text/85 leading-relaxed">{visible.message}</p>
          </div>
          <button
            onClick={() => {
              if (!visible.isExternal) dismissNudge(visible.id);
              setVisible(null);
              clearTimeout(timerRef.current);
            }}
            className="text-helix-muted hover:text-helix-text transition-colors mt-0.5"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
