import React, { useState, useCallback } from 'react';
import {
  HiOutlineHeart, HiOutlineClipboardList, HiOutlineCalendar,
  HiOutlinePlus, HiOutlineTrash, HiOutlineCheck, HiOutlineLightBulb,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import AppointmentSync from './AppointmentSync';

const TRIMESTER_INFO = {
  1: {
    name: '1st Trimester',
    weeks: 'Weeks 1–12',
    desc: 'Your body is building the foundation. Nausea and fatigue are normal — be gentle with yourself.',
    tip: 'Short walks and small, frequent meals help more than forcing a full workday.',
    color: '#f5b731',
  },
  2: {
    name: '2nd Trimester',
    weeks: 'Weeks 13–26',
    desc: 'Energy returns! This is often called the "golden trimester." Great time for bigger projects.',
    tip: 'Your focus peaks now — use it for deep work, but keep hydrating every hour.',
    color: '#2d9e6e',
  },
  3: {
    name: '3rd Trimester',
    weeks: 'Weeks 27–40',
    desc: 'Home stretch. Your body is working hard even at rest. Delegate freely — you\'ve earned it.',
    tip: 'Break every 30 minutes. Side-lying rest is better than powering through brain fog.',
    color: '#d95f8c',
  },
};

function gentleNudge(trimester, weeksPregnant) {
  const nudges = {
    1: [
      "Baby is the size of a blueberry this week. Your fatigue is real — even a 10-minute nap recharges you.",
      "Nausea waves are normal. Sip ginger tea and tackle only your top 3 priorities today.",
      "Your body is building a placenta from scratch. That's why you're tired. Rest is productive.",
    ],
    2: [
      "Baby is moving! Your energy is up — great day for a walking meeting.",
      "Your heart is pumping 50% more blood now. Stay hydrated and take a stretch break.",
      "This is your power trimester. Tackle that big project, but set a timer to rest every 45 min.",
    ],
    3: [
      "Baby is growing fast today. Your heart rate is slightly up. Take a 5-minute side-lying rest.",
      "Your brain fog is real — it's called 'momnesia.' Use your task breakdown list, not willpower.",
      "Almost there. Your body is doing extraordinary things. Delegate one task to a teammate today.",
    ],
  };
  const list = nudges[trimester] || nudges[1];
  return list[weeksPregnant % list.length];
}

function breakIntoMicroTasks(task) {
  const words = task.trim().split(/\s+/);
  if (words.length <= 3) {
    return [{ text: task, done: false, id: Date.now().toString(36) }];
  }
  const steps = [
    `Gather what you need for: ${task}`,
    `Start the first small part of: ${task}`,
    `Continue for 10 more minutes`,
    `Review what you've done & take a break`,
  ];
  return steps.map((text, i) => ({
    text,
    done: false,
    id: `${Date.now().toString(36)}-${i}`,
  }));
}

export default function MotherhoodShield({
  weeksPregnant, trimester, daysUntilDue, pregnancyData, updatePregnancyData, daysUntilAppointment,
}) {
  const [newTask, setNewTask] = useState('');
  const info = TRIMESTER_INFO[trimester];
  const nudge = gentleNudge(trimester, weeksPregnant);
  const microTasks = pregnancyData.microTasks || [];

  const addTask = useCallback(() => {
    const trimmed = newTask.trim();
    if (!trimmed) return;
    const steps = breakIntoMicroTasks(trimmed);
    updatePregnancyData({ microTasks: [...microTasks, { original: trimmed, steps, createdAt: new Date().toISOString() }] });
    setNewTask('');
  }, [newTask, microTasks, updatePregnancyData]);

  const toggleStep = useCallback((taskIdx, stepIdx) => {
    const updated = microTasks.map((t, ti) => {
      if (ti !== taskIdx) return t;
      const steps = t.steps.map((s, si) => si === stepIdx ? { ...s, done: !s.done } : s);
      return { ...t, steps };
    });
    updatePregnancyData({ microTasks: updated });
  }, [microTasks, updatePregnancyData]);

  const removeTask = useCallback((taskIdx) => {
    updatePregnancyData({ microTasks: microTasks.filter((_, i) => i !== taskIdx) });
  }, [microTasks, updatePregnancyData]);

  const progress = Math.min(100, Math.round((weeksPregnant / 40) * 100));

  return (
    <div className="space-y-5">
      {/* Hero — Trimester Ring */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-amber-50 border border-amber-200 p-6">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-gradient-radial from-amber-100 to-transparent rounded-full" />
        <div className="flex items-start justify-between flex-wrap gap-4 relative">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineHeart className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">{info.name}</span>
              <span className="text-[10px] text-amber-700">{info.weeks}</span>
            </div>
            <p className="text-3xl font-serif font-bold text-amber-900">
              Week {weeksPregnant}
            </p>
            <p className="text-sm text-amber-700 mt-2 leading-relaxed max-w-md">{info.desc}</p>

            <div className="mt-4 w-full max-w-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-amber-700">Pregnancy Progress</span>
                <span className="text-[10px] font-semibold text-amber-600">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-amber-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sunrise-gradient transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {daysUntilDue !== null && (
            <div className="bg-amber-100 border border-amber-200 rounded-xl px-5 py-3 text-center shrink-0">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Due Date</p>
              <p className="text-2xl font-serif font-bold text-amber-900 mt-0.5">
                {daysUntilDue}
              </p>
              <p className="text-xs text-amber-700">days to go</p>
            </div>
          )}
        </div>
      </div>

      {/* The Gentle Nudge */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-200 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
            <HiOutlineHeart className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">The Gentle Nudge</h3>
            <p className="text-sm text-amber-900 leading-relaxed">{nudge}</p>
            <p className="text-[10px] text-amber-700 mt-2 italic">{info.tip}</p>
          </div>
        </div>
      </div>

      {/* Cognitive Load Protector */}
      <div className="rounded-2xl border border-amber-200 bg-white/70 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
            <HiOutlineLightBulb className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Pregnancy Brain Support</h3>
            <p className="text-[10px] text-amber-700">Large tasks auto-break into 10-min micro-steps</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a task to break down..."
            className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-amber-900 placeholder:text-amber-700 focus:outline-none focus:border-amber-400 transition-all"
          />
          <button
            onClick={addTask}
            disabled={!newTask.trim()}
            className="px-4 py-2.5 rounded-xl bg-sunrise-gradient text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-30"
          >
            <HiOutlinePlus className="w-4 h-4" />
          </button>
        </div>

        {microTasks.length === 0 ? (
          <div className="text-center py-6">
            <HiOutlineClipboardList className="w-8 h-8 mx-auto text-amber-300 mb-2" />
            <p className="text-xs text-amber-700">Add a task and it will be broken into tiny, manageable steps</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {microTasks.map((task, taskIdx) => {
              const doneCount = task.steps.filter(s => s.done).length;
              const allDone = doneCount === task.steps.length;
              return (
                <div key={taskIdx} className={`rounded-xl border p-4 transition-all ${allDone ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm font-medium ${allDone ? 'text-emerald-600 line-through' : 'text-amber-900'}`}>
                      {task.original}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-700">{doneCount}/{task.steps.length}</span>
                      <button onClick={() => removeTask(taskIdx)} className="p-1 rounded text-amber-700 hover:text-red-600 transition-colors">
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {task.steps.map((step, stepIdx) => (
                      <button
                        key={step.id}
                        onClick={() => toggleStep(taskIdx, stepIdx)}
                        className="w-full flex items-center gap-2.5 text-left p-2 rounded-lg hover:bg-amber-100 transition-colors group"
                      >
                        <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          step.done
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-amber-300 group-hover:border-amber-500'
                        }`}>
                          {step.done && <HiOutlineCheck className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-xs leading-snug ${step.done ? 'text-amber-700 line-through' : 'text-amber-900'}`}>
                          {step.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Appointment Sync */}
      <AppointmentSync
        pregnancyData={pregnancyData}
        updatePregnancyData={updatePregnancyData}
        daysUntilAppointment={daysUntilAppointment}
      />

      {/* Privacy badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200">
        <HiOutlineShieldCheck className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-xs text-amber-600 font-medium">All data stays on your device</span>
      </div>
    </div>
  );
}
