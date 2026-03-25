import os
import logging
import uuid
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

try:
    from google.cloud.firestore_v1.base_query import FieldFilter
except ImportError:
    FieldFilter = None

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

_db = None
_initialized = False


def init_firebase():
    """Initialize Firebase Admin SDK. Safe to call multiple times."""
    global _db, _initialized
    if _initialized:
        return _db

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', './config/firebase-credentials.json')
        if not os.path.isabs(cred_path):
            cred_path = os.path.join(_BACKEND_ROOT, cred_path)
        cred_path = os.path.normpath(cred_path)

        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _db = firestore.client()
            logger.info('Firebase Admin SDK initialized successfully')
        else:
            logger.warning(
                'Firebase credentials not found at %s. '
                'Using SQLite local storage (data persists across restarts).', cred_path
            )
            _db = None
    except Exception as e:
        logger.warning(
            'Firebase initialization failed: %s. '
            'Using SQLite local storage (data persists across restarts).', e
        )
        _db = None

    _initialized = True
    return _db


def get_db():
    return init_firebase()


def _local():
    """Lazily return the SQLite-backed local store singleton."""
    from app.services.local_store import get_local_store
    return get_local_store()


# ---------------------------------------------------------------------------
# Journal entries
# ---------------------------------------------------------------------------

def save_journal_entry(user_id, entry):
    db = get_db()
    doc = {
        'user_id': user_id,
        'text': entry['text'],
        'emotion': entry.get('emotion', 'neutral'),
        'confidence': entry.get('confidence', 0),
        'sentiment': entry.get('sentiment', 'neutral'),
        'reframe': entry.get('reframe'),
        'all_emotions': entry.get('all_emotions', []),
        'all_sentiments': entry.get('all_sentiments', []),
        'timestamp': datetime.utcnow().isoformat(),
    }

    if db:
        try:
            db.collection('journal_entries').add(doc)
        except Exception as e:
            logger.warning('Firestore write failed for journal entry: %s', e)
            doc['id'] = uuid.uuid4().hex[:12]
            _local().insert('journal_entries', doc)
    else:
        doc['id'] = uuid.uuid4().hex[:12]
        _local().insert('journal_entries', doc)

    return doc


def get_journal_entries(user_id, limit=20):
    db = get_db()
    if db:
        try:
            query = db.collection('journal_entries')
            if FieldFilter:
                query = query.where(filter=FieldFilter('user_id', '==', user_id))
            else:
                query = query.where('user_id', '==', user_id)
            results = [{'id': d.id, **d.to_dict()} for d in query.stream()]
            results.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            return results[:limit]
        except Exception as e:
            logger.warning('Firestore query failed for journal entries: %s', e)
            return []

    return sorted(
        [e for e in _local().get_all('journal_entries') if e.get('user_id') == user_id],
        key=lambda x: x.get('timestamp', ''), reverse=True
    )[:limit]


# ---------------------------------------------------------------------------
# Hydration
# ---------------------------------------------------------------------------

DEFAULT_AMOUNT_ML = 250


def log_hydration(user_id, amount_ml=None):
    if amount_ml is None:
        amount_ml = DEFAULT_AMOUNT_ML
    amount_ml = max(1, int(amount_ml))

    db = get_db()
    doc = {
        'user_id': user_id,
        'amount_ml': amount_ml,
        'timestamp': datetime.utcnow().isoformat(),
        'date': datetime.utcnow().strftime('%Y-%m-%d'),
    }

    if db:
        try:
            db.collection('hydration_logs').add(doc)
        except Exception as e:
            logger.warning('Firestore write failed for hydration log: %s', e)
            _local().insert('hydration_logs', doc)
    else:
        _local().insert('hydration_logs', doc)

    return doc


def get_hydration_today(user_id):
    today = datetime.utcnow().strftime('%Y-%m-%d')
    db = get_db()

    if db:
        try:
            query = db.collection('hydration_logs')
            if FieldFilter:
                query = query.where(filter=FieldFilter('user_id', '==', user_id))
            else:
                query = query.where('user_id', '==', user_id)
            docs = [d.to_dict() for d in query.stream()
                    if d.to_dict().get('date') == today]
            total_ml = sum(d.get('amount_ml', DEFAULT_AMOUNT_ML) for d in docs)
            return {'ml_today': total_ml, 'entries': len(docs)}
        except Exception as e:
            logger.warning('Firestore query failed for hydration: %s', e)
            return {'ml_today': 0, 'entries': 0}

    today_logs = [e for e in _local().get_all('hydration_logs')
                  if e.get('user_id') == user_id and e.get('date') == today]
    total_ml = sum(e.get('amount_ml', DEFAULT_AMOUNT_ML) for e in today_logs)
    return {'ml_today': total_ml, 'entries': len(today_logs)}


# ---------------------------------------------------------------------------
# Mood logs
# ---------------------------------------------------------------------------

def save_mood_log(user_id, mood_data):
    db = get_db()
    doc = {
        'user_id': user_id,
        'emotion': mood_data.get('emotion'),
        'sentiment': mood_data.get('sentiment'),
        'confidence': mood_data.get('confidence'),
        'source': mood_data.get('source', 'auto-detect'),
        'timestamp': datetime.utcnow().isoformat(),
    }

    if db:
        try:
            db.collection('mood_logs').add(doc)
        except Exception as e:
            logger.warning('Firestore write failed for mood log: %s', e)
            _local().insert('mood_logs', doc)
    else:
        _local().insert('mood_logs', doc)

    return doc


# ---------------------------------------------------------------------------
# READ-ONLY query helpers for dashboard & reports
# These functions only READ from the database — no writes, no schema changes.
# ---------------------------------------------------------------------------

def get_mood_logs_for_period(user_id, start_date, end_date):
    """Return mood logs whose timestamp falls within [start_date, end_date] (YYYY-MM-DD)."""
    db = get_db()
    if db:
        try:
            query = db.collection('mood_logs')
            if FieldFilter:
                query = query.where(filter=FieldFilter('user_id', '==', user_id))
            else:
                query = query.where('user_id', '==', user_id)
            results = []
            for d in query.stream():
                doc = d.to_dict()
                ts_date = doc.get('timestamp', '')[:10]
                if start_date <= ts_date <= end_date:
                    results.append(doc)
            return results
        except Exception as e:
            logger.warning('Firestore query failed for mood logs period: %s', e)
            return []

    return [e for e in _local().get_all('mood_logs')
            if e.get('user_id') == user_id
            and start_date <= e.get('timestamp', '')[:10] <= end_date]


def get_journal_entries_for_period(user_id, start_date, end_date):
    """Return journal entries whose timestamp falls within [start_date, end_date] (YYYY-MM-DD)."""
    db = get_db()
    if db:
        try:
            query = db.collection('journal_entries')
            if FieldFilter:
                query = query.where(filter=FieldFilter('user_id', '==', user_id))
            else:
                query = query.where('user_id', '==', user_id)
            results = []
            for d in query.stream():
                doc = d.to_dict()
                ts_date = doc.get('timestamp', '')[:10]
                if start_date <= ts_date <= end_date:
                    results.append(doc)
            return results
        except Exception as e:
            logger.warning('Firestore query failed for journal entries period: %s', e)
            return []

    return [e for e in _local().get_all('journal_entries')
            if e.get('user_id') == user_id
            and start_date <= e.get('timestamp', '')[:10] <= end_date]


def get_hydration_for_period(user_id, start_date, end_date):
    """Return hydration logs whose date falls within [start_date, end_date] (YYYY-MM-DD)."""
    db = get_db()
    if db:
        try:
            query = db.collection('hydration_logs')
            if FieldFilter:
                query = query.where(filter=FieldFilter('user_id', '==', user_id))
            else:
                query = query.where('user_id', '==', user_id)
            results = []
            for d in query.stream():
                doc = d.to_dict()
                log_date = doc.get('date', doc.get('timestamp', '')[:10])
                if start_date <= log_date <= end_date:
                    results.append(doc)
            return results
        except Exception as e:
            logger.warning('Firestore query failed for hydration period: %s', e)
            return []

    return [e for e in _local().get_all('hydration_logs')
            if e.get('user_id') == user_id
            and start_date <= e.get('date', '') <= end_date]


# ---------------------------------------------------------------------------
# Screen time
# ---------------------------------------------------------------------------

def save_screen_time(user_id, data):
    """Upsert a screen-time snapshot for a given date."""
    db = get_db()
    doc_id = f'{user_id}_{data["date"]}'
    doc = {
        'id': doc_id,
        'user_id': user_id,
        'date': data['date'],
        'total_hours': data.get('total_hours', 0),
        'breakdown': data.get('breakdown', {}),
        'updated_at': datetime.utcnow().isoformat(),
    }

    if db:
        try:
            db.collection('screen_time_logs').document(doc_id).set(doc)
        except Exception as e:
            logger.warning('Firestore write failed for screen time: %s', e)
            _local().upsert('screen_time_logs', doc_id, doc)
    else:
        _local().upsert('screen_time_logs', doc_id, doc)
    return doc


def get_screen_time_history(user_id, days=7):
    """Return screen-time snapshots for the last *days* calendar days."""
    today = datetime.utcnow()
    start = (today - timedelta(days=days - 1)).strftime('%Y-%m-%d')
    end = today.strftime('%Y-%m-%d')

    db = get_db()
    if db:
        try:
            query = db.collection('screen_time_logs')
            if FieldFilter:
                query = query.where(filter=FieldFilter('user_id', '==', user_id))
            else:
                query = query.where('user_id', '==', user_id)
            results = []
            for d in query.stream():
                doc = d.to_dict()
                if start <= doc.get('date', '') <= end:
                    results.append(doc)
            return sorted(results, key=lambda x: x.get('date', ''))
        except Exception as e:
            logger.warning('Firestore query failed for screen time history: %s', e)
            return []

    return sorted(
        [e for e in _local().get_all('screen_time_logs')
         if e.get('user_id') == user_id and start <= e.get('date', '') <= end],
        key=lambda x: x.get('date', ''),
    )


# ---------------------------------------------------------------------------
# Self-care
# ---------------------------------------------------------------------------

def log_selfcare_action(user_id, action_type):
    """Log a self-care action (stretch, eye_rest). action_type: 'stretch' | 'eye_rest'."""
    db = get_db()
    doc = {
        'user_id': user_id,
        'action': action_type,
        'timestamp': datetime.utcnow().isoformat(),
        'date': datetime.utcnow().strftime('%Y-%m-%d'),
    }
    if db:
        try:
            db.collection('selfcare_logs').add(doc)
        except Exception as e:
            logger.warning('Firestore write failed for selfcare log: %s', e)
            _local().insert('selfcare_logs', doc)
    else:
        _local().insert('selfcare_logs', doc)
    return doc


def get_selfcare_today(user_id):
    """Return today's self-care action counts."""
    today = datetime.utcnow().strftime('%Y-%m-%d')
    db = get_db()
    counts = {'stretch': 0, 'eye_rest': 0}

    if db:
        try:
            query = db.collection('selfcare_logs')
            if FieldFilter:
                query = query.where(filter=FieldFilter('user_id', '==', user_id))
            else:
                query = query.where('user_id', '==', user_id)
            for d in query.stream():
                doc = d.to_dict()
                if doc.get('date') != today:
                    continue
                action = doc.get('action', '')
                if action in counts:
                    counts[action] += 1
            return counts
        except Exception as e:
            logger.warning('Firestore query failed for selfcare today: %s', e)
            return counts

    for e in _local().get_all('selfcare_logs'):
        if e.get('user_id') == user_id and e.get('date') == today:
            action = e.get('action', '')
            if action in counts:
                counts[action] += 1
    return counts


def get_selfcare_for_period(user_id, start_date, end_date):
    """Return self-care logs for a date range."""
    db = get_db()
    if db:
        try:
            query = db.collection('selfcare_logs')
            if FieldFilter:
                query = query.where(filter=FieldFilter('user_id', '==', user_id))
            else:
                query = query.where('user_id', '==', user_id)
            results = []
            for d in query.stream():
                doc = d.to_dict()
                log_date = doc.get('date', doc.get('timestamp', '')[:10])
                if start_date <= log_date <= end_date:
                    results.append(doc)
            return results
        except Exception as e:
            logger.warning('Firestore query failed for selfcare period: %s', e)
            return []

    return [e for e in _local().get_all('selfcare_logs')
            if e.get('user_id') == user_id
            and start_date <= e.get('date', '') <= end_date]


# ---------------------------------------------------------------------------
# Private care
# ---------------------------------------------------------------------------

def log_privatecare(user_id, care_type, note=''):
    """Log a private care action (pad_change, freshen_up, etc.)."""
    db = get_db()
    doc = {
        'user_id': user_id,
        'type': care_type,
        'note': note,
        'timestamp': datetime.utcnow().isoformat(),
        'date': datetime.utcnow().strftime('%Y-%m-%d'),
        'time': datetime.utcnow().strftime('%H:%M'),
    }
    if db:
        try:
            db.collection('privatecare_logs').add(doc)
        except Exception as e:
            logger.warning('Firestore write failed for privatecare log: %s', e)
            _local().insert('privatecare_logs', doc)
    else:
        _local().insert('privatecare_logs', doc)
    return doc


def get_privatecare_logs(user_id, days=90):
    """Return private care logs for the last N days, newest first."""
    cutoff = (datetime.utcnow() - timedelta(days=days)).strftime('%Y-%m-%d')
    db = get_db()
    if db:
        try:
            query = db.collection('privatecare_logs')
            if FieldFilter:
                query = query.where(filter=FieldFilter('user_id', '==', user_id))
            else:
                query = query.where('user_id', '==', user_id)
            results = []
            for d in query.stream():
                doc = d.to_dict()
                if doc.get('date', '') >= cutoff:
                    results.append(doc)
            return sorted(results, key=lambda x: x.get('timestamp', ''), reverse=True)
        except Exception as e:
            logger.warning('Firestore query failed for privatecare logs: %s', e)
            return []

    return sorted(
        [e for e in _local().get_all('privatecare_logs')
         if e.get('user_id') == user_id and e.get('date', '') >= cutoff],
        key=lambda x: x.get('timestamp', ''), reverse=True,
    )


def get_privatecare_for_period(user_id, start_date, end_date):
    """Return private care logs for a date range."""
    db = get_db()
    if db:
        try:
            query = db.collection('privatecare_logs')
            if FieldFilter:
                query = query.where(filter=FieldFilter('user_id', '==', user_id))
            else:
                query = query.where('user_id', '==', user_id)
            results = []
            for d in query.stream():
                doc = d.to_dict()
                log_date = doc.get('date', '')
                if start_date <= log_date <= end_date:
                    results.append(doc)
            return sorted(results, key=lambda x: x.get('timestamp', ''), reverse=True)
        except Exception as e:
            logger.warning('Firestore query failed for privatecare period: %s', e)
            return []

    return sorted(
        [e for e in _local().get_all('privatecare_logs')
         if e.get('user_id') == user_id
         and start_date <= e.get('date', '') <= end_date],
        key=lambda x: x.get('timestamp', ''), reverse=True,
    )


# ---------------------------------------------------------------------------
# Activity streak
# ---------------------------------------------------------------------------

def get_activity_streak(user_id):
    """Count consecutive days (ending today) with at least one journal or hydration entry."""
    today = datetime.utcnow()
    lookback = (today - timedelta(days=60)).strftime('%Y-%m-%d')
    today_str = today.strftime('%Y-%m-%d')

    hydration = get_hydration_for_period(user_id, lookback, today_str)
    journals = get_journal_entries_for_period(user_id, lookback, today_str)

    active_dates = set()
    for log in hydration:
        active_dates.add(log.get('date', log.get('timestamp', '')[:10]))
    for entry in journals:
        active_dates.add(entry.get('timestamp', '')[:10])

    streak = 0
    for days_back in range(61):
        check = (today - timedelta(days=days_back)).strftime('%Y-%m-%d')
        if check in active_dates:
            streak += 1
        else:
            break
    return streak


# ---------------------------------------------------------------------------
# Personal Todos / Reminders
# ---------------------------------------------------------------------------

def save_todo(user_id, text, remind_at=None, date=None, category=None):
    db = get_db()
    todo_id = str(uuid.uuid4())[:8]
    todo_date = date or datetime.utcnow().strftime('%Y-%m-%d')
    doc = {
        'id': todo_id,
        'user_id': user_id,
        'text': text,
        'remind_at': remind_at,
        'completed': False,
        'date': todo_date,
        'category': category or 'work',
        'created_at': datetime.utcnow().isoformat(),
        'timestamp': datetime.utcnow().isoformat(),
    }
    if db:
        try:
            db.collection('personal_todos').document(todo_id).set(doc)
        except Exception as e:
            logger.warning('Firestore write failed for todo: %s', e)
            _local().insert('personal_todos', doc)
    else:
        _local().insert('personal_todos', doc)
    return doc


def get_todos_today(user_id):
    today = datetime.utcnow().strftime('%Y-%m-%d')
    return get_todos_by_date(user_id, today)


def get_todos_by_date(user_id, date):
    db = get_db()
    if db:
        try:
            query = db.collection('personal_todos')
            if FieldFilter:
                query = (query
                         .where(filter=FieldFilter('user_id', '==', user_id))
                         .where(filter=FieldFilter('date', '==', date)))
            else:
                query = (query
                         .where('user_id', '==', user_id)
                         .where('date', '==', date))
            results = []
            for d in query.stream():
                results.append(d.to_dict())
            return sorted(results, key=lambda x: x.get('timestamp', ''))
        except Exception as e:
            logger.warning('Firestore query failed for todos: %s', e)
            return []

    return sorted(
        [t for t in _in_memory_store.get('personal_todos', [])
         if t.get('user_id') == user_id and t.get('date') == date],
        key=lambda x: x.get('timestamp', ''),
    )


def get_todos_upcoming(user_id):
    """Return all incomplete todos for today and future dates, sorted by date then time."""
    today = datetime.utcnow().strftime('%Y-%m-%d')
    db = get_db()
    if db:
        try:
            query = db.collection('personal_todos')
            if FieldFilter:
                query = query.where(filter=FieldFilter('user_id', '==', user_id))
            else:
                query = query.where('user_id', '==', user_id)
            results = []
            for d in query.stream():
                doc = d.to_dict()
                if doc.get('date', '') >= today and not doc.get('completed', False):
                    results.append(doc)
            return sorted(results, key=lambda x: (x.get('date', ''), x.get('remind_at') or '99:99'))
        except Exception as e:
            logger.warning('Firestore query failed for upcoming todos: %s', e)
            return []

    return sorted(
<<<<<<< HEAD
        [t for t in _in_memory_store.get('personal_todos', [])
         if t.get('user_id') == user_id and t.get('date', '') >= today and not t.get('completed', False)],
        key=lambda x: (x.get('date', ''), x.get('remind_at') or '99:99'),
    )


def get_todo_history(user_id, days=30):
    """Return all todos (completed and pending) for the last N days, newest first."""
    cutoff = (datetime.utcnow() - timedelta(days=days)).strftime('%Y-%m-%d')
    db = get_db()
    if db:
        try:
            query = db.collection('personal_todos')
            if FieldFilter:
                query = query.where(filter=FieldFilter('user_id', '==', user_id))
            else:
                query = query.where('user_id', '==', user_id)
            results = []
            for d in query.stream():
                doc = d.to_dict()
                if doc.get('date', '') >= cutoff:
                    results.append(doc)
            return sorted(results, key=lambda x: (x.get('date', ''), x.get('timestamp', '')), reverse=True)
        except Exception as e:
            logger.warning('Firestore query failed for todo history: %s', e)
            return []

    return sorted(
        [t for t in _in_memory_store.get('personal_todos', [])
         if t.get('user_id') == user_id and t.get('date', '') >= cutoff],
        key=lambda x: (x.get('date', ''), x.get('timestamp', '')),
        reverse=True,
=======
        [t for t in _local().get_all('personal_todos')
         if t.get('user_id') == user_id and t.get('date') == today],
        key=lambda x: x.get('timestamp', ''),
>>>>>>> 9aa662e (Add middleware, calendar providers, theme support, and UI improvement)
    )


def toggle_todo(user_id, todo_id):
    db = get_db()
    if db:
        try:
            ref = db.collection('personal_todos').document(todo_id)
            doc = ref.get()
            if doc.exists:
                data = doc.to_dict()
                if data.get('user_id') != user_id:
                    return None
                new_completed = not data.get('completed', False)
                ref.update({'completed': new_completed})
                data['completed'] = new_completed
                return data
            return None
        except Exception as e:
            logger.warning('Firestore toggle failed for todo: %s', e)
            return None

    t = _local().get_by_id('personal_todos', todo_id)
    if t and t.get('user_id') == user_id:
        t['completed'] = not t.get('completed', False)
        _local().upsert('personal_todos', todo_id, t)
        return t
    return None


def delete_todo(user_id, todo_id):
    db = get_db()
    if db:
        try:
            ref = db.collection('personal_todos').document(todo_id)
            doc = ref.get()
            if doc.exists and doc.to_dict().get('user_id') == user_id:
                ref.delete()
        except Exception as e:
            logger.warning('Firestore delete failed for todo: %s', e)
    else:
        existing = _local().get_by_id('personal_todos', todo_id)
        if existing and existing.get('user_id') == user_id:
            _local().delete('personal_todos', todo_id)


# ---------------------------------------------------------------------------
# Calendar OAuth tokens (per-user, per-provider)
# ---------------------------------------------------------------------------

def save_calendar_token(user_id, provider, token_data):
    """Persist an OAuth token for a calendar provider, keyed by user+provider."""
    db = get_db()
    doc_id = f'{user_id}_{provider}'
    doc = {
        'id': doc_id,
        'user_id': user_id,
        'provider': provider,
        'access_token': token_data.get('access_token'),
        'refresh_token': token_data.get('refresh_token'),
        'expires_at': token_data.get('expires_at', 0),
        'user_info': token_data.get('user_info'),
        'updated_at': datetime.utcnow().isoformat(),
    }
    if db:
        try:
            db.collection('calendar_tokens').document(doc_id).set(doc)
        except Exception as e:
            logger.warning('Firestore write failed for calendar token: %s', e)
            _local().upsert('calendar_tokens', doc_id, doc)
    else:
        _local().upsert('calendar_tokens', doc_id, doc)


def get_calendar_token(user_id, provider):
    """Retrieve stored OAuth token for a user+provider. Returns dict or None."""
    db = get_db()
    doc_id = f'{user_id}_{provider}'
    if db:
        try:
            ref = db.collection('calendar_tokens').document(doc_id)
            doc = ref.get()
            if doc.exists:
                return doc.to_dict()
        except Exception as e:
            logger.warning('Firestore read failed for calendar token: %s', e)
            return None
    else:
        return _local().get_by_id('calendar_tokens', doc_id)
    return None


def delete_calendar_token(user_id, provider):
    """Remove stored OAuth token for a user+provider."""
    db = get_db()
    doc_id = f'{user_id}_{provider}'
    if db:
        try:
            db.collection('calendar_tokens').document(doc_id).delete()
        except Exception as e:
            logger.warning('Firestore delete failed for calendar token: %s', e)
    else:
        _local().delete('calendar_tokens', doc_id)
