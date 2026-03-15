// API Service — Axios instance configured for Flask backend
//
// Base URL: http://localhost:5000/api
//
// Endpoints:
//   emotion.analyze(text)           → POST /api/emotion/analyze
//   sentiment.analyze(text)         → POST /api/sentiment/analyze
//   journal.create(entry)           → POST /api/journal/entry
//   journal.history(userId)         → GET  /api/journal/history
//   dashboard.today(userId)         → GET  /api/dashboard/today
//   reports.weekly(userId, week)    → GET  /api/reports/weekly
//   tracker.logActivity(data)       → POST /api/tracker/activity
//   tracker.status()                → GET  /api/tracker/status
//   nudge.generate(context)         → POST /api/nudge/generate
//   calendar.meetings(userId)       → GET  /api/calendar/meetings
//   cycle.log(phase)                → POST /api/cycle/log
//   cycle.suggestions(userId)       → GET  /api/cycle/suggestions
//   hydration.log(event)            → POST /api/hydration/log
//   user.getSettings(userId)        → GET  /api/user/settings
//   user.updateSettings(settings)   → PUT  /api/user/settings

// TODO: Create axios instance with base URL and auth interceptor
// TODO: Export grouped API functions
