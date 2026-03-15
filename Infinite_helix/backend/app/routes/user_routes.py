# User Routes — /api/user/*
#
# GET /api/user/settings?userId=...
#   Response: {
#     "name": "...", "email": "...", "avatar": "...",
#     "notifications": { "frequency": "moderate", "quiet_hours": { "start": "22:00", "end": "08:00" }},
#     "cycleMode": { "enabled": false },
#     "calendarConnected": false,
#     "workHours": { "start": "09:00", "end": "18:00" }
#   }
#
# PUT /api/user/settings
#   Request: { "userId": "...", "settings": { ... } }
#   Response: { "status": "updated" }

# TODO: Blueprint registration
# TODO: get_settings() — fetch from Firebase users collection
# TODO: update_settings() — merge update to Firebase
