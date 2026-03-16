import time
import psutil


class ScreenTracker:
    """
    Tracks screen time and active application usage using psutil.
    Monitors which applications are in focus and calculates usage breakdown.
    """

    def __init__(self):
        self._start_time = time.time()
        self._app_usage = {}
        self._total_screen_seconds = 0

    def get_screen_time(self):
        elapsed_hours = (time.time() - self._start_time) / 3600
        return {
            'total_hours': round(elapsed_hours, 2),
            'breakdown': self._get_breakdown(),
            'active_app': self._get_active_app(),
        }

    def get_system_stats(self):
        return {
            'cpu_percent': psutil.cpu_percent(interval=0.5),
            'memory_percent': psutil.virtual_memory().percent,
            'battery': self._get_battery(),
        }

    def _get_breakdown(self):
        """Estimate app usage breakdown based on running processes."""
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
        elapsed = (time.time() - self._start_time) / 3600

        return {
            k: round(v / total * elapsed, 1) for k, v in categories.items() if v > 0
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
