# Dashboard Routes — /api/dashboard/*
#
# GET /api/dashboard/today?userId=...
#   Response: {
#     "screenTime": { "total": 420, "active": 360, "idle": 60 },
#     "focusSessions": [{ "start": "...", "end": "...", "score": 85 }],
#     "breaks": { "taken": 4, "recommended": 6 },
#     "productivityScore": 78,
#     "hydration": { "completed": 5, "target": 8 },
#     "recentNudges": [{ "id", "type", "message", "timestamp" }]
#   }

# TODO: Blueprint registration
# TODO: get_today() — aggregate data from work_sessions + hydration_logs
