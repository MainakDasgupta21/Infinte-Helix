import React, { createContext, useContext, useState, useCallback } from 'react';

const WellnessContext = createContext(null);

const INITIAL_METRICS = {
  screenTime: { total: 5.2, goal: 8, breakdown: { coding: 2.8, meetings: 1.2, browsing: 0.7, email: 0.5 } },
  focusSessions: [
    { start: '09:00', end: '10:30', score: 92, label: 'Deep Work' },
    { start: '11:00', end: '12:15', score: 78, label: 'Code Review' },
    { start: '14:00', end: '15:00', score: 85, label: 'Feature Dev' },
    { start: '15:30', end: '16:45', score: 70, label: 'Documentation' },
  ],
  breaks: { taken: 4, suggested: 6, lastBreak: '14:55', avgDuration: 8 },
  hydration: { glasses: 5, goal: 8, lastReminder: '15:30', history: [true, true, true, false, true, false, false, false] },
  score: 78,
  mood: 'focused',
  streakDays: 5,
  weeklyTrend: [65, 72, 68, 80, 78, 0, 0],
};

const INITIAL_NUDGES = [
  { id: 1, type: 'hydration', message: "You've been coding for 90 min — perfect moment to hydrate! 💧", time: '3 min ago', priority: 'gentle', dismissed: false },
  { id: 2, type: 'stretch', message: "Your body could use a gentle reset. Stand and stretch? 🌿", time: '18 min ago', priority: 'moderate', dismissed: false },
  { id: 3, type: 'eyes', message: "Your eyes have been busy — try the 20-20-20 rule. 👀", time: '42 min ago', priority: 'gentle', dismissed: true },
  { id: 4, type: 'meeting', message: "Meeting in 10 min. Want a 30-second confidence breath? 🧘", time: '1 hr ago', priority: 'important', dismissed: true },
];

export function WellnessProvider({ children }) {
  const [todayMetrics, setTodayMetrics] = useState(INITIAL_METRICS);
  const [nudges, setNudges] = useState(INITIAL_NUDGES);
  const [trackerStatus] = useState('connected');

  const refreshMetrics = useCallback(() => {
    setTodayMetrics(prev => ({ ...prev, score: Math.min(100, prev.score + Math.floor(Math.random() * 3)) }));
  }, []);

  const dismissNudge = useCallback((id) => {
    setNudges(prev => prev.map(n => n.id === id ? { ...n, dismissed: true } : n));
  }, []);

  const addHydration = useCallback(() => {
    setTodayMetrics(prev => ({
      ...prev,
      hydration: {
        ...prev.hydration,
        glasses: Math.min(prev.hydration.glasses + 1, prev.hydration.goal),
        history: prev.hydration.history.map((v, i) => i === prev.hydration.glasses ? true : v),
      }
    }));
  }, []);

  const value = { todayMetrics, nudges, trackerStatus, refreshMetrics, dismissNudge, addHydration };
  return <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>;
}

export function useWellness() {
  return useContext(WellnessContext);
}
