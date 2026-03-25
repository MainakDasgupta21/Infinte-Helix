from flask import Blueprint, request, jsonify
from app.ai.nudge_engine import NudgeEngine
from app.notifications.notification_manager import notification_manager
from app.services.settings_service import get_user_settings
from app.middleware import require_auth
import app as app_module

nudge_bp = Blueprint('nudge', __name__)
nudge_engine = NudgeEngine()

_FREQUENCY_COOLDOWNS = {'minimal': 30, 'balanced': 15, 'frequent': 8}


@nudge_bp.route('/generate', methods=['POST'])
@require_auth
def generate_nudge():
    context = request.get_json() or {}
    user_id = request.uid

    settings = get_user_settings(user_id)
    if not settings.get('notifications', True):
        return jsonify({'message': 'Notifications disabled'}), 204

    freq = settings.get('nudge_frequency', 'balanced')
    nudge_engine.cooldown_minutes = _FREQUENCY_COOLDOWNS.get(freq, 15)

    monitor = app_module.activity_monitor
    if monitor:
        stats = monitor.stats
        context.setdefault('continuous_work_minutes', stats.get('continuous_work_minutes', 0))
        context.setdefault('typing_intensity', stats.get('typing_intensity', 0))

    nudge = nudge_engine.generate(context)

    if nudge:
        notification_manager.send(
            nudge_type=nudge['type'],
            message=nudge['message'],
            priority=nudge['priority'],
            user_id=user_id,
        )
        return jsonify(nudge)

    return jsonify({'message': 'No nudge needed right now'}), 204


@nudge_bp.route('/pending', methods=['GET'])
@require_auth
def get_pending():
    user_id = request.uid
    pending = notification_manager.get_pending(user_id)
    return jsonify(pending)


@nudge_bp.route('/<int:nudge_id>/dismiss', methods=['POST'])
@require_auth
def dismiss_nudge(nudge_id):
    success = notification_manager.dismiss(nudge_id)
    if success:
        return jsonify({'status': 'dismissed'})
    return jsonify({'error': 'Nudge not found'}), 404
