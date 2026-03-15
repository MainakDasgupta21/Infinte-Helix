# Journal Routes — /api/journal/*
#
# POST /api/journal/entry
#   Request:  { "userId": "...", "text": "..." }
#   Response: { "id": "...", "emotion": {...}, "sentiment": {...}, "aiResponse": "..." }
#   Side effect: Saves to Firebase mood_logs collection
#
# GET /api/journal/history?userId=...&limit=20
#   Response: { "entries": [{ "id", "text", "emotion", "sentiment", "timestamp" }] }

# TODO: Blueprint registration
# TODO: create_entry() — analyze + save + generate AI response
# TODO: get_history() — fetch from Firebase with pagination
