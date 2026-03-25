import { useState, useEffect, useRef, useCallback } from 'react';

const WINDOW_MS = 30_000;
const KEYSTROKE_THRESHOLD = 50;
const BACKSPACE_THRESHOLD = 8;
const COOLDOWN_MS = 120_000;
const POLL_INTERVAL = 5_000;
const SNOOZE_KEY = 'helix_stress_snooze';
const LOG_KEY = 'helix_stress_log';
const SESSION_KEY = 'helix_session_tracker';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadStressLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }
  catch { return []; }
}

function saveStressLog(log) {
  try {
    const trimmed = log.slice(-200);
    localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
  } catch {}
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}'); }
  catch { return {}; }
}

function saveSession(data) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); }
  catch {}
}

export function getStressLog() {
  return loadStressLog();
}

export function getSessionData() {
  return loadSession();
}

export default function useStressDetector() {
  const [isStressed, setIsStressed] = useState(false);
  const [metrics, setMetrics] = useState({
    keystrokes: 0,
    backspaces: 0,
    speed: 0,
    sessionMinutes: 0,
    todayEvents: 0,
    source: 'browser',
  });

  const bufferRef = useRef([]);
  const cooldownRef = useRef(false);
  const snoozedUntilRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const totalKeysRef = useRef(0);
  const totalBackspacesRef = useRef(0);
  const agentAvailableRef = useRef(false);

  useEffect(() => {
    try {
      const ts = Number(localStorage.getItem(SNOOZE_KEY)) || 0;
      if (ts > Date.now()) snoozedUntilRef.current = ts;
    } catch {}

    const session = loadSession();
    const today = todayKey();
    if (session.date !== today) {
      saveSession({ date: today, totalMinutes: 0, totalKeys: 0, totalBackspaces: 0, startedAt: Date.now() });
    } else {
      sessionStartRef.current = session.startedAt || Date.now();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const session = loadSession();
      const today = todayKey();

      saveSession({
        date: today,
        totalMinutes: (session.date === today ? session.totalMinutes || 0 : 0) + 1,
        totalKeys: totalKeysRef.current,
        totalBackspaces: totalBackspacesRef.current,
        startedAt: sessionStartRef.current,
        lastActive: Date.now(),
      });

      const elapsedMin = Math.round((Date.now() - sessionStartRef.current) / 60_000);
      setMetrics(prev => ({ ...prev, sessionMinutes: elapsedMin }));
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const logStressEvent = useCallback((eventMetrics) => {
    const log = loadStressLog();
    const today = todayKey();
    const event = {
      timestamp: new Date().toISOString(),
      date: today,
      keystrokes: eventMetrics.keystrokes,
      backspaces: eventMetrics.backspaces,
      speed: eventMetrics.speed,
      sessionMinutes: Math.round((Date.now() - sessionStartRef.current) / 60_000),
      source: eventMetrics.source || 'browser',
      intervention: 'toast_shown',
    };
    log.push(event);
    saveStressLog(log);

    const todayCount = log.filter(e => e.date === today).length;
    setMetrics(prev => ({ ...prev, todayEvents: todayCount }));
  }, []);

  // Browser-level keystroke tracking (works inside the app)
  const evaluateBrowser = useCallback(() => {
    const now = Date.now();
    const cutoff = now - WINDOW_MS;
    bufferRef.current = bufferRef.current.filter(e => e.ts >= cutoff);

    const total = bufferRef.current.length;
    const backspaces = bufferRef.current.filter(e => e.del).length;
    const speed = Math.round((total / WINDOW_MS) * 60_000);
    const elapsedMin = Math.round((now - sessionStartRef.current) / 60_000);
    const today = todayKey();
    const todayCount = loadStressLog().filter(e => e.date === today).length;

    if (!agentAvailableRef.current) {
      setMetrics({ keystrokes: total, backspaces, speed, sessionMinutes: elapsedMin, todayEvents: todayCount, source: 'browser' });
    }

    if (
      total >= KEYSTROKE_THRESHOLD &&
      backspaces >= BACKSPACE_THRESHOLD &&
      !cooldownRef.current &&
      now > snoozedUntilRef.current &&
      !agentAvailableRef.current
    ) {
      setIsStressed(true);
      logStressEvent({ keystrokes: total, backspaces, speed, source: 'browser' });
      cooldownRef.current = true;
      setTimeout(() => { cooldownRef.current = false; }, COOLDOWN_MS);
    }
  }, [logStressEvent]);

  useEffect(() => {
    const onKey = (e) => {
      const isDeletion = e.key === 'Backspace' || e.key === 'Delete';
      bufferRef.current.push({ ts: Date.now(), del: isDeletion });
      totalKeysRef.current++;
      if (isDeletion) totalBackspacesRef.current++;
      evaluateBrowser();
    };

    window.addEventListener('keydown', onKey, true);
    const interval = setInterval(evaluateBrowser, 5000);

    return () => {
      window.removeEventListener('keydown', onKey, true);
      clearInterval(interval);
    };
  }, [evaluateBrowser]);

  // System-wide agent polling (if stress_agent.py is running)
  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/stress/latest`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (!active) return;
        agentAvailableRef.current = true;

        const elapsedMin = Math.round((Date.now() - sessionStartRef.current) / 60_000);
        const today = todayKey();
        const todayCount = loadStressLog().filter(e => e.date === today).length;

        setMetrics({
          keystrokes: data.keystrokes || 0,
          backspaces: data.backspaces || 0,
          speed: data.speed || 0,
          sessionMinutes: elapsedMin,
          todayEvents: todayCount,
          source: 'system_agent',
        });

        if (
          data.is_stressed &&
          !cooldownRef.current &&
          Date.now() > snoozedUntilRef.current
        ) {
          setIsStressed(true);
          logStressEvent({ keystrokes: data.keystrokes, backspaces: data.backspaces, speed: data.speed, source: 'system_agent' });
          cooldownRef.current = true;
          setTimeout(() => { cooldownRef.current = false; }, COOLDOWN_MS);
        }
      } catch {
        if (active) agentAvailableRef.current = false;
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => { active = false; clearInterval(interval); };
  }, [logStressEvent]);

  const resolveOnServer = useCallback(async (resolution) => {
    try {
      await fetch(`${API_BASE}/stress/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });
    } catch {}
  }, []);

  const dismiss = useCallback(() => {
    setIsStressed(false);
    const log = loadStressLog();
    if (log.length > 0) {
      log[log.length - 1].resolution = 'dismissed';
      saveStressLog(log);
    }
    resolveOnServer('dismissed');
  }, [resolveOnServer]);

  const snooze = useCallback((minutes = 30) => {
    setIsStressed(false);
    const until = Date.now() + minutes * 60_000;
    snoozedUntilRef.current = until;
    try { localStorage.setItem(SNOOZE_KEY, String(until)); } catch {}
    const log = loadStressLog();
    if (log.length > 0) {
      log[log.length - 1].resolution = `snoozed_${minutes}m`;
      saveStressLog(log);
    }
    resolveOnServer(`snoozed_${minutes}m`);
  }, [resolveOnServer]);

  const breathingCompleted = useCallback(() => {
    const log = loadStressLog();
    if (log.length > 0) {
      log[log.length - 1].resolution = 'breathing_completed';
      saveStressLog(log);
    }
    resolveOnServer('breathing_completed');
  }, [resolveOnServer]);

  return { isStressed, metrics, dismiss, snooze, breathingCompleted };
}
