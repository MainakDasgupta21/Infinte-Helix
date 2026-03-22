import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { dashboardAPI, hydrationAPI, nudgeAPI, selfCareAPI } from '../services/api';

import { useAuth } from './AuthContext';
import { showNudgeNotification, requestPermission, isPermissionGranted } from '../services/notifications';
import { startMealReminderScheduler } from '../services/mealReminders';
import { startEyeRestScheduler } from '../services/eyeRestReminder';
import { startPrivateCareScheduler } from '../services/privateCareReminder';

const WellnessContext = createContext(null);

const INITIAL_METRICS = {
  screenTime: { total: 0, goal: 8, breakdown: { coding: 0, meetings: 0, browsing: 0, email: 0 } },
  focusSessions: [],
  breaks: { taken: 0, suggested: 6, lastBreak: '--:--', avgDuration: 0 },
  hydration: { ml_today: 0, goal_ml: 2000, default_amount_ml: 250 },
  selfCare: { stretch: 0, eye_rest: 0, goals: { stretch: 25, eye_rest: 30 } },
  score: 0,
  mood: 'neutral',
  streakDays: 0,
  activity: {},
};

export function WellnessProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.uid || null;
  const [todayMetrics, setTodayMetrics] = useState(INITIAL_METRICS);
  const [screenHistory, setScreenHistory] = useState([]);
  const [nudges, setNudges] = useState([]);
  const [trackerStatus, setTrackerStatus] = useState('connecting');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const pollRef = useRef(null);
  const permissionAsked = useRef(false);
  const firstLoad = useRef(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await dashboardAPI.getToday(userId);
      const d = res.data;
      setTodayMetrics({
        screenTime: d.screenTime || INITIAL_METRICS.screenTime,
        focusSessions: d.focusSessions || [],
        breaks: d.breaks || INITIAL_METRICS.breaks,
        hydration: {
          ml_today: d.hydration?.ml_today || 0,
          goal_ml: d.hydration?.goal_ml || 2000,
          default_amount_ml: d.hydration?.default_amount_ml || 250,
        },
        selfCare: d.selfCare || INITIAL_METRICS.selfCare,
        score: d.score || 0,
        mood: d.mood || 'neutral',
        streakDays: d.streakDays || 0,
        activity: d.activity || {},
      });
      setTrackerStatus('connected');
      if (firstLoad.current) {
        firstLoad.current = false;
        setDashboardLoading(false);
      }
    } catch {
      setTrackerStatus('offline');
      if (firstLoad.current) {
        firstLoad.current = false;
        setDashboardLoading(false);
      }
    }
  }, [userId]);

  const refreshMetrics = useCallback(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const fetchScreenHistory = useCallback(async (days = 7) => {
    try {
      const res = await dashboardAPI.getScreenHistory(userId, days);
      setScreenHistory(res.data?.history || []);
    } catch {
      setScreenHistory([]);
    }
  }, [userId]);

  const addHydration = useCallback(async (amount_ml) => {
    const ml = amount_ml || 250;
    try {
      await hydrationAPI.log(ml, userId);
      toast.success(`+${ml} ml logged \u{1F4A7}`);
    } catch {
      toast.success(`+${ml} ml logged (offline)`);
    }
    setTodayMetrics(prev => ({
      ...prev,
      hydration: {
        ...prev.hydration,
        ml_today: prev.hydration.ml_today + ml,
      },
    }));
  }, [userId]);

  const logSelfCare = useCallback(async (action) => {
    const label = action === 'stretch' ? 'Stretch break' : 'Eye rest';
    const emoji = action === 'stretch' ? '\u{1F9D8}' : '\u{1F441}\uFE0F';
    try {
      await selfCareAPI.log(action, userId);
      toast.success(`${label} logged ${emoji}`);
    } catch {
      toast.success(`${label} logged (offline)`);
    }
    setTodayMetrics(prev => ({
      ...prev,
      selfCare: {
        ...prev.selfCare,
        [action]: (prev.selfCare[action] || 0) + 1,
      },
    }));
  }, [userId]);

  const dismissNudge = useCallback(async (id) => {
    setNudges(prev => prev.map(n => n.id === id ? { ...n, dismissed: true } : n));
    try {
      await nudgeAPI.dismiss(id);
    } catch {
      // best-effort
    }
  }, []);

  const generateNudge = useCallback(async (context = {}) => {
    try {
      const res = await nudgeAPI.generate(context);
      if (res.status === 200 && res.data?.type) {
        const newNudge = {
          ...res.data,
          id: res.data.id || Date.now(),
          time: 'just now',
          dismissed: false,
        };
        setNudges(prev => [newNudge, ...prev]);
        showNudgeNotification(newNudge);
      }
    } catch {
      // no nudge needed
    }
  }, []);

  useEffect(() => {
    let stopMeals = null;
    let stopEyeRest = null;
    let cancelled = false;

    async function init() {
      if (!permissionAsked.current) {
        permissionAsked.current = true;
        await requestPermission();
      }
      if (!cancelled) {
        stopMeals = startMealReminderScheduler(30000);
        stopEyeRest = startEyeRestScheduler();
        startPrivateCareScheduler();
      }
    }

    init();
    fetchDashboard();
    pollRef.current = setInterval(fetchDashboard, 30000);
    return () => {
      cancelled = true;
      clearInterval(pollRef.current);
      if (stopMeals) stopMeals();
      if (stopEyeRest) stopEyeRest();
    };
  }, [fetchDashboard]);

  useEffect(() => {
    const nudgeInterval = setInterval(() => {
      const activity = todayMetrics.activity || {};
      const continuous = activity.continuous_work_minutes || 0;
      generateNudge({
        continuous_work_minutes: continuous,
        typing_intensity: activity.typing_intensity || 0,
        minutes_since_break: continuous,
        recent_emotion: todayMetrics.mood || 'neutral',
        ml_today: todayMetrics.hydration?.ml_today || 0,
        hour_of_day: new Date().getHours(),
      });
    }, 120000);
    return () => clearInterval(nudgeInterval);
  }, [generateNudge, todayMetrics]);

  const value = {
    todayMetrics,
    screenHistory,
    nudges,
    trackerStatus,
    dashboardLoading,
    refreshMetrics,
    fetchScreenHistory,
    dismissNudge,
    addHydration,
    logSelfCare,
    generateNudge,
  };

  return <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>;
}

export function useWellness() {
  return useContext(WellnessContext);
}
