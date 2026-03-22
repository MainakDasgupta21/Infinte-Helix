import os
import logging
from flask import Blueprint, jsonify, request, redirect
from app.services.calendar_service import CalendarService

logger = logging.getLogger(__name__)

calendar_bp = Blueprint('calendar', __name__)
calendar_service = CalendarService()

FRONTEND_URL = 'http://localhost:3000'


@calendar_bp.route('/meetings', methods=['GET'])
def get_meetings():
    meetings = calendar_service.get_todays_meetings()
    return jsonify(meetings)


@calendar_bp.route('/next', methods=['GET'])
def get_next_meeting():
    meeting = calendar_service.get_next_meeting()
    if meeting:
        return jsonify(meeting)
    return jsonify({'message': 'No upcoming meetings'}), 204


@calendar_bp.route('/status', methods=['GET'])
def connection_status():
    return jsonify(calendar_service.get_connection_status())


@calendar_bp.route('/authorize', methods=['GET'])
def authorize():
    missing = []
    if not os.getenv('MS_CLIENT_ID'):
        missing.append('MS_CLIENT_ID')
    if not os.getenv('MS_CLIENT_SECRET'):
        missing.append('MS_CLIENT_SECRET')

    tenant = os.getenv('MS_TENANT_ID', 'common')
    if tenant.startswith('your-') or not tenant:
        missing.append('MS_TENANT_ID')

    if missing:
        msg = f"Microsoft OAuth not configured. Missing or invalid: {', '.join(missing)}"
        logger.warning(msg)
        return jsonify({
            'message': msg,
            'help': 'Set these values in your backend .env file. '
                    'Register an app at portal.azure.com with Calendars.Read permission.',
            'missing': missing,
        }), 200

    url = calendar_service.get_authorize_url()
    if url:
        return jsonify({'authorize_url': url})
    return jsonify({
        'message': 'Failed to generate authorization URL. Check server logs for details.',
    }), 500


@calendar_bp.route('/callback', methods=['GET'])
def oauth_callback():
    code = request.args.get('code')
    error = request.args.get('error')
    error_desc = request.args.get('error_description', '')

    if error:
        logger.error("OAuth callback error from Azure: [%s] %s", error, error_desc)
        return redirect(f"{FRONTEND_URL}/calendar?error={error}")

    if not code:
        logger.error("OAuth callback received without authorization code")
        return redirect(f"{FRONTEND_URL}/calendar?error=no_code")

    success, result = calendar_service.handle_callback(code)

    if success:
        return redirect(f"{FRONTEND_URL}/calendar?connected=true")
    logger.error("OAuth callback: handle_callback failed — %s", result)
    return redirect(f"{FRONTEND_URL}/calendar?error={result}")


@calendar_bp.route('/disconnect', methods=['POST'])
def disconnect():
    calendar_service.disconnect()
    return jsonify({'message': 'Disconnected from Microsoft Calendar'})
