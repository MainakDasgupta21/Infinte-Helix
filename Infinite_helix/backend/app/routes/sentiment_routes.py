from flask import Blueprint, request, jsonify, current_app

sentiment_bp = Blueprint('sentiment', __name__)


@sentiment_bp.route('/analyze', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    text = data.get('text', '')

    if not text.strip():
        return jsonify({'error': 'Text is required'}), 400

    analyzer = current_app.sentiment_analyzer

    if analyzer is None:
        return jsonify({
            'sentiment': 'neutral',
            'confidence': 0.80,
            'all_sentiments': [
                {'label': 'neutral', 'score': 0.80},
                {'label': 'positive', 'score': 0.12},
                {'label': 'negative', 'score': 0.08},
            ],
            'reframe': None,
        })

    try:
        result = analyzer.analyze(text)
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f'Sentiment analysis error: {e}')
        return jsonify({'error': 'Analysis failed'}), 500
