from flask import Blueprint, jsonify
import time

dashboard_bp = Blueprint('dashboard', __name__)

SESSION_START = time.time()


@dashboard_bp.route('/today', methods=['GET'])
def get_today():
    elapsed_hours = round((time.time() - SESSION_START) / 3600, 2)

    return jsonify({
        'screenTime': {
            'total': min(elapsed_hours + 4.0, 10),
            'goal': 8,
            'breakdown': {
                'coding': round(elapsed_hours * 0.5 + 2.0, 1),
                'meetings': 1.2,
                'browsing': 0.7,
                'email': 0.5,
            }
        },
        'focusSessions': [
            {'start': '09:00', 'end': '10:30', 'score': 92, 'label': 'Deep Work'},
            {'start': '11:00', 'end': '12:15', 'score': 78, 'label': 'Code Review'},
            {'start': '14:00', 'end': '15:00', 'score': 85, 'label': 'Feature Dev'},
            {'start': '15:30', 'end': '16:45', 'score': 70, 'label': 'Documentation'},
        ],
        'breaks': {
            'taken': 4,
            'suggested': 6,
            'lastBreak': '14:55',
            'avgDuration': 8,
        },
        'hydration': {
            'glasses': 5,
            'goal': 8,
        },
        'score': 78,
        'mood': 'focused',
        'streakDays': 5,
    })
