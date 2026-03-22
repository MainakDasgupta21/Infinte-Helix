from flask import Blueprint, request, jsonify
from app.services.chatbot_service import chatbot_service
from app.services.firebase_service import get_hydration_today

chatbot_bp = Blueprint('chatbot', __name__)


def _gather_app_context(user_id):
    """Collect live data from other modules to give the chatbot awareness."""
    context = {}

    try:
        hydration = get_hydration_today(user_id)
        context['hydration'] = {
            'ml_today': hydration.get('ml_today', 0),
            'goal_ml': 2000,
            'entries': hydration.get('entries', 0),
        }
        ml = context['hydration']['ml_today']
        goal = context['hydration']['goal_ml']
        context['hydration']['progress'] = round(ml / goal * 100, 1) if goal else 0
    except Exception:
        context['hydration'] = {'ml_today': 0, 'goal_ml': 2000, 'progress': 0}

    try:
        from flask import current_app
        monitor = getattr(current_app, '_activity_monitor', None)
        if monitor:
            stats = monitor.stats
            context['activity'] = {
                'continuous_work_minutes': stats.get('continuous_work_minutes', 0),
                'minutes_since_break': stats.get('minutes_since_break', 0),
            }
    except Exception:
        pass

    return context


@chatbot_bp.route('/message', methods=['POST'])
def send_message():
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', 'demo-user-001')
    message = data.get('message', '').strip()

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    app_context = _gather_app_context(user_id)
    response = chatbot_service.process_message(user_id, message, app_context)

    return jsonify(response)


@chatbot_bp.route('/history', methods=['GET'])
def get_history():
    user_id = request.args.get('user_id', 'demo-user-001')
    limit = request.args.get('limit', 50, type=int)
    history = chatbot_service.get_history(user_id, limit)
    return jsonify(history)


@chatbot_bp.route('/history', methods=['DELETE'])
def clear_history():
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', request.args.get('user_id', 'demo-user-001'))
    chatbot_service.clear_history(user_id)
    return jsonify({'status': 'cleared'})


@chatbot_bp.route('/quick-replies', methods=['GET'])
def quick_replies():
    user_id = request.args.get('user_id', 'demo-user-001')
    app_context = _gather_app_context(user_id)
    replies = chatbot_service.get_contextual_quick_replies(user_id, app_context)
    return jsonify(replies)
