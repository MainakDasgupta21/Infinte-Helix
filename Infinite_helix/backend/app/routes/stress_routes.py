from flask import Blueprint, request, jsonify
from datetime import datetime
import threading

stress_bp = Blueprint('stress', __name__)

_lock = threading.Lock()
_latest_metrics = {
    "keystrokes": 0,
    "backspaces": 0,
    "speed": 0,
    "window_sec": 30,
    "updated_at": None,
    "is_stressed": False,
}

_stress_log = []

KEYSTROKE_THRESHOLD = 50
BACKSPACE_THRESHOLD = 8


@stress_bp.route('/ingest', methods=['POST'])
def ingest():
    """Receives metrics from the desktop stress_agent.py."""
    data = request.get_json(force=True, silent=True) or {}
    keystrokes = data.get('keystrokes', 0)
    backspaces = data.get('backspaces', 0)
    speed = data.get('speed', 0)

    is_stressed = keystrokes >= KEYSTROKE_THRESHOLD and backspaces >= BACKSPACE_THRESHOLD

    with _lock:
        _latest_metrics.update({
            "keystrokes": keystrokes,
            "backspaces": backspaces,
            "speed": speed,
            "window_sec": data.get('window_sec', 30),
            "updated_at": datetime.utcnow().isoformat(),
            "is_stressed": is_stressed,
        })

        if is_stressed:
            event = {
                "timestamp": datetime.utcnow().isoformat(),
                "date": datetime.utcnow().strftime('%Y-%m-%d'),
                "keystrokes": keystrokes,
                "backspaces": backspaces,
                "speed": speed,
                "source": "system_agent",
            }
            _stress_log.append(event)
            if len(_stress_log) > 500:
                _stress_log[:] = _stress_log[-500:]

    return jsonify({"status": "ok", "is_stressed": is_stressed}), 200


@stress_bp.route('/latest', methods=['GET'])
def latest():
    """Returns latest metrics for the frontend to poll."""
    with _lock:
        return jsonify(_latest_metrics), 200


@stress_bp.route('/log', methods=['GET'])
def log():
    """Returns stress event history."""
    days = request.args.get('days', 7, type=int)
    with _lock:
        return jsonify({"events": _stress_log[-100:], "total": len(_stress_log)}), 200


@stress_bp.route('/resolve', methods=['POST'])
def resolve():
    """Records how the user responded to a stress alert."""
    data = request.get_json(force=True, silent=True) or {}
    resolution = data.get('resolution', 'dismissed')

    with _lock:
        if _stress_log:
            _stress_log[-1]['resolution'] = resolution
        _latest_metrics['is_stressed'] = False

    return jsonify({"status": "ok"}), 200
