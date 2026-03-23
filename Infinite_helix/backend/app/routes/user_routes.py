from flask import Blueprint, request, jsonify
from app.models.user import default_user
from app.services.firebase_service import get_db

user_bp = Blueprint('user', __name__)

_user_settings_cache = {}


def _load_settings(user_id):
    """Load settings from Firestore, falling back to in-memory cache then defaults."""
    db = get_db()
    if db:
        try:
            doc = db.collection('users').document(user_id).get()
            if doc.exists:
                return doc.to_dict().get('settings', {})
        except Exception:
            pass
    if user_id in _user_settings_cache:
        return _user_settings_cache[user_id]
    return default_user(user_id, 'User', '')['settings']


def _save_settings(user_id, settings):
    """Save settings to Firestore and in-memory cache."""
    _user_settings_cache[user_id] = settings
    db = get_db()
    if db:
        try:
            db.collection('users').document(user_id).set(
                {'settings': settings}, merge=True
            )
        except Exception:
            pass


@user_bp.route('/settings', methods=['GET'])
def get_settings():
    user_id = request.args.get('user_id', 'demo-user-001')
    return jsonify(_load_settings(user_id))


@user_bp.route('/settings', methods=['PUT'])
def update_settings():
    user_id = request.get_json().get('user_id', 'demo-user-001')
    settings = request.get_json().get('settings', {})
    _save_settings(user_id, settings)
    return jsonify({'status': 'updated', 'settings': settings})


@user_bp.route('/profile', methods=['GET'])
def get_profile():
    user_id = request.args.get('user_id', 'demo-user-001')
    db = get_db()
    if db:
        try:
            doc = db.collection('users').document(user_id).get()
            if doc.exists:
                data = doc.to_dict()
                name = data.get('display_name', 'User')
                initials = ''.join(w[0].upper() for w in name.split()[:2]) if name else 'U'
                return jsonify({
                    'uid': user_id,
                    'display_name': name,
                    'email': data.get('email', ''),
                    'initials': initials,
                })
        except Exception:
            pass
    return jsonify({
        'uid': user_id,
        'display_name': 'User',
        'email': '',
        'initials': 'U',
    })
