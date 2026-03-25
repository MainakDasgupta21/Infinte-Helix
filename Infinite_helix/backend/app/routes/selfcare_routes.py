from flask import Blueprint, request, jsonify
from app.services.firebase_service import log_selfcare_action, get_selfcare_today
from app.middleware import require_auth

selfcare_bp = Blueprint('selfcare', __name__)

DAILY_GOALS = {'stretch': 25, 'eye_rest': 30}


@selfcare_bp.route('/log', methods=['POST'])
@require_auth
def log_action():
    data = request.get_json(silent=True) or {}
    user_id = request.uid
    action = data.get('action')

    if action not in ('stretch', 'eye_rest'):
        return jsonify({'error': 'action must be stretch or eye_rest'}), 400

    entry = log_selfcare_action(user_id, action)
    counts = get_selfcare_today(user_id)
    return jsonify({
        'status': 'logged',
        'action': action,
        'counts': counts,
        'goals': DAILY_GOALS,
        'entry': entry,
    })


@selfcare_bp.route('/today', methods=['GET'])
@require_auth
def get_today():
    user_id = request.uid
    counts = get_selfcare_today(user_id)
    return jsonify({
        'counts': counts,
        'goals': DAILY_GOALS,
    })
