from flask import Blueprint, jsonify
from app.services.calendar_service import CalendarService

calendar_bp = Blueprint('calendar', __name__)
calendar_service = CalendarService()


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


@calendar_bp.route('/authorize', methods=['GET'])
def authorize():
    url = calendar_service.get_authorize_url()
    if url:
        return jsonify({'authorize_url': url})
    return jsonify({'message': 'Google Calendar not configured. Using demo data.'}), 200


@calendar_bp.route('/callback', methods=['GET'])
def oauth_callback():
    return jsonify({'message': 'OAuth callback — implement token exchange in production'})
