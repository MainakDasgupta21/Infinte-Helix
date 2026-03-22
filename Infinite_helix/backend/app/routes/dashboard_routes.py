from flask import Blueprint, jsonify, request
from app.tracker.screen_tracker import screen_tracker
from app.services.firebase_service import (
    get_hydration_today, get_activity_streak, get_mood_logs_for_period,
    save_screen_time, get_screen_time_history, get_selfcare_today,
)
import app as app_module
import time
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/today', methods=['GET'])
def get_today():
    user_id = request.args.get('user_id', 'demo-user-001')

    screen_data = screen_tracker.get_screen_time(user_id)
    save_screen_time(user_id, screen_tracker.get_snapshot_for_save(user_id))
    monitor = app_module.activity_monitor
    activity = monitor.stats if monitor else {}

    try:
        hydration_data = get_hydration_today(user_id)
        ml_today = hydration_data['ml_today']
    except Exception:
        ml_today = 0

    continuous = activity.get('continuous_work_minutes', 0)
    typing = activity.get('typing_intensity', 0)
    session_min = activity.get('session_duration_minutes', 0)

    focus_score = min(100, int(50 + typing * 0.3 + min(continuous, 90) * 0.2))
    breaks_taken = max(1, int(session_min / 60)) if session_min > 30 else 0
    score = _calculate_wellness_score(focus_score, breaks_taken, ml_today, continuous)

    breakdown = screen_data.get('breakdown', {})

    focus_sessions = _build_focus_sessions(activity, focus_score)

    last_break = '--:--'
    if continuous > 0 and session_min > 0:
        last_break_dt = datetime.now() - timedelta(minutes=continuous)
        last_break = last_break_dt.strftime('%H:%M')

    avg_break_dur = 0
    if breaks_taken > 0 and session_min > continuous:
        avg_break_dur = round((session_min - continuous) / breaks_taken, 1)

    try:
        streak = get_activity_streak(user_id)
    except Exception:
        streak = 0

    mood = _get_current_mood(user_id, typing)

    try:
        selfcare = get_selfcare_today(user_id)
    except Exception:
        selfcare = {'stretch': 0, 'eye_rest': 0}

    return jsonify({
        'screenTime': {
            'total': round(screen_data.get('total_hours', 0), 1),
            'goal': 8,
            'breakdown': breakdown,
        },
        'focusSessions': focus_sessions,
        'breaks': {
            'taken': breaks_taken,
            'suggested': 6,
            'lastBreak': last_break,
            'avgDuration': avg_break_dur,
        },
        'hydration': {
            'ml_today': ml_today,
            'goal_ml': 2000,
            'default_amount_ml': 250,
        },
        'score': score,
        'mood': mood,
        'streakDays': streak,
        'activity': {
            'keystrokes': activity.get('keystrokes_total', 0),
            'typing_intensity': typing,
            'idle_seconds': activity.get('idle_seconds', 0),
            'is_idle': activity.get('is_idle', False),
            'continuous_work_minutes': continuous,
        },
        'selfCare': {
            'stretch': selfcare.get('stretch', 0),
            'eye_rest': selfcare.get('eye_rest', 0),
            'goals': {'stretch': 25, 'eye_rest': 30},
        },
    })


def _build_focus_sessions(activity, focus_score):
    """Derive focus session blocks from the real activity monitor session."""
    session_min = activity.get('session_duration_minutes', 0)
    if session_min < 5:
        return []

    session_start = datetime.now() - timedelta(minutes=session_min)
    sessions = []
    labels = ['Deep Work', 'Code Review', 'Feature Dev', 'Documentation']
    remaining = session_min
    block_start = session_start
    idx = 0

    while remaining > 0:
        block_len = min(remaining, 75)
        if block_len < 10:
            break
        block_end = block_start + timedelta(minutes=block_len)
        block_score = max(30, min(100, focus_score + (10 - idx * 5)))
        sessions.append({
            'start': block_start.strftime('%H:%M'),
            'end': block_end.strftime('%H:%M'),
            'score': block_score,
            'label': labels[idx % len(labels)],
        })
        idx += 1
        block_start = block_end + timedelta(minutes=10)
        remaining -= (block_len + 10)

    return sessions


def _get_current_mood(user_id, typing_intensity):
    """Return the latest mood log emotion for today, or a fallback."""
    try:
        today = datetime.utcnow().strftime('%Y-%m-%d')
        logs = get_mood_logs_for_period(user_id, today, today)
        if logs:
            latest = sorted(logs, key=lambda x: x.get('timestamp', ''), reverse=True)[0]
            return latest.get('emotion', 'neutral')
    except Exception:
        pass
    return 'focused' if typing_intensity > 30 else 'neutral'


def _calculate_wellness_score(focus, breaks, ml_today, continuous):
    focus_norm = min(focus, 100) * 0.25
    break_norm = min(breaks / 6, 1.0) * 100 * 0.20
    hydration_norm = min(ml_today / 2000, 1.0) * 100 * 0.20
    overwork_penalty = max(0, continuous - 120) * 0.15
    base = focus_norm + break_norm + hydration_norm + 35 - overwork_penalty
    return max(10, min(100, int(base)))


@dashboard_bp.route('/screen-history', methods=['GET'])
def get_screen_history():
    user_id = request.args.get('user_id', 'demo-user-001')
    days = request.args.get('days', 7, type=int)
    days = max(1, min(days, 30))

    history = get_screen_time_history(user_id, days)

    today_snap = screen_tracker.get_snapshot_for_save(user_id)
    today_date = today_snap['date']
    history = [h for h in history if h.get('date') != today_date]
    history.append({
        'date': today_date,
        'total_hours': today_snap['total_hours'],
        'breakdown': today_snap['breakdown'],
    })
    history.sort(key=lambda x: x.get('date', ''))

    return jsonify({'history': history, 'days': days})
