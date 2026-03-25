import os
import logging
from flask import Blueprint, jsonify, request, redirect
from app.services.calendar_service import CalendarManager
from app.middleware import require_auth

logger = logging.getLogger(__name__)

calendar_bp = Blueprint('calendar', __name__)
calendar_mgr = CalendarManager()

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')


# ── Read operations ───────────────────────────────────────────────

@calendar_bp.route('/meetings', methods=['GET'])
@require_auth
def get_meetings():
    meetings = calendar_mgr.get_todays_meetings(request.uid)
    return jsonify(meetings)


@calendar_bp.route('/next', methods=['GET'])
@require_auth
def get_next_meeting():
    meeting = calendar_mgr.get_next_meeting(request.uid)
    if meeting:
        return jsonify(meeting)
    return jsonify({'message': 'No upcoming meetings'}), 204


@calendar_bp.route('/status', methods=['GET'])
@require_auth
def connection_status():
    return jsonify(calendar_mgr.get_connection_status(request.uid))


# ── OAuth — authorize ─────────────────────────────────────────────

@calendar_bp.route('/authorize', methods=['GET'])
@require_auth
def authorize():
    """Start OAuth for a provider.  ``?provider=microsoft|google`` (default: microsoft)."""
    provider = request.args.get('provider', 'microsoft')
    result = calendar_mgr.get_authorize_url(provider, request.uid)

    if 'authorize_url' in result:
        return jsonify(result)

    status = 200 if 'missing' in result else 500
    return jsonify(result), status


# ── OAuth — callbacks (unauthenticated, called by IdP) ────────────

def _handle_oauth_callback(provider_name: str):
    """Shared logic for both Microsoft and Google OAuth callbacks.

    The ``state`` query param carries ``provider:firebase_uid`` so we
    can attribute the token to the correct user even though the
    callback itself is unauthenticated.
    """
    code = request.args.get('code')
    error = request.args.get('error')
    error_desc = request.args.get('error_description', '')

    if error:
        logger.error('OAuth %s callback error: [%s] %s', provider_name, error, error_desc)
        return redirect(f'{FRONTEND_URL}/calendar?error={error}')

    if not code:
        logger.error('OAuth %s callback: no authorization code', provider_name)
        return redirect(f'{FRONTEND_URL}/calendar?error=no_code')

    state = request.args.get('state', '')
    parts = state.split(':', 1)
    user_id = parts[1] if len(parts) == 2 else 'demo-user-001'

    success, result = calendar_mgr.handle_callback(provider_name, code, user_id)

    if success:
        return redirect(f'{FRONTEND_URL}/calendar?connected=true&provider={provider_name}')

    logger.error('OAuth %s callback failed: %s', provider_name, result)
    return redirect(f'{FRONTEND_URL}/calendar?error={result}')


@calendar_bp.route('/callback', methods=['GET'])
def microsoft_oauth_callback():
    return _handle_oauth_callback('microsoft')


@calendar_bp.route('/google/callback', methods=['GET'])
def google_oauth_callback():
    return _handle_oauth_callback('google')


# ── Disconnect ────────────────────────────────────────────────────

@calendar_bp.route('/disconnect', methods=['POST'])
@require_auth
def disconnect():
    provider = request.args.get('provider') or (request.get_json(silent=True) or {}).get('provider', 'microsoft')
    calendar_mgr.disconnect(provider, request.uid)
    return jsonify({'message': f'Disconnected from {provider}'})


# ── Event creation ────────────────────────────────────────────────

@calendar_bp.route('/events', methods=['POST'])
@require_auth
def create_event():
    body = request.get_json(force=True)
    title = body.get('title')
    start_iso = body.get('start_iso')
    end_iso = body.get('end_iso')

    if not title or not start_iso or not end_iso:
        return jsonify({'error': 'title, start_iso, and end_iso are required'}), 400

    result = calendar_mgr.create_event(request.uid, {
        'title': title,
        'start_iso': start_iso,
        'end_iso': end_iso,
        'description': body.get('description', ''),
    })

    if result:
        return jsonify(result), 201
    return jsonify({'error': 'No connected calendar provider available'}), 503
