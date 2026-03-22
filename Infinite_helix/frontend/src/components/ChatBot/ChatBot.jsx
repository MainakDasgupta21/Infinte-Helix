import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatAPI } from '../../services/api';
import {
  HiOutlineChatAlt2,
  HiOutlineX,
  HiOutlinePaperAirplane,
  HiOutlineMicrophone,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineStop,
  HiOutlineHeart,
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

function formatMessage(text) {
  if (!text) return '';
  let html = text
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
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-helix-accent/20 border border-helix-accent/30 text-helix-text rounded-br-md'
            : 'bg-helix-surface border border-helix-border/40 text-helix-text rounded-bl-md'
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
          className="px-3 py-1.5 text-xs rounded-full border border-helix-accent/30 text-helix-accent
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
      <div className="bg-helix-surface border border-helix-border/40 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-helix-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-helix-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-helix-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function ChatBot() {
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
      const res = await chatAPI.sendMessage(msg);
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
      await chatAPI.clearHistory();
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
                       bg-helix-bg/95 backdrop-blur-xl border border-helix-border/50
                       rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="px-4 py-3 border-b border-helix-border/40 bg-helix-surface/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-helix-accent to-helix-pink flex items-center justify-center">
                <HiOutlineSparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-helix-text">Helix</h3>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${aiPowered ? 'bg-helix-mint' : 'bg-helix-amber'}`} />
                  <span className="text-[10px] text-helix-muted">
                    {aiPowered ? 'AI Companion' : 'Your supportive companion'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg hover:bg-helix-border/30 transition-colors"
              title="Clear conversation"
            >
              <HiOutlineTrash className="w-4 h-4 text-helix-muted" />
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
          <div className="px-3 pb-3 pt-1 border-t border-helix-border/30 shrink-0">
            <div className="flex items-center gap-2 bg-helix-surface rounded-xl border border-helix-border/40 px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your mind..."
                className="flex-1 bg-transparent text-sm text-helix-text placeholder:text-helix-muted/60
                          outline-none"
                disabled={loading}
              />

              {recognitionRef.current && (
                <button
                  onClick={toggleVoice}
                  className={`p-1.5 rounded-lg transition-all ${
                    isListening
                      ? 'bg-helix-pink/20 text-helix-pink animate-pulse'
                      : 'hover:bg-helix-border/30 text-helix-muted'
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
                className="p-1.5 rounded-lg bg-helix-accent/20 text-helix-accent
                          hover:bg-helix-accent/30 transition-all disabled:opacity-30
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
