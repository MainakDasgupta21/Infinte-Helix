# Hydration Routes — /api/hydration/*
#
# POST /api/hydration/log
#   Request:  { "userId": "...", "trigger": "long_task", "completed": true }
#   Response: { "status": "logged", "todayCount": 6, "target": 8 }
#
# Triggers (behavior-based, not time-based):
#   - "long_task"      → after completing a long work session
#   - "two_hours"      → after 2 hours since last hydration
#   - "intense_typing" → after high typing intensity period
#   - "manual"         → user-initiated log

# TODO: Blueprint registration
# TODO: log_hydration() — save + return daily progress
