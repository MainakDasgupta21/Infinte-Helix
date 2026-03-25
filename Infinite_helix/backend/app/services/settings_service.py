"""Centralized settings loader so every backend module resolves the same
user preferences (hydration goal, nudge frequency, cycle mode, etc.)."""

import logging

logger = logging.getLogger(__name__)

_DEFAULTS = {
    'notifications': True,
    'desktop_notifs': True,
    'sound_enabled': False,
    'nudge_frequency': 'balanced',
    'hydration_goal_ml': 2000,
    'cycle_mode_enabled': True,
    'data_sharing': False,
    'cycle_phase': None,
}


def get_user_settings(user_id: str) -> dict:
    """Return the user's settings merged over the built-in defaults.

    Resolution order: defaults ← Firestore/SQLite stored values.
    """
    stored = _load_stored(user_id)
    return {**_DEFAULTS, **stored}


def _load_stored(user_id: str) -> dict:
    from app.services.firebase_service import get_db

    db = get_db()
    if db:
        try:
            doc = db.collection('users').document(user_id).get()
            if doc.exists:
                return doc.to_dict().get('settings', {})
        except Exception:
            logger.debug('Firestore settings read failed for %s', user_id)

    from app.services.local_store import get_local_store
    cached = get_local_store().get_by_id('user_settings', user_id)
    return cached if cached else {}
