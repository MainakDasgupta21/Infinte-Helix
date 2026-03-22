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
                'Running with in-memory storage (data will not persist).', cred_path
            )
            _db = None
    except Exception as e:
        logger.warning(
            'Firebase initialization failed: %s. '
            'Running with in-memory storage (data will not persist).', e
        )
        _db = None

    _initialized = True
    return _db


def get_db():
    return init_firebase()


_in_memory_store = {
    'journal_entries': [],
    'hydration_logs': [],
    'mood_logs': [],
    'work_sessions': [],
    'screen_time_logs': [],
}


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
            doc['id'] = len(_in_memory_store['journal_entries']) + 1
            _in_memory_store['journal_entries'].append(doc)
    else:
        doc['id'] = len(_in_memory_store['journal_entries']) + 1
        _in_memory_store['journal_entries'].append(doc)

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
            docs = (query
                    .order_by('timestamp', direction='DESCENDING')
                    .limit(limit)
                    .stream())
            return [{'id': d.id, **d.to_dict()} for d in docs]
        except Exception as e:
            logger.warning('Firestore query failed for journal entries: %s', e)
            return []

    return sorted(
        [e for e in _in_memory_store['journal_entries'] if e.get('user_id') == user_id],
        key=lambda x: x.get('timestamp', ''), reverse=True
    )[:limit]


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
            _in_memory_store['hydration_logs'].append(doc)
    else:
        _in_memory_store['hydration_logs'].append(doc)

    return doc


def get_hydration_today(user_id):
    today = datetime.utcnow().strftime('%Y-%m-%d')
    db = get_db()

    if db:
        try:
            query = db.collection('hydration_logs')
            if FieldFilter:
                query = (query
                         .where(filter=FieldFilter('user_id', '==', user_id))
                         .where(filter=FieldFilter('date', '==', today)))
            else:
                query = (query
                         .where('user_id', '==', user_id)
                         .where('date', '==', today))
            docs = list(query.stream())
            total_ml = sum(d.to_dict().get('amount_ml', DEFAULT_AMOUNT_ML) for d in docs)
            return {'ml_today': total_ml, 'entries': len(docs)}
        except Exception as e:
            logger.warning('Firestore query failed for hydration: %s', e)
            return {'ml_today': 0, 'entries': 0}

    today_logs = [e for e in _in_memory_store['hydration_logs']
                  if e.get('user_id') == user_id and e.get('date') == today]
    total_ml = sum(e.get('amount_ml', DEFAULT_AMOUNT_ML) for e in today_logs)
    return {'ml_today': total_ml, 'entries': len(today_logs)}


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
            _in_memory_store['mood_logs'].append(doc)
    else:
        _in_memory_store['mood_logs'].append(doc)

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

    return [e for e in _in_memory_store['mood_logs']
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

    return [e for e in _in_memory_store['journal_entries']
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

    return [e for e in _in_memory_store['hydration_logs']
            if e.get('user_id') == user_id
            and start_date <= e.get('date', '') <= end_date]


def save_screen_time(user_id, data):
    """Upsert a screen-time snapshot for a given date."""
    db = get_db()
    doc = {
        'user_id': user_id,
        'date': data['date'],
        'total_hours': data.get('total_hours', 0),
        'breakdown': data.get('breakdown', {}),
        'updated_at': datetime.utcnow().isoformat(),
    }

    if db:
        try:
            doc_id = f'{user_id}_{data["date"]}'
            db.collection('screen_time_logs').document(doc_id).set(doc)
        except Exception as e:
            logger.warning('Firestore write failed for screen time: %s', e)
            _upsert_in_memory_screen_time(doc)
    else:
        _upsert_in_memory_screen_time(doc)
    return doc


def _upsert_in_memory_screen_time(doc):
    store = _in_memory_store['screen_time_logs']
    for i, existing in enumerate(store):
        if existing.get('user_id') == doc['user_id'] and existing.get('date') == doc['date']:
            store[i] = doc
            return
    store.append(doc)


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
        [e for e in _in_memory_store['screen_time_logs']
         if e.get('user_id') == user_id and start <= e.get('date', '') <= end],
        key=lambda x: x.get('date', ''),
    )


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
            _in_memory_store.setdefault('selfcare_logs', []).append(doc)
    else:
        _in_memory_store.setdefault('selfcare_logs', []).append(doc)
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
                query = (query
                         .where(filter=FieldFilter('user_id', '==', user_id))
                         .where(filter=FieldFilter('date', '==', today)))
            else:
                query = (query
                         .where('user_id', '==', user_id)
                         .where('date', '==', today))
            for d in query.stream():
                action = d.to_dict().get('action', '')
                if action in counts:
                    counts[action] += 1
            return counts
        except Exception as e:
            logger.warning('Firestore query failed for selfcare today: %s', e)
            return counts

    for e in _in_memory_store.get('selfcare_logs', []):
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

    return [e for e in _in_memory_store.get('selfcare_logs', [])
            if e.get('user_id') == user_id
            and start_date <= e.get('date', '') <= end_date]


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
            _in_memory_store.setdefault('privatecare_logs', []).append(doc)
    else:
        _in_memory_store.setdefault('privatecare_logs', []).append(doc)
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
        [e for e in _in_memory_store.get('privatecare_logs', [])
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
        [e for e in _in_memory_store.get('privatecare_logs', [])
         if e.get('user_id') == user_id
         and start_date <= e.get('date', '') <= end_date],
        key=lambda x: x.get('timestamp', ''), reverse=True,
    )


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

def save_todo(user_id, text, remind_at=None):
    db = get_db()
    todo_id = str(uuid.uuid4())[:8]
    doc = {
        'id': todo_id,
        'user_id': user_id,
        'text': text,
        'remind_at': remind_at,
        'completed': False,
        'date': datetime.utcnow().strftime('%Y-%m-%d'),
        'timestamp': datetime.utcnow().isoformat(),
    }
    if db:
        try:
            db.collection('personal_todos').document(todo_id).set(doc)
        except Exception as e:
            logger.warning('Firestore write failed for todo: %s', e)
            _in_memory_store.setdefault('personal_todos', []).append(doc)
    else:
        _in_memory_store.setdefault('personal_todos', []).append(doc)
    return doc


def get_todos_today(user_id):
    today = datetime.utcnow().strftime('%Y-%m-%d')
    db = get_db()
    if db:
        try:
            query = db.collection('personal_todos')
            if FieldFilter:
                query = (query
                         .where(filter=FieldFilter('user_id', '==', user_id))
                         .where(filter=FieldFilter('date', '==', today)))
            else:
                query = (query
                         .where('user_id', '==', user_id)
                         .where('date', '==', today))
            results = []
            for d in query.stream():
                results.append(d.to_dict())
            return sorted(results, key=lambda x: x.get('timestamp', ''))
        except Exception as e:
            logger.warning('Firestore query failed for todos: %s', e)
            return []

    return sorted(
        [t for t in _in_memory_store.get('personal_todos', [])
         if t.get('user_id') == user_id and t.get('date') == today],
        key=lambda x: x.get('timestamp', ''),
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
                ref.update({'completed': not data.get('completed', False)})
                data['completed'] = not data.get('completed', False)
                return data
            return None
        except Exception as e:
            logger.warning('Firestore toggle failed for todo: %s', e)
            return None

    for t in _in_memory_store.get('personal_todos', []):
        if t.get('id') == todo_id and t.get('user_id') == user_id:
            t['completed'] = not t.get('completed', False)
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
        store = _in_memory_store.get('personal_todos', [])
        _in_memory_store['personal_todos'] = [
            t for t in store
            if not (t.get('id') == todo_id and t.get('user_id') == user_id)
        ]
