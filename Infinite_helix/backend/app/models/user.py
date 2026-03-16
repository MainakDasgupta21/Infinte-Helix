"""
Firestore User document schema.

Collection: users
Document ID: Firebase Auth UID

Fields:
    display_name    str     User's display name
    email           str     Email address
    settings        dict    User preferences
        notifications       bool    Enable notifications
        nudge_frequency     str     'minimal' | 'balanced' | 'frequent'
        hydration_goal      int     Daily glass target
        cycle_mode_enabled  bool    Enable cycle energy mode
        cycle_phase         str     Current phase or None
    created_at      str     ISO timestamp
    updated_at      str     ISO timestamp
"""


def default_user(uid, display_name, email):
    return {
        'uid': uid,
        'display_name': display_name,
        'email': email,
        'settings': {
            'notifications': True,
            'nudge_frequency': 'balanced',
            'hydration_goal': 8,
            'cycle_mode_enabled': False,
            'cycle_phase': None,
        },
        'created_at': None,
        'updated_at': None,
    }
