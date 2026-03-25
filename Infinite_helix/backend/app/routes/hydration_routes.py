from flask import Blueprint, request, jsonify
from app.services.firebase_service import log_hydration, get_hydration_today, DEFAULT_AMOUNT_ML
from app.services.settings_service import get_user_settings
from app.middleware import require_auth

hydration_bp = Blueprint('hydration', __name__)


@hydration_bp.route('/log', methods=['POST'])
@require_auth
def log_water():
    data = request.get_json(silent=True) or {}
    user_id = request.uid
    amount_ml = data.get('amount_ml', DEFAULT_AMOUNT_ML)
    goal = get_user_settings(user_id).get('hydration_goal_ml', 2000)
    entry = log_hydration(user_id, amount_ml=amount_ml)
    today = get_hydration_today(user_id)
    return jsonify({
        'status': 'logged',
        'ml_today': today['ml_today'],
        'entries_today': today['entries'],
        'goal_ml': goal,
        'entry': entry,
    })


@hydration_bp.route('/today', methods=['GET'])
@require_auth
def get_today():
    user_id = request.uid
    today = get_hydration_today(user_id)
    goal = get_user_settings(user_id).get('hydration_goal_ml', 2000)
    ml = today['ml_today']
    return jsonify({
        'ml_today': ml,
        'goal_ml': goal,
        'entries_today': today['entries'],
        'default_amount_ml': DEFAULT_AMOUNT_ML,
        'progress': round(ml / goal * 100, 1) if goal else 0,
    })
