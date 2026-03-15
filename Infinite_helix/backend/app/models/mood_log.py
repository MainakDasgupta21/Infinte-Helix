# MoodLog Model — Firestore document schema
#
# Collection: mood_logs
#
# Schema:
#   {
#     "id": string (auto),
#     "userId": string,
#     "text": string,
#     "emotion": {
#       "label": string,  (joy, sadness, anger, fear, surprise, disgust, neutral)
#       "confidence": float
#     },
#     "sentiment": {
#       "label": string,  (positive, neutral, negative)
#       "confidence": float
#     },
#     "aiResponse": string,
#     "timestamp": timestamp
#   }

# TODO: Define data class
# TODO: Validation
