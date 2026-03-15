// WellnessContext — Global state for wellness data
//
// Provides:
//   - todayMetrics: { screenTime, focusSessions, breaks, hydration, score }
//   - nudges: current pending nudges
//   - trackerStatus: background tracker connection state
//   - refreshMetrics(): re-fetch from backend
//   - dismissNudge(id): mark nudge as seen

import React, { createContext, useContext } from 'react';

const WellnessContext = createContext(null);

export function WellnessProvider({ children }) {
  // TODO: State management for wellness data
  // TODO: Periodic polling from GET /api/dashboard/today
  // TODO: Nudge queue management
  const value = {};
  return <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>;
}

export function useWellness() {
  return useContext(WellnessContext);
}
