from flask import Blueprint, request, jsonify, current_app

emotion_bp = Blueprint('emotion', __name__)


@emotion_bp.route('/analyze', methods=['POST'])
def analyze_emotion():
    data = request.get_json()
    text = data.get('text', '')

    if not text.strip():
        return jsonify({'error': 'Text is required'}), 400

    detector = current_app.emotion_detector

    if detector is None:
        # Demo fallback when AI models aren't loaded
        return jsonify({
            'emotion': 'neutral',
            'confidence': 0.85,
            'all_emotions': [
                {'label': 'neutral', 'score': 0.85},
                {'label': 'joy', 'score': 0.08},
                {'label': 'sadness', 'score': 0.04},
                {'label': 'anger', 'score': 0.03},
            ],
            'sentiment': 'neutral',
            'reframe': None,
        })

    try:
        emotion_result = detector.analyze(text)

        sentiment_result = {'sentiment': 'neutral', 'reframe': None}
        if current_app.sentiment_analyzer:
            sentiment_result = current_app.sentiment_analyzer.analyze(text)

        return jsonify({
            **emotion_result,
            'sentiment': sentiment_result.get('sentiment', 'neutral'),
            'reframe': sentiment_result.get('reframe'),
        })
    except Exception as e:
        current_app.logger.error(f'Emotion analysis error: {e}')
        return jsonify({'error': 'Analysis failed'}), 500
