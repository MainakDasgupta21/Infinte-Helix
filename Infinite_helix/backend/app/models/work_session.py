# WorkSession Model — Firestore document schema
#
# Collection: work_sessions
#
# Schema:
#   {
#     "id": string (auto),
#     "userId": string,
#     "startTime": timestamp,
#     "endTime": timestamp,
#     "keystrokes": int,
#     "idleSeconds": int,
#     "activeMinutes": int,
#     "typingIntensity": "low" | "moderate" | "high" | "intense",
#     "focusScore": int (0-100),
#     "breaks": [{ "startTime": timestamp, "duration": int }]
#   }

# TODO: Define data class
# TODO: Focus score calculation method
