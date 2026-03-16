import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'helix-dev-secret-key-change-in-production')

    FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', './config/firebase-credentials.json')

    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')
    GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/calendar/callback')

    EMOTION_MODEL = os.getenv('EMOTION_MODEL', 'j-hartmann/emotion-english-distilroberta-base')
    SENTIMENT_MODEL = os.getenv('SENTIMENT_MODEL', 'cardiffnlp/twitter-roberta-base-sentiment')
    MODEL_CACHE_DIR = os.getenv('MODEL_CACHE_DIR', './model_cache')

    TRACKER_INTERVAL_SECONDS = int(os.getenv('TRACKER_INTERVAL_SECONDS', 30))
    NUDGE_COOLDOWN_MINUTES = int(os.getenv('NUDGE_COOLDOWN_MINUTES', 30))
    IDLE_THRESHOLD_SECONDS = int(os.getenv('IDLE_THRESHOLD_SECONDS', 60))
    FATIGUE_THRESHOLD_MINUTES = int(os.getenv('FATIGUE_THRESHOLD_MINUTES', 120))
