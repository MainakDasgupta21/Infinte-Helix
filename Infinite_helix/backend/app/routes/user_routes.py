from flask import Blueprint, request, jsonify
from app.services.firebase_service import get_db
from app.services.settings_service import get_user_settings
from app.middleware import require_auth

user_bp = Blueprint('user', __name__)


def _save_settings(user_id, settings):
    """Save settings to Firestore and local SQLite."""
    from app.services.local_store import get_local_store
    get_local_store().upsert('user_settings', user_id, settings)
    db = get_db()
    if db:
        try:
            db.collection('users').document(user_id).set(
                {'settings': settings}, merge=True
            )
        except Exception:
            pass


@user_bp.route('/settings', methods=['GET'])
@require_auth
def get_settings():
    user_id = request.uid
    return jsonify(get_user_settings(user_id))


@user_bp.route('/settings', methods=['PUT'])
@require_auth
def update_settings():
    user_id = request.uid
    incoming = request.get_json().get('settings', {})
    existing = get_user_settings(user_id)
    merged = {**existing, **incoming}
    _save_settings(user_id, merged)
    return jsonify({'status': 'updated', 'settings': merged})


@user_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile():
    user_id = request.uid
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
