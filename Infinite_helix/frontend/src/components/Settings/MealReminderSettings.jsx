import React, { useState, useEffect } from 'react';
import { loadMealReminderConfig, saveMealReminderConfig, MEAL_REMINDER_EVENT } from '../../services/mealReminders';

function ToggleMini({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${enabled ? 'bg-helix-accent' : 'bg-helix-border'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

export default function MealReminderSettings() {
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const c = loadMealReminderConfig();
    setMasterEnabled(c.masterEnabled);
    setRows(c.reminders);
  }, []);

  const updateMaster = (v) => {
    setMasterEnabled(v);
    saveMealReminderConfig({ masterEnabled: v });
  };

  const updateRow = (id, patch) => {
    const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setRows(next);
    saveMealReminderConfig({ reminders: next, masterEnabled });
  };

  return (
    <div className="space-y-4 pt-2 border-t border-helix-border/40">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-helix-text">Meal & break reminders</p>
          <p className="text-xs text-helix-muted mt-0.5">
            Daily desktop alerts for meals and breaks. Times use your device clock.
          </p>
        </div>
        <ToggleMini enabled={masterEnabled} onChange={updateMaster} />
      </div>

      {masterEnabled && (
        <div className="space-y-3 rounded-xl bg-helix-bg/40 border border-helix-border/30 p-3">
          <p className="text-[11px] text-helix-muted">
            Tap the time to change it to your preferred schedule. Each reminder fires once per day at the set time.
          </p>
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-2 sm:gap-3 py-2 border-b border-helix-border/20 last:border-0"
            >
              <ToggleMini enabled={r.enabled !== false} onChange={(v) => updateRow(r.id, { enabled: v })} />
              <span className="text-sm text-helix-text flex-1 min-w-[8rem]">{r.label}</span>
              <input
                type="time"
                value={r.time}
                onChange={(e) => updateRow(r.id, { time: e.target.value })}
                className="bg-helix-bg border border-helix-border rounded-lg px-2 py-1 text-sm text-helix-text focus:border-helix-accent outline-none"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent(MEAL_REMINDER_EVENT, {
                detail: {
                  id: `test-${Date.now()}`,
                  type: 'meal',
                  label: 'Test Reminder',
                  message: 'This is a test — if you see this toast, reminders are working!',
                },
              }));
            }}
            className="w-full mt-2 px-3 py-2 rounded-lg bg-helix-accent/10 text-helix-accent text-xs font-medium hover:bg-helix-accent/20 transition-colors"
          >
            Send Test Reminder
          </button>
        </div>
      )}
    </div>
  );
}
