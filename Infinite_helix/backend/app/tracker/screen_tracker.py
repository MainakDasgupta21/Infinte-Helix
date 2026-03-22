import time
import threading
from datetime import datetime, date
import psutil


class ScreenTracker:
    """
    Tracks screen time per calendar day, per user.
    Automatically resets at midnight and supports Firestore persistence.
    """

    _instance = None
    _instance_lock = threading.Lock()

    def __new__(cls):
        with cls._instance_lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._lock = threading.Lock()
        self._users = {}  # user_id -> { today, day_start, app_usage }
        self._initialized = True

    def _get_user(self, user_id):
        """Return the per-user tracking dict, creating one if needed."""
        if user_id not in self._users:
            self._users[user_id] = {
                'today': date.today(),
                'day_start': time.time(),
                'app_usage': {},
            }
        return self._users[user_id]

    def _check_day_rollover(self, user_id):
        """Reset counters if the calendar day has changed; returns old data when a rollover occurs."""
        u = self._get_user(user_id)
        now = date.today()
        if now != u['today']:
            old_snapshot = self._build_snapshot(user_id, u)
            u['today'] = now
            u['day_start'] = time.time()
            u['app_usage'] = {}
            return old_snapshot
        return None

    def _build_snapshot(self, user_id, u):
        elapsed_hours = (time.time() - u['day_start']) / 3600
        return {
            'user_id': user_id,
            'date': u['today'].isoformat(),
            'total_hours': round(elapsed_hours, 2),
            'breakdown': self._get_breakdown(elapsed_hours),
        }

    def get_screen_time(self, user_id='demo-user-001'):
        with self._lock:
            stale = self._check_day_rollover(user_id)
            if stale:
                self._persist_snapshot(stale)

            u = self._get_user(user_id)
            elapsed_hours = (time.time() - u['day_start']) / 3600
            return {
                'total_hours': round(elapsed_hours, 2),
                'breakdown': self._get_breakdown(elapsed_hours),
                'active_app': self._get_active_app(),
                'date': u['today'].isoformat(),
            }

    def get_snapshot_for_save(self, user_id='demo-user-001'):
        data = self.get_screen_time(user_id)
        return {
            'user_id': user_id,
            'date': data['date'],
            'total_hours': data['total_hours'],
            'breakdown': data['breakdown'],
        }

    def save_current(self, user_id='demo-user-001'):
        """Persist the current day's snapshot to Firestore."""
        snapshot = self.get_snapshot_for_save(user_id)
        self._persist_snapshot(snapshot)
        return snapshot

    @staticmethod
    def _persist_snapshot(snapshot):
        try:
            from app.services.firebase_service import save_screen_time
            save_screen_time(snapshot['user_id'], snapshot)
        except Exception:
            pass

    def get_system_stats(self):
        return {
            'cpu_percent': psutil.cpu_percent(interval=0.5),
            'memory_percent': psutil.virtual_memory().percent,
            'battery': self._get_battery(),
        }

    def _get_breakdown(self, elapsed_hours):
        categories = {'coding': 0, 'meetings': 0, 'browsing': 0, 'email': 0, 'other': 0}

        coding_apps = {'code', 'pycharm', 'intellij', 'vscode', 'sublime', 'atom', 'vim', 'nvim', 'terminal', 'cmd', 'powershell'}
        meeting_apps = {'zoom', 'teams', 'slack', 'meet', 'webex', 'discord'}
        browser_apps = {'chrome', 'firefox', 'edge', 'safari', 'brave', 'opera'}
        email_apps = {'outlook', 'thunderbird', 'mail'}

        try:
            for proc in psutil.process_iter(['name']):
                name = (proc.info.get('name') or '').lower()
                if any(app in name for app in coding_apps):
                    categories['coding'] += 1
                elif any(app in name for app in meeting_apps):
                    categories['meetings'] += 1
                elif any(app in name for app in browser_apps):
                    categories['browsing'] += 1
                elif any(app in name for app in email_apps):
                    categories['email'] += 1
        except (psutil.AccessDenied, psutil.NoSuchProcess):
            pass

        total = sum(categories.values()) or 1
        return {
            k: round(v / total * elapsed_hours, 1)
            for k, v in categories.items() if v > 0
        }

    def _get_active_app(self):
        try:
            for proc in psutil.process_iter(['name', 'cpu_percent']):
                if proc.info.get('cpu_percent', 0) > 5:
                    return proc.info.get('name', 'Unknown')
        except (psutil.AccessDenied, psutil.NoSuchProcess):
            pass
        return 'Unknown'

    def _get_battery(self):
        try:
            battery = psutil.sensors_battery()
            if battery:
                return {'percent': battery.percent, 'plugged': battery.power_plugged}
        except Exception:
            pass
        return None


screen_tracker = ScreenTracker()
