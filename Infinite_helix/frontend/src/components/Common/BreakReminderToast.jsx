import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineCheck, HiOutlineClock, HiOutlineX } from 'react-icons/hi';

export default function BreakReminderToast({ reminder, onDone, onSnooze, onDismiss }) {
  if (!reminder) return null;

  const isMeal = reminder.type === 'meal';

  const accentStyles = isMeal
    ? { bg: 'bg-amber-500/10', border: 'border-amber-500/20', headerBg: 'bg-amber-500/15', headerText: 'text-amber-600', btnBg: 'bg-gradient-to-r from-amber-500 to-orange-500', shadow: 'shadow-lg' }
    : { bg: 'bg-helix-accent/10', border: 'border-helix-accent/20', headerBg: 'bg-helix-accent/15', headerText: 'text-helix-accent', btnBg: 'bg-gradient-to-r from-violet-600 to-indigo-600', shadow: 'shadow-lg' };

  return (
    <AnimatePresence>
      <motion.div
        key={reminder.id}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="fixed bottom-24 left-6 z-[55] w-[320px]"
      >
        <div className={`bg-helix-surface rounded-2xl border ${accentStyles.border} shadow-xl shadow-lg overflow-hidden`}>
          {/* Header strip */}
          <div className={`${accentStyles.headerBg} px-4 py-2 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{reminder.emoji}</span>
              <span className={`text-xs font-bold ${accentStyles.headerText} uppercase tracking-wider`}>
                {isMeal ? 'Meal Reminder' : 'Wellness Break'}
              </span>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-helix-muted hover:text-helix-text hover:bg-helix-surface/80 transition-colors"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4">
            {/* Title + Time */}
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-bold text-helix-text">{reminder.label}</h4>
              {reminder.time && (
                <span className="text-xs font-semibold text-helix-muted bg-helix-border/30 px-2 py-0.5 rounded-md">
                  {formatTime12(reminder.time)}
                </span>
              )}
            </div>

            {/* Message */}
            <p className="text-xs text-helix-text leading-relaxed mb-4">
              {reminder.message}
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => onDone(reminder.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl ${accentStyles.btnBg} text-white text-xs font-bold shadow-md ${accentStyles.shadow} hover:shadow-lg transition-all`}
              >
                <HiOutlineCheck className="w-3.5 h-3.5" />
                Done
              </button>
              <button
                onClick={() => onSnooze(reminder.id, 10)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-helix-border/30 border border-helix-border/50 text-xs font-bold text-helix-text hover:bg-helix-card/60 transition-all"
              >
                <HiOutlineClock className="w-3.5 h-3.5" />
                10m
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function formatTime12(time24) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}
