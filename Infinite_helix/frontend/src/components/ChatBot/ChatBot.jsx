import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWellness } from '../../context/WellnessContext';
import { usePageContext } from '../../context/PageContext';
import {
  HiOutlineChatAlt2,
  HiOutlineX,
  HiOutlinePaperAirplane,
  HiOutlineMicrophone,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineStop,
} from 'react-icons/hi';

const WELCOME_MSG = {
  role: 'assistant',
  message:
    "Hey there! I'm **Helix** — think of me as a supportive friend who's always here when you need someone to talk to.\n\n" +
    "Whether you want guidance, need to vent, or just want a little pick-me-up — I'm right here. " +
    "This is a safe space, and everything we talk about stays between us.\n\n" +
    "How are you feeling today?",
  timestamp: Date.now() / 1000,
  quick_replies: ['I need support', 'I\'m doing well!', 'What can you do?', 'Help me feel better'],
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

function MessageBubble({ msg, isUser }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-slide-up`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-helix-accent to-helix-pink flex items-center justify-center mr-2 mt-1 shrink-0">
          <HiOutlineSparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed font-sans ${
          isUser
            ? 'bg-helix-accent/20 border border-helix-accent/30 text-slate-700 rounded-br-md'
            : 'bg-white/90 border border-slate-200/50 text-slate-700 rounded-bl-md'
        }`}
        dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }}
      />
    </div>
  );
}

function QuickReplies({ replies, onSelect, disabled }) {
  if (!replies || replies.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-3 px-1">
      {replies.map((reply, i) => (
        <button
          key={i}
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-sans font-medium rounded-full border border-helix-accent/30 text-helix-accent
                     hover:bg-helix-accent/10 transition-all duration-200 disabled:opacity-50
                     disabled:cursor-not-allowed whitespace-nowrap"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-helix-accent to-helix-pink flex items-center justify-center mr-2 mt-1 shrink-0">
        <HiOutlineSparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white/90 border border-slate-200/50 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState(WELCOME_MSG.quick_replies);
  const [isListening, setIsListening] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [aiPowered, setAiPowered] = useState(false);

  const messagesEndRef = useRef(null);
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

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
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
      const res = await chatAPI.sendMessage(msg, user?.uid, pageContext);
      const botMsg = {
        role: 'assistant',
        message: res.data.message,
        timestamp: res.data.timestamp,
        quick_replies: res.data.quick_replies,
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(res.data.quick_replies || []);
      if (res.data.ai_powered !== undefined) setAiPowered(res.data.ai_powered);

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          message: "I'm having a little trouble connecting right now, but I'm still here. Could you try again in a moment?",
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
      await chatAPI.clearHistory(user?.uid);
    } catch { /* ignore */ }
    setMessages([WELCOME_MSG]);
    setQuickReplies(WELCOME_MSG.quick_replies);
  };

  return (
    <>
      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg
                   flex items-center justify-center transition-all duration-300 group
                   ${isOpen
                     ? 'bg-helix-surface border border-helix-border/60 rotate-0'
                     : 'bg-gradient-to-br from-helix-accent to-helix-pink hover:scale-110 glow-accent'
                   }`}
        aria-label={isOpen ? 'Close chat' : 'Talk to Helix'}
      >
        {isOpen ? (
          <HiOutlineX className="w-6 h-6 text-helix-muted" />
        ) : (
          <>
            <HiOutlineChatAlt2 className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-helix-pink text-white text-[10px]
                             font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)]
                       h-[560px] max-h-[calc(100vh-8rem)]
                       bg-slate-50/95 backdrop-blur-xl border border-slate-200/50
                       rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up font-sans antialiased">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200/40 bg-white/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-helix-accent to-helix-pink flex items-center justify-center">
                <HiOutlineSparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Helix</h3>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${aiPowered ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-[10px] text-slate-400 font-medium">
                    {aiPowered ? 'AI Companion' : 'Your supportive companion'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Clear conversation"
            >
              <HiOutlineTrash className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scrollbar-thin">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} isUser={msg.role === 'user'} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {quickReplies.length > 0 && !loading && (
            <div className="px-3 pb-1 shrink-0">
              <QuickReplies replies={quickReplies} onSelect={sendMessage} disabled={loading} />
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-slate-200/30 shrink-0">
            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200/50 px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your mind..."
                maxLength={2000}
                className="flex-1 bg-transparent text-sm font-sans text-slate-700 placeholder:text-slate-400
                          outline-none"
                disabled={loading}
              />

              {recognitionRef.current && (
                <button
                  onClick={toggleVoice}
                  className={`p-1.5 rounded-lg transition-all ${
                    isListening
                      ? 'bg-rose-100 text-rose-500 animate-pulse'
                      : 'hover:bg-slate-100 text-slate-400'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
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
                className="p-1.5 rounded-lg bg-violet-100 text-violet-600
                          hover:bg-violet-200 transition-all disabled:opacity-30
                          disabled:cursor-not-allowed"
              >
                <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
