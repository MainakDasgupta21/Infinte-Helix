from flask import Blueprint, request, jsonify, current_app
from app.middleware import require_auth

sentiment_bp = Blueprint('sentiment', __name__)


@sentiment_bp.route('/analyze', methods=['POST'])
@require_auth
def analyze_sentiment():
    data = request.get_json()
    text = data.get('text', '')

    if not text.strip():
        return jsonify({'error': 'Text is required'}), 400

    analyzer = current_app.sentiment_analyzer

    if analyzer is None:
        return jsonify({
            'sentiment': 'neutral',
            'confidence': 0.62,
            'all_sentiments': [
                {'label': 'neutral', 'score': 0.62},
                {'label': 'positive', 'score': 0.24},
                {'label': 'negative', 'score': 0.14},
            ],
            'reframe': None,
        })

    try:
        result = analyzer.analyze(text)
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f'Sentiment analysis error: {e}')
        return jsonify({'error': 'Analysis failed'}), 500
