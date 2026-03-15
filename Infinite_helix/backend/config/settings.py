# Application Settings
#
# All configuration loaded from environment variables via python-dotenv.
# See .env.example for required variables.
#
# Settings groups:
#
# FLASK:
#   FLASK_ENV          = development | production
#   FLASK_PORT         = 5000
#   FLASK_DEBUG        = True
#   SECRET_KEY         = <random-secret>
#
# FIREBASE:
#   FIREBASE_CREDENTIALS_PATH = ./config/firebase-credentials.json
#
# GOOGLE CALENDAR:
#   GOOGLE_CLIENT_ID      = <oauth-client-id>
#   GOOGLE_CLIENT_SECRET  = <oauth-client-secret>
#   GOOGLE_REDIRECT_URI   = http://localhost:5000/api/calendar/callback
#
# AI MODELS:
#   EMOTION_MODEL    = j-hartmann/emotion-english-distilroberta-base
#   SENTIMENT_MODEL  = cardiffnlp/twitter-roberta-base-sentiment
#   MODEL_CACHE_DIR  = ./model_cache
#
# TRACKER:
#   TRACKER_INTERVAL_SECONDS   = 30
#   NUDGE_COOLDOWN_MINUTES     = 30
#   IDLE_THRESHOLD_SECONDS     = 60
#   FATIGUE_THRESHOLD_MINUTES  = 120

# TODO: Load from .env using python-dotenv
# TODO: Define Config class with defaults
