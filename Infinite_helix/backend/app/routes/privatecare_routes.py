from flask import Blueprint, request, jsonify
from app.services.firebase_service import log_privatecare, get_privatecare_logs, get_privatecare_for_period

privatecare_bp = Blueprint('privatecare', __name__)


@privatecare_bp.route('/log', methods=['POST'])
def log_entry():
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', 'demo-user-001')
    note = data.get('note', '')
    care_type = data.get('type', 'pad_change')

    entry = log_privatecare(user_id, care_type, note)
    return jsonify({'status': 'logged', 'entry': entry})


@privatecare_bp.route('/history', methods=['GET'])
def get_history():
    user_id = request.args.get('user_id', 'demo-user-001')
    days = int(request.args.get('days', 90))
    logs = get_privatecare_logs(user_id, days)
    return jsonify({'logs': logs, 'total': len(logs)})


@privatecare_bp.route('/period-history', methods=['GET'])
def get_period_history():
    """Get care logs for a specific date range — useful for monthly view."""
    user_id = request.args.get('user_id', 'demo-user-001')
    start = request.args.get('start')
    end = request.args.get('end')
    if not start or not end:
        return jsonify({'error': 'start and end query params required (YYYY-MM-DD)'}), 400
    logs = get_privatecare_for_period(user_id, start, end)
    return jsonify({'logs': logs, 'total': len(logs)})
