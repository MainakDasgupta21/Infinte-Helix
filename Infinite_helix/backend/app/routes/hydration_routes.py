from flask import Blueprint, request, jsonify
from app.services.firebase_service import log_hydration, get_hydration_today

hydration_bp = Blueprint('hydration', __name__)


@hydration_bp.route('/log', methods=['POST'])
def log_water():
    user_id = request.get_json().get('user_id', 'demo-user-001') if request.is_json else 'demo-user-001'
    entry = log_hydration(user_id)
    count = get_hydration_today(user_id)
    return jsonify({
        'status': 'logged',
        'glasses_today': count,
        'entry': entry,
    })


@hydration_bp.route('/today', methods=['GET'])
def get_today():
    user_id = request.args.get('user_id', 'demo-user-001')
    count = get_hydration_today(user_id)
    return jsonify({
        'glasses': count,
        'goal': 8,
        'progress': round(count / 8 * 100, 1),
    })
