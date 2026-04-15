import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineShieldCheck, HiOutlineClock, HiOutlineCalendar } from 'react-icons/hi';
import { privateCareAPI } from '../../services/api';
import {
  loadPrivateCareConfig,
  savePrivateCareConfig,
  restartPrivateCareScheduler,
} from '../../services/privateCareReminder';

const CARE_TYPES = [
  { id: 'pad_change', label: 'Pad Change', emoji: '\u{1F33C}' },
  { id: 'freshen_up', label: 'Freshen Up', emoji: '\u2728' },
  { id: 'medicine', label: 'Medicine', emoji: '\u{1F48A}' },
  { id: 'other', label: 'Other', emoji: '\u{1F4DD}' },
];

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PrivateCareTracker() {
  const [cfg, setCfg] = useState(loadPrivateCareConfig);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [selectedType, setSelectedType] = useState('pad_change');
  const [showHistory, setShowHistory] = useState(false);
  const [logAnim, setLogAnim] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await privateCareAPI.getHistory(90);
      setLogs(res.data?.logs || []);
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLog = async () => {
    setLogAnim(true);
    try {
      await privateCareAPI.log(selectedType, note);
      toast.success('Care action logged \u{1F33C}');
      setNote('');
      fetchHistory();
    } catch {
      toast.success('Logged (offline)');
    }
    setTimeout(() => setLogAnim(false), 500);
  };

  const toggleActiveToday = () => {
    const next = { ...cfg, activeToday: !cfg.activeToday, enabled: true };
    setCfg(next);
    savePrivateCareConfig(next);
    restartPrivateCareScheduler();
    if (next.activeToday) {
      toast.success('Reminders active for today');
    }
  };

  const updateInterval = (delta) => {
    const next = { ...cfg, intervalHours: Math.max(1, Math.min(8, cfg.intervalHours + delta)) };
    setCfg(next);
    savePrivateCareConfig(next);
    restartPrivateCareScheduler();
  };

  const todayLogs = logs.filter(l => l.date === new Date().toISOString().slice(0, 10));
  const lastLog = logs[0];

  const grouped = {};
  logs.forEach(l => {
    const key = l.date || 'unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(l);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="bento-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/15">
            <HiOutlineShieldCheck className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-helix-text">Private Care</h3>
            <p className="text-[10px] text-helix-muted">Discreet tracking & reminders</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <HiOutlineShieldCheck className="w-3 h-3 text-emerald-600" />
          <span className="text-[10px] text-emerald-600 font-medium">Private</span>
        </div>
      </div>

      {/* Quick toggle: "I need reminders today" */}
      <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5">
        <div>
          <p className="text-sm font-medium text-helix-text">
            {cfg.activeToday ? 'Reminders active today' : 'Need reminders today?'}
          </p>
          <p className="text-[10px] text-helix-muted mt-0.5">
            {cfg.activeToday
              ? `Every ${cfg.intervalHours}h \u2014 discreet notifications`
              : 'Tap to start periodic reminders'}
          </p>
        </div>
        <button
          onClick={toggleActiveToday}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            cfg.activeToday
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-600'
              : 'bg-helix-accent/10 border border-helix-accent/20 text-helix-accent hover:bg-helix-accent/15'
          }`}
        >
          {cfg.activeToday ? 'Active \u2713' : 'Turn On'}
        </button>
      </div>

      {/* Interval selector */}
      {cfg.activeToday && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-helix-muted">Remind every</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateInterval(-1)}
              className="w-7 h-7 rounded-lg bg-helix-surface/50 text-helix-muted hover:text-helix-text transition-colors flex items-center justify-center text-sm"
            >-</button>
            <span className="text-sm font-medium text-helix-text w-12 text-center">{cfg.intervalHours}h</span>
            <button
              onClick={() => updateInterval(1)}
              className="w-7 h-7 rounded-lg bg-helix-surface/50 text-helix-muted hover:text-helix-text transition-colors flex items-center justify-center text-sm"
            >+</button>
          </div>
        </div>
      )}

      {/* Log action */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-helix-muted uppercase tracking-wider">Log an Action</p>
        <div className="flex flex-wrap gap-2">
          {CARE_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                selectedType === t.id
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-600'
                  : 'bg-helix-border/30 border-helix-border/50 text-helix-muted hover:text-helix-text'
              }`}
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Optional note (e.g. office 3rd floor)"
          className="w-full bg-helix-border/30 border border-helix-border/50 rounded-xl px-3.5 py-2.5 text-sm text-helix-text placeholder:text-helix-muted focus:outline-none focus:border-helix-accent/50 focus:ring-1 focus:ring-helix-accent/10"
        />
        <button
          onClick={handleLog}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
            bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-lg
            ${logAnim ? 'scale-95 opacity-80' : ''}`}
        >
          Log {CARE_TYPES.find(t => t.id === selectedType)?.emoji} {CARE_TYPES.find(t => t.id === selectedType)?.label}
        </button>
      </div>

      {/* Today summary */}
      <div className="flex items-center justify-between bg-helix-border/30 rounded-xl p-3 border border-helix-border/50">
        <div className="flex items-center gap-2">
          <HiOutlineClock className="w-4 h-4 text-helix-muted" />
          <div>
            <p className="text-xs font-medium text-helix-text">
              {todayLogs.length === 0 ? 'No logs today' : `${todayLogs.length} log${todayLogs.length > 1 ? 's' : ''} today`}
            </p>
            {lastLog && (
              <p className="text-[10px] text-helix-muted">Last: {timeAgo(lastLog.timestamp)}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-helix-accent hover:bg-helix-accent/10 transition-colors"
        >
          <HiOutlineCalendar className="w-3.5 h-3.5" />
          {showHistory ? 'Hide' : 'History'}
        </button>
      </div>

      {/* History view */}
      {showHistory && (
        <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="text-center py-6 text-sm text-helix-muted animate-pulse">Loading...</div>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-helix-muted">No history yet</p>
              <p className="text-[10px] text-helix-muted mt-1">Your logs will appear here</p>
            </div>
          ) : (
            sortedDates.map(date => (
              <div key={date}>
                <p className="text-[10px] font-bold text-helix-muted uppercase tracking-wider mb-1.5">
                  {formatDate(date)}
                </p>
                <div className="space-y-1.5">
                  {grouped[date].map((log, i) => {
                    const typeObj = CARE_TYPES.find(t => t.id === log.type) || CARE_TYPES[3];
                    return (
                      <div
                        key={`${date}-${i}`}
                        className="flex items-center gap-3 bg-helix-surface/50 rounded-lg px-3 py-2 border border-helix-border/30"
                      >
                        <span className="text-base">{typeObj.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-helix-text">{typeObj.label}</p>
                          {log.note && (
                            <p className="text-[10px] text-helix-muted truncate">{log.note}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-helix-muted shrink-0">{log.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
