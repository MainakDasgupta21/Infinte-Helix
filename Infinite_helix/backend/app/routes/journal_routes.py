from flask import Blueprint, request, jsonify, current_app
from app.services.firebase_service import save_journal_entry, get_journal_entries
from app.ai.wellness_advisor import generate_wellness_suggestions
from app.middleware import require_auth

journal_bp = Blueprint('journal', __name__)


@journal_bp.route('', methods=['POST'])
@require_auth
def create_entry():
    data = request.get_json()
    text = data.get('text', '')
    user_id = request.uid

    if not text.strip():
        return jsonify({'error': 'Text is required'}), 400

    emotion_data = {'emotion': 'neutral', 'confidence': 0, 'all_emotions': []}
    sentiment_data = {'sentiment': 'neutral', 'confidence': 0, 'all_sentiments': [], 'reframe': None}

    detector = current_app.emotion_detector
    analyzer = current_app.sentiment_analyzer

    if detector:
        emotion_data = detector.analyze(text)
    if analyzer:
        sentiment_data = analyzer.analyze(text)

    emotion = emotion_data.get('emotion', 'neutral')
    sentiment = sentiment_data.get('sentiment', 'neutral')
    confidence = emotion_data.get('confidence', 0)

    suggestions = generate_wellness_suggestions(emotion, sentiment, confidence, text)

    combined = {
        'emotion': emotion,
        'confidence': confidence,
        'all_emotions': emotion_data.get('all_emotions', []),
        'sentiment': sentiment,
        'reframe': sentiment_data.get('reframe'),
        'all_sentiments': sentiment_data.get('all_sentiments', []),
        'suggestions': suggestions,
    }

    entry = save_journal_entry(user_id, {
        'text': text,
        'emotion': emotion,
        'confidence': confidence,
        'sentiment': sentiment,
    })

    return jsonify({**entry, **combined}), 201


@journal_bp.route('', methods=['GET'])
@require_auth
def list_entries():
    user_id = request.uid
    limit = int(request.args.get('limit', 20))
    entries = get_journal_entries(user_id, limit)
    return jsonify(entries)


@journal_bp.route('/<entry_id>', methods=['GET'])
@require_auth
def get_entry(entry_id):
    return jsonify({'id': entry_id, 'message': 'Entry detail endpoint'})
