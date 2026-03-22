from flask import Blueprint, jsonify
from app.tracker.screen_tracker import screen_tracker
import app as app_module

tracker_bp = Blueprint('tracker', __name__)


@tracker_bp.route('/status', methods=['GET'])
def get_status():
    screen_data = screen_tracker.get_screen_time()
    system_data = screen_tracker.get_system_stats()

    monitor = app_module.activity_monitor
    activity_data = monitor.stats if monitor else {
        'keystrokes_total': 0,
        'typing_intensity': 0,
        'mouse_moves': 0,
        'idle_seconds': 0,
        'is_idle': False,
        'continuous_work_minutes': 0,
        'session_duration_minutes': 0,
    }

    return jsonify({
        'status': 'active' if monitor else 'inactive',
        'screen': screen_data,
        'system': system_data,
        'activity': activity_data,
    })


@tracker_bp.route('/start', methods=['POST'])
def start_tracker():
    monitor = app_module.activity_monitor
    if monitor and not monitor._running:
        import threading
        t = threading.Thread(target=monitor.start, daemon=True)
        t.start()
    return jsonify({'status': 'tracking_started'})


@tracker_bp.route('/stop', methods=['POST'])
def stop_tracker():
    monitor = app_module.activity_monitor
    if monitor:
        monitor.stop()
    return jsonify({'status': 'tracking_stopped'})
