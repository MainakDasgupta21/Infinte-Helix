import { useState, useCallback } from 'react';

const STORAGE_KEY = 'helix_life_stage_mode';
const PREGNANCY_DATA_KEY = 'helix_pregnancy_data';

function loadMode() {
  try { return localStorage.getItem(STORAGE_KEY) === 'pregnancy' ? 'pregnancy' : 'cycle'; }
  catch { return 'cycle'; }
}

function loadPregnancyData() {
  try {
    const raw = localStorage.getItem(PREGNANCY_DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    dueDateIso: null,
    doctorQuestions: [],
    nextAppointmentIso: null,
    nextAppointmentLabel: '',
    microTasks: [],
  };
}

function persistMode(mode) {
  try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* quota */ }
}

function persistPregnancyData(data) {
  try { localStorage.setItem(PREGNANCY_DATA_KEY, JSON.stringify(data)); } catch { /* quota */ }
}

export function usePregnancyMode() {
  const [mode, setModeState] = useState(loadMode);
  const [pregnancyData, setPregnancyDataState] = useState(loadPregnancyData);

  const setMode = useCallback((m) => {
    setModeState(m);
    persistMode(m);
  }, []);

  const toggleMode = useCallback(() => {
    const next = mode === 'cycle' ? 'pregnancy' : 'cycle';
    setModeState(next);
    persistMode(next);
  }, [mode]);

  const updatePregnancyData = useCallback((partial) => {
    setPregnancyDataState(prev => {
      const next = { ...prev, ...partial };
      persistPregnancyData(next);
      return next;
    });
  }, []);

  const weeksPregnant = (() => {
    if (!pregnancyData.dueDateIso) return 0;
    const due = new Date(pregnancyData.dueDateIso + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = 280;
    const daysRemaining = Math.round((due - today) / 86400000);
    const daysPregnant = totalDays - daysRemaining;
    return Math.max(0, Math.min(40, Math.floor(daysPregnant / 7)));
  })();

  const trimester = weeksPregnant < 13 ? 1 : weeksPregnant < 27 ? 2 : 3;

  const daysUntilDue = (() => {
    if (!pregnancyData.dueDateIso) return null;
    const due = new Date(pregnancyData.dueDateIso + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((due - today) / 86400000));
  })();

  const daysUntilAppointment = (() => {
    if (!pregnancyData.nextAppointmentIso) return null;
    const apt = new Date(pregnancyData.nextAppointmentIso + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((apt - today) / 86400000));
  })();

  return {
    mode,
    isPregnancy: mode === 'pregnancy',
    setMode,
    toggleMode,
    pregnancyData,
    updatePregnancyData,
    weeksPregnant,
    trimester,
    daysUntilDue,
    daysUntilAppointment,
  };
}
