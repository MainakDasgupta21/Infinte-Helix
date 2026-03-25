import logging
from flask import Blueprint, request, jsonify
from app.services.chatbot_service import chatbot_service
from app.services.firebase_service import get_hydration_today
from app.services.settings_service import get_user_settings
from app.middleware import require_auth

logger = logging.getLogger(__name__)
chatbot_bp = Blueprint('chatbot', __name__)


def _gather_app_context(user_id):
    """Collect live data from other modules to give the chatbot awareness."""
    context = {}
    settings = get_user_settings(user_id)
    hydration_goal = settings.get('hydration_goal_ml', 2000)

    context['user_settings'] = settings

    try:
        hydration = get_hydration_today(user_id)
        context['hydration'] = {
            'ml_today': hydration.get('ml_today', 0),
            'goal_ml': hydration_goal,
            'entries': hydration.get('entries', 0),
        }
        ml = context['hydration']['ml_today']
        goal = context['hydration']['goal_ml']
        context['hydration']['progress'] = round(ml / goal * 100, 1) if goal else 0
    except Exception:
        context['hydration'] = {'ml_today': 0, 'goal_ml': hydration_goal, 'progress': 0}

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
@require_auth
def send_message():
    data = request.get_json(silent=True) or {}
    user_id = request.uid
    message = data.get('message', '').strip()[:2000]
    page_context = data.get('page_context') if isinstance(data.get('page_context'), dict) else {}

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    app_context = _gather_app_context(user_id)
    app_context['page_context'] = page_context

    current_page = page_context.get('current_page', 'unknown')
    has_wellness = bool(page_context.get('wellness_metrics'))
    has_page_data = bool(page_context.get('page_data'))
    other_pages = list(page_context.get('other_pages_data', {}).keys())
    logger.debug(
        "Chat context — page: %s, wellness_metrics: %s, page_data: %s, other_pages: %s",
        current_page, has_wellness, has_page_data, other_pages,
    )

    response = chatbot_service.process_message(user_id, message, app_context)

    return jsonify(response)


@chatbot_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    user_id = request.uid
    limit = request.args.get('limit', 50, type=int)
    history = chatbot_service.get_history(user_id, limit)
    return jsonify(history)


@chatbot_bp.route('/history', methods=['DELETE'])
@require_auth
def clear_history():
    user_id = request.uid
    chatbot_service.clear_history(user_id)
    return jsonify({'status': 'cleared'})


@chatbot_bp.route('/quick-replies', methods=['GET'])
@require_auth
def quick_replies():
    user_id = request.uid
    app_context = _gather_app_context(user_id)
    replies = chatbot_service.get_contextual_quick_replies(user_id, app_context)
    return jsonify(replies)
