# Calendar Routes — /api/calendar/*
#
# GET /api/calendar/meetings?userId=...
#   Response: {
#     "meetings": [
#       { "id": "...", "title": "Sprint Planning", "startTime": "...",
#         "endTime": "...", "attendees": 8, "minutesUntil": 14 }
#     ],
#     "nextMeeting": { ... },
#     "preNudge": {
#       "show": true,
#       "message": "Meeting in 15 minutes. Want a 30-second confidence breath?"
#     }
#   }
#
# Requires: Google Calendar API OAuth2 credentials

# TODO: Blueprint registration
# TODO: get_meetings() — fetch from Google Calendar API
# TODO: Pre-meeting nudge trigger logic (10-15 min window)
