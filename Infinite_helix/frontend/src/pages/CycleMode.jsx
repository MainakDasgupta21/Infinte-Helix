import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePeriodTracker } from '../hooks/usePeriodTracker';
import { usePregnancyMode } from '../hooks/usePregnancyMode';
import PeriodEntryModal from '../components/CycleMode/PeriodEntryModal';
import PrivateCareTracker from '../components/CycleMode/PrivateCareTracker';
import CycleRing from '../components/CycleMode/CycleRing';
import EnergyForecast from '../components/CycleMode/EnergyForecast';
import MotherhoodShield from '../components/CycleMode/MotherhoodShield';
import SmartSwitch from '../components/CycleMode/SmartSwitch';
import ConfidenceBreath from '../components/Calendar/ConfidenceBreath';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import { toIso, startOfDay } from '../utils/periodMath';
import { usePageContext } from '../context/PageContext';

const DAILY_LOG_KEY = 'helix_cycle_daily_logs';
const PERIOD_DURATION_KEY = 'helix_period_duration';

function todayKey() {
  return toIso(startOfDay(new Date()));
}

function loadDailyLogs() {
  try { return JSON.parse(localStorage.getItem(DAILY_LOG_KEY) || '{}'); }
  catch { return {}; }
}
function saveDailyLogs(logs) {
  try { localStorage.setItem(DAILY_LOG_KEY, JSON.stringify(logs)); } catch {}
}
function loadPeriodDuration() {
  try { return Number(localStorage.getItem(PERIOD_DURATION_KEY)) || 4; }
  catch { return 4; }
}
function savePeriodDuration(d) {
  try { localStorage.setItem(PERIOD_DURATION_KEY, String(d)); } catch {}
}

const MOODS = [
  { id: 'great', label: 'Great', emoji: '😊' },
  { id: 'calm', label: 'Calm', emoji: '😌' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
  { id: 'low', label: 'Low', emoji: '😞' },
];

const FLOWS = [
  { id: 'none', label: 'None' },
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'heavy', label: 'Heavy' },
];

const SYMPTOMS = [
  'Cramps', 'Bloating', 'Headache', 'Very tired',
  'Mood swings', "Can't focus", 'Food cravings', 'Feeling anxious',
];

const DURATIONS = [
  { value: 3, label: '3 days' },
  { value: 4, label: '4 days' },
  { value: 5, label: '5 days' },
  { value: 6, label: '6 days' },
  { value: 7, label: '7+ days' },
];

function phaseInfo(cycleDay) {
  if (cycleDay >= 1 && cycleDay <= 5)
    return { name: 'Period days', desc: 'Rest when you can. Shorter tasks and warmth help more than pushing through.', color: 'text-rose-600' };
  if (cycleDay >= 6 && cycleDay <= 13)
    return { name: 'Energy rising', desc: 'Your energy is picking up this week. Good time for focused work and meetings.', color: 'text-emerald-600' };
  if (cycleDay >= 14 && cycleDay <= 16)
    return { name: 'Peak energy', desc: 'Confidence and focus are at their highest. Tackle challenging projects and speak up.', color: 'text-amber-600' };
  return { name: 'Winding down', desc: 'Finish open tasks and tie up loose ends. Gentle routines feel better than new starts.', color: 'text-violet-600' };
}

function addDays(date, n) {
  const x = new Date(date);
  x.setDate(x.getDate() + n);
  return x;
}

function cycleDayForDate(cycleStartIso, date) {
  const [y, m, day] = cycleStartIso.split('-').map(Number);
  const start = new Date(y, m - 1, day);
  const diff = Math.round((startOfDay(date) - startOfDay(start)) / 86400000);
  if (diff < 0) return null;
  return (diff % 28) + 1;
}

function getPatternInsight(entries, cycleDay, dailyLogs) {
  if (entries.length < 1) return null;
  const symptomsOnThisDay = [];
  Object.entries(dailyLogs).forEach(([, log]) => {
    if (log.cycleDay === cycleDay && log.symptoms?.length) {
      symptomsOnThisDay.push(...log.symptoms);
    }
  });
  if (symptomsOnThisDay.length > 0) {
    const counts = {};
    symptomsOnThisDay.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      return {
        title: 'FROM LAST MONTH',
        text: `You logged ${top[0].toLowerCase()} on day ${cycleDay} before. Try drinking more water today — it helped last time.`,
      };
    }
  }
  if (cycleDay >= 1 && cycleDay <= 5)
    return { title: 'PATTERN INSIGHT', text: `Day ${cycleDay} is typically in your period phase. Warm drinks and shorter tasks tend to help you feel more settled.` };
  if (cycleDay >= 14 && cycleDay <= 16)
    return { title: 'PATTERN INSIGHT', text: `Day ${cycleDay} is near your peak. Past logs show you handle challenging meetings best around this time.` };
  return { title: 'PATTERN INSIGHT', text: `Track your mood, flow, and symptoms daily to see personalized patterns for day ${cycleDay} of your cycle.` };
}

const flipVariants = {
  enter: { rotateY: 90, opacity: 0 },
  center: { rotateY: 0, opacity: 1 },
  exit: { rotateY: -90, opacity: 0 },
};

const PREGNANCY_SETUP_KEY = 'helix_pregnancy_setup_done';

function PregnancySetup({ updatePregnancyData }) {
  const [dueDate, setDueDate] = useState('');

  const handleSave = () => {
    if (!dueDate) return;
    updatePregnancyData({ dueDateIso: dueDate });
    try { localStorage.setItem(PREGNANCY_SETUP_KEY, 'true'); } catch {}
  };

  return (
    <div className="bento-card p-8 text-center border-amber-200 bg-amber-50">
      <p className="text-4xl mb-3">🤰</p>
      <h2 className="text-xl font-serif font-bold text-amber-900 mb-2">Welcome to Motherhood Shield</h2>
      <p className="text-sm text-amber-700 max-w-sm mx-auto mb-6">
        Enter your estimated due date to get trimester insights, gentle nudges, and appointment tracking.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 max-w-xs mx-auto">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="flex-1 bg-white border border-amber-300 rounded-xl px-4 py-2.5 text-sm text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
        />
        <button
          onClick={handleSave}
          disabled={!dueDate}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30 shadow-md shadow-amber-500/20"
        >
          Start
        </button>
      </div>
    </div>
  );
}

export default function CycleMode() {
  const {
    entries, hasEntries, lastPeriodStartIso, nextPeriodInfo,
    cycleDay, addEntry, updateEntry, removeEntry,
  } = usePeriodTracker();
  const {
    mode, isPregnancy, toggleMode,
    pregnancyData, updatePregnancyData,
    weeksPregnant, trimester, daysUntilDue, daysUntilAppointment,
  } = usePregnancyMode();
  const { updatePageContext } = usePageContext();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState(null);

  const [dailyLogs, setDailyLogs] = useState(loadDailyLogs);
  const [periodDuration, setPeriodDuration] = useState(loadPeriodDuration);
  const [saved, setSaved] = useState(false);

  const todayLog = dailyLogs[todayKey()] || {};
  const [mood, setMood] = useState(todayLog.mood || null);
  const [flow, setFlow] = useState(todayLog.flow || null);
  const [symptoms, setSymptoms] = useState(todayLog.symptoms || []);

  useEffect(() => {
    const log = dailyLogs[todayKey()];
    if (log) {
      setMood(log.mood || null);
      setFlow(log.flow || null);
      setSymptoms(log.symptoms || []);
    }
  }, []);

  const toggleSymptom = (s) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    setSaved(false);
  };

  const handleSaveToday = () => {
    const key = todayKey();
    const updated = {
      ...dailyLogs,
      [key]: { mood, flow, symptoms, cycleDay, savedAt: new Date().toISOString() },
    };
    setDailyLogs(updated);
    saveDailyLogs(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDurationChange = (val) => {
    setPeriodDuration(val);
    savePeriodDuration(val);
  };

  const openChangeDate = useCallback(() => {
    if (hasEntries) {
      setModalMode('edit');
      const sorted = [...entries].sort((a, b) => b.startDate.localeCompare(a.startDate));
      setEditingEntry(sorted[0]);
    } else {
      setModalMode('add');
      setEditingEntry(null);
    }
    setModalOpen(true);
  }, [entries, hasEntries]);

  const closeModal = useCallback(() => { setModalOpen(false); setEditingEntry(null); }, []);

  const handleModalSave = useCallback(
    ({ startDate, endDate }) => {
      if (modalMode === 'edit' && editingEntry) updateEntry(editingEntry.id, startDate, endDate);
      else addEntry(startDate, endDate);
    },
    [modalMode, editingEntry, addEntry, updateEntry]
  );

  const handleModalDelete = useCallback((id) => removeEntry(id), [removeEntry]);

  const phase = useMemo(() => phaseInfo(cycleDay), [cycleDay]);
  const isPeriodDay = cycleDay >= 1 && cycleDay <= 5;

  const today = startOfDay(new Date());
  const weekDays = useMemo(() => {
    return [-3, -2, -1, 0, 1, 2, 3].map(offset => addDays(today, offset));
  }, []);

  const patternInsight = useMemo(
    () => getPatternInsight(entries, cycleDay, dailyLogs),
    [entries, cycleDay, dailyLogs]
  );

  useEffect(() => {
    updatePageContext('cycle-mode', {
      mode,
      cycle_day: cycleDay,
      phase_name: phase.name,
      phase_description: phase.desc,
      has_entries: hasEntries,
      next_period: nextPeriodInfo ? {
        days_until: nextPeriodInfo.daysUntil,
        date: nextPeriodInfo.label,
      } : null,
      today_mood: mood,
      today_flow: flow,
      today_symptoms: symptoms,
      period_duration: periodDuration,
      is_period_day: isPeriodDay,
      pattern_insight: patternInsight?.text,
      ...(isPregnancy ? {
        weeks_pregnant: weeksPregnant,
        trimester,
        days_until_due: daysUntilDue,
      } : {}),
    });
  }, [cycleDay, phase, hasEntries, nextPeriodInfo, mood, flow, symptoms, periodDuration, isPeriodDay, patternInsight, updatePageContext, mode, isPregnancy, weeksPregnant, trimester, daysUntilDue]);

  const needsPregnancySetup = isPregnancy && !pregnancyData.dueDateIso;

  return (
    <div className={`max-w-6xl mx-auto space-y-5 animate-slide-up pb-8 transition-colors duration-700 ${isPregnancy ? 'pregnancy-mode' : ''}`}>
      {/* Header with Smart Switch */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-serif font-bold transition-colors duration-500 ${isPregnancy ? 'text-amber-900' : 'text-slate-900'}`}>
            {isPregnancy ? 'Motherhood Shield' : 'My Cycle'}
          </h1>
          <p className={`text-sm mt-1 font-medium transition-colors duration-500 ${isPregnancy ? 'text-amber-700' : 'text-slate-500'}`}>
            {isPregnancy ? 'Nurturing you through every trimester' : 'Everything based on your last period date'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <SmartSwitch isPregnancy={isPregnancy} onToggle={toggleMode} />
          {!isPregnancy && (
            <button
              onClick={openChangeDate}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              Change start date
            </button>
          )}
        </div>
      </div>

      {/* Animated mode switch with 3D flip */}
      <AnimatePresence mode="wait">
        {isPregnancy ? (
          <motion.div
            key="pregnancy"
            variants={flipVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
          >
            {needsPregnancySetup ? (
              <PregnancySetup updatePregnancyData={updatePregnancyData} />
            ) : (
              <MotherhoodShield
                weeksPregnant={weeksPregnant}
                trimester={trimester}
                daysUntilDue={daysUntilDue}
                pregnancyData={pregnancyData}
                updatePregnancyData={updatePregnancyData}
                daysUntilAppointment={daysUntilAppointment}
              />
            )}

            {/* Pre-Meeting Calm — Deep Pelvic Breathing */}
            <div className="mt-5">
              <ConfidenceBreath pregnancyMode />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cycle"
            variants={flipVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
            className="space-y-5"
          >
            {/* Privacy badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <HiOutlineShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs text-emerald-700 font-semibold">Only saved on your device</span>
            </div>

            {/* Top row: Cycle Ring + Energy Forecast side by side */}
            {hasEntries ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bento-card">
                  <CycleRing
                    cycleDay={cycleDay}
                    onPhaseClick={(p) => setSelectedPhase(p)}
                  />
                  {selectedPhase && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <p className="text-sm font-bold text-slate-800">{selectedPhase.name} Phase</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Days {selectedPhase.days[0]}–{selectedPhase.days[1]} &middot; <span style={{ color: selectedPhase.color }}>{selectedPhase.label}</span>
                      </p>
                    </motion.div>
                  )}
                </div>
                <EnergyForecast cycleDay={cycleDay} />
              </div>
            ) : (
              <div className="bento-card p-8 text-center border-dashed border-slate-300">
                <p className="text-4xl mb-3">🌸</p>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Tap <span className="text-slate-800 font-bold">Change start date</span> to log
                  when your last period started. Everything else builds from there.
                </p>
              </div>
            )}

            {/* This Week strip */}
            {hasEntries && (
              <div className="bento-card">
                <h3 className="bento-label mb-3">This Week</h3>
                <div className="grid grid-cols-7 gap-1.5">
                  {weekDays.map(d => {
                    const isToday = startOfDay(d).getTime() === today.getTime();
                    const cd = lastPeriodStartIso ? cycleDayForDate(lastPeriodStartIso, d) : null;
                    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
                    const dateNum = d.getDate();
                    return (
                      <div
                        key={d.toISOString()}
                        className={`rounded-xl py-2.5 px-1 text-center transition-all border ${
                          isToday
                            ? 'bg-rose-100 border-rose-300 ring-1 ring-rose-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{label}</p>
                        <p className={`text-base font-bold mt-0.5 ${isToday ? 'text-rose-600' : 'text-slate-800'}`}>{dateNum}</p>
                        <p className={`text-[10px] mt-0.5 font-semibold ${isToday ? 'text-rose-600' : 'text-slate-500'}`}>
                          Day {cd != null ? cd : '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mood + Flow row */}
            {hasEntries && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bento-card">
                  <h3 className="bento-label mb-3">How do you feel today?</h3>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setMood(m.id); setSaved(false); }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-all ${
                          mood === m.id
                            ? 'bg-rose-100 border-rose-300 text-rose-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-base">{m.emoji}</span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bento-card">
                  <h3 className="bento-label mb-1">Flow Today</h3>
                  <p className="text-[10px] text-slate-400 font-medium mb-3">
                    {isPeriodDay ? 'Log your flow level' : 'Only during period days'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FLOWS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => { if (isPeriodDay) { setFlow(f.id); setSaved(false); } }}
                        disabled={!isPeriodDay}
                        className={`px-3.5 py-2 rounded-lg border text-sm font-semibold transition-all ${
                          flow === f.id && isPeriodDay
                            ? 'bg-rose-100 border-rose-300 text-rose-700'
                            : isPeriodDay
                              ? 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300'
                              : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Symptoms + Duration row */}
            {hasEntries && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bento-card">
                  <h3 className="bento-label mb-3">Any symptoms today?</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {SYMPTOMS.map(s => (
                      <button
                        key={s}
                        onClick={() => toggleSymptom(s)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          symptoms.includes(s)
                            ? 'bg-rose-100 border-rose-300 text-rose-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {symptoms.includes(s) && <span className="mr-1">●</span>}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bento-card">
                  <h3 className="bento-label mb-3">My period usually lasts</h3>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map(d => (
                      <button
                        key={d.value}
                        onClick={() => handleDurationChange(d.value)}
                        className={`px-3.5 py-2 rounded-lg border text-sm font-semibold transition-all ${
                          periodDuration === d.value
                            ? 'bg-rose-100 border-rose-300 text-rose-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            {hasEntries && (
              <button
                onClick={handleSaveToday}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  saved
                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-700'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-violet-600/20 shadow-md shadow-violet-600/15'
                }`}
              >
                {saved ? '✓ Saved for today' : 'Save today →'}
              </button>
            )}

            {/* Pattern insight */}
            {hasEntries && patternInsight && (
              <div className="bento-card">
                <h3 className="bento-label mb-1">Pattern Insight</h3>
                <div className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-1.5">{patternInsight.title}</p>
                  <p className="text-sm text-slate-800 leading-relaxed">{patternInsight.text}</p>
                </div>
              </div>
            )}

            {/* Breathing + Private Care side by side */}
            {hasEntries && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ConfidenceBreath />
                <PrivateCareTracker />
              </div>
            )}

            {/* Bottom link */}
            {hasEntries && (
              <button
                onClick={openChangeDate}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors underline underline-offset-4 font-medium"
              >
                Change my period start date
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <PeriodEntryModal
        open={modalOpen}
        mode={modalMode}
        initialEntry={editingEntry}
        onClose={closeModal}
        onSave={handleModalSave}
        onDelete={modalMode === 'edit' ? handleModalDelete : undefined}
      />
    </div>
  );
}
