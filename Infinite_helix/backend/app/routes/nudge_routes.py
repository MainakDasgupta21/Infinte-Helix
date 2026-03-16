from flask import Blueprint, request, jsonify
from app.ai.nudge_engine import NudgeEngine
from app.notifications.notification_manager import notification_manager

nudge_bp = Blueprint('nudge', __name__)
nudge_engine = NudgeEngine()


@nudge_bp.route('/generate', methods=['POST'])
def generate_nudge():
    context = request.get_json() or {}
    nudge = nudge_engine.generate(context)

    if nudge:
        notification_manager.send(
            nudge_type=nudge['type'],
            message=nudge['message'],
            priority=nudge['priority'],
            user_id=context.get('user_id'),
        )
        return jsonify(nudge)

    return jsonify({'message': 'No nudge needed right now'}), 204


@nudge_bp.route('/pending', methods=['GET'])
def get_pending():
    user_id = request.args.get('user_id')
    pending = notification_manager.get_pending(user_id)
    return jsonify(pending)


@nudge_bp.route('/<int:nudge_id>/dismiss', methods=['POST'])
def dismiss_nudge(nudge_id):
    success = notification_manager.dismiss(nudge_id)
    if success:
        return jsonify({'status': 'dismissed'})
    return jsonify({'error': 'Nudge not found'}), 404
