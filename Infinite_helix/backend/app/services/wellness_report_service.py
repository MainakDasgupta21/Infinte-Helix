from datetime import datetime


DEMO_WEEKLY_REPORT = {
    'period': {
        'start': '2026-03-10',
        'end': '2026-03-16',
    },
    'summary': {
        'avg_score': 74,
        'total_focus_hours': 28.5,
        'breaks_per_day': 4.8,
        'mood_trend': 'improving',
        'top_emotion': 'focused',
        'hydration_avg': 4.2,
        'hydration_goal': 8,
    },
    'daily_scores': [65, 72, 68, 80, 78, 45, 0],
    'work_hours': {
        'focus': [6.2, 5.8, 7.1, 6.5, 5.0, 1.2, 0],
        'breaks': [0.8, 1.0, 0.6, 0.9, 1.2, 0.3, 0],
    },
    'stress_heatmap': [
        [2, 3, 5, 4, 2, 3, 6, 5, 3],
        [1, 2, 4, 3, 2, 4, 5, 4, 2],
        [3, 4, 6, 7, 3, 5, 7, 6, 4],
        [2, 3, 5, 4, 2, 3, 4, 3, 2],
        [1, 2, 3, 2, 1, 2, 3, 2, 1],
    ],
    'insights': [
        {'type': 'positive', 'title': 'Productivity Up 12%', 'detail': 'Focus sessions increased from 3.2 to 4.1 per day.'},
        {'type': 'warning', 'title': 'Hydration Needs Attention', 'detail': 'Averaged 4.2 glasses/day — below your 8 glass goal.'},
        {'type': 'positive', 'title': 'Great Break Balance', 'detail': 'Breaks every 72 min on average — close to ideal 90 min cycle.'},
        {'type': 'tip', 'title': 'Peak Focus: 9-11 AM', 'detail': 'Highest concentration consistently in morning hours.'},
    ],
    'emotion_distribution': {
        'joy': 35, 'neutral': 30, 'focused': 20, 'sadness': 8, 'anger': 4, 'fear': 3,
    },
}


class WellnessReportService:
    """Generates weekly wellness reports from stored data."""

    def generate_weekly(self, user_id):
        """
        In production, this would aggregate data from Firestore.
        For the prototype, returns rich demo data.
        """
        return DEMO_WEEKLY_REPORT

    def calculate_score(self, metrics):
        weights = {
            'focus_time': 0.25,
            'break_balance': 0.20,
            'hydration': 0.15,
            'mood_stability': 0.15,
            'screen_time': 0.10,
            'stretch_compliance': 0.15,
        }

        score = 0
        for key, weight in weights.items():
            value = metrics.get(key, 50)
            score += value * weight

        return min(100, max(0, round(score)))
