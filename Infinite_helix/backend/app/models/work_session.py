"""
Firestore Work Session document schema.

Collection: work_sessions
Auto-generated document ID

Fields:
    user_id                 str     Firebase Auth UID
    date                    str     YYYY-MM-DD
    start_time              str     ISO timestamp
    end_time                str     ISO timestamp or None (active)
    total_keystrokes        int     Total keystrokes in session
    typing_intensity_avg    float   Avg keystrokes/min
    idle_periods            int     Number of idle periods
    breaks_taken            int     Number of breaks detected
    screen_time_hours       float   Total screen time
    focus_score             int     Calculated focus score (0-100)
    apps_breakdown          dict    {category: hours}
"""


def create_work_session(user_id, date):
    return {
        'user_id': user_id,
        'date': date,
        'start_time': None,
        'end_time': None,
        'total_keystrokes': 0,
        'typing_intensity_avg': 0.0,
        'idle_periods': 0,
        'breaks_taken': 0,
        'screen_time_hours': 0.0,
        'focus_score': 0,
        'apps_breakdown': {},
    }
