from flask import Blueprint, jsonify
from app.tracker.screen_tracker import ScreenTracker

tracker_bp = Blueprint('tracker', __name__)
screen_tracker = ScreenTracker()


@tracker_bp.route('/status', methods=['GET'])
def get_status():
    screen_data = screen_tracker.get_screen_time()
    system_data = screen_tracker.get_system_stats()
    return jsonify({
        'status': 'active',
        'screen': screen_data,
        'system': system_data,
    })


@tracker_bp.route('/start', methods=['POST'])
def start_tracker():
    return jsonify({'status': 'tracking_started'})


@tracker_bp.route('/stop', methods=['POST'])
def stop_tracker():
    return jsonify({'status': 'tracking_stopped'})
