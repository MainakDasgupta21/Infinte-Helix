from flask import Blueprint, request, jsonify
from app.models.user import default_user

user_bp = Blueprint('user', __name__)

_user_settings_cache = {}


@user_bp.route('/settings', methods=['GET'])
def get_settings():
    user_id = request.args.get('user_id', 'demo-user-001')
    if user_id in _user_settings_cache:
        return jsonify(_user_settings_cache[user_id])
    return jsonify(default_user(user_id, 'Ananya Sharma', 'ananya@company.com')['settings'])


@user_bp.route('/settings', methods=['PUT'])
def update_settings():
    user_id = request.get_json().get('user_id', 'demo-user-001')
    settings = request.get_json().get('settings', {})
    _user_settings_cache[user_id] = settings
    return jsonify({'status': 'updated', 'settings': settings})


@user_bp.route('/profile', methods=['GET'])
def get_profile():
    return jsonify({
        'uid': 'demo-user-001',
        'display_name': 'Ananya Sharma',
        'email': 'ananya.sharma@company.com',
        'initials': 'AS',
    })
