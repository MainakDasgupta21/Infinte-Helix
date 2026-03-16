from flask import Flask
from flask_cors import CORS
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def create_app():
    app = Flask(__name__)
    app.config.from_object('config.settings.Config')
    CORS(app, resources={r"/api/*": {"origins": "*"}})

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
    from app.routes.user_routes import user_bp

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
    app.register_blueprint(user_bp, url_prefix='/api/user')

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'service': 'Infinite Helix API'}

    _init_ai_models(app)
    return app


def _init_ai_models(app):
    """Load AI models lazily — they're initialized on first request."""
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
        app.logger.warning(f'AI models not loaded (demo mode): {e}')
        app.emotion_detector = None
        app.sentiment_analyzer = None
