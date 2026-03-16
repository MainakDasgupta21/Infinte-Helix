from flask import Blueprint, request, jsonify, current_app
from app.services.firebase_service import save_journal_entry, get_journal_entries

journal_bp = Blueprint('journal', __name__)


@journal_bp.route('', methods=['POST'])
def create_entry():
    data = request.get_json()
    text = data.get('text', '')
    user_id = data.get('user_id', 'demo-user-001')

    if not text.strip():
        return jsonify({'error': 'Text is required'}), 400

    emotion_data = {}
    detector = current_app.emotion_detector
    analyzer = current_app.sentiment_analyzer

    if detector:
        emotion_data = detector.analyze(text)
    if analyzer:
        sentiment_data = analyzer.analyze(text)
        emotion_data['sentiment'] = sentiment_data.get('sentiment', 'neutral')
        emotion_data['reframe'] = sentiment_data.get('reframe')

    entry = save_journal_entry(user_id, {
        'text': text,
        'emotion': emotion_data.get('emotion', 'neutral'),
        'confidence': emotion_data.get('confidence', 0),
        'sentiment': emotion_data.get('sentiment', 'neutral'),
    })

    return jsonify({**entry, **emotion_data}), 201


@journal_bp.route('', methods=['GET'])
def list_entries():
    user_id = request.args.get('user_id', 'demo-user-001')
    limit = int(request.args.get('limit', 20))
    entries = get_journal_entries(user_id, limit)
    return jsonify(entries)


@journal_bp.route('/<entry_id>', methods=['GET'])
def get_entry(entry_id):
    return jsonify({'id': entry_id, 'message': 'Entry detail endpoint'})
