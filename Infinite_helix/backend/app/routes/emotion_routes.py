from flask import Blueprint, request, jsonify, current_app
from app.middleware import require_auth

emotion_bp = Blueprint('emotion', __name__)


@emotion_bp.route('/analyze', methods=['POST'])
@require_auth
def analyze_emotion():
    data = request.get_json()
    text = data.get('text', '')

    if not text.strip():
        return jsonify({'error': 'Text is required'}), 400

    detector = current_app.emotion_detector
    analyzer = current_app.sentiment_analyzer

    if detector is None:
        return jsonify({
            'emotion': 'neutral',
            'confidence': 0.65,
            'all_emotions': [
                {'label': 'neutral', 'score': 0.65},
                {'label': 'joy', 'score': 0.18},
                {'label': 'surprise', 'score': 0.10},
                {'label': 'sadness', 'score': 0.07},
            ],
            'sentiment': 'neutral',
            'all_sentiments': [],
            'reframe': None,
        })

    try:
        emotion_result = detector.analyze(text)

        sentiment_result = {'sentiment': 'neutral', 'confidence': 0, 'all_sentiments': [], 'reframe': None}
        if analyzer:
            sentiment_result = analyzer.analyze(text)

        return jsonify({
            'emotion': emotion_result.get('emotion', 'neutral'),
            'confidence': emotion_result.get('confidence', 0),
            'all_emotions': emotion_result.get('all_emotions', []),
            'sentiment': sentiment_result.get('sentiment', 'neutral'),
            'all_sentiments': sentiment_result.get('all_sentiments', []),
            'reframe': sentiment_result.get('reframe'),
        })
    except Exception as e:
        current_app.logger.error(f'Emotion analysis error: {e}')
        return jsonify({'error': 'Analysis failed'}), 500
