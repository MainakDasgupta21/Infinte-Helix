"""
Firestore Mood Log document schema.

Collection: mood_logs
Auto-generated document ID

Fields:
    user_id         str     Firebase Auth UID
    emotion         str     Detected emotion (joy, sadness, anger, fear, surprise, disgust, neutral)
    confidence      float   Model confidence (0-1)
    sentiment       str     positive | neutral | negative
    source          str     'journal' | 'auto-detect'
    timestamp       str     ISO timestamp
"""


def create_mood_log(user_id, emotion, confidence, sentiment, source='journal'):
    return {
        'user_id': user_id,
        'emotion': emotion,
        'confidence': confidence,
        'sentiment': sentiment,
        'source': source,
        'timestamp': None,
    }
