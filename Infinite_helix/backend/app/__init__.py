from flask import Flask
from flask_cors import CORS
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

activity_monitor = None


def create_app():
    app = Flask(__name__)
    app.config.from_object('config.settings.Config')
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from app.routes.auth_routes import auth_bp
    from app.routes.emotion_routes import emotion_bp
    from app.routes.sentiment_routes import sentiment_bp
    from app.routes.journal_routes import journal_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.reports_routes import reports_bp
    from app.routes.tracker_routes import tracker_bp
    from app.routes.nudge_routes import nudge_bp
    from app.routes.calendar_routes import calendar_bp
    from app.routes.cycle_routes import cycle_bp
    from app.routes.hydration_routes import hydration_bp
    from app.routes.selfcare_routes import selfcare_bp
    from app.routes.privatecare_routes import privatecare_bp
    from app.routes.todo_routes import todo_bp
    from app.routes.user_routes import user_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(emotion_bp, url_prefix='/api/emotion')
    app.register_blueprint(sentiment_bp, url_prefix='/api/sentiment')
    app.register_blueprint(journal_bp, url_prefix='/api/journal')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(tracker_bp, url_prefix='/api/tracker')
    app.register_blueprint(nudge_bp, url_prefix='/api/nudge')
    app.register_blueprint(calendar_bp, url_prefix='/api/calendar')
    app.register_blueprint(cycle_bp, url_prefix='/api/cycle')
    app.register_blueprint(hydration_bp, url_prefix='/api/hydration')
    app.register_blueprint(selfcare_bp, url_prefix='/api/selfcare')
    app.register_blueprint(privatecare_bp, url_prefix='/api/privatecare')
    app.register_blueprint(todo_bp, url_prefix='/api/todos')
    app.register_blueprint(user_bp, url_prefix='/api/user')

    @app.route('/api/health')
    def health():
        return {
            'status': 'ok',
            'service': 'Infinite Helix API',
            'demo_mode': app.config.get('DEMO_MODE', True),
        }

    from app.services.firebase_service import init_firebase
    init_firebase()

    _init_ai_models(app)
    return app


def _init_ai_models(app):
    demo = app.config.get('DEMO_MODE', True)

    if demo:
        app.logger.info('Running in DEMO mode — using mock AI models')
        app.emotion_detector = _DemoEmotionDetector()
        app.sentiment_analyzer = _DemoSentimentAnalyzer()
        return

    try:
        from app.ai.emotion_detector import EmotionDetector
        from app.ai.sentiment_analyzer import SentimentAnalyzer
        app.emotion_detector = EmotionDetector(
            model_name=app.config.get('EMOTION_MODEL'),
            cache_dir=app.config.get('MODEL_CACHE_DIR')
        )
        app.sentiment_analyzer = SentimentAnalyzer(
            model_name=app.config.get('SENTIMENT_MODEL'),
            cache_dir=app.config.get('MODEL_CACHE_DIR')
        )
        app.logger.info('AI models loaded successfully')
    except Exception as e:
        app.logger.warning(f'AI models not loaded, falling back to demo: {e}')
        app.emotion_detector = _DemoEmotionDetector()
        app.sentiment_analyzer = _DemoSentimentAnalyzer()


class _DemoEmotionDetector:
    """Fast mock emotion detector for demo/hackathon mode."""

    _PROFILES = {
        'stress': {'emotion': 'sadness', 'confidence': 0.72,
                   'all_emotions': [{'label': 'sadness', 'score': 0.72}, {'label': 'fear', 'score': 0.15},
                                    {'label': 'anger', 'score': 0.06}, {'label': 'neutral', 'score': 0.04},
                                    {'label': 'joy', 'score': 0.02}, {'label': 'surprise', 'score': 0.01}]},
        'happy': {'emotion': 'joy', 'confidence': 0.89,
                  'all_emotions': [{'label': 'joy', 'score': 0.89}, {'label': 'surprise', 'score': 0.05},
                                   {'label': 'neutral', 'score': 0.04}, {'label': 'sadness', 'score': 0.02}]},
        'angry': {'emotion': 'anger', 'confidence': 0.78,
                  'all_emotions': [{'label': 'anger', 'score': 0.78}, {'label': 'disgust', 'score': 0.10},
                                   {'label': 'sadness', 'score': 0.06}, {'label': 'neutral', 'score': 0.04},
                                   {'label': 'fear', 'score': 0.02}]},
        'neutral': {'emotion': 'neutral', 'confidence': 0.65,
                    'all_emotions': [{'label': 'neutral', 'score': 0.65}, {'label': 'joy', 'score': 0.18},
                                     {'label': 'surprise', 'score': 0.10}, {'label': 'sadness', 'score': 0.07}]},
        'fear': {'emotion': 'fear', 'confidence': 0.70,
                 'all_emotions': [{'label': 'fear', 'score': 0.70}, {'label': 'sadness', 'score': 0.14},
                                  {'label': 'anger', 'score': 0.08}, {'label': 'neutral', 'score': 0.05},
                                  {'label': 'surprise', 'score': 0.03}]},
    }

    _KEYWORDS = {
        'stress': ['stress', 'overwhelm', 'tired', 'exhaust', 'burnout', 'deadline', 'pressure', 'struggling', 'difficult', 'hard'],
        'happy': ['happy', 'great', 'wonderful', 'excited', 'love', 'amazing', 'good', 'awesome', 'fantastic', 'proud', 'accomplished'],
        'angry': ['angry', 'frustrated', 'annoyed', 'furious', 'unfair', 'hate', 'mad', 'irritat'],
        'fear': ['scared', 'anxious', 'worried', 'nervous', 'afraid', 'panic', 'dread', 'uncertain'],
    }

    def analyze(self, text):
        if not text or not text.strip():
            return self._PROFILES['neutral']

        lower = text.lower()
        for mood, keywords in self._KEYWORDS.items():
            if any(kw in lower for kw in keywords):
                return self._PROFILES[mood]
        # No keyword match: stable neutral (not random) so generic text isn't mislabeled as joy
        return self._PROFILES['neutral']


class _DemoSentimentAnalyzer:
    """Fast mock sentiment analyzer for demo mode."""

    _REFRAMES = [
        "It's okay to feel this way. You've handled similar challenges before — take it one step at a time.",
        "Tough moments don't last. Let's focus on one small win right now.",
        "You're doing better than you think. Small steps count.",
        "Take a breath. You've navigated difficult situations before and come through stronger.",
        "This feeling is temporary. What's one small thing you can do right now to feel a little better?",
        "Remember, asking for help is a sign of strength, not weakness.",
        "You've already accomplished so much today. Give yourself credit for showing up.",
    ]

    _NEGATIVE = ['stress', 'sad', 'angry', 'hate', 'terrible', 'awful', 'worried', 'anxious', 'overwhelm',
                 'frustrated', 'tired', 'exhaust', 'burnout', 'struggling', 'difficult', 'hurt', 'fear']
    _POSITIVE = ['happy', 'great', 'love', 'excited', 'wonderful', 'amazing', 'good', 'awesome', 'proud', 'accomplished']

    _idx = 0

    def analyze(self, text):
        if not text or not text.strip():
            return {'sentiment': 'neutral', 'confidence': 1.0, 'all_sentiments': [], 'reframe': None}

        lower = text.lower()
        if any(w in lower for w in self._NEGATIVE):
            reframe = self._REFRAMES[self._idx % len(self._REFRAMES)]
            self._idx += 1
            return {
                'sentiment': 'negative', 'confidence': 0.82,
                'all_sentiments': [{'label': 'negative', 'score': 0.82}, {'label': 'neutral', 'score': 0.12}, {'label': 'positive', 'score': 0.06}],
                'reframe': reframe,
            }
        if any(w in lower for w in self._POSITIVE):
            return {
                'sentiment': 'positive', 'confidence': 0.88,
                'all_sentiments': [{'label': 'positive', 'score': 0.88}, {'label': 'neutral', 'score': 0.08}, {'label': 'negative', 'score': 0.04}],
                'reframe': None,
            }
        return {
            'sentiment': 'neutral', 'confidence': 0.62,
            'all_sentiments': [{'label': 'neutral', 'score': 0.62}, {'label': 'positive', 'score': 0.24}, {'label': 'negative', 'score': 0.14}],
            'reframe': None,
        }
