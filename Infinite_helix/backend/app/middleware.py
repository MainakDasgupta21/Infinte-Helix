import logging
from functools import wraps
from flask import request, jsonify

logger = logging.getLogger(__name__)

DEMO_USER_ID = 'demo-user-001'
DEMO_EMAIL = 'demo@helix.app'


def _verify_firebase_token(id_token):
    """Verify Firebase ID token. Returns decoded claims or None."""
    try:
        from app.services.firebase_service import init_firebase
        init_firebase()
        import firebase_admin.auth as fb_auth
        return fb_auth.verify_id_token(id_token)
    except Exception:
        return None


def require_auth(f):
    """Verify the Firebase Bearer token and set request.uid.

    In demo mode (DEMO_MODE=true), requests without a valid token are
    still allowed but assigned a deterministic demo user identity.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        header = request.headers.get('Authorization', '')

        if header.startswith('Bearer '):
            token = header.split('Bearer ', 1)[1]
            claims = _verify_firebase_token(token)
            if claims:
                request.uid = claims.get('uid')
                request.email = claims.get('email', '')
                request.auth_claims = claims
                return f(*args, **kwargs)

        from flask import current_app
        if current_app.config.get('DEMO_MODE', False):
            request.uid = DEMO_USER_ID
            request.email = DEMO_EMAIL
            request.auth_claims = {}
            return f(*args, **kwargs)

        return jsonify({'error': 'Authentication required'}), 401

    return decorated
