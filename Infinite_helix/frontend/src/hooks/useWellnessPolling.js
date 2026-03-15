// useWellnessPolling — Polls backend for wellness updates
//
// Interval: 30 seconds (configurable)
//
// Fetches:
//   - Tracker status (is background service running?)
//   - Pending nudges
//   - Updated metrics
//
// Usage:
//   const { metrics, nudges, isTrackerRunning } = useWellnessPolling(intervalMs);

// TODO: Implement polling with useEffect + setInterval
// TODO: Handle connection errors gracefully
