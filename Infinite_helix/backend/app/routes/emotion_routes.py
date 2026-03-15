# Emotion Routes — /api/emotion/*
#
# POST /api/emotion/analyze
#   Request:  { "text": "I feel overwhelmed with this deadline" }
#   Response: { "emotion": "fear", "confidence": 0.87, "all_emotions": [...] }
#
# Model: j-hartmann/emotion-english-distilroberta-base
# Emotions detected: anger, disgust, fear, joy, neutral, sadness, surprise

# TODO: Blueprint registration
# TODO: analyze() route handler
# TODO: Input validation
# TODO: Call EmotionService.detect()
