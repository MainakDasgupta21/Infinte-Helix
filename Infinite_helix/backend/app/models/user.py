# User Model — Firestore document schema
#
# Collection: users
# Document ID: Firebase Auth UID
#
# Schema:
#   {
#     "uid": string,
#     "name": string,
#     "email": string,
#     "avatar": string (URL),
#     "settings": {
#       "notifications": {
#         "frequency": "gentle" | "moderate" | "minimal",
#         "quietHours": { "start": "22:00", "end": "08:00" }
#       },
#       "cycleMode": { "enabled": boolean },
#       "workHours": { "start": "09:00", "end": "18:00" }
#     },
#     "calendarConnected": boolean,
#     "createdAt": timestamp,
#     "updatedAt": timestamp
#   }

# TODO: Define data class or Pydantic model
# TODO: Validation helpers
# TODO: to_dict() / from_dict() methods
