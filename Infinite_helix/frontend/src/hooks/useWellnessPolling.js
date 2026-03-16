import { useEffect, useRef, useCallback } from 'react';
import { useWellness } from '../context/WellnessContext';

export default function useWellnessPolling(intervalMs = 30000) {
  const { refreshMetrics } = useWellness();
  const timerRef = useRef(null);

  const startPolling = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      refreshMetrics();
    }, intervalMs);
  }, [intervalMs, refreshMetrics]);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startPolling();
    return stopPolling;
  }, [startPolling, stopPolling]);

  return { startPolling, stopPolling };
}
