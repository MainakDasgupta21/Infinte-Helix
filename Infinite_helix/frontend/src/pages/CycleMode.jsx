import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { usePeriodTracker } from '../hooks/usePeriodTracker';
import PeriodEntryModal from '../components/CycleMode/PeriodEntryModal';
import PrivateCareTracker from '../components/CycleMode/PrivateCareTracker';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import { toIso, startOfDay } from '../utils/periodMath';

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
  const d = cycleDay;
  if (d >= 1 && d <= 5)
    return { name: 'Period days', desc: 'Rest when you can. Shorter tasks and warmth help more than pushing through.', color: 'text-rose-400' };
  if (d >= 6 && d <= 13)
    return { name: 'Energy rising', desc: 'Your energy is picking up this week. Good time for focused work and meetings.', color: 'text-emerald-400' };
  if (d >= 14 && d <= 16)
    return { name: 'Peak energy', desc: 'Confidence and focus are at their highest. Tackle challenging projects and speak up.', color: 'text-amber-400' };
  return { name: 'Winding down', desc: 'Finish open tasks and tie up loose ends. Gentle routines feel better than new starts.', color: 'text-helix-accent' };
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
  const dayKey = `day-${cycleDay}`;
  const allLogs = Object.values(dailyLogs);
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
  if (cycleDay >= 1 && cycleDay <= 5) {
    return { title: 'PATTERN INSIGHT', text: `Day ${cycleDay} is typically in your period phase. Warm drinks and shorter tasks tend to help you feel more settled.` };
  }
  if (cycleDay >= 14 && cycleDay <= 16) {
    return { title: 'PATTERN INSIGHT', text: `Day ${cycleDay} is near your peak. Past logs show you handle challenging meetings best around this time.` };
  }
  return { title: 'PATTERN INSIGHT', text: `Track your mood, flow, and symptoms daily to see personalized patterns for day ${cycleDay} of your cycle.` };
}


export default function CycleMode() {
  const {
    entries, hasEntries, lastPeriodStartIso, nextPeriodInfo,
    cycleDay, addEntry, updateEntry, removeEntry,
  } = usePeriodTracker();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingEntry, setEditingEntry] = useState(null);

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

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-slide-up pb-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-helix-text">My cycle</h1>
          <p className="text-sm text-helix-muted mt-1">Everything based on your last period date</p>
        </div>
        <button
          onClick={openChangeDate}
          className="px-4 py-2 rounded-xl bg-helix-card border border-helix-border text-sm font-medium text-helix-text hover:bg-helix-bg/80 transition-colors"
        >
          Change start date
        </button>
      </div>

      {/* Privacy badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-helix-mint/10 border border-helix-mint/25">
        <HiOutlineShieldCheck className="w-3.5 h-3.5 text-helix-mint" />
        <span className="text-xs text-helix-mint font-medium">Only saved on your device</span>
      </div>

      {/* Hero card */}
      {hasEntries ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/15 via-helix-card to-helix-card border border-rose-400/20 p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-4xl font-display font-bold text-helix-text">Day {cycleDay}</p>
              <p className={`text-sm font-semibold mt-1 ${phase.color}`}>{phase.name}</p>
              <p className="text-sm text-helix-muted mt-2 max-w-sm leading-relaxed">{phase.desc}</p>
            </div>
            {nextPeriodInfo && (
              <div className="bg-rose-500/20 border border-rose-400/30 rounded-xl px-4 py-3 text-center shrink-0">
                <p className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Next Period</p>
                <p className="text-xl font-display font-bold text-helix-text mt-0.5">
                  {nextPeriodInfo.daysUntil} days away
                </p>
                <p className="text-xs text-helix-muted mt-0.5">{nextPeriodInfo.label}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center border border-dashed border-helix-border/50 rounded-2xl">
          <p className="text-4xl mb-3">🌸</p>
          <p className="text-sm text-helix-muted max-w-md mx-auto">
            Tap <span className="text-helix-text font-medium">Change start date</span> to log
            when your last period started. Everything else builds from there.
          </p>
        </div>
      )}

      {/* This Week strip */}
      {hasEntries && (
        <div className="glass-card p-4 rounded-2xl">
          <h3 className="text-xs font-bold text-helix-muted uppercase tracking-wider mb-3">This Week</h3>
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
                      ? 'bg-rose-500/20 border-rose-400/50 ring-1 ring-rose-400/30'
                      : 'bg-helix-bg/40 border-helix-border/30'
                  }`}
                >
                  <p className="text-[10px] text-helix-muted font-medium uppercase">{label}</p>
                  <p className={`text-base font-bold mt-0.5 ${isToday ? 'text-rose-300' : 'text-helix-text'}`}>{dateNum}</p>
                  <p className={`text-[10px] mt-0.5 font-medium ${isToday ? 'text-rose-300' : 'text-helix-muted'}`}>
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
          {/* How do you feel */}
          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-helix-muted uppercase tracking-wider mb-3">How do you feel today?</h3>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setMood(m.id); setSaved(false); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    mood === m.id
                      ? 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                      : 'bg-helix-bg/40 border-helix-border/40 text-helix-muted hover:text-helix-text hover:border-helix-border'
                  }`}
                >
                  <span className="text-base">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flow today */}
          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-helix-muted uppercase tracking-wider mb-1">Flow Today</h3>
            <p className="text-[10px] text-helix-muted/60 mb-3">
              {isPeriodDay ? 'Log your flow level' : 'Only during period days'}
            </p>
            <div className="flex flex-wrap gap-2">
              {FLOWS.map(f => (
                <button
                  key={f.id}
                  onClick={() => { if (isPeriodDay) { setFlow(f.id); setSaved(false); } }}
                  disabled={!isPeriodDay}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    flow === f.id && isPeriodDay
                      ? 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                      : isPeriodDay
                        ? 'bg-helix-bg/40 border-helix-border/40 text-helix-muted hover:text-helix-text'
                        : 'bg-helix-bg/20 border-helix-border/20 text-helix-muted/40 cursor-not-allowed'
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
          {/* Symptoms */}
          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-helix-muted uppercase tracking-wider mb-3">Any symptoms today?</h3>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    symptoms.includes(s)
                      ? 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                      : 'bg-helix-bg/40 border-helix-border/40 text-helix-muted hover:text-helix-text'
                  }`}
                >
                  {symptoms.includes(s) && <span className="mr-1">●</span>}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Period duration */}
          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-helix-muted uppercase tracking-wider mb-3">My period usually lasts</h3>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => handleDurationChange(d.value)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    periodDuration === d.value
                      ? 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                      : 'bg-helix-bg/40 border-helix-border/40 text-helix-muted hover:text-helix-text'
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
          className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all ${
            saved
              ? 'bg-helix-mint/20 border border-helix-mint/40 text-helix-mint'
              : 'bg-gradient-to-r from-rose-500/80 to-pink-500/80 text-white hover:shadow-lg hover:shadow-rose-500/20'
          }`}
        >
          {saved ? '✓ Saved for today' : 'Save today →'}
        </button>
      )}

      {/* Pattern insight */}
      {hasEntries && patternInsight && (
        <div className="glass-card p-5 rounded-2xl border border-helix-accent/15">
          <h3 className="text-xs font-bold text-helix-muted uppercase tracking-wider mb-1">Pattern Insight</h3>
          <div className="mt-3 bg-helix-accent/8 border border-helix-accent/20 rounded-xl p-4">
            <p className="text-[10px] font-bold text-helix-accent uppercase tracking-wider mb-1.5">{patternInsight.title}</p>
            <p className="text-sm text-helix-text leading-relaxed">{patternInsight.text}</p>
          </div>
        </div>
      )}

      {/* Private Care Tracker */}
      {hasEntries && <PrivateCareTracker />}

      {/* Bottom link */}
      {hasEntries && (
        <button
          onClick={openChangeDate}
          className="text-xs text-helix-muted hover:text-helix-text transition-colors underline underline-offset-4"
        >
          Change my period start date
        </button>
      )}

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
