import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWellness } from '../../context/WellnessContext';
import { usePageContext } from '../../context/PageContext';
import {
  HiOutlineX,
  HiOutlinePaperAirplane,
  HiOutlineMicrophone,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineStop,
  HiOutlineChevronDown,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlineChevronLeft,
} from 'react-icons/hi';

const WELCOME_MSG = {
  role: 'assistant',
  message:
    "Hey there! I'm **Helix** — think of me as a supportive friend who's always here when you need someone to talk to.\n\n" +
    "Whether you want guidance, need to vent, or just want a little pick-me-up — I'm right here. " +
    "This is a safe space, and everything we talk about stays between us.\n\n" +
    "How are you feeling today?",
  timestamp: Date.now() / 1000,
  quick_replies: ['I need support', "I'm doing well!", 'What can you do?', 'Help me feel better'],
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMessage(text) {
  if (!text) return '';
  let html = escapeHtml(text);
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeDate(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - msgDay) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function SessionList({ sessions, activeId, onSelect, onDelete, onNewChat, onClose, loading }) {
  return (
    <div className="cb-history-panel flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h4 className="text-sm font-semibold text-white/90">Chat History</h4>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close history"
        >
          <HiOutlineChevronLeft className="w-4 h-4 text-white/50" />
        </button>
      </div>

      <div className="px-3 py-2">
        <button
          onClick={onNewChat}
          className="cb-new-chat-btn w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          <HiOutlinePlus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 cb-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-white/20 border-t-[#e8a04a] rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-8">No conversations yet</p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`cb-session-item w-full text-left px-3 py-2.5 rounded-xl mb-1 group transition-all ${
                s.id === activeId ? 'cb-session-active' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-white/85 truncate leading-tight">
                    {s.title || 'New conversation'}
                  </p>
                  <p className="text-[11px] text-white/40 mt-0.5 truncate">
                    {s.preview || 'No messages yet'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-white/30 whitespace-nowrap">
                    {formatRelativeDate(s.updated_at)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-red-300 text-white/30 transition-all"
                    aria-label="Delete conversation"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function MessageBubble({ msg, isUser, isLatest }) {
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 cb-msg-enter`}
      style={{ animationDelay: isLatest ? '0ms' : '0ms' }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full cb-avatar flex items-center justify-center mr-2.5 mt-1 shrink-0">
          <HiOutlineSparkles className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="max-w-[78%] group">
        <div
          className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
            ${isUser
              ? 'cb-bubble-user rounded-2xl rounded-br-sm'
              : 'cb-bubble-assistant rounded-2xl rounded-bl-sm'
            }`}
          dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }}
        />
        <div
          className={`mt-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200
            ${isUser ? 'text-right pr-1 text-white/30' : 'pl-1 cb-timestamp'}`}
        >
          {formatTime(msg.timestamp)}
        </div>
      </div>
    </div>
  );
}

function QuickReplies({ replies, onSelect, disabled }) {
  if (!replies || replies.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-2 px-1 cb-quick-replies-enter">
      {replies.map((reply, i) => (
        <button
          key={i}
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="cb-quick-btn"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {reply}
        </button>
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4 cb-msg-enter">
      <div className="w-8 h-8 rounded-full cb-avatar flex items-center justify-center mr-2.5 mt-1 shrink-0">
        <HiOutlineSparkles className="w-4 h-4 text-white animate-spin-slow" />
      </div>
      <div className="cb-bubble-assistant rounded-2xl rounded-bl-sm px-5 py-3.5">
        <div className="flex gap-1.5 items-center">
          <span className="w-2 h-2 rounded-full cb-typing-dot" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full cb-typing-dot" style={{ animationDelay: '160ms' }} />
          <span className="w-2 h-2 rounded-full cb-typing-dot" style={{ animationDelay: '320ms' }} />
        </div>
      </div>
    </div>
  );
}

function getPageName(pathname) {
  if (pathname === '/' || pathname === '/dashboard') return 'dashboard';
  return pathname.replace(/^\//, '');
}

const PAGE_LABELS = {
  dashboard: 'Dashboard',
  journal: 'Emotion Journal',
  todos: 'My Tasks',
  reports: 'Wellness Reports',
  'cycle-mode': 'Cycle Mode',
  calendar: 'Calendar',
  settings: 'Settings',
};

export default function ChatBot() {
  const location = useLocation();
  const { user } = useAuth();
  const wellness = useWellness();
  const { getPageData } = usePageContext();

  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState(WELCOME_MSG.quick_replies);
  const [isListening, setIsListening] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [aiPowered, setAiPowered] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const sessionLoadedRef = useRef(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const buildPageContext = useCallback(() => {
    const pageName = getPageName(location.pathname);
    const allPageData = getPageData();

    const context = {
      current_page: pageName,
      page_title: PAGE_LABELS[pageName] || pageName,
      timestamp: new Date().toISOString(),
      user_name: user?.displayName?.split(' ')[0] || '',
      dashboard_loaded: !wellness?.dashboardLoading,
    };

    if (wellness) {
      const m = wellness.todayMetrics;
      context.wellness_metrics = {
        score: m.score,
        mood: m.mood,
        streak_days: m.streakDays,
        hydration_ml: m.hydration?.ml_today || 0,
        hydration_goal: m.hydration?.goal_ml || 2000,
        breaks_taken: m.breaks?.taken || 0,
        breaks_suggested: m.breaks?.suggested || 6,
        screen_time_hours: m.screenTime?.total || 0,
        screen_time_breakdown: m.screenTime?.breakdown || {},
        self_care_stretches: m.selfCare?.stretch || 0,
        self_care_eye_rest: m.selfCare?.eye_rest || 0,
        focus_sessions_count: m.focusSessions?.length || 0,
        focus_sessions: (m.focusSessions || []).slice(0, 5).map(s => ({
          label: s.label, start: s.start, score: s.score,
        })),
        tracker_status: wellness.trackerStatus,
        active_nudges: (wellness.nudges || []).filter(n => !n.dismissed).map(n => ({
          type: n.type, message: n.message, priority: n.priority,
        })).slice(0, 5),
      };
    }

    if (allPageData[pageName]) {
      const { _updatedAt, ...data } = allPageData[pageName];
      context.page_data = data;
    }

    const otherPages = {};
    for (const [key, value] of Object.entries(allPageData)) {
      if (key !== pageName && value) {
        const { _updatedAt, ...data } = value;
        otherPages[key] = data;
      }
    }

    // Pull cycle/pregnancy data from localStorage so the chatbot always knows
    try {
      const periodEntries = JSON.parse(localStorage.getItem('helix_period_entries') || '[]');
      if (periodEntries.length > 0 && !otherPages['cycle-mode'] && pageName !== 'cycle-mode') {
        const sorted = [...periodEntries].sort((a, b) => b.startDate.localeCompare(a.startDate));
        const lastStart = sorted[0]?.startDate;
        if (lastStart) {
          const start = new Date(lastStart + 'T00:00:00');
          const today = new Date(); today.setHours(0,0,0,0);
          const diff = Math.round((today - start) / 86400000);
          const cycleDay = diff >= 0 ? (diff % 28) + 1 : 1;
          const phaseName = cycleDay <= 5 ? 'Menstrual (Rest)' : cycleDay <= 13 ? 'Follicular (Plan)' : cycleDay <= 16 ? 'Ovulatory (Execute)' : 'Luteal (Refine)';
          otherPages['cycle-mode'] = { cycle_day: cycleDay, phase_name: phaseName, has_entries: true };
        }
      }
      const lifeStage = localStorage.getItem('helix_life_stage_mode');
      if (lifeStage === 'pregnancy') {
        const pregData = JSON.parse(localStorage.getItem('helix_pregnancy_data') || '{}');
        const existing = otherPages['cycle-mode'] || context.page_data || {};
        const merged = { ...existing, mode: 'pregnancy', due_date: pregData.dueDateIso || null };
        if (pregData.dueDateIso) {
          const due = new Date(pregData.dueDateIso + 'T00:00:00');
          const now = new Date(); now.setHours(0,0,0,0);
          const daysRemaining = Math.round((due - now) / 86400000);
          const weeksPregnant = Math.max(0, Math.min(40, Math.floor((280 - daysRemaining) / 7)));
          merged.weeks_pregnant = weeksPregnant;
          merged.trimester = weeksPregnant < 13 ? 1 : weeksPregnant < 27 ? 2 : 3;
          merged.days_until_due = Math.max(0, daysRemaining);
        }
        if (pageName === 'cycle-mode') context.page_data = { ...context.page_data, ...merged };
        else otherPages['cycle-mode'] = merged;
      }
    } catch { /* localStorage read failures are non-critical */ }

    // Pull daily cycle logs from localStorage
    try {
      const logs = JSON.parse(localStorage.getItem('helix_cycle_daily_logs') || '{}');
      const todayKey = new Date().toISOString().slice(0, 10);
      const todayLog = logs[todayKey];
      if (todayLog && todayLog.mood) {
        const cycleCtx = otherPages['cycle-mode'] || context.page_data || {};
        cycleCtx.today_mood = todayLog.mood;
        cycleCtx.today_flow = todayLog.flow;
        cycleCtx.today_symptoms = todayLog.symptoms;
        if (pageName !== 'cycle-mode') otherPages['cycle-mode'] = cycleCtx;
      }
    } catch { /* non-critical */ }

    if (Object.keys(otherPages).length > 0) {
      context.other_pages_data = otherPages;
    }

    return context;
  }, [location.pathname, user, wellness, getPageData]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 100);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      const timeout = setTimeout(() => setIsVisible(false), 280);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await chatAPI.getSessions();
      const list = res.data || [];
      setSessions(list);
      return list;
    } catch {
      return [];
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const loadSessionMessages = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await chatAPI.getSessionMessages(sessionId);
      const msgs = res.data || [];
      if (msgs.length > 0) {
        setMessages(msgs);
        const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant');
        setQuickReplies(lastAssistant?.quick_replies || []);
      } else {
        setMessages([WELCOME_MSG]);
        setQuickReplies(WELCOME_MSG.quick_replies);
      }
    } catch {
      setMessages([WELCOME_MSG]);
      setQuickReplies(WELCOME_MSG.quick_replies);
    }
  }, []);

  const switchSession = useCallback(async (sessionId) => {
    setActiveSessionId(sessionId);
    setShowHistory(false);
    await loadSessionMessages(sessionId);
  }, [loadSessionMessages]);

  const startNewChat = useCallback(async () => {
    try {
      const res = await chatAPI.createSession();
      const newSession = res.data;
      setActiveSessionId(newSession.id);
      setSessions((prev) => [newSession, ...prev]);
      setMessages([WELCOME_MSG]);
      setQuickReplies(WELCOME_MSG.quick_replies);
      setShowHistory(false);
    } catch { /* ignore */ }
  }, []);

  const deleteSessionHandler = useCallback(async (sessionId) => {
    try {
      await chatAPI.deleteSession(sessionId);
      setSessions((prev) => {
        const remaining = prev.filter((s) => s.id !== sessionId);
        if (sessionId === activeSessionId) {
          if (remaining.length > 0) {
            setActiveSessionId(remaining[0].id);
            loadSessionMessages(remaining[0].id);
          } else {
            startNewChat();
          }
        }
        return remaining;
      });
    } catch { /* ignore */ }
  }, [activeSessionId, loadSessionMessages, startNewChat]);

  useEffect(() => {
    if (isOpen && !sessionLoadedRef.current) {
      sessionLoadedRef.current = true;
      (async () => {
        try {
          const list = await loadSessions();
          if (list.length > 0) {
            setActiveSessionId(list[0].id);
            await loadSessionMessages(list[0].id);
          } else {
            const res = await chatAPI.createSession();
            const newSession = res.data;
            setActiveSessionId(newSession.id);
            setSessions([newSession]);
          }
        } catch {
          sessionLoadedRef.current = false;
        }
      })();
    }
  }, [isOpen, loadSessions, loadSessionMessages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg = { role: 'user', message: msg, timestamp: Date.now() / 1000 };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setQuickReplies([]);
    setLoading(true);

    try {
      const pageContext = buildPageContext();
      const res = await chatAPI.sendMessage(msg, pageContext, activeSessionId);
      const botMsg = {
        role: 'assistant',
        message: res.data.message,
        timestamp: res.data.timestamp,
        quick_replies: res.data.quick_replies,
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(res.data.quick_replies || []);
      if (res.data.ai_powered !== undefined) setAiPowered(res.data.ai_powered);

      if (res.data.session_id && res.data.session_id !== activeSessionId) {
        setActiveSessionId(res.data.session_id);
      }

      setSessions((prev) => {
        const sid = res.data.session_id || activeSessionId;
        const idx = prev.findIndex((s) => s.id === sid);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          updated_at: res.data.timestamp,
          preview: res.data.message.slice(0, 80),
          title: updated[idx].title === 'New conversation' ? msg.slice(0, 50) : updated[idx].title,
          message_count: (updated[idx].message_count || 0) + 2,
        };
        updated.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
        return updated;
      });

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          message:
            "I'm having a little trouble connecting right now, but I'm still here. Could you try again in a moment?",
          timestamp: Date.now() / 1000,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const clearChat = async () => {
    try {
      if (activeSessionId) {
        await chatAPI.deleteSession(activeSessionId);
        setSessions((prev) => prev.filter((s) => s.id !== activeSessionId));
      }
      const res = await chatAPI.createSession();
      const newSession = res.data;
      setActiveSessionId(newSession.id);
      setSessions((prev) => [newSession, ...prev]);
    } catch {
      /* ignore */
    }
    setMessages([WELCOME_MSG]);
    setQuickReplies(WELCOME_MSG.quick_replies);
  };

  const charCount = input.length;

  return (
    <>
      {/* Backdrop scrim — dims main content when chat is open */}
      {isVisible && (
        <div
          className={`fixed inset-0 z-[59] bg-black/20 backdrop-blur-[2px] sm:bg-black/10 sm:backdrop-blur-0
                      transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Floating Action Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[60] transition-all duration-300 group
                   ${isOpen ? 'cb-fab-open' : 'cb-fab-closed'}`}
        aria-label={isOpen ? 'Close chat' : 'Talk to Helix'}
      >
        {isOpen ? (
          <div className="w-12 h-12 rounded-full bg-[#1e1108] border border-[#382c1e]/60 flex items-center justify-center shadow-lg">
            <HiOutlineX className="w-5 h-5 text-[#e8a04a]" />
          </div>
        ) : (
          <div className="relative">
            {/* Pulse ring behind FAB */}
            <div className="absolute inset-0 rounded-full cb-fab-ring" />
            <div className="relative w-14 h-14 rounded-full cb-fab-gradient flex items-center justify-center shadow-xl">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
                <circle cx="8" cy="12" r="1" fill="currentColor" />
                <circle cx="16" cy="12" r="1" fill="currentColor" />
              </svg>
            </div>
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#e86040] text-white text-[10px]
                               font-bold rounded-full flex items-center justify-center animate-pulse shadow-md ring-2 ring-[#1e1108]">
                {unreadCount}
              </span>
            )}
            {/* Label pill */}
            <span className="absolute right-full mr-3 px-3 py-1.5 text-xs font-semibold text-white
                             cb-label-pill rounded-full shadow-lg
                             opacity-0 group-hover:opacity-100 pointer-events-none
                             transition-opacity duration-200 whitespace-nowrap">
              Talk to Helix
            </span>
          </div>
        )}
      </button>

      {/* ── Chat Window ── */}
      {isVisible && (
        <div
          className={`fixed z-[60] cb-window
                     bottom-24 right-6 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)]
                     max-sm:bottom-0 max-sm:right-0 max-sm:left-0 max-sm:top-0
                     max-sm:w-full max-sm:max-w-none max-sm:h-full max-sm:max-h-none max-sm:rounded-none
                     rounded-2xl overflow-hidden flex flex-col transition-[width] duration-300
                     ${showHistory ? 'w-[640px]' : 'w-[420px]'}
                     ${isOpen ? 'cb-window-open' : 'cb-window-close'}`}
          role="dialog"
          aria-label="Helix wellness companion chat"
        >
          {/* ── Header ── */}
          <div className="cb-header shrink-0">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full cb-avatar flex items-center justify-center ring-2 ring-white/20">
                    <HiOutlineSparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1e1108]
                                   ${aiPowered ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-white leading-tight tracking-tight">Helix</h3>
                  <span className="text-[11px] text-white/60 leading-tight">
                    {aiPowered ? 'AI-powered companion' : 'Your wellness companion'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className={`p-2 rounded-xl transition-colors group/hist ${
                    showHistory ? 'bg-white/10' : 'hover:bg-white/10'
                  }`}
                  title="Chat history"
                  aria-label="Toggle chat history"
                >
                  <HiOutlineClock className={`w-4 h-4 transition-colors ${
                    showHistory ? 'text-[#e8a04a]' : 'text-white/50 group-hover/hist:text-white/80'
                  }`} />
                </button>
                <button
                  onClick={clearChat}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors group/clear"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <HiOutlineTrash className="w-4 h-4 text-white/50 group-hover/clear:text-red-300 transition-colors" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                  title="Close chat"
                  aria-label="Close chat"
                >
                  <HiOutlineX className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
                </button>
              </div>
            </div>
            {/* Decorative wave separator */}
            <svg className="w-full h-3 -mb-px" viewBox="0 0 420 12" preserveAspectRatio="none">
              <path d="M0 0 Q105 12 210 6 Q315 0 420 8 L420 12 L0 12 Z" fill="var(--cb-body-bg)" />
            </svg>
          </div>

          {/* ── History + Chat body wrapper ── */}
          <div className="flex flex-1 overflow-hidden relative">
            {/* ── History Sidebar ── */}
            {showHistory && (
              <div className="cb-history-sidebar shrink-0 border-r border-white/10">
                <SessionList
                  sessions={sessions}
                  activeId={activeSessionId}
                  onSelect={switchSession}
                  onDelete={deleteSessionHandler}
                  onNewChat={startNewChat}
                  onClose={() => setShowHistory(false)}
                  loading={sessionsLoading}
                />
              </div>
            )}

            {/* ── Chat content ── */}
            <div className="flex flex-col flex-1 min-w-0 relative">
              {/* ── Messages ── */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 cb-body cb-scrollbar relative"
              >
                {messages.map((msg, i) => (
                  <MessageBubble
                    key={i}
                    msg={msg}
                    isUser={msg.role === 'user'}
                    isLatest={i === messages.length - 1}
                  />
                ))}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll-to-bottom button */}
              {showScrollBtn && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-[140px] left-1/2 -translate-x-1/2 z-10
                             w-8 h-8 rounded-full cb-scroll-btn
                             flex items-center justify-center cb-msg-enter"
                  aria-label="Scroll to latest message"
                >
                  <HiOutlineChevronDown className="w-4 h-4 text-[#e8a04a]" />
                </button>
              )}

              {/* ── Quick Replies ── */}
              {quickReplies.length > 0 && !loading && (
                <div className="px-4 pb-2 shrink-0 cb-body">
                  <QuickReplies replies={quickReplies} onSelect={sendMessage} disabled={loading} />
                </div>
              )}

              {/* ── Input Area ── */}
              <div className="cb-input-area shrink-0">
                <div className="px-4 pb-4 pt-3 max-sm:pb-6">
                  <div className="flex items-end gap-2 cb-input-box">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                      onKeyDown={handleKeyDown}
                      placeholder="Share what's on your mind..."
                      rows={1}
                      className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/25
                                outline-none resize-none max-h-24 leading-relaxed"
                      disabled={loading}
                      style={{ minHeight: '24px' }}
                      onInput={(e) => {
                        e.target.style.height = '24px';
                        e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                      }}
                    />
                    <div className="flex items-center gap-1 shrink-0 pb-0.5">
                      {recognitionRef.current && (
                        <button
                          onClick={toggleVoice}
                          className={`p-2 rounded-xl transition-all duration-200 ${
                            isListening
                              ? 'bg-[#e86040]/20 text-[#e86040] cb-listening-pulse'
                              : 'hover:bg-white/10 text-white/40 hover:text-white/70'
                          }`}
                          title={isListening ? 'Stop listening' : 'Voice input'}
                          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                        >
                          {isListening ? (
                            <HiOutlineStop className="w-4 h-4" />
                          ) : (
                            <HiOutlineMicrophone className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className="cb-send-btn"
                        aria-label="Send message"
                      >
                        <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
                      </button>
                    </div>
                  </div>
                  {charCount > 1800 && (
                    <div className="text-right mt-1 pr-1">
                      <span className={`text-[10px] ${charCount > 1950 ? 'text-red-400' : 'text-white/30'}`}>
                        {charCount}/2000
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
