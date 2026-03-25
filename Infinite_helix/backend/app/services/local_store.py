"""SQLite-backed persistence for demo/dev mode when Firestore is unavailable.

Provides the same logical operations that the in-memory dicts used to offer,
but survives server restarts.  The DB file lives at ``<backend>/data/local.db``.
"""

import json
import os
import sqlite3
import threading
import uuid
import logging
from contextlib import contextmanager

logger = logging.getLogger(__name__)

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_DEFAULT_DB_PATH = os.path.join(_BACKEND_ROOT, 'data', 'local.db')


class LocalStore:

    def __init__(self, db_path=None):
        self._db_path = db_path or _DEFAULT_DB_PATH
        os.makedirs(os.path.dirname(self._db_path), exist_ok=True)
        self._lock = threading.Lock()
        self._init_db()
        logger.info('LocalStore ready at %s', self._db_path)

    @contextmanager
    def _conn(self):
        """Yield a SQLite connection that auto-commits and auto-closes."""
        conn = sqlite3.connect(self._db_path, timeout=10)
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('PRAGMA busy_timeout=5000')
        try:
            with conn:
                yield conn
        finally:
            conn.close()

    def _init_db(self):
        with self._conn() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS documents (
                    collection TEXT NOT NULL,
                    doc_id     TEXT NOT NULL,
                    data       TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    PRIMARY KEY (collection, doc_id)
                )
            ''')
            conn.execute(
                'CREATE INDEX IF NOT EXISTS idx_coll ON documents(collection)'
            )

    # ------------------------------------------------------------------
    # Core CRUD
    # ------------------------------------------------------------------

    def insert(self, collection, doc):
        """Insert *doc* (dict).  Uses ``doc['id']`` as the key, or generates one."""
        doc_id = str(doc.get('id') or uuid.uuid4().hex[:12])
        doc.setdefault('id', doc_id)
        with self._lock:
            with self._conn() as conn:
                conn.execute(
                    'INSERT OR REPLACE INTO documents (collection, doc_id, data) '
                    'VALUES (?, ?, ?)',
                    (collection, doc_id, json.dumps(doc, default=str)),
                )
        return doc_id

    def get_all(self, collection):
        """Return every document in *collection* ordered by insertion time."""
        with self._conn() as conn:
            rows = conn.execute(
                'SELECT data FROM documents WHERE collection = ? ORDER BY created_at',
                (collection,),
            ).fetchall()
        return [json.loads(r[0]) for r in rows]

    def get_by_id(self, collection, doc_id):
        """Return a single document, or ``None``."""
        with self._conn() as conn:
            row = conn.execute(
                'SELECT data FROM documents WHERE collection = ? AND doc_id = ?',
                (collection, doc_id),
            ).fetchone()
        return json.loads(row[0]) if row else None

    def upsert(self, collection, doc_id, data):
        """Insert-or-replace a document keyed by *doc_id*."""
        with self._lock:
            with self._conn() as conn:
                conn.execute(
                    'INSERT OR REPLACE INTO documents (collection, doc_id, data) '
                    'VALUES (?, ?, ?)',
                    (collection, str(doc_id), json.dumps(data, default=str)),
                )

    def delete(self, collection, doc_id):
        """Delete a single document."""
        with self._lock:
            with self._conn() as conn:
                conn.execute(
                    'DELETE FROM documents WHERE collection = ? AND doc_id = ?',
                    (collection, str(doc_id)),
                )


# ------------------------------------------------------------------
# Module-level singleton
# ------------------------------------------------------------------
_instance = None


def get_local_store() -> LocalStore:
    global _instance
    if _instance is None:
        _instance = LocalStore()
    return _instance
