import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineBell,
  HiOutlineLightningBolt,
  HiOutlineStar,
  HiOutlineOfficeBuilding,
  HiOutlineHome,
  HiOutlineSparkles,
  HiOutlineHeart,
} from 'react-icons/hi';
import { todoAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePageContext } from '../context/PageContext';
import { checkTodoReminders } from '../services/todoReminder';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function groupByDate(todos) {
  const groups = {};
  for (const t of todos) {
    const d = t.date || 'No date';
    if (!groups[d]) groups[d] = [];
    groups[d].push(t);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

const OFFICE_COLORS = [
  { border: 'border-l-violet-400', bg: 'bg-helix-accent/10', dot: 'bg-violet-400' },
  { border: 'border-l-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-400' },
  { border: 'border-l-indigo-400', bg: 'bg-indigo-500/10', dot: 'bg-indigo-400' },
  { border: 'border-l-sky-400', bg: 'bg-sky-500/10', dot: 'bg-sky-400' },
  { border: 'border-l-purple-400', bg: 'bg-purple-500/10', dot: 'bg-purple-400' },
];

const LIFE_COLORS = [
  { border: 'border-l-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
  { border: 'border-l-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-400' },
  { border: 'border-l-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  { border: 'border-l-teal-400', bg: 'bg-teal-500/10', dot: 'bg-teal-400' },
  { border: 'border-l-rose-400', bg: 'bg-rose-500/10', dot: 'bg-rose-400' },
];

// ─── Mode Toggle ────────────────────────────────────────────────────────────
function ModeToggle({ mode, onToggle }) {
  const isLife = mode === 'life';
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex items-center bg-helix-surface rounded-xl p-1 shadow-sm border border-helix-border/50">
        <div
          className={`absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-lg transition-all duration-400 ease-out ${
            isLife
              ? 'translate-x-[calc(100%+4px)] bg-gradient-to-r from-amber-500 to-orange-500 shadow-md'
              : 'translate-x-0 bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md'
          }`}
        />

        <button
          onClick={() => onToggle('work')}
          className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors duration-300 ${
            !isLife ? 'text-white' : 'text-helix-muted hover:text-helix-text'
          }`}
        >
          <HiOutlineOfficeBuilding className="w-4 h-4" />
          <span>Office Mode</span>
        </button>

        <button
          onClick={() => onToggle('life')}
          className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors duration-300 ${
            isLife ? 'text-white' : 'text-helix-muted hover:text-helix-text'
          }`}
        >
          <HiOutlineHome className="w-4 h-4" />
          <span>The Second Shift</span>
        </button>
      </div>
    </div>
  );
}

// ─── Transition Card ────────────────────────────────────────────────────────
function TransitionCard({ workTaskCount }) {
  const hour = new Date().getHours();
  const greeting = hour < 17 ? 'Taking a breather from work' : 'Work is done for today';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/20">
      <div className="relative p-5 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shrink-0">
          <HiOutlineHeart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-900">{greeting}</h3>
          <p className="text-sm text-amber-800/70 mt-1 leading-relaxed">
            You left <span className="font-bold text-amber-900">{workTaskCount} task{workTaskCount !== 1 ? 's' : ''}</span> at
            the office. Take a breath — here is your personal list for tonight.
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-helix-surface text-xs font-semibold text-amber-700 border border-amber-500/20">
              <HiOutlineSparkles className="w-3.5 h-3.5" />
              You deserve this transition
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Todos() {
  const { user } = useAuth();
  const { updatePageContext } = usePageContext();
  const userId = user?.uid || null;

  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [mode, setMode] = useState(() => localStorage.getItem('helix_task_mode') || 'work');

  const [text, setText] = useState('');
  const [date, setDate] = useState(todayStr());
  const [remindAt, setRemindAt] = useState('');
  const [taskCategory, setTaskCategory] = useState(mode);
  const [adding, setAdding] = useState(false);
  const [showCategoryDrop, setShowCategoryDrop] = useState(false);
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  const isLife = mode === 'life';

  const handleModeToggle = useCallback((newMode) => {
    setMode(newMode);
    setTaskCategory(newMode);
    localStorage.setItem('helix_task_mode', newMode);
  }, []);

  // Filtered views
  const filteredUpcoming = useMemo(
    () => upcoming.filter(t => (t.category || 'work') === mode && !t.completed),
    [upcoming, mode]
  );
  const workTaskCount = useMemo(
    () => upcoming.filter(t => (t.category || 'work') === 'work' && !t.completed).length,
    [upcoming]
  );
  const lifeTaskCount = useMemo(
    () => upcoming.filter(t => (t.category || 'work') === 'life' && !t.completed).length,
    [upcoming]
  );

  const grouped = groupByDate(filteredUpcoming);
  const today = todayStr();

  const filteredHistory = useMemo(
    () => history.filter(t => t.completed && (t.category || 'work') === mode),
    [history, mode]
  );

  const fetchUpcoming = useCallback(async () => {
    try {
      const res = await todoAPI.getUpcoming(userId);
      const list = res.data?.todos || [];
      setUpcoming(list);
      checkTodoReminders(list);
    } catch { /* offline */ }
  }, [userId]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await todoAPI.getHistory(userId, 30);
      setHistory(res.data?.todos || []);
    } catch { /* offline */ }
  }, [userId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchUpcoming();
      setLoading(false);
    }
    init();
    const iv = setInterval(fetchUpcoming, 30000);
    return () => clearInterval(iv);
  }, [fetchUpcoming]);

  useEffect(() => {
    const pending = upcoming.filter(t => !t.completed);
    const done = upcoming.filter(t => t.completed);
    const todayTasks = upcoming.filter(t => t.date === todayStr());
    const overdue = upcoming.filter(t => t.date && t.date < todayStr() && !t.completed);
    updatePageContext('todos', {
      total_tasks: upcoming.length,
      pending_count: pending.length,
      done_count: done.length,
      today_count: todayTasks.length,
      overdue_count: overdue.length,
      work_tasks: workTaskCount,
      life_tasks: lifeTaskCount,
      active_mode: mode,
      upcoming_tasks: upcoming.slice(0, 5).map(t => ({
        text: t.text,
        date: t.date,
        completed: t.completed,
        remind_at: t.remind_at,
        category: t.category || 'work',
      })),
    });
  }, [upcoming, updatePageContext, workTaskCount, lifeTaskCount, mode]);

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory, fetchHistory]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowCategoryDrop(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      const res = await todoAPI.create(trimmed, remindAt || null, userId, date || null, taskCategory);
      const newTodo = res.data?.todo;
      if (newTodo) {
        setUpcoming(prev => {
          const updated = [...prev, newTodo];
          return updated.sort((a, b) =>
            (a.date + (a.remind_at || '99:99')).localeCompare(b.date + (b.remind_at || '99:99'))
          );
        });
        const catLabel = taskCategory === 'life' ? 'Second Shift' : 'Office';
        toast.success(`${catLabel} task added`);
      }
    } catch {
      toast.error('Failed to add task');
    }
    setText('');
    setRemindAt('');
    setDate(todayStr());
    setAdding(false);
    inputRef.current?.focus();
  };

  const handleToggle = async (todoId) => {
    setUpcoming(prev => prev.map(t => t.id === todoId ? { ...t, completed: true } : t));
    try {
      await todoAPI.toggle(todoId, userId);
      toast.success('Nice work!');
      if (showHistory) fetchHistory();
    } catch { /* offline */ }
  };

  const handleUntoggle = async (todoId) => {
    try {
      await todoAPI.toggle(todoId, userId);
      fetchHistory();
      fetchUpcoming();
    } catch { /* offline */ }
  };

  const handleDelete = async (todoId) => {
    setUpcoming(prev => prev.filter(t => t.id !== todoId));
    setHistory(prev => prev.filter(t => t.id !== todoId));
    try {
      await todoAPI.remove(todoId, userId);
    } catch { /* offline */ }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); }
  };

  // Dynamic accent classes
  const accent = isLife ? {
    gradient: 'from-amber-500 to-orange-500',
    gradientSoft: 'from-amber-100 via-orange-50 to-rose-50',
    ring: 'focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20',
    badge: 'bg-amber-500/15 border-amber-500/30 text-amber-700',
    badgeDone: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-700',
    btn: 'from-amber-500 to-orange-500',
    btnHover: 'hover:shadow-lg',
    check: 'hover:border-emerald-500 hover:bg-emerald-500/10',
    checkIcon: 'group-hover:text-emerald-500',
    tag: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
    tagIcon: 'text-amber-600',
    dateBadge: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
    separator: 'from-amber-300',
    heroOrb1: 'from-amber-200/40',
    heroOrb2: 'from-orange-200/30',
    progressTrack: 'from-amber-500 via-orange-500 to-emerald-500',
  } : {
    gradient: 'from-violet-600 to-indigo-600',
    gradientSoft: 'from-violet-100 via-indigo-50 to-blue-50',
    ring: 'focus:border-helix-accent/50 focus:ring-2 focus:ring-helix-accent/10',
    badge: 'bg-helix-accent/15 border-helix-accent/30 text-helix-accent',
    badgeDone: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-700',
    btn: 'from-violet-600 to-indigo-600',
    btnHover: 'hover:shadow-lg',
    check: 'hover:border-helix-accent hover:bg-helix-accent/10',
    checkIcon: 'group-hover:text-helix-accent',
    tag: 'bg-helix-accent/15 text-helix-text border-helix-accent/30',
    tagIcon: 'text-helix-accent',
    dateBadge: 'bg-helix-accent/15 text-helix-accent border-helix-accent/30',
    separator: 'from-violet-300',
    heroOrb1: 'from-violet-200/40',
    heroOrb2: 'from-indigo-200/30',
    progressTrack: 'from-violet-600 via-indigo-500 to-emerald-500',
  };

  const taskColors = isLife ? LIFE_COLORS : OFFICE_COLORS;
  const currentPending = filteredUpcoming.length;
  const currentDone = filteredHistory.length;
  const progressPct = (currentPending + currentDone) > 0
    ? Math.round((currentDone / (currentPending + currentDone)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-14 rounded-[2rem] bg-helix-border/30" />
        <div className="h-36 rounded-[2rem] bg-helix-border/30" />
        <div className="h-40 rounded-[2rem] bg-helix-border/30" />
        <div className="h-64 rounded-[2rem] bg-helix-border/30" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">

      {/* ── Mode Toggle ── */}
      <ModeToggle mode={mode} onToggle={handleModeToggle} />

      {/* ── Transition Card (Second Shift only) ── */}
      {isLife && <TransitionCard workTaskCount={workTaskCount} />}

      {/* ── Hero Header ── */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${accent.gradientSoft} border border-helix-border/50`}>
        <div className="relative p-5 md:p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${accent.gradient} shadow-md`}>
                {isLife
                  ? <HiOutlineHome className="w-5 h-5 text-white" />
                  : <HiOutlineOfficeBuilding className="w-5 h-5 text-white" />
                }
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-helix-text">
                  {isLife ? 'The Second Shift' : 'Office Tasks'}
                </h1>
                <p className="text-sm text-helix-muted">
                  {isLife
                    ? 'Your personal & home mental load'
                    : 'Focused work — tackle what matters'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${accent.badge}`}>
                <HiOutlineLightningBolt className="w-4 h-4" />
                <span className="text-xs font-semibold">Pending</span>
                <span className="text-sm font-bold tabular-nums">{currentPending}</span>
              </div>
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${accent.badgeDone}`}>
                <HiOutlineStar className="w-4 h-4" />
                <span className="text-xs font-semibold">Done</span>
                <span className="text-sm font-bold tabular-nums">{currentDone}</span>
              </div>
            </div>
          </div>

          {(currentPending + currentDone) > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-helix-muted">
                  {isLife ? 'Evening progress' : "Today's progress"}
                </span>
                <span className="text-xs font-bold text-emerald-600">{progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-helix-surface rounded-full overflow-hidden border border-helix-border/50">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${accent.progressTrack} transition-all duration-700 ease-out`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Smart Add Task Bar ── */}
      <div className="bento-card">
        <h2 className="bento-label mb-3 flex items-center gap-2">
          <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${accent.gradient} flex items-center justify-center`}>
            <HiOutlinePlus className="w-3 h-3 text-white" />
          </div>
          What's on your mind?
        </h2>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLife ? 'Groceries, call mom, laundry...' : 'Finish report, review PRs, send update...'}
            className={`w-full bg-helix-surface/50 border border-helix-border/50 rounded-xl px-4 py-3 text-sm text-helix-text
                      placeholder:text-helix-muted focus:outline-none focus:bg-helix-surface ${accent.ring} transition-all`}
          />

          <div className="flex items-center gap-2.5 flex-wrap">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-helix-surface/50 border border-helix-border/50
                            hover:border-blue-400 transition-all cursor-pointer group">
              <HiOutlineCalendar className="w-4 h-4 text-helix-muted group-hover:text-blue-500" />
              <input
                type="date"
                value={date}
                min={today}
                onChange={e => setDate(e.target.value)}
                className="bg-transparent text-xs text-helix-text font-medium focus:outline-none cursor-pointer"
              />
            </label>

            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-helix-surface/50 border border-helix-border/50
                            hover:border-amber-400 transition-all cursor-pointer group">
              <HiOutlineBell className="w-4 h-4 text-helix-muted group-hover:text-amber-500" />
              <input
                type="time"
                value={remindAt}
                onChange={e => setRemindAt(e.target.value)}
                className="bg-transparent text-xs text-helix-text font-medium focus:outline-none cursor-pointer"
              />
              <span className="text-[10px] text-helix-muted font-semibold">Remind</span>
            </label>

            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setShowCategoryDrop(p => !p)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${accent.tag}`}
              >
                {taskCategory === 'life'
                  ? <><HiOutlineHome className="w-3.5 h-3.5" /> Second Shift</>
                  : <><HiOutlineOfficeBuilding className="w-3.5 h-3.5" /> Office</>
                }
                <HiOutlineChevronDown className="w-3 h-3" />
              </button>

              {showCategoryDrop && (
                <div className="absolute top-full mt-1.5 left-0 z-20 bg-helix-surface rounded-xl shadow-lg border border-helix-border/50 overflow-hidden min-w-[160px]">
                  <button
                    onClick={() => { setTaskCategory('work'); setShowCategoryDrop(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors ${
                      taskCategory === 'work' ? 'bg-helix-accent/10 text-helix-accent' : 'text-helix-text hover:bg-helix-card/60'
                    }`}
                  >
                    <HiOutlineOfficeBuilding className="w-4 h-4" />
                    Office Task
                    {taskCategory === 'work' && <HiOutlineCheck className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                  <button
                    onClick={() => { setTaskCategory('life'); setShowCategoryDrop(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors ${
                      taskCategory === 'life' ? 'bg-amber-500/10 text-amber-700' : 'text-helix-text hover:bg-helix-card/60'
                    }`}
                  >
                    <HiOutlineHome className="w-4 h-4" />
                    Second Shift
                    {taskCategory === 'life' && <HiOutlineCheck className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={!text.trim() || adding}
              className={`ml-auto px-5 py-2.5 rounded-xl text-sm font-bold
                        bg-gradient-to-r ${accent.btn} text-white
                        ${accent.btnHover}
                        active:scale-[0.98] transition-all duration-200
                        disabled:opacity-30 disabled:cursor-not-allowed
                        flex items-center gap-2`}
            >
              <HiOutlinePlus className="w-4 h-4" />
              {adding ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Task List ── */}
      <div className="bento-card">
        <h2 className="bento-label mb-4 flex items-center gap-2">
          <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${accent.gradient} flex items-center justify-center`}>
            <HiOutlineClock className="w-3 h-3 text-white" />
          </div>
          {isLife ? 'Tonight\'s List' : 'Upcoming Tasks'}
        </h2>

        {grouped.length === 0 ? (
          <div className="text-center py-10">
            <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${accent.gradientSoft} border border-helix-border/50 flex items-center justify-center`}>
              <span className="text-3xl">{isLife ? '\u{1F3E1}' : '\u{1F3AF}'}</span>
            </div>
            <p className="text-sm font-bold text-helix-text">
              {isLife ? 'No personal tasks yet' : 'No office tasks'}
            </p>
            <p className="text-xs text-helix-muted mt-1">
              {isLife ? 'Add something from your home mental load above' : 'Add a task above to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([dateKey, todos]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                    dateKey === today ? accent.dateBadge : 'bg-helix-border/30 text-helix-text border-helix-border/50'
                  }`}>
                    {formatDate(dateKey)}
                  </span>
                  <div className={`flex-1 h-px bg-helix-border/30`} />
                  <span className="text-[11px] font-semibold text-helix-muted tabular-nums">
                    {todos.length} task{todos.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {todos.map((todo, idx) => {
                    const color = taskColors[idx % taskColors.length];
                    return (
                      <div
                        key={todo.id}
                        className={`flex items-start gap-3 rounded-xl px-4 py-3
                                  border-l-[3px] ${color.border}
                                  bg-helix-surface border border-helix-border/50
                                  group hover:bg-helix-card/60 hover:border-helix-border transition-all duration-200`}
                      >
                        <button
                          onClick={() => handleToggle(todo.id)}
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 border-helix-border
                                    ${accent.check}
                                    flex items-center justify-center shrink-0 transition-all duration-200`}
                          title="Mark complete"
                        >
                          <HiOutlineCheck className={`w-3 h-3 text-transparent ${accent.checkIcon} transition-colors`} />
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-helix-text font-semibold leading-snug">{todo.text}</p>
                          <div className="flex items-center gap-2.5 mt-1.5">
                            {todo.remind_at && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                                <HiOutlineBell className="w-3 h-3 text-amber-600" />
                                <span className="text-[11px] font-semibold text-amber-700">{todo.remind_at}</span>
                              </span>
                            )}
                            {todo.date !== today && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                                <HiOutlineCalendar className="w-3 h-3 text-blue-500" />
                                <span className="text-[11px] font-semibold text-blue-600">{formatDate(todo.date)}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete(todo.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-helix-muted
                                    hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                          title="Delete task"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Completed History ── */}
      <div className="bento-card !p-0 overflow-hidden">
        <button
          onClick={() => setShowHistory(prev => !prev)}
          className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-helix-card/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <HiOutlineCheck className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-helix-text">
              Completed {isLife ? 'Personal' : 'Office'} Tasks
            </span>
            {currentDone > 0 && (
              <span className="text-[11px] font-bold bg-emerald-500/15 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {currentDone}
              </span>
            )}
          </div>
          {showHistory
            ? <HiOutlineChevronUp className="w-4 h-4 text-helix-muted" />
            : <HiOutlineChevronDown className="w-4 h-4 text-helix-muted" />
          }
        </button>

        {showHistory && (
          <div className="px-5 pb-4 border-t border-helix-border/30">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <span className="text-xl">{'\u{2705}'}</span>
                </div>
                <p className="text-xs font-semibold text-helix-muted">No completed tasks yet</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 mt-3">
                {filteredHistory.map(todo => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 rounded-lg px-3.5 py-2.5
                              bg-emerald-500/10 border border-emerald-500/20 group
                              hover:bg-emerald-500/15 transition-all"
                  >
                    <button
                      onClick={() => handleUntoggle(todo.id)}
                      className="w-5 h-5 rounded-full bg-emerald-200 border-2 border-emerald-400
                                flex items-center justify-center shrink-0 hover:bg-emerald-300 transition-colors"
                      title="Mark incomplete"
                    >
                      <HiOutlineCheck className="w-3 h-3 text-emerald-700" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-helix-muted line-through truncate">{todo.text}</p>
                      <span className="text-[10px] text-helix-muted font-medium">{formatDate(todo.date)}</span>
                    </div>

                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-helix-muted
                                hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
