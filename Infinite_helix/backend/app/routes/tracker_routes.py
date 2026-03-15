# Tracker Routes — /api/tracker/*
#
# POST /api/tracker/activity
#   Request:  { "userId": "...", "keystrokes": 1200, "idleSeconds": 45,
#               "activeMinutes": 25, "typingIntensity": "high" }
#   Response: { "status": "logged", "shouldNudge": true, "nudgeType": "hydration" }
#   Side effect: Saves to Firebase work_sessions collection
#
# GET /api/tracker/status
#   Response: { "running": true, "uptime": 14400, "lastActivity": "2026-03-15T10:30:00" }

# TODO: Blueprint registration
# TODO: log_activity() — save + check nudge triggers
# TODO: get_status() — background service health check
